#!/bin/bash
#
# MongoDB 健康监控与自愈脚本
# 用法: ./monitor-mongodb.sh
# 建议: crontab 每 2 分钟执行一次
#

MONGO_HOST="127.0.0.1"
MONGO_PORT="27017"
INIT_SCRIPT="/etc/init.d/mongodb"
MONGO_CONFIG="/www/server/mongodb/config.conf"
MONGO_LOG="/www/server/mongodb/log/config.log"
MONITOR_LOG="/www/server/mongodb/log/monitor.log"
LOCK_FILE="/tmp/mongodb-monitor.lock"
ALERT_SCRIPT="/www/wwwroot/woyouwu/server/scripts/send-alert-email.py"

# 防止并发执行
exec 200>"$LOCK_FILE"
if ! flock -n 200; then
    exit 0
fi

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$MONITOR_LOG"
}

# 用 mongosh ping 测试是否是真正的 MongoDB
check_mongo_real() {
    local result
    result=$(mongosh --host "$MONGO_HOST" --port "$MONGO_PORT" --quiet --eval "db.runCommand({ping:1}).ok" 2>/dev/null)
    [[ "$result" == "1" ]]
}

# 用 TCP 端口测试
check_mongo_tcp() {
    timeout 3 bash -c "echo >/dev/tcp/$MONGO_HOST/$MONGO_PORT" 2>/dev/null
}

# 发送告警
send_alert() {
    local subject="$1"
    local body="$2"
    local server_ip
    server_ip=$(hostname -I 2>/dev/null | awk '{print $1}')

    # 写入系统日志
    logger -t mongodb-monitor -p daemon.err "$subject"

    # 通过 Python SMTP 发送邮件
    local full_subject="[MongoDB告警] $subject - $server_ip"
    local full_body="服务器: $server_ip
时间: $(date)

$body

---
监控脚本自动发送
日志文件: $MONITOR_LOG"

    echo "$full_body" | python3 "$ALERT_SCRIPT" -s "$full_subject" 2>&1 | logger -t mongodb-monitor-mail

    log "ALERT: $subject"
}

# 查找端口占用进程（非 MongoDB 的恶意占用）
check_port_occupied_by_other() {
    local pid
    pid=$(ss -tlnp "sport = :$MONGO_PORT" 2>/dev/null | grep -oP 'pid=\K\d+')
    if [[ -n "$pid" ]] && ! ps -p "$pid" -o comm= | grep -q mongod; then
        echo "$pid"
        return 0
    fi
    return 1
}

# ========== 主逻辑 ==========

log "=== 开始检查 ==="

# 1. 检查 MongoDB 是否运行
if check_mongo_real; then
    log "MongoDB 正常 (ping ok)"
    exit 0
fi

log "MongoDB ping 失败，进一步排查..."

# 2. 检查端口是否被非 MongoDB 进程占用
OTHER_PID=$(check_port_occupied_by_other)
if [[ -n "$OTHER_PID" ]]; then
    log "端口 $MONGO_PORT 被非 MongoDB 进程占用 (PID: $OTHER_PID)"
    send_alert "端口被异常占用" "端口 $MONGO_PORT 被 PID $OTHER_PID 占用，不是 mongod 进程。\n占用进程: $(ps -p $OTHER_PID -o pid,cmd= 2>/dev/null)"
    exit 1
fi

# 3. 分析 MongoDB 日志找失败原因
FAIL_REASON="未知原因"
if [[ -f "$MONGO_LOG" ]]; then
    LAST_ERROR=$(tail -100 "$MONGO_LOG" | grep -E '"s":"[EF]"' | tail -3)
    if echo "$LAST_ERROR" | grep -q "Failed to unlink socket file"; then
        FAIL_REASON="socket 文件删除权限不足"
    elif echo "$LAST_ERROR" | grep -q "Address already in use"; then
        FAIL_REASON="端口被占用"
    elif echo "$LAST_ERROR" | grep -q "Permission denied"; then
        FAIL_REASON="文件权限不足"
    elif echo "$LAST_ERROR" | grep -q "No space left"; then
        FAIL_REASON="磁盘空间不足"
    fi
fi

log "失败原因: $FAIL_REASON"

# 4. 尝试自愈
log "尝试自愈: 执行 init.d 重启动..."
RESTART_OUTPUT=$("$INIT_SCRIPT" restart 2>&1)
RESTART_EXIT=$?

sleep 3

if check_mongo_real; then
    log "自愈成功! MongoDB 已恢复"
    send_alert "自愈成功" "MongoDB 异常退出（原因: $FAIL_REASON），已通过 init.d 自动重启恢复。"
else
    log "自愈失败! MongoDB 未能启动"
    send_alert "启动失败 - 自愈无效" \
        "MongoDB 无法启动（原因: $FAIL_REASON）
        
自愈操作: $INIT_SCRIPT restart
返回码: $RESTART_EXIT
输出:
$RESTART_OUTPUT

最近日志:
$(tail -10 "$MONGO_LOG" 2>/dev/null || echo '日志文件不存在')"
fi

log "=== 检查结束 ===\n"

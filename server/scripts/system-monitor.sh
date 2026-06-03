#!/bin/bash
#
# 系统资源监控与自愈脚本
# 监控内存、CPU、磁盘、关键服务，超阈值时告警并尝试自愈
# 建议 crontab 每 5 分钟执行一次
#

# ========== 配置 ==========
MEMORY_ALERT=80          # 内存使用率告警 (%)
SWAP_ALERT=50            # Swap使用率告警 (%)
SWAP_CLEANUP=60          # Swap使用率超过此值自动清理缓存 (%)
DISK_ALERT=85            # 磁盘使用率告警 (%)
CPU_ALERT=90             # CPU使用率告警 (%)
SERVICE_CHECK=1          # 是否检查关键服务

LOG_FILE="/www/wwwroot/woyouwu/server/logs/system-monitor.log"
LOCK_FILE="/tmp/system-monitor.lock"
ALERT_SCRIPT="/www/wwwroot/woyouwu/server/scripts/send-alert-email.py"

# 关键服务列表 (名称, 检测命令, 重启命令)
SERVICES=(
  "mongodb:pgrep mongod:/etc/init.d/mongodb restart"
  "woyouwu-server:pgrep -f 'woyouwu/server/index.js':pm2 restart woyouwu-server"
  "nginx:pgrep nginx:/etc/init.d/nginx restart"
)

mkdir -p "$(dirname "$LOG_FILE")"

# ========== 函数 ==========

log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

send_alert() {
  local subject="$1"
  local body="$2"
  logger -t system-monitor -p daemon.err "$subject"
  if [ -f "$ALERT_SCRIPT" ]; then
    echo "$body" | python3 "$ALERT_SCRIPT" -s "$subject" 2>&1 | logger -t system-monitor-mail
  fi
  log "ALERT: $subject"
}

check_service() {
  local entry="$1"
  local name="${entry%%:*}"
  local rest="${entry#*:}"
  local check_cmd="${rest%%:*}"
  local restart_cmd="${rest#*:}"

  if eval "$check_cmd" >/dev/null 2>&1; then
    return 0
  fi

  log "[SERVICE] $name 未运行，尝试重启..."
  send_alert "[$name] 服务异常" "$name 未运行，即将尝试自动重启"

  eval "$restart_cmd" >/dev/null 2>&1
  sleep 2

  if eval "$check_cmd" >/dev/null 2>&1; then
    log "[SERVICE] $name 重启成功"
    send_alert "[$name] 自愈成功" "$name 已通过自动重启恢复"
  else
    log "[SERVICE] $name 重启失败!"
    send_alert "[$name] 自愈失败" "$name 重启失败，需要人工介入"
  fi
}

# ========== 主逻辑 ==========

# 防止并发
exec 200>"$LOCK_FILE"
if ! flock -n 200; then
  exit 0
fi

# 1. 内存检查
mem_total=$(grep MemTotal /proc/meminfo | awk '{print $2}')
mem_avail=$(grep MemAvailable /proc/meminfo | awk '{print $2}')
mem_used_percent=$((100 - (mem_avail * 100 / mem_total)))
mem_avail_mb=$((mem_avail / 1024))

if [ "$mem_used_percent" -gt "$MEMORY_ALERT" ]; then
  top5=$(ps aux --sort=-%mem 2>/dev/null | head -6 | tail -5 | awk '{printf "  %s %sMB %s\n", $1, int($6/1024), $11}')
  send_alert "内存告警 ${mem_used_percent}%" \
    "内存使用率: ${mem_used_percent}% (可用: ${mem_avail_mb}MB)
Top 5 内存进程:
${top5}"

  # 如果可用内存低于 100MB，尝试重启 MongoDB 释放缓存
  if [ "$mem_avail_mb" -lt 100 ]; then
    log "[OOM] 可用内存仅 ${mem_avail_mb}MB，尝试释放内存..."
    echo 3 > /proc/sys/vm/drop_caches 2>/dev/null
    log "[OOM] 缓存已清理"
  fi
fi

# 2. Swap 检查 + 自动清理
swap_total=$(grep SwapTotal /proc/meminfo | awk '{print $2}')
swap_free=$(grep SwapFree /proc/meminfo | awk '{print $2}')
if [ "$swap_total" -gt 0 ]; then
  swap_used_percent=$(( (swap_total - swap_free) * 100 / swap_total ))
  swap_used_mb=$(( (swap_total - swap_free) / 1024 ))

  # Swap 使用率超过 CLEANUP 阈值时自动清理缓存
  if [ "$swap_used_percent" -gt "$SWAP_CLEANUP" ]; then
    log "[SWAP] 使用率 ${swap_used_percent}%，超过清理阈值 ${SWAP_CLEANUP}%，执行缓存清理..."
    sync
    echo 3 > /proc/sys/vm/drop_caches 2>/dev/null
    log "[SWAP] 缓存已清理 (drop_caches=3)"

    # 清理后重新计算 Swap 使用率
    swap_free=$(grep SwapFree /proc/meminfo | awk '{print $2}')
    swap_used_percent=$(( (swap_total - swap_free) * 100 / swap_total ))
    swap_used_mb=$(( (swap_total - swap_free) / 1024 ))
    log "[SWAP] 清理后使用率: ${swap_used_percent}% (已用: ${swap_used_mb}MB)"
  fi

  # Swap 使用率超过 ALERT 阈值时发送告警
  if [ "$swap_used_percent" -gt "$SWAP_ALERT" ]; then
    top5=$(ps aux --sort=-%mem 2>/dev/null | head -6 | tail -5 | awk '{printf "  %s %sMB %s\n", $1, int($6/1024), $11}')
    send_alert "Swap告警 ${swap_used_percent}%" \
      "Swap使用率: ${swap_used_percent}% (已用: ${swap_used_mb}MB / 总: $((swap_total/1024))MB)
Top 5 内存进程:
${top5}"
  fi
fi

# 3. 磁盘检查
disk_used_percent=$(df / 2>/dev/null | tail -1 | awk '{print $5}' | tr -d '%')
if [ "$disk_used_percent" -gt "$DISK_ALERT" ]; then
  send_alert "磁盘告警 ${disk_used_percent}%" \
    "磁盘使用率: ${disk_used_percent}%\n$(df -h /)"
fi

# 4. CPU 检查
cpu_idle=$(top -bn1 2>/dev/null | grep 'Cpu(s)' | awk '{print $8}' | cut -d. -f1)
if [ -n "$cpu_idle" ]; then
  cpu_used=$((100 - cpu_idle))
  if [ "$cpu_used" -gt "$CPU_ALERT" ]; then
    top5cpu=$(ps aux --sort=-%cpu 2>/dev/null | head -6 | tail -5 | awk '{printf "  %s %.1f%% %s\n", $1, $3, $11}')
    send_alert "CPU告警 ${cpu_used}%" \
      "CPU使用率: ${cpu_used}%\nTop 5 CPU进程:\n${top5cpu}"
  fi
fi

# 5. 关键服务检查
if [ "$SERVICE_CHECK" -eq 1 ]; then
  for entry in "${SERVICES[@]}"; do
    check_service "$entry"
  done
fi

# 6. 定期日志（每轮记录一次）
log "OK | 内存:${mem_used_percent}% | 可用:${mem_avail_mb}MB | Swap:${swap_used_percent:-0}% | 磁盘:${disk_used_percent}% | CPU:${cpu_used:-0}%"

exit 0

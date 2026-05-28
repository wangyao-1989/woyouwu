#!/bin/bash
LOG_FILE="/root/.pm2/logs/memory-monitor.log"
ALERT_THRESHOLD=85

log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

snap() {
  local total=$(grep MemTotal /proc/meminfo | awk '{print $2}')
  local avail=$(grep MemAvailable /proc/meminfo | awk '{print $2}')
  local free=$(grep MemFree /proc/meminfo | awk '{print $2}')
  local swap_total=$(grep SwapTotal /proc/meminfo | awk '{print $2}')
  local swap_free=$(grep SwapFree /proc/meminfo | awk '{print $2}')

  local total_mb=$((total / 1024))
  local avail_mb=$((avail / 1024))
  local free_mb=$((free / 1024))
  local used_percent=$((100 - (avail * 100 / total)))
  local swap_used=$(( (swap_total - swap_free) / 1024 ))

  local top_processes=""
  if [ "$used_percent" -gt "$ALERT_THRESHOLD" ]; then
    top_processes="\n  [告警] 内存占用 > ${ALERT_THRESHOLD}%, TOP5 进程:\n$(ps aux --sort=-%mem | head -6 | tail -5 | awk '{printf "    %s  RSS:%sMB  CMD:%s\n", $1, int($6/1024), $11}')"
  fi

  log "内存 | 总:${total_mb}MB | 可用:${avail_mb}MB | 空闲:${free_mb}MB | 占用:${used_percent}% | Swap已用:${swap_used}MB${top_processes}"
}

# start
mkdir -p "$(dirname "$LOG_FILE")"
echo "" >> "$LOG_FILE"
log "========================================"
log "内存监控启动 — 等待 news-refresh (7:00)"
log "========================================"
snap

TARGET_TIME_UTC=$(date -d "today 07:00 CST" +%s 2>/dev/null)
if [ -z "$TARGET_TIME_UTC" ]; then
  TARGET_TIME_UTC=$(date -d "today 07:00" +%s 2>/dev/null)
fi

NOW=$(date +%s)
if [ -n "$TARGET_TIME_UTC" ] && [ "$NOW" -lt "$TARGET_TIME_UTC" ]; then
  WAIT_SECS=$((TARGET_TIME_UTC - NOW))
  log "距 7:00 还有 ${WAIT_SECS} 秒，等待中..."
  sleep "$WAIT_SECS"
fi

log "========================================"
log "7:00 — 开始监控 (news-refresh 应已启动)"
log "========================================"
snap

for i in $(seq 1 21); do
  sleep 30
  snap
done

log "========================================"
log "7:10 — 监控结束"
log "========================================"
snap

log "查看完整日志: cat $LOG_FILE"

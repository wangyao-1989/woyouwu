#!/usr/bin/env python3
"""
MongoDB 监控告警邮件发送器
通过外部 SMTP 服务器发送告警邮件，不依赖本地 postfix/sendmail。

配置方式（优先级从高到低）：
  1. 环境变量: ALERT_SMTP_HOST, ALERT_SMTP_PORT, ALERT_SMTP_USER, ALERT_SMTP_PASS
  2. .env 文件（与脚本同目录或上级目录）: 同上

用法:
  ./send-alert-email.py -s "主题" -b "正文内容"
  echo "正文" | ./send-alert-email.py -s "主题"
"""

import argparse
import os
import smtplib
import socket
import sys
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from pathlib import Path

SCRIPT_DIR = Path(__file__).resolve().parent
SERVER_DIR = SCRIPT_DIR.parent


def load_env():
    """加载 .env 文件（从脚本目录或上级目录）"""
    env_files = [
        SERVER_DIR / '.env',
        SCRIPT_DIR / '.env',
        SERVER_DIR / '.env.production',
    ]
    for env_file in env_files:
        if not env_file.is_file():
            continue
        with open(env_file, 'r', encoding='utf-8') as f:
            for line in f:
                line = line.strip()
                if not line or line.startswith('#') or '=' not in line:
                    continue
                key, _, value = line.partition('=')
                key = key.strip()
                value = value.strip().strip('"').strip("'")
                if key and key not in os.environ:
                    os.environ[key] = value


def get_smtp_config():
    """获取 SMTP 配置，环境变量优先级高于 .env"""
    load_env()

    host = os.environ.get('ALERT_SMTP_HOST', '')
    port = int(os.environ.get('ALERT_SMTP_PORT', '587'))
    user = os.environ.get('ALERT_SMTP_USER', '')
    password = os.environ.get('ALERT_SMTP_PASS', '')
    from_addr = os.environ.get('ALERT_SMTP_FROM', user)
    to_addrs_str = os.environ.get('ALERT_SMTP_TO', '')
    to_addrs = [a.strip() for a in to_addrs_str.split(',') if a.strip()] if to_addrs_str else []

    return {
        'host': host,
        'port': port,
        'user': user,
        'password': password,
        'from_addr': from_addr,
        'to_addrs': to_addrs,
    }


def send_email(subject: str, body: str, dry_run: bool = False):
    """通过 SMTP 发送邮件"""
    config = get_smtp_config()

    if dry_run:
        print(f'[DRY RUN] 发件人: {config["from_addr"] or "(未配置)"}')
        print(f'[DRY RUN] 收件人: {", ".join(config["to_addrs"]) or "(未配置)"}')
        print(f'[DRY RUN] 主题: {subject}')
        print(f'[DRY RUN] 正文: {body[:200]}...' if len(body) > 200 else f'[DRY RUN] 正文: {body}')
        if not config['host']:
            print('[DRY RUN] 注意: SMTP 尚未配置，实际发送时将失败')
        return True, 'dry run 完成'

    if not config['host']:
        return False, 'SMTP 未配置。请设置环境变量 ALERT_SMTP_HOST'

    if not config['to_addrs']:
        return False, '收件人未配置。请设置环境变量 ALERT_SMTP_TO'

    hostname = socket.gethostname()
    msg = MIMEMultipart('alternative')
    msg['Subject'] = subject
    msg['From'] = config['from_addr']
    msg['To'] = ', '.join(config['to_addrs'])
    msg['Date'] = smtplib.email.utils.formatdate(localtime=True)
    msg['Message-ID'] = smtplib.email.utils.make_msgid(domain=hostname)

    msg.attach(MIMEText(body, 'plain', 'utf-8'))
    msg.attach(MIMEText(
        f'<html><body style="font-family:monospace;white-space:pre-wrap;">{body}</body></html>',
        'html', 'utf-8'
    ))

    try:
        if config['port'] == 465:
            server = smtplib.SMTP_SSL(config['host'], config['port'], timeout=30)
        else:
            server = smtplib.SMTP(config['host'], config['port'], timeout=30)
            server.ehlo()

        if config['port'] == 587:
            server.starttls()
            server.ehlo()

        if config['user'] and config['password']:
            server.login(config['user'], config['password'])

        server.sendmail(config['from_addr'], config['to_addrs'], msg.as_string())
        server.quit()
        return True, f'邮件发送成功 → {", ".join(config["to_addrs"])}'
    except smtplib.SMTPAuthenticationError:
        return False, 'SMTP 认证失败，请检查用户名和密码/授权码'
    except smtplib.SMTPConnectError:
        return False, f'无法连接 SMTP 服务器 {config["host"]}:{config["port"]}'
    except smtplib.SMTPServerDisconnected:
        return False, 'SMTP 服务器断开连接'
    except socket.timeout:
        return False, f'连接 {config["host"]}:{config["port"]} 超时'
    except Exception as e:
        return False, f'发送失败: {type(e).__name__}: {e}'


def main():
    parser = argparse.ArgumentParser(description='MongoDB 监控告警邮件发送器')
    parser.add_argument('-s', '--subject', help='邮件主题')
    parser.add_argument('-b', '--body', default=None, help='邮件正文（不指定则从 stdin 读取）')
    parser.add_argument('--dry-run', action='store_true', help='测试模式，不实际发送')
    parser.add_argument('--test-config', action='store_true', help='显示当前配置')
    args = parser.parse_args()

    if args.test_config:
        config = get_smtp_config()
        print('=== SMTP 配置 ===')
        print(f'HOST:      {config["host"] or "(未设置)"}')
        print(f'PORT:      {config["port"]}')
        print(f'USER:      {config["user"] or "(未设置)"}')
        print(f'PASS:      {"***" if config["password"] else "(未设置)"}')
        print(f'FROM:      {config["from_addr"] or "(同 USER)"}')
        print(f'TO:        {", ".join(config["to_addrs"]) or "(未设置)"}')
        print('')
        print('配置方式: 在 /www/wwwroot/woyouwu/server/.env 中添加:')
        print('  ALERT_SMTP_HOST=smtp.example.com')
        print('  ALERT_SMTP_PORT=587')
        print('  ALERT_SMTP_USER=your@email.com')
        print('  ALERT_SMTP_PASS=your_password_or_auth_code')
        print('  ALERT_SMTP_TO=your@email.com')
        return

    if not args.subject:
        print('错误: 请通过 -s 参数指定邮件主题', file=sys.stderr)
        sys.exit(1)

    body = args.body
    if body is None:
        if sys.stdin.isatty():
            print('错误: 请通过 -b 参数或管道提供邮件正文', file=sys.stderr)
            sys.exit(1)
        body = sys.stdin.read().strip()

    if not body:
        print('错误: 邮件正文为空', file=sys.stderr)
        sys.exit(1)

    success, message = send_email(args.subject, body, dry_run=args.dry_run)
    if success:
        print(f'[OK] {message}')
    else:
        print(f'[ERROR] {message}', file=sys.stderr)
        sys.exit(1)


if __name__ == '__main__':
    main()

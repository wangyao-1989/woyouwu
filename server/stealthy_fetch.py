#!/usr/bin/env python3
"""Scrapling/Patchright 浏览器爬取辅助脚本
直接使用 Patchright 控制 Google Chrome，绕过 Scrapling CLI 的限制，
可自定义浏览器路径和 Chrome 启动参数。
"""
import sys
import os
import traceback

chrome_path = "/opt/google/chrome/chrome"

def main():
    if len(sys.argv) < 3:
        print("Usage: stealthy_fetch.py URL OUTPUT_FILE [--headless] [--block-ads] [--timeout MS]", file=sys.stderr)
        sys.exit(1)

    url = sys.argv[1]
    output_file = sys.argv[2]

    headless = True
    timeout = 30000
    block_ads = False

    i = 3
    while i < len(sys.argv):
        if sys.argv[i] == '--headless':
            headless = True
        elif sys.argv[i] == '--block-ads':
            block_ads = True
        elif sys.argv[i] == '--timeout' and i + 1 < len(sys.argv):
            timeout = int(sys.argv[i + 1])
            i += 1
        i += 1

    print(f"[stealthy_fetch] 目标: {url}", file=sys.stderr)
    print(f"[stealthy_fetch] 超时: {timeout}ms, headless={headless}", file=sys.stderr)

    from patchright.sync_api import sync_playwright

    browser_args = [
        '--enable-features=NetworkServiceInProcess',
        '--disable-crashpad-for-testing',
        '--no-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--disable-breakpad',
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding',
        '--disable-field-trial-config',
        '--disable-hang-monitor',
        '--disable-sync',
        '--disable-features=Translate,OptimizationHints,PaintHolding',
        '--disable-blink-features=AutomationControlled',
        '--no-first-run',
        '--no-default-browser-check',
        '--password-store=basic',
        '--force-color-profile=srgb',
        '--mute-audio',
    ]

    if block_ads:
        browser_args.append('--block-ads')

    try:
        print(f"[stealthy_fetch] 启动浏览器...", file=sys.stderr)
        with sync_playwright() as p:
            browser = p.chromium.launch(
                headless=headless,
                executable_path=chrome_path,
                args=browser_args,
            )
            try:
                print(f"[stealthy_fetch] 创建页面...", file=sys.stderr)
                # 使用默认上下文，避免 new_context 触发 launch_persistent_context
                page = browser.new_page(
                    user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36',
                    viewport={'width': 1920, 'height': 1080},
                    locale='zh-CN',
                )

                print(f"[stealthy_fetch] 导航到目标页面...", file=sys.stderr)
                page.goto(url, timeout=timeout, wait_until='domcontentloaded')

                content = page.content()
                print(f"[stealthy_fetch] 获取内容: {len(content)} 字节", file=sys.stderr)

                os.makedirs(os.path.dirname(os.path.abspath(output_file)), exist_ok=True)
                with open(output_file, 'w', encoding='utf-8') as f:
                    f.write(content)

                print(f"OK {len(content)} bytes")
            finally:
                browser.close()
    except Exception as e:
        print(f"ERROR: {e}", file=sys.stderr)
        traceback.print_exc(file=sys.stderr)
        sys.exit(1)

if __name__ == '__main__':
    main()

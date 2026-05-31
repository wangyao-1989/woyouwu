#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔍 开始静态代码分析验证...\n');

// 1. 验证 SVG 图标使用情况
console.log('📊 步骤 1: 检查 SVG 图标使用情况');
const clientSrc = path.join(__dirname, 'src');

function scanForEmojis(dir, files = []) {
    if (!fs.existsSync(dir)) return files;

    const items = fs.readdirSync(dir);

    items.forEach(item => {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
            scanForEmojis(fullPath, files);
        } else if (stat.isFile() && (item.endsWith('.jsx') || item.endsWith('.js') || item.endsWith('.tsx'))) {
            const content = fs.readFileSync(fullPath, 'utf8');
            const relativePath = path.relative(__dirname, fullPath);

            // 检查是否使用了 emoji 作为图标
            const emojiPatterns = [
                /[\u{1F300}-\u{1F9FF}]/u,  // 各种 emoji
                /🔒|🔑|🔐|🔓|📝|📄|📁|📂|🗂️|📊|📈|📉|💡|⭐|🌟|✨|🔔|🔕|🔇|🔈|🔉|🔊|📢|📣|💬|💭|🗨️|🗯️|👆|👇|👉|👈|👍|👎|👏|🙌|👐|✋|🤚|🖐️|✍️|🙏|💪|🤝|🤝|🤝/g
            ];

            let hasEmoji = false;
            emojiPatterns.forEach(pattern => {
                if (pattern.test(content)) {
                    hasEmoji = true;
                }
            });

            if (hasEmoji) {
                files.push({
                    path: relativePath,
                    hasEmoji: true
                });
            }
        }
    });

    return files;
}

const filesWithEmoji = scanForEmojis(clientSrc);

if (filesWithEmoji.length > 0) {
    console.log(`   ⚠️  发现 ${filesWithEmoji.length} 个文件仍使用 emoji:`);
    filesWithEmoji.forEach(file => {
        console.log(`      - ${file.path}`);
    });
} else {
    console.log('   ✅ 所有文件已使用 SVG 图标，无 emoji');
}

// 2. 验证按钮按压状态
console.log('\n📊 步骤 2: 检查按钮按压状态');

function scanForActiveScale(dir, results = []) {
    if (!fs.existsSync(dir)) return results;

    const items = fs.readdirSync(dir);

    items.forEach(item => {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
            scanForActiveScale(fullPath, results);
        } else if (stat.isFile() && (item.endsWith('.jsx') || item.endsWith('.js') || item.endsWith('.tsx'))) {
            const content = fs.readFileSync(fullPath, 'utf8');
            const relativePath = path.relative(__dirname, fullPath);

            // 检查按钮元素
            const buttonRegex = /<button[^>]*>/gi;
            const buttons = content.match(buttonRegex) || [];

            if (buttons.length > 0) {
                const buttonsWithActiveScale = buttons.filter(btn => btn.includes('active:scale-95'));
                const buttonsWithoutActiveScale = buttons.filter(btn => !btn.includes('active:scale-95'));

                if (buttons.length > 0) {
                    results.push({
                        path: relativePath,
                        totalButtons: buttons.length,
                        withActiveScale: buttonsWithActiveScale.length,
                        withoutActiveScale: buttonsWithoutActiveScale.length,
                        sampleButtons: buttonsWithoutActiveScale.slice(0, 2)
                    });
                }
            }
        }
    });

    return results;
}

const buttonResults = scanForActiveScale(clientSrc);

if (buttonResults.length > 0) {
    const filesWithMissingActiveScale = buttonResults.filter(r => r.withoutActiveScale > 0);

    if (filesWithMissingActiveScale.length > 0) {
        console.log(`   ⚠️  发现 ${filesWithMissingActiveScale.length} 个文件的部分按钮缺少按压状态:`);
        filesWithMissingActiveScale.forEach(result => {
            console.log(`      - ${result.path}: ${result.withActiveScale}/${result.totalButtons} 个按钮有按压反馈`);
        });
    } else {
        console.log('   ✅ 所有按钮均已添加按压状态 (active:scale-95)');
    }
} else {
    console.log('   ✅ 未发现按钮或所有按钮均有按压状态');
}

// 3. 验证测试页面存在
console.log('\n📊 步骤 3: 检查测试页面');
const publicDir = path.join(__dirname, 'public');
const testPages = [
    'login-test.html',
    'ui-fix-test.html',
    'ui-fix-verification-report.html'
];

testPages.forEach(page => {
    const pagePath = path.join(publicDir, page);
    if (fs.existsSync(pagePath)) {
        const stats = fs.statSync(pagePath);
        const sizeKB = (stats.size / 1024).toFixed(2);
        console.log(`   ✅ ${page} (${sizeKB} KB)`);
    } else {
        console.log(`   ⚠️  ${page} 不存在`);
    }
});

// 4. 生成综合报告
console.log('\n' + '='.repeat(60));
console.log('📋 综合分析报告');
console.log('='.repeat(60));

console.log('\n修复进度:');
console.log(`  • SVG 图标替换: ${filesWithEmoji.length === 0 ? '✅ 完成' : '⚠️ 进行中'} (${filesWithEmoji.length} 个文件待处理)`);
console.log(`  • 按钮按压反馈: ${buttonResults.filter(r => r.withoutActiveScale === 0).length}/${buttonResults.length} 个文件完成`);

console.log('\n测试页面:');
testPages.forEach(page => {
    const pagePath = path.join(publicDir, page);
    console.log(`  • ${page}: ${fs.existsSync(pagePath) ? '✅ 可用' : '❌ 不可用'}`);
});

console.log('\n访问地址:');
console.log('  • 登录测试: http://localhost:3000/login-test.html');
console.log('  • UI 修复测试: http://localhost:3000/ui-fix-test.html');
console.log('  • 验证报告: http://localhost:3000/ui-fix-verification-report.html');

console.log('\n' + '='.repeat(60));
console.log('🎉 静态分析完成！');
console.log('='.repeat(60));

// 5. 检查开发服务器状态
console.log('\n🌐 检查开发服务器状态...');
const http = require('http');

function checkServer(url) {
    return new Promise((resolve) => {
        const req = http.get(url, (res) => {
            resolve({ status: res.statusCode, ok: res.statusCode === 200 });
        });

        req.on('error', () => {
            resolve({ status: 0, ok: false });
        });

        req.setTimeout(3000, () => {
            req.destroy();
            resolve({ status: 0, ok: false });
        });
    });
}

(async () => {
    const result = await checkServer('http://localhost:3000');

    if (result.ok) {
        console.log('   ✅ 开发服务器正在运行: http://localhost:3000');
        console.log('\n💡 提示: 请在浏览器中打开上述测试页面进行交互验证');
    } else {
        console.log('   ⚠️  开发服务器未运行，请先启动: npm run dev');
    }

    console.log('\n✅ 静态分析全部完成！\n');
})();

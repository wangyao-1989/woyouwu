/**
 * UI 修复验证脚本
 * 使用方法：在浏览器控制台中粘贴此代码并执行
 */

(function() {
    console.log('🔍 开始 UI 修复验证...\n');

    // 1. 检查 SVG 图标
    console.log('📊 步骤 1: 检查 SVG 图标');
    const svgCount = document.querySelectorAll('svg').length;
    const emojiPattern = /[\u{1F300}-\u{1F9FF}]/gu;
    const bodyText = document.body.innerText;
    const emojiMatches = bodyText.match(emojiPattern);
    const emojiCount = emojiMatches ? emojiMatches.length : 0;

    console.log(`   SVG 图标数量: ${svgCount}`);
    console.log(`   Emoji 数量: ${emojiCount}`);
    console.log(`   ${emojiCount === 0 ? '✅' : '⚠️'} Emoji ${emojiCount === 0 ? '已全部替换' : '仍有使用'}\n`);

    // 2. 检查按钮按压状态
    console.log('📊 步骤 2: 检查按钮按压状态');
    const buttons = document.querySelectorAll('button');
    let buttonsWithActiveScale = 0;
    let buttonsWithoutActiveScale = [];

    buttons.forEach((btn, index) => {
        const className = btn.className;
        if (className.includes('active:scale-95')) {
            buttonsWithActiveScale++;
        } else {
            buttonsWithoutActiveScale.push({
                index: index,
                text: btn.textContent.trim().substring(0, 30)
            });
        }
    });

    console.log(`   总按钮数量: ${buttons.length}`);
    console.log(`   有按压反馈: ${buttonsWithActiveScale}`);
    console.log(`   缺少按压反馈: ${buttonsWithoutActiveScale.length}`);
    if (buttonsWithoutActiveScale.length > 0 && buttonsWithoutActiveScale.length <= 5) {
        console.log('   缺少按压反馈的按钮:');
        buttonsWithoutActiveScale.forEach(btn => {
            console.log(`      - [${btn.index}] ${btn.text}`);
        });
    }
    console.log(`   ${buttonsWithoutActiveScale.length === 0 ? '✅' : '⚠️'} 按压状态 ${buttonsWithoutActiveScale.length === 0 ? '全部完成' : '部分待完善'}\n`);

    // 3. 测试按钮按压效果
    console.log('📊 步骤 3: 测试按钮按压效果');
    const testBtn = document.querySelector('button');
    if (testBtn) {
        const rect = testBtn.getBoundingClientRect();
        console.log(`   测试按钮初始尺寸: ${rect.width.toFixed(2)}x${rect.height.toFixed(2)}`);

        // 模拟按压
        testBtn.dispatchEvent(new MouseEvent('mousedown', {
            view: window,
            bubbles: true,
            cancelable: true
        }));

        setTimeout(() => {
            const rectAfter = testBtn.getBoundingClientRect();
            console.log(`   测试按钮按压时尺寸: ${rectAfter.width.toFixed(2)}x${rectAfter.height.toFixed(2)}`);

            const scaleRatio = rectAfter.width / rect.width;
            console.log(`   ${Math.abs(scaleRatio - 1) > 0.01 ? '✅' : '⚠️'} 按压缩放比例: ${(scaleRatio * 100).toFixed(1)}%`);
            console.log(`   ${Math.abs(scaleRatio - 0.95) < 0.02 ? '✅' : '⚠️'} 是否为 95%: ${Math.abs(scaleRatio - 0.95) < 0.02 ? '是' : '否'}\n`);
        }, 100);
    }

    // 4. 检查输入框焦点状态
    console.log('📊 步骤 4: 检查输入框焦点状态');
    const inputs = document.querySelectorAll('input');
    inputs.forEach((input, index) => {
        const hasFocusRing = getComputedStyle(input).ring ||
                            getComputedStyle(input).outlineWidth !== '0px';
        const placeholder = input.placeholder || '未设置';

        console.log(`   输入框 ${index + 1}: "${placeholder}"`);
        console.log(`      - ${hasFocusRing ? '✅' : '⚠️'} 焦点环: ${hasFocusRing ? '有' : '无'}`);
    });
    console.log();

    // 5. 综合评分
    console.log('='.repeat(60));
    console.log('📋 综合评分');
    console.log('='.repeat(60));

    const svgScore = emojiCount === 0 ? 100 : Math.max(0, 100 - (emojiCount * 10));
    const buttonScore = buttons.length > 0 ?
                       Math.round((buttonsWithActiveScale / buttons.length) * 100) : 0;
    const overallScore = Math.round((svgScore + buttonScore) / 2);

    console.log(`   SVG 图标覆盖率: ${svgScore}/100`);
    console.log(`   按钮按压反馈率: ${buttonScore}/100`);
    console.log(`   综合评分: ${overallScore}/100`);
    console.log();

    if (overallScore >= 90) {
        console.log('   🎉 评分等级: 优秀 - UI 修复完成度很高！');
    } else if (overallScore >= 70) {
        console.log('   👍 评分等级: 良好 - 大部分修复已完成');
    } else if (overallScore >= 50) {
        console.log('   ⚠️  评分等级: 一般 - 需要继续完善');
    } else {
        console.log('   ❌ 评分等级: 较差 - 需要大量修复');
    }

    console.log('='.repeat(60));
    console.log('✅ UI 修复验证完成！\n');

    // 6. 建议
    if (overallScore < 100) {
        console.log('💡 优化建议:');
        if (emojiCount > 0) {
            console.log(`   1. 仍有 ${emojiCount} 个 emoji 需要替换为 SVG 图标`);
        }
        if (buttonsWithoutActiveScale.length > 0) {
            console.log(`   2. 有 ${buttonsWithoutActiveScale.length} 个按钮缺少 active:scale-95 类`);
        }
        console.log();
    }

    // 返回结果对象
    return {
        svgCount,
        emojiCount,
        totalButtons: buttons.length,
        buttonsWithActiveScale,
        buttonsWithoutActiveScale,
        svgScore,
        buttonScore,
        overallScore
    };
})();

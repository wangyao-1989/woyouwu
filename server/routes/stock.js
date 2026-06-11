const express = require('express');
const router = express.Router();
const StockHolding = require('../models/StockHolding');
const { auth } = require('../middleware/auth');

// ==================== 实时股价获取 ====================

// 从东方财富获取实时股价和详细数据
async function fetchEastMoneyPrice(stockCode) {
  try {
    let marketId = '1'; // 默认沪市
    if (stockCode.startsWith('0') || stockCode.startsWith('3') ||
        stockCode.startsWith('1') || stockCode.startsWith('8') || stockCode.startsWith('9')) {
      marketId = '0'; // 深市
    }

    const url = `http://push2.eastmoney.com/api/qt/stock/get?secid=${marketId}.${stockCode}&fields=f43,f44,f45,f46,f47,f48,f50,f51,f52,f60,f107,f108,f116,f117,f124,f128,f162,f163,f164`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'http://quote.eastmoney.com',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) return null;

    const data = await response.json();

    if (data.data && data.data.f43) {
      const isEtf = stockCode.startsWith('15') || stockCode.startsWith('16') ||
                    stockCode.startsWith('17') || stockCode.startsWith('18') || stockCode.startsWith('19') ||
                    stockCode.startsWith('51') || stockCode.startsWith('56') ||
                    stockCode.startsWith('58') || stockCode.startsWith('59');

      const divisor = isEtf ? 1000 : 100;
      const price = data.data.f43 / divisor;

      if (!isNaN(price) && price > 0 && price < 10000) {
        return {
          currentPrice: price.toFixed(4),
          yesterdayClose: data.data.f60 ? data.data.f60 / divisor : null,
          todayOpen: data.data.f46 / divisor,
          highPrice: data.data.f44 / divisor,
          lowPrice: data.data.f45 / divisor,
          volume: data.data.f47,
          amount: data.data.f48,
          volumeRatio: data.data.f50 ? data.data.f50 / 1000 : null,
          changeAmount: data.data.f51 / divisor,
          changePercent: data.data.f52 / 100,
          amplitude: data.data.f107 ? data.data.f107 / 100 : null,
          turnoverRate: data.data.f108 ? data.data.f108 / 100 : null,
          totalMarketCap: data.data.f116,
          circulateMarketCap: data.data.f117,
          pe: data.data.f124 ? data.data.f124 / 100 : null,
          pb: data.data.f128 ? data.data.f128 / 100 : null,
        };
      }
    }
    return null;
  } catch (error) {
    console.error('东方财富接口失败:', error.message);
    return null;
  }
}

// 从腾讯财经获取实时股价
async function fetchTencentPrice(stockCode) {
  try {
    let prefix = '';
    if (stockCode.startsWith('6') || stockCode.startsWith('5')) {
      prefix = 'sh';
    } else if (stockCode.startsWith('0') || stockCode.startsWith('3') ||
               stockCode.startsWith('1') || stockCode.startsWith('8') || stockCode.startsWith('9')) {
      prefix = 'sz';
    } else {
      prefix = 'sh';
    }

    const url = `http://qt.gtimg.cn/q=${prefix}${stockCode}`;
    const response = await fetch(url);

    if (!response.ok) return null;

    const text = await response.text();
    const match = text.match(/"([^"]+)"/);
    if (match) {
      const parts = match[1].split('~');
      if (parts.length >= 47) {
        const currentPrice = parseFloat(parts[3]);
        if (!isNaN(currentPrice) && currentPrice > 0 && currentPrice < 10000) {
          return {
            currentPrice: currentPrice.toFixed(4),
            yesterdayClose: parseFloat(parts[4]),
            todayOpen: parseFloat(parts[5]),
            volume: parseFloat(parts[6]),
            changeAmount: parseFloat(parts[31]),
            changePercent: parseFloat(parts[32]),
            highPrice: parseFloat(parts[41]),
            lowPrice: parseFloat(parts[42]),
            amplitude: parseFloat(parts[43]),
            totalMarketCap: parseFloat(parts[44]),
            circulateMarketCap: parseFloat(parts[45]),
            pb: parseFloat(parts[46]),
            pe: parseFloat(parts[39]),
          };
        }
      }
    }
    return null;
  } catch (error) {
    console.error('腾讯财经接口失败:', error.message);
    return null;
  }
}

// ==================== API 路由 ====================

// 获取实时股价
router.post('/price', async (req, res) => {
  try {
    const { stockCode } = req.body;

    if (!stockCode) {
      return res.status(400).json({ success: false, error: '股票代码不能为空' });
    }

    let stockData = null;

    // 并行请求东方财富和腾讯，取最快成功的
    const results = await Promise.allSettled([
      fetchEastMoneyPrice(stockCode).then(data => ({ source: 'eastmoney', data })),
      fetchTencentPrice(stockCode).then(data => ({ source: 'tencent', data })),
    ]);

    for (const result of results) {
      if (result.status === 'fulfilled' && result.value.data) {
        stockData = result.value.data;
        break;
      }
    }

    if (stockData && stockData.currentPrice) {
      return res.json({
        success: true,
        stockCode,
        currentPrice: stockData.currentPrice,
        ...stockData,
        timestamp: new Date().toISOString(),
      });
    }

    return res.json({
      success: false,
      stockCode,
      error: '获取股价失败，请检查股票代码',
    });
  } catch (error) {
    console.error('获取股价失败:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== 持仓管理（需登录） ====================

// 获取当前用户的所有持仓
router.get('/holdings', auth, async (req, res) => {
  try {
    const holdings = await StockHolding.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json({ success: true, holdings });
  } catch (error) {
    console.error('获取持仓失败:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 添加持仓
router.post('/holdings', auth, async (req, res) => {
  try {
    const { stockCode, stockName, shares, costPrice, type, sector } = req.body;

    if (!stockCode || !stockName) {
      return res.status(400).json({ success: false, error: '股票代码和名称不能为空' });
    }

    // 检查是否已存在
    const existing = await StockHolding.findOne({
      user: req.user._id,
      stockCode,
    });

    if (existing) {
      return res.status(400).json({ success: false, error: '该股票已在持仓列表中' });
    }

    const holding = await StockHolding.create({
      user: req.user._id,
      stockCode,
      stockName,
      type: type || 'stock',
      shares: shares || 0,
      costPrice: costPrice || '0.0000',
      sector: sector || '',
    });

    res.json({ success: true, holding });
  } catch (error) {
    console.error('添加持仓失败:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 更新持仓
router.put('/holdings/:id', auth, async (req, res) => {
  try {
    const holding = await StockHolding.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!holding) {
      return res.status(404).json({ success: false, error: '持仓不存在' });
    }

    const { stockName, shares, costPrice, currentPrice, type, sector } = req.body;
    if (stockName !== undefined) holding.stockName = stockName;
    if (shares !== undefined) holding.shares = shares;
    if (costPrice !== undefined) holding.costPrice = costPrice;
    if (currentPrice !== undefined) holding.currentPrice = currentPrice;
    if (type !== undefined) holding.type = type;
    if (sector !== undefined) holding.sector = sector;

    await holding.save();
    res.json({ success: true, holding });
  } catch (error) {
    console.error('更新持仓失败:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 删除持仓
router.delete('/holdings/:id', auth, async (req, res) => {
  try {
    const result = await StockHolding.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!result) {
      return res.status(404).json({ success: false, error: '持仓不存在' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('删除持仓失败:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 批量刷新所有持仓的当前价格
router.post('/holdings/refresh', auth, async (req, res) => {
  try {
    const holdings = await StockHolding.find({ user: req.user._id });

    const results = [];
    for (const holding of holdings) {
      const priceData = await fetchEastMoneyPrice(holding.stockCode) || await fetchTencentPrice(holding.stockCode);
      if (priceData && priceData.currentPrice) {
        holding.currentPrice = priceData.currentPrice;
        await holding.save();
        results.push({ id: holding._id, stockCode: holding.stockCode, currentPrice: priceData.currentPrice, ...priceData });
      } else {
        results.push({ id: holding._id, stockCode: holding.stockCode, error: '获取价格失败' });
      }
    }

    res.json({ success: true, results });
  } catch (error) {
    console.error('批量刷新失败:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== AI 分析（调用 DeepSeek API） ====================

const { getApiConfig } = require('../utils/apiConfig');

// DeepSeek API 配置
const DEEPSEEK_CONFIG = {
  endpoint: 'https://api.deepseek.com/v1/chat/completions',
  model: 'deepseek-chat',
};

async function callDeepSeek(messages, temperature = 0.7) {
  const apiKey = process.env.DEEPSEEK_API_KEY || '';
  if (!apiKey) {
    throw new Error('DeepSeek API Key 未配置');
  }

  const response = await fetch(DEEPSEEK_CONFIG.endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: DEEPSEEK_CONFIG.model,
      messages,
      temperature,
      max_tokens: 3000,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`DeepSeek API 返回 ${response.status}: ${errText}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || '';
}

// 深市/沪市判断
function getMarketId(code) {
  if (code.startsWith('0') || code.startsWith('3') ||
      code.startsWith('1') || code.startsWith('8') || code.startsWith('9')) {
    return '0'; // 深市
  }
  return '1'; // 沪市
}

// 获取实时价格数据（用于 AI 分析上下文）
async function getPriceSummary(stockCode) {
  try {
    const data = await fetchEastMoneyPrice(stockCode) || await fetchTencentPrice(stockCode);
    return data;
  } catch {
    return null;
  }
}

// AI 个股分析
router.post('/analyze', auth, async (req, res) => {
  try {
    const { stockCode, stockName, shares, costPrice } = req.body;

    if (!stockCode || !stockName) {
      return res.status(400).json({ success: false, error: '股票代码和名称不能为空' });
    }

    // 获取实时价格数据作为分析上下文
    const priceData = await getPriceSummary(stockCode);

    const marketContext = priceData ? `
## 实时行情数据
- 当前价格：${priceData.currentPrice} 元
- 今日开盘：${priceData.todayOpen} 元
- 今日最高：${priceData.highPrice} 元
- 今日最低：${priceData.lowPrice} 元
- 昨日收盘：${priceData.yesterdayClose} 元
- 涨跌幅：${priceData.changePercent ? priceData.changePercent.toFixed(2) + '%' : '未知'}
- 成交量：${priceData.volume ? (priceData.volume / 10000).toFixed(2) + '万手' : '未知'}
- 换手率：${priceData.turnoverRate ? priceData.turnoverRate.toFixed(2) + '%' : '未知'}
- 市盈率(PE)：${priceData.pe ? priceData.pe.toFixed(2) : '未知'}
- 市净率(PB)：${priceData.pb ? priceData.pb.toFixed(2) : '未知'}
- 总市值：${priceData.totalMarketCap ? (priceData.totalMarketCap / 100000000).toFixed(2) + '亿' : '未知'}
` : '（暂无实时行情数据）';

    const userContext = shares && costPrice ? `
## 我的持仓信息
- 持仓数量：${shares} 股
- 成本价：${costPrice} 元
- 当前价：${priceData ? priceData.currentPrice + ' 元' : '未知'}
- 盈亏比例：${priceData ? ((parseFloat(priceData.currentPrice) - parseFloat(costPrice)) / parseFloat(costPrice) * 100).toFixed(2) + '%' : '未知'}
` : '';

    const prompt = `你是一位资深的股票分析师，擅长基本面分析、技术分析和市场情绪分析。请对以下股票进行全面分析：

## 股票信息
- 股票代码：${stockCode}
- 股票名称：${stockName}
${marketContext}
${userContext}

请从以下维度进行分析：

### 1. 基本面分析
- 公司主营业务和行业地位
- 财务状况和市场估值分析
- 行业发展趋势

### 2. 技术面分析
- 当前价格位置和趋势判断
- 关键支撑位和压力位
- 量价关系分析

### 3. 市场情绪分析
- 近期市场关注度
- 机构持仓变化趋势
- 市场预期和分歧

### 4. 投资建议
- 短线操作建议（1-4周）
- 中线操作建议（1-6个月）
- 长线投资价值判断
- 风险等级评估（低/中/高）
- 关键风险提示

请给出具体、可操作的分析和建议，避免模棱两可的表述。`;

    const analysis = await callDeepSeek([
      { role: 'system', content: '你是资深股票分析师。请基于提供的行情数据进行客观、专业的分析。使用 Markdown 格式组织回复，重点突出、条理清晰。' },
      { role: 'user', content: prompt },
    ], 0.7);

    res.json({
      success: true,
      analysis,
      stockCode,
      stockName,
      priceData,
      generatedAt: new Date().toISOString(),
    });

  } catch (error) {
    console.error('股票分析失败:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// AI 换手率分析
router.post('/turnover-analysis', auth, async (req, res) => {
  try {
    const { stockCode, stockName } = req.body;

    if (!stockCode || !stockName) {
      return res.status(400).json({ success: false, error: '股票代码和名称不能为空' });
    }

    // 获取实时行情数据
    const priceData = await getPriceSummary(stockCode);

    if (!priceData || !priceData.currentPrice) {
      return res.status(400).json({ success: false, error: '获取实时行情数据失败，请稍后重试' });
    }

    const prompt = `你是专业的量价分析专家，擅长通过换手率分析资金流向和主力意图。

请对以下股票进行换手率深度分析：

## 股票基本信息
- 股票代码：${stockCode}
- 股票名称：${stockName}
- 当前价格：${priceData.currentPrice} 元
- 涨跌幅：${priceData.changePercent ? priceData.changePercent.toFixed(2) : '0'}%
- 换手率：${priceData.turnoverRate ? priceData.turnoverRate.toFixed(2) : '0'}%
- 成交量：${priceData.volume || 0}手
- 成交额：${priceData.amount || '未知'}
- 振幅：${priceData.amplitude ? priceData.amplitude.toFixed(2) : '0'}%

### 换手率水平判断标准
- 极低：<1%
- 低：1%~3%
- 中等：3%~5%
- 高：5%~10%
- 极高：>10%

### 阶段标注规则
1. 低位堆量·吸筹：换手率连续温和放大，底部股票
2. 缩量洗盘：换手率明显萎缩，股价整理
3. 真突破·主升：放量突破关键位，换手率健康
4. 高位爆量·出货：高位巨量换手，警惕出货
5. 阴跌出货·减仓：持续放量下跌
6. 震荡观望：方向不明

请按以下格式输出分析：

### 换手率解读
- 换手率数值和水平
- 量能状态判断
- 市场含义

### 阶段标注
- 当前阶段判断
- 判断依据

### 量价关系
- 量价特征
- 资金意图

### 主力动向
- 资金状态
- 流向判断

### 操作建议
- 短线操作
- 中长线操作
- 关键观察点

### 风险清单
- 技术面风险
- 基本面风险
- 资金面风险`;

    const analysis = await callDeepSeek([
      { role: 'system', content: '你是专业的量价分析专家，擅长通过换手率分析资金流向和主力意图。严肃、客观、基于数据。使用 Markdown 格式输出。' },
      { role: 'user', content: prompt },
    ], 0.5);

    res.json({
      success: true,
      analysis,
      stockCode,
      stockName,
      priceData,
      generatedAt: new Date().toISOString(),
    });

  } catch (error) {
    console.error('换手率分析失败:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// AI 多模型加仓讨论
router.post('/holdings/:id/position-discussion', auth, async (req, res) => {
  try {
    const holding = await StockHolding.findOne({ _id: req.params.id, user: req.user._id });
    if (!holding) return res.status(404).json({ success: false, error: '持仓不存在' });

    const currentPrice = holding.currentPrice || holding.costPrice;
    const costPrice = parseFloat(holding.costPrice);
    const shares = holding.shares || 0;
    const profit = (parseFloat(currentPrice) - costPrice) * shares;
    const profitPercent = costPrice > 0 ? ((parseFloat(currentPrice) - costPrice) / costPrice) * 100 : 0;

    const stockInfo = {
      stockCode: holding.stockCode, stockName: holding.stockName,
      currentPrice: parseFloat(currentPrice), costPrice,
      shares, profit, profitPercent,
    };

    const models = [
      { name: 'DeepSeek V3 (技术面)', role: '技术面+数据逻辑分析师，用数据说话' },
      { name: 'DeepSeek (基本面)', role: '深度研究和基本面分析专家，挖掘行业深层逻辑' },
      { name: 'DeepSeek (风控)', role: '风险控制和实战经验专家，强调仓位管理和风险发现' },
    ];

    const discussionPrompt = `请从你的专业角度评估是否适合加仓以下股票：

股票代码：${stockInfo.stockCode}
股票名称：${stockInfo.stockName}
当前价格：¥${stockInfo.currentPrice.toFixed(2)}
持仓成本：¥${stockInfo.costPrice.toFixed(2)}
持仓数量：${stockInfo.shares}股
当前盈亏：${stockInfo.profit >= 0 ? '+' : ''}¥${stockInfo.profit.toFixed(2)} (${stockInfo.profitPercent >= 0 ? '+' : ''}${stockInfo.profitPercent.toFixed(2)}%)

请给出明确的观点（agree/disagree/neutral），信心指数(0-100)，3-5个关键论点。
以JSON格式回复：{"opinion":"agree/disagree/neutral","confidence":0-100,"reasoning":"分析理由","keyPoints":["论点1","论点2"]}`;

    // 并行调用多个 AI 角色
    const results = await Promise.all(
      models.map(async (model) => {
        try {
          const content = await callDeepSeek([
            { role: 'system', content: `你是${model.name}，${model.role}。` },
            { role: 'user', content: discussionPrompt },
          ], 0.7);
          const jsonMatch = content.match(/\{[\s\S]*\}/);
          const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : {};
          return {
            name: model.name,
            avatar: '🤖',
            opinion: parsed.opinion || 'neutral',
            confidence: Math.min(100, Math.max(0, parsed.confidence || 50)),
            reasoning: parsed.reasoning || content.substring(0, 200),
            keyPoints: parsed.keyPoints || [],
            concerns: parsed.concerns || [],
          };
        } catch {
          return { name: model.name, avatar: '🤖', opinion: 'neutral', confidence: 0, reasoning: '分析失败', keyPoints: [] };
        }
      })
    );

    // 投票
    const votes = { agree: results.filter(r => r.opinion === 'agree').length, disagree: results.filter(r => r.opinion === 'disagree').length, neutral: results.filter(r => r.opinion === 'neutral').length };
    const decision = votes.agree >= 2 ? 'agree' : votes.disagree >= 2 ? 'disagree' : 'neutral';
    const consensus = decision !== 'neutral' ? (votes.agree >= 3 || votes.disagree >= 3 ? 'strong' : 'weak') : 'none';
    const avgConfidence = results.reduce((s, r) => s + r.confidence, 0) / results.length;

    // 最终建议
    const finalPrompt = `综合以下AI分析师的观点，给出最终加仓建议。投票：${votes.agree}同意/${votes.disagree}反对/${votes.neutral}中立。\n\n${results.map(r => `${r.name}（${r.opinion === 'agree' ? '同意' : r.opinion === 'disagree' ? '反对' : '中立'}，信心${r.confidence}%）：${r.reasoning}`).join('\n')}`;
    const finalContent = await callDeepSeek([
      { role: 'system', content: '你是专业投资顾问，给出可操作的加仓建议。JSON格式回复。' },
      { role: 'user', content: finalPrompt + '\n\nJSON：{"suggestion":"具体建议","positionSize":"建议仓位","entryPoints":["时机1"],"stopLoss":"止损","targetPrice":"目标价","riskWarning":"风险提示"}' },
    ], 0.5);
    const finalMatch = finalContent.match(/\{[\s\S]*\}/);
    const suggestion = finalMatch ? JSON.parse(finalMatch[0]) : { suggestion: '综合分析：' + (decision === 'agree' ? '建议适当加仓' : decision === 'disagree' ? '不建议加仓' : '意见分歧，建议观望') };

    res.json({
      success: true,
      discussion: {
        participants: results,
        decision, consensus,
        confidence: Math.round(avgConfidence),
        votes, suggestion,
      },
    });
  } catch (err) {
    console.error('加仓讨论失败:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;

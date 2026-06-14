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
const DEEPSEEK_ENDPOINT = 'https://api.deepseek.com/v1/chat/completions';
const DEEPSEEK_MODEL = 'deepseek-chat';

async function callAI(messages, temperature = 0.7) {
  const { apiKey } = await getApiConfig('aiChat');
  const finalKey = apiKey || process.env.DEEPSEEK_API_KEY || '';
  if (!finalKey) {
    throw new Error('AI API Key 未配置');
  }

  const response = await fetch(DEEPSEEK_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${finalKey}`,
    },
    body: JSON.stringify({
      model: DEEPSEEK_MODEL,
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

    const analysis = await callAI([
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

    const analysis = await callAI([
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

// ==================== 技术指标（MACD/KDJ/成交量/量比/资金流向/买卖力道） ====================

function calcEMA(data, period, field = 'close') {
  if (data.length < period) return [];
  const k = 2 / (period + 1);
  const result = [];
  // 第一个值用 SMA
  let sum = 0;
  for (let i = 0; i < period; i++) sum += parseFloat(data[i][field]) || 0;
  result.push(sum / period);
  for (let i = period; i < data.length; i++) {
    result.push((parseFloat(data[i][field]) || 0) * k + result[result.length - 1] * (1 - k));
  }
  // 前面填 null 对齐
  const aligned = new Array(period - 1).fill(null).concat(result);
  return aligned;
}

// 根据 K 线数据计算 MACD
function calcMACD(klineData) {
  const ema12 = calcEMA(klineData, 12);
  const ema26 = calcEMA(klineData, 26);

  const dif = [];
  const deaArr = [];
  const macdArr = [];

  for (let i = 0; i < klineData.length; i++) {
    if (ema12[i] == null || ema26[i] == null) {
      dif.push(null);
      deaArr.push(null);
      macdArr.push(null);
    } else {
      dif.push(ema12[i] - ema26[i]);
    }
  }

  // DEA = 9日 EMA of DIF
  for (let i = 0; i < dif.length; i++) {
    if (dif[i] == null) {
      deaArr.push(null);
      macdArr.push(null);
      continue;
    }
    if (deaArr.length > 0 && deaArr[deaArr.length - 1] != null) {
      deaArr.push(dif[i] * (2 / 10) + deaArr[deaArr.length - 1] * (8 / 10));
    } else {
      // 找前 9 个非 null DIF 算 SMA
      let count = 0, sum = 0;
      for (let j = i; j >= 0 && count < 9; j--) {
        if (dif[j] != null) { sum += dif[j]; count++; }
      }
      deaArr.push(count > 0 ? sum / count : 0);
    }
    macdArr.push(2 * (dif[i] - deaArr[i]));
  }

  return { dif, dea: deaArr, macd: macdArr };
}

// 根据 K 线数据计算 KDJ
function calcKDJ(klineData, n = 9) {
  const kArr = [], dArr = [], jArr = [];
  for (let i = 0; i < klineData.length; i++) {
    if (i < n - 1) {
      kArr.push(null); dArr.push(null); jArr.push(null);
      continue;
    }
    let high = -Infinity, low = Infinity;
    for (let j = i - n + 1; j <= i; j++) {
      const h = parseFloat(klineData[j].high) || 0;
      const l = parseFloat(klineData[j].low) || 0;
      if (h > high) high = h;
      if (l < low) low = l;
    }
    const rsv = low === high ? 50 : ((parseFloat(klineData[i].close) || 0) - low) / (high - low) * 100;
    const prevK = kArr.length > 0 && kArr[kArr.length - 1] != null ? kArr[kArr.length - 1] : 50;
    const prevD = dArr.length > 0 && dArr[dArr.length - 1] != null ? dArr[dArr.length - 1] : 50;
    kArr.push(prevK * 2 / 3 + rsv / 3);
    dArr.push(prevD * 2 / 3 + kArr[kArr.length - 1] / 3);
    jArr.push(3 * kArr[kArr.length - 1] - 2 * dArr[dArr.length - 1]);
  }
  return { k: kArr, d: dArr, j: jArr };
}

// 生成大白话解释
function explainIndicator(type, value, extra = {}) {
  switch (type) {
    case 'volume': {
      // value = { todayVol, avgVol, volRatio }
      const ratio = value.volRatio || 0;
      if (ratio > 3) return '爆量，交投异常活跃，多空分歧巨大，注意方向选择';
      if (ratio > 2) return '大幅放量，说明有大资金在动作，主力正在表态';
      if (ratio > 1.5) return '温和放量，市场关注度上升，属于健康换手';
      if (ratio > 1.0) return '量能正常，买卖双方力量均衡，走势延续概率大';
      if (ratio > 0.5) return '缩量调整，市场观望情绪浓，等待方向明朗';
      return '地量水平，几乎没有资金关注，短线难有行情';
    }
    case 'macd': {
      const { dif, dea, macd } = value;
      if (dif == null) return '数据不足，需要更多交易日才能计算';
      let desc = '';
      if (dif > dea && macd > 0) desc = 'DIFF在DEA上方且MACD红柱，属于多头趋势，持股为宜';
      else if (dif > dea && macd < 0) desc = 'DIFF刚上穿DEA，MACD绿柱缩短，金叉初期，反弹信号';
      else if (dif < dea && macd < 0) desc = 'DIFF在DEA下方且MACD绿柱，属于空头趋势，谨慎操作';
      else if (dif < dea && macd > 0) desc = 'DIFF刚下穿DEA，MACD红柱缩短，死叉初期，调整信号';
      else desc = 'MACD零轴附近纠缠，没有明确方向，多看少动';
      if (dif > 0) desc += '。DIFF在零轴上方，中期趋势偏多';
      else if (dif < 0) desc += '。DIFF在零轴下方，中期趋势偏空';
      return desc;
    }
    case 'kdj': {
      const { k, d, j } = value;
      if (k == null) return '数据不足';
      let desc = '';
      if (j > 100) desc = `J值${j.toFixed(1)}，严重超买（>100），随时可能回调，不宜追高`;
      else if (j > 80 && k > 80) desc = `J值${j.toFixed(1)}，K值${k.toFixed(1)}，处于超买区（>80），短期涨幅已大`;
      else if (j < 0) desc = `J值${j.toFixed(1)}，严重超卖（<0），随时可能反弹，不宜杀跌`;
      else if (j < 20 && k < 20) desc = `J值${j.toFixed(1)}，K值${k.toFixed(1)}，处于超卖区（<20），短期跌幅已大`;
      else if (j > 50 && k > d) desc = `J值${j.toFixed(1)}，K上穿D，金叉区域，上涨动能增强`;
      else if (j < 50 && k < d) desc = `J值${j.toFixed(1)}，K下穿D，死叉区域，下跌动能增强`;
      else desc = `J值${j.toFixed(1)}，中位震荡，方向不明朗`;
      return desc;
    }
    case 'volRatio': {
      const vr = value;
      if (vr > 3) return '量比极高，说明今天成交极度活跃，可能有重大消息刺激，注意跟风风险';
      if (vr > 2) return '量比偏大，成交活跃度显著高于平时，有资金在主动作为';
      if (vr > 1.2) return '量比温和偏大，今天交投比平时活跃，属于正常增量';
      if (vr > 0.8) return '量比正常，今天成交量和平常差不多，没什么异常';
      if (vr > 0.5) return '量比偏小，今天参与的人比平时少，市场兴趣下降';
      return '量比极小，几乎没人交易，属于僵尸股状态';
    }
    case 'fundFlow': {
      // value = { mainNet, bigNet, smallNet }
      const { mainNet } = value;
      if (mainNet > 5000) return '主力大举买入，机构/游资在主动吸筹，属于强力看多信号';
      if (mainNet > 1000) return '主力温和买入，有大资金在慢慢建仓，走势偏暖';
      if (mainNet > -1000) return '资金进出基本平衡，主力没有明显动作，横盘概率大';
      if (mainNet > -5000) return '主力温和卖出，有大资金在逐步撤退，注意跟风风险';
      return '主力大举卖出，机构/游资在出货，属于危险信号，建议减仓';
    }
    case 'buySellForce': {
      // value = { buyRatio, sellRatio }
      const { buyRatio } = value;
      if (buyRatio > 1.5) return '买方力量明显占优，买盘是卖盘的1.5倍以上，上涨动力足';
      if (buyRatio > 1.1) return '买方略强，买盘稍微多于卖盘，偏多格局';
      if (buyRatio > 0.9) return '买卖力量均衡，多空双方在博弈，等待方向选择';
      if (buyRatio > 0.7) return '卖方略强，卖盘多于买盘，有抛压但不算严重';
      return '卖方明显占优，卖压较重，股价容易被压低';
    }
    default:
      return '';
  }
}

// 获取日K线数据（东方财富）
async function fetchKlineData(stockCode, days = 60) {
  try {
    let marketId = '1';
    if (stockCode.startsWith('0') || stockCode.startsWith('3') ||
        stockCode.startsWith('1') || stockCode.startsWith('8') || stockCode.startsWith('9')) {
      marketId = '0';
    }
    const url = `http://push2his.eastmoney.com/api/qt/stock/kline/get?secid=${marketId}.${stockCode}&fields1=f1,f2,f3,f4,f5,f6&fields2=f51,f52,f53,f54,f55,f56,f57,f58,f59,f60,f61&klt=101&fqt=1&end=20500101&lmt=${days}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    const response = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0', 'Referer': 'http://quote.eastmoney.com' },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    const json = await response.json();

    if (json.data && json.data.klines) {
      return json.data.klines.map(line => {
        const parts = line.split(',');
        return {
          date: parts[0],
          open: parts[1],
          close: parts[2],
          high: parts[3],
          low: parts[4],
          volume: parts[5],
          amount: parts[6],
          amplitude: parts[7],
          changePercent: parts[8],
          change: parts[9],
          turnoverRate: parts[10],
        };
      });
    }
    return null;
  } catch (err) {
    console.error(`获取K线数据失败 ${stockCode}:`, err.message);
    return null;
  }
}

// 获取资金流向（东方财富）
async function fetchFundFlow(stockCode) {
  try {
    let marketId = '1';
    if (stockCode.startsWith('0') || stockCode.startsWith('3') ||
        stockCode.startsWith('1') || stockCode.startsWith('8') || stockCode.startsWith('9')) {
      marketId = '0';
    }
    const url = `http://push2.eastmoney.com/api/qt/stock/fflow/kline/get?secid=${marketId}.${stockCode}&fields1=f1,f2,f3,f7&fields2=f51,f52,f53,f54,f55,f56,f57,f58,f59,f60,f61,f62,f63&klt=1&lmt=1`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);
    const response = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0', 'Referer': 'http://quote.eastmoney.com' },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    const json = await response.json();

    if (json.data && json.data.klines && json.data.klines.length > 0) {
      const parts = json.data.klines[0].split(',');
      return {
        mainNet: parseFloat(parts[1]) || 0,    // 主力净流入（万元）
        bigNet: parseFloat(parts[5]) || 0,     // 超大单净流入
        midNet: parseFloat(parts[7]) || 0,     // 大单净流入
        smallNet: parseFloat(parts[3]) || 0,   // 小单净流入
      };
    }
    return null;
  } catch (err) {
    console.error(`获取资金流向失败 ${stockCode}:`, err.message);
    return null;
  }
}

// POST /api/stocks/indicator - 获取技术指标
router.post('/indicator', async (req, res) => {
  try {
    const { stockCode } = req.body;
    if (!stockCode) return res.json({ success: false, error: '缺少股票代码' });

    // 并行获取：实时报价 + K线数据 + 资金流向
    const [priceData, klineData, fundFlow] = await Promise.all([
      fetchEastMoneyPrice(stockCode),
      fetchKlineData(stockCode, 60),
      fetchFundFlow(stockCode),
    ]);

    if (!priceData || !priceData.currentPrice) {
      return res.json({ success: false, error: '获取实时行情失败' });
    }

    const indicators = {};

    // 1. 成交量（从实时数据获取）
    const volume = priceData.volume || 0;
    indicators.volume = {
      value: volume,
      unit: '手',
      show: volume > 0 ? `${(volume / 10000).toFixed(1)}万手` : '无数据',
    };

    // 2. 量比
    const volRatio = priceData.volumeRatio || 0;
    indicators.volRatio = {
      value: volRatio,
      show: volRatio > 0 ? volRatio.toFixed(2) : '--',
      explain: explainIndicator('volRatio', volRatio),
    };

    // 3. 成交量解释
    indicators.volume.explain = explainIndicator('volume', {
      volRatio,
      todayVol: volume,
      avgVol: volume / (volRatio || 1),
    });

    // 4. MACD
    if (klineData && klineData.length >= 30) {
      const macdData = calcMACD(klineData);
      const lastIdx = macdData.dif.length - 1;
      const dif = macdData.dif[lastIdx], dea = macdData.dea[lastIdx], macd = macdData.macd[lastIdx];
      indicators.macd = {
        dif: dif != null ? dif.toFixed(4) : '--',
        dea: dea != null ? dea.toFixed(4) : '--',
        macd: macd != null ? macd.toFixed(4) : '--',
        signal: dif != null && dea != null ? (dif > dea ? '金叉' : '死叉') : '--',
        trend: dif != null ? (dif > 0 ? '多头' : '空头') : '--',
        explain: explainIndicator('macd', { dif, dea, macd }),
      };
    }

    // 5. KDJ
    if (klineData && klineData.length >= 20) {
      const kdjData = calcKDJ(klineData, 9);
      const lastIdx = kdjData.k.length - 1;
      const k = kdjData.k[lastIdx], d = kdjData.d[lastIdx], j = kdjData.j[lastIdx];
      indicators.kdj = {
        k: k != null ? k.toFixed(2) : '--',
        d: d != null ? d.toFixed(2) : '--',
        j: j != null ? j.toFixed(2) : '--',
        signal: k != null && d != null ? (k > d ? '金叉' : j != null && j > 100 ? '超买' : j != null && j < 0 ? '超卖' : '死叉') : '--',
        explain: explainIndicator('kdj', { k, d, j }),
      };
    }

    // 6. 资金流向（万元）
    if (fundFlow) {
      const mainNetWan = fundFlow.mainNet;
      indicators.fundFlow = {
        mainNet: mainNetWan,
        bigNet: fundFlow.bigNet,
        midNet: fundFlow.midNet,
        smallNet: fundFlow.smallNet,
        show: mainNetWan > 0 ? `+${(mainNetWan / 10000).toFixed(2)}亿` : `${(mainNetWan / 10000).toFixed(2)}亿`,
        explain: explainIndicator('fundFlow', { mainNet: mainNetWan }),
      };
    }

    // 7. 买卖力道（盘口五档累积）
    if (priceData.buyVolumes && priceData.buyVolumes.length > 0) {
      const totalBuy = priceData.buyVolumes.reduce((a, b) => a + b, 0);
      const totalSell = priceData.sellVolumes.reduce((a, b) => a + b, 0);
      const buyRatio = totalSell > 0 ? totalBuy / totalSell : 1;
      indicators.buySellForce = {
        buyRatio,
        show: buyRatio > 0 ? `买${(buyRatio * 100).toFixed(0)}% vs 卖100%` : '无数据',
        explain: explainIndicator('buySellForce', { buyRatio, sellRatio: 1 }),
        totalBuy,
        totalSell,
      };
    }

    res.json({
      success: true,
      stockCode,
      stockName: priceData.stockName || '',
      currentPrice: priceData.currentPrice,
      indicators,
    });
  } catch (error) {
    console.error('获取技术指标失败:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const Market = require('../models/Market');
const { auth } = require('../middleware/auth');

// ============ 市场 CRUD ============

// GET /api/markets - 获取所有市场
router.get('/', auth, async (req, res) => {
  try {
    const markets = await Market.find({ user: req.user._id })
      .sort({ potentialScore: -1 });
    res.json({ success: true, markets });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/markets/:id - 获取单个市场
router.get('/:id', auth, async (req, res) => {
  try {
    const market = await Market.findOne({ _id: req.params.id, user: req.user._id });
    if (!market) return res.status(404).json({ success: false, error: '市场不存在' });
    res.json({ success: true, market });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/markets - 创建市场
router.post('/', auth, async (req, res) => {
  try {
    const { name, description, marketType, attentionScore, potentialScore, icon, tags, companies } = req.body;
    if (!name || !description) return res.status(400).json({ success: false, error: '名称和描述不能为空' });

    const market = await Market.create({
      user: req.user._id,
      name, description,
      marketType: marketType || 'potential',
      attentionScore: attentionScore || 50,
      potentialScore: potentialScore || 50,
      icon: icon || '',
      tags: tags || [],
      companies: companies || [],
    });
    res.json({ success: true, market });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PATCH /api/markets/:id - 更新市场
router.patch('/:id', auth, async (req, res) => {
  try {
    const market = await Market.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { $set: req.body },
      { new: true }
    );
    if (!market) return res.status(404).json({ success: false, error: '市场不存在' });
    res.json({ success: true, market });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/markets/:id - 删除市场
router.delete('/:id', auth, async (req, res) => {
  try {
    const market = await Market.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!market) return res.status(404).json({ success: false, error: '市场不存在' });
    res.json({ success: true, message: '删除成功' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ============ 企业管理 ============

// POST /api/markets/:id/companies - 添加企业
router.post('/:id/companies', auth, async (req, res) => {
  try {
    const { stockCode, stockName, link, description, marketCap, chainPosition } = req.body;
    if (!stockCode || !stockName) return res.status(400).json({ success: false, error: '股票代码和名称不能为空' });

    const market = await Market.findOne({ _id: req.params.id, user: req.user._id });
    if (!market) return res.status(404).json({ success: false, error: '市场不存在' });

    market.companies.push({ stockCode, stockName, link, description, marketCap, chainPosition });
    await market.save();
    res.json({ success: true, market });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/markets/:id/companies/:companyId - 删除企业
router.delete('/:id/companies/:companyId', auth, async (req, res) => {
  try {
    const market = await Market.findOne({ _id: req.params.id, user: req.user._id });
    if (!market) return res.status(404).json({ success: false, error: '市场不存在' });

    market.companies = market.companies.filter(c => c._id.toString() !== req.params.companyId);
    await market.save();
    res.json({ success: true, market });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ============ AI 分析（DeepSeek） ============

async function callDeepSeek(messages, temperature = 0.7) {
  const apiKey = process.env.DEEPSEEK_API_KEY || '';
  if (!apiKey) throw new Error('DeepSeek API Key 未配置');

  const resp = await fetch('https://api.deepseek.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
    body: JSON.stringify({ model: 'deepseek-chat', messages, temperature, max_tokens: 3000 }),
  });
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`DeepSeek API ${resp.status}: ${text}`);
  }
  const data = await resp.json();
  return data.choices?.[0]?.message?.content || '';
}

// 获取实时股价
async function fetchPrice(stockCode) {
  try {
    // 使用东方财富 API
    const marketId = stockCode.startsWith('0') || stockCode.startsWith('3') ? 0 : 1;
    const url = `https://push2.eastmoney.com/api/qt/stock/get?secid=${marketId}.${stockCode}&fields=f43,f44,f45,f46,f47,f48,f50,f55,f57,f58,f116,f117,f162,f168,f169,f170,f171`;
    const resp = await fetch(url);
    if (!resp.ok) return null;
    const data = await resp.json();
    if (!data?.data) return null;
    const d = data.data;
    return {
      currentPrice: d.f43 / 100,
      changePercent: d.f170 / 100,
      changeAmount: d.f169 / 100,
      highPrice: d.f44 / 100,
      lowPrice: d.f45 / 100,
      volume: d.f47,
      turnoverRate: d.f168 / 100,
      yesterdayClose: d.f48 / 100,
      pe: d.f162 / 100,
    };
  } catch { return null; }
}

// POST /api/markets/:id/analyze - AI 市场分析
router.post('/:id/analyze', auth, async (req, res) => {
  try {
    const market = await Market.findOne({ _id: req.params.id, user: req.user._id });
    if (!market) return res.status(404).json({ success: false, error: '市场不存在' });

    const marketTypeText = market.marketType === 'hot' ? '热门板块' : '潜力市场';
    const companiesStr = market.companies.map(c => `- ${c.stockName}（${c.stockCode}）${c.description ? ' - ' + c.description : ''}`).join('\n');

    const prompt = `请分析以下板块：\n板块名称：${market.name}\n类型：${marketTypeText}\n描述：${market.description}\n关注度：${market.attentionScore}/100\n潜力评分：${market.potentialScore}/100\n\n产业链企业：\n${companiesStr}\n\n请从以下维度分析：\n1. 市场定义与背景\n2. 基本面分析（核心驱动因素、行业景气度、市场规模）\n3. 当前阶段判断（底部/上升/高潮/回调）\n4. 投资建议和风险提示\n5. 产业链各环节投资机会`;

    const analysis = await callDeepSeek([
      { role: 'system', content: '你是专业股票投资分析师，擅长板块投资价值分析。使用 Markdown 格式，关键结论加粗。' },
      { role: 'user', content: prompt },
    ]);

    market.analysis = { content: analysis, generatedAt: new Date(), type: 'basic' };
    await market.save();

    res.json({ success: true, analysis: { content: analysis, generatedAt: market.analysis.generatedAt } });
  } catch (err) {
    console.error('市场分析失败:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;

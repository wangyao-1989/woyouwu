const express = require('express');
const NewsPreference = require('../models/NewsPreference');
const NewsItem = require('../models/NewsItem');
const { auth } = require('../middleware/auth');
const { fetchAllHeadlines } = require('../newsFetcher');

const router = express.Router();

const CATEGORY_LABELS = {
  tech: '技术',
  design: '设计',
  creative: '创意',
  literature: '文学',
  life: '生活',
  career: '职场',
  science: '科学',
  art: '艺术',
  custom: '定制',
};

router.get('/preferences', auth, async (req, res) => {
  try {
    let pref = await NewsPreference.findOne({ userId: req.user._id });
    if (!pref) {
      pref = { userId: req.user._id, categories: [], customKeywords: [] };
    }
    const allCategories = Object.keys(CATEGORY_LABELS)
      .filter(k => k !== 'custom')
      .map(key => ({ value: key, label: CATEGORY_LABELS[key] }));
    res.json({
      categories: pref.categories || [],
      customKeywords: pref.customKeywords || [],
      allCategories,
    });
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
});

router.put('/preferences', auth, async (req, res) => {
  try {
    const { categories, customKeywords } = req.body;

    if (!Array.isArray(categories)) {
      return res.status(400).json({ message: '请提供有效的分类数组' });
    }

    const validCategories = Object.keys(CATEGORY_LABELS).filter(k => k !== 'custom');
    const filteredCategories = categories.filter(c => validCategories.includes(c));

    let filteredKeywords = [];
    if (Array.isArray(customKeywords)) {
      filteredKeywords = customKeywords
        .map(k => (typeof k === 'string' ? k.trim() : ''))
        .filter(k => k.length > 0 && k.length <= 30)
        .slice(0, 10);
    }

    const pref = await NewsPreference.findOneAndUpdate(
      { userId: req.user._id },
      {
        categories: filteredCategories,
        customKeywords: filteredKeywords,
        updatedAt: new Date(),
      },
      { upsert: true, new: true }
    );

    await NewsItem.deleteMany({ generatedFor: req.user._id });

    res.json({
      message: '偏好设置已更新',
      categories: pref.categories,
      customKeywords: pref.customKeywords,
      news: [],
    });
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
});

async function callDeepSeek(messages, maxTokens = 3000) {
  const apiKey = process.env.DEEPSEEK_API_KEY || '';
  if (!apiKey) {
    throw new Error('AI 服务未配置 API Key');
  }

  const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages,
      temperature: 0.7,
      max_tokens: maxTokens,
    }),
  });

  if (!response.ok) {
    throw new Error('DeepSeek API returned ' + response.status);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || '';
}

function cleanJsonResponse(raw) {
  let cleaned = raw
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/, '')
    .trim();

  const firstBracket = cleaned.indexOf('[');
  const lastBracket = cleaned.lastIndexOf(']');
  if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
    cleaned = cleaned.substring(firstBracket, lastBracket + 1);
  }

  return cleaned;
}

function hasOldContent(item) {
  const text = (item.title || '') + (item.summary || '') + (item.detail || '');
  const oldYearRegex = /\b(2020|2021|2022|2023|2024)\b/;
  return oldYearRegex.test(text);
}

function filterFresh(items) {
  return items.filter(i => !hasOldContent(i));
}

async function generateAiNews(promptInput, count = 10) {
  let realHeadlines = [];
  try {
    realHeadlines = await fetchAllHeadlines();
  } catch (e) {
    console.log('[generateAiNews] RSS 获取失败');
  }

  if (realHeadlines.length < 10) {
    console.log(`[generateAiNews] 真实头条不足 (${realHeadlines.length}条)，拒绝生成`);
    return [];
  }

  const todayDate = new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' });
  const todayISO = new Date().toISOString().split('T')[0];

  const headlinesText = realHeadlines.map((h, i) =>
    `${i + 1}. [${h.sourceLabel}] ${h.title}\n   摘要: ${h.summary}\n   时间: ${h.pubDate}`
  ).join('\n\n');

  const systemPrompt = `你是一个专业的资讯编辑。今天的日期是 ${todayDate}（${todayISO}）。

以下是今天从各大新闻源抓取到的真实头条资讯：
---
${headlinesText}
---

请从上述真实资讯中，挑选 10 条最具代表性的，重新整理为结构化简报。
每条资讯的标题和内容必须严格基于上述真实头条，不要编造任何不存在的事件。

返回一个严格的 JSON 数组（只返回 JSON），每条资讯包含：
{
  "title": "基于真实头条精炼的标题（15字以内）",
  "summary": "根据真实内容撰写的摘要（80字以内）",
  "detail": "基于真实事件的深度分析（300字以内）",
  "category": "分类：tech/design/creative/literature/life/career/science/art/custom",
  "keywords": ["3-5个关键词"]
}`;

  const userContent = '请从上述真实资讯中精选 10 条，确保覆盖不同的分类领域。';

  const messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userContent },
  ];

  for (let attempt = 0; attempt < 3; attempt++) {
    const raw = await callDeepSeek(messages, 4000);
    const cleaned = cleanJsonResponse(raw);

    let parsed;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      const retryRaw = await callDeepSeek([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userContent },
        { role: 'assistant', content: raw },
        { role: 'user', content: 'JSON 格式有误，请重新返回严格的 JSON 数组。' },
      ], 4000);
      parsed = JSON.parse(cleanJsonResponse(retryRaw));
    }

    if (!Array.isArray(parsed)) continue;

    const fresh = filterFresh(parsed);
    if (fresh.length >= count - 2 || attempt === 2) {
      return fresh.slice(0, count).map((item, index) => ({
        title: (item.title || '今日资讯').substring(0, 200),
        summary: (item.summary || '').substring(0, 600),
        detail: (item.detail || '').substring(0, 2000),
        category: CATEGORY_LABELS[item.category] ? item.category : 'custom',
        author: { nickname: 'AI 资讯助手' },
        isAiGenerated: true,
        relatedKeywords: (item.keywords || []).slice(0, 5),
        hotScore: 100 - index * 5,
        publishDate: new Date(Date.now() - index * 60000),
      }));
    }

    messages.push(
      { role: 'assistant', content: raw },
      { role: 'user', content: `你返回的内容中包含了过去的年份信息（如2024、2023等），请严格按照今天（${todayDate}）的时间来重新生成。去掉所有提及过去年份的内容。` }
    );
  }

  return [];
}

async function generatePersonalizedAiNews(userCategories, userKeywords, count = 10) {
  let realHeadlines = [];
  try {
    realHeadlines = await fetchAllHeadlines();
  } catch (e) {
    console.log('[generatePersonalizedAiNews] RSS 获取失败');
  }

  if (realHeadlines.length < 10) {
    console.log(`[generatePersonalizedAiNews] 真实头条不足 (${realHeadlines.length}条)，拒绝生成`);
    return [];
  }

  const todayDate = new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' });
  const todayISO = new Date().toISOString().split('T')[0];

  const headlinesText = realHeadlines.map((h, i) =>
    `${i + 1}. [${h.sourceLabel}] ${h.title}\n   摘要: ${h.summary}\n   时间: ${h.pubDate}`
  ).join('\n\n');

  const categoryLabels = userCategories.map(c => CATEGORY_LABELS[c] || c).join('、');
  const keywordList = userKeywords.join('、');

  const preferenceDescription = [];
  if (categoryLabels) preferenceDescription.push(`关注的领域：${categoryLabels}`);
  if (keywordList) preferenceDescription.push(`关注的关键词：${keywordList}`);
  const preferenceText = preferenceDescription.length > 0 ? preferenceDescription.join('；') : '无特殊偏好';

  const systemPrompt = `你是一个专业的资讯编辑。今天的日期是 ${todayDate}（${todayISO}）。

以下是今天从各大新闻源抓取到的真实头条资讯：
---
${headlinesText}
---

用户定制了以下资讯偏好：
${preferenceText}

请从上述真实资讯中，优先筛选与用户偏好相关的资讯。如果真实头条中有与用户关键词直接相关的资讯，请优先选取。
如果部分关键词（如"十五五"等政策类话题）在今天的头条中没有直接体现，请从今日真实资讯中挑选最贴近用户关注的条目，并确保分析时结合用户关注点进行解读。

每条资讯的标题和内容必须严格基于上述真实头条，不要编造任何不存在的事件。

返回一个严格的 JSON 数组（只返回 JSON），每条资讯包含：
{
  "title": "基于真实头条精炼的标题（15字以内）",
  "summary": "根据真实内容撰写的摘要，突出与用户偏好相关的要点（80字以内）",
  "detail": "基于真实事件的深度分析，结合用户关注的领域或关键词进行解读（300字以内）",
  "category": "分类：tech/design/creative/literature/life/career/science/art/custom",
  "keywords": ["3-5个关键词，优先包含用户关注的关键词"]
}`;

  const userContent = `请为我精选 ${count} 条资讯，优先选择与「${preferenceText}」相关的内容。如果真实头条中确无直接相关内容，请挑选最贴近的条目并尽量在分析中关联用户的关注点。`;

  const messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userContent },
  ];

  for (let attempt = 0; attempt < 3; attempt++) {
    const raw = await callDeepSeek(messages, 4000);
    const cleaned = cleanJsonResponse(raw);

    let parsed;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      const retryRaw = await callDeepSeek([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userContent },
        { role: 'assistant', content: raw },
        { role: 'user', content: 'JSON 格式有误，请重新返回严格的 JSON 数组。' },
      ], 4000);
      parsed = JSON.parse(cleanJsonResponse(retryRaw));
    }

    if (!Array.isArray(parsed)) continue;

    const fresh = filterFresh(parsed);
    if (fresh.length >= count - 2 || attempt === 2) {
      return fresh.slice(0, count).map((item, index) => ({
        title: (item.title || '今日资讯').substring(0, 200),
        summary: (item.summary || '').substring(0, 600),
        detail: (item.detail || '').substring(0, 2000),
        category: CATEGORY_LABELS[item.category] ? item.category : 'custom',
        author: { nickname: 'AI 资讯助手' },
        isAiGenerated: true,
        relatedKeywords: (item.keywords || []).slice(0, 5),
        hotScore: 100 - index * 5,
        publishDate: new Date(Date.now() - index * 60000),
      }));
    }

    messages.push(
      { role: 'assistant', content: raw },
      { role: 'user', content: `你返回的内容中包含了过去的年份信息（如2024、2023等），请严格按照今天（${todayDate}）的时间来重新生成。去掉所有提及过去年份的内容。` }
    );
  }

  return [];
}

router.get('/hot', async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let news = await NewsItem.find({
      generatedFor: null,
      publishDate: { $gte: today },
    })
      .sort({ hotScore: -1 })
      .limit(10)
      .lean();

    if (news.length === 0) {
      news = await NewsItem.find({ generatedFor: null })
        .sort({ hotScore: -1 })
        .limit(10)
        .lean();
    }

    res.json({ news });
  } catch (error) {
    console.error('GET /news/hot error:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

router.get('/my', auth, async (req, res) => {
  try {
    const pref = await NewsPreference.findOne({ userId: req.user._id });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let news = await NewsItem.find({
      generatedFor: req.user._id,
      publishDate: { $gte: today },
    })
      .sort({ hotScore: -1 })
      .lean();

    const hasPreference = !!(pref?.categories?.length || pref?.customKeywords?.length);

    if (news.length === 0) {
      let hotNews = await NewsItem.find({
        generatedFor: null,
        publishDate: { $gte: today },
      })
        .sort({ hotScore: -1 })
        .limit(50)
        .lean();

      if (hotNews.length === 0) {
        hotNews = await NewsItem.find({ generatedFor: null })
          .sort({ hotScore: -1 })
          .limit(50)
          .lean();
      }

      if (hasPreference && hotNews.length > 0) {
        const userCategories = (pref?.categories || []).map(c => c);
        const userKeywords = (pref?.customKeywords || []).map(k => k.toLowerCase());

        const scored = hotNews.map(item => {
          let score = item.hotScore || 0;
          if (userCategories.includes(item.category)) {
            score += 1000;
          }
          if (item.relatedKeywords && item.relatedKeywords.length > 0) {
            for (const kw of item.relatedKeywords) {
              if (userKeywords.some(uk => kw.toLowerCase().includes(uk) || uk.includes(kw.toLowerCase()))) {
                score += 500;
              }
            }
          }
          const text = ((item.title || '') + (item.summary || '') + (item.detail || '')).toLowerCase();
          for (const uk of userKeywords) {
            if (text.includes(uk)) {
              score += 800;
            }
          }
          return { ...item, hotScore: score };
        });

        scored.sort((a, b) => b.hotScore - a.hotScore);
        news = scored.slice(0, 10);
      } else {
        news = hotNews.slice(0, 10);
      }

      return res.json({
        news,
        hasPreference,
        categories: pref?.categories || [],
        customKeywords: pref?.customKeywords || [],
      });
    }

    res.json({ news, hasPreference, categories: pref?.categories || [], customKeywords: pref?.customKeywords || [] });
  } catch (error) {
    console.error('GET /news/my error:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

router.post('/refresh', async (req, res) => {
  try {
    await NewsItem.deleteMany({ generatedFor: null });

    const apiKey = process.env.DEEPSEEK_API_KEY || '';
    if (apiKey) {
      const aiItems = await generateAiNews('HOT_NEWS', 10);
      if (aiItems.length > 0) {
        await NewsItem.insertMany(
          aiItems.map(item => ({
            ...item,
            generatedFor: null,
            sourceType: 'ai',
          }))
        );
      }
    }

    const count = await NewsItem.countDocuments({ generatedFor: null });
    res.json({ message: '资讯刷新成功', count });
  } catch (error) {
    console.error('POST /news/refresh error:', error);
    res.status(500).json({ message: '刷新失败：' + error.message });
  }
});

router.post('/refresh-my', auth, async (req, res) => {
  try {
    const pref = await NewsPreference.findOne({ userId: req.user._id });
    const userCategories = pref?.categories || [];
    const userKeywords = pref?.customKeywords || [];

    await NewsItem.deleteMany({ generatedFor: req.user._id });

    const apiKey = process.env.DEEPSEEK_API_KEY || '';
    if (!apiKey) {
      return res.json({ message: 'AI 服务未配置，已清除旧数据', count: 0 });
    }

    const hasPreference = userCategories.length > 0 || userKeywords.length > 0;

    let aiItems;
    if (hasPreference) {
      aiItems = await generatePersonalizedAiNews(userCategories, userKeywords, 10);
    } else {
      aiItems = await generateAiNews('HOT_NEWS', 10);
    }

    if (aiItems.length > 0) {
      await NewsItem.insertMany(
        aiItems.map(item => ({
          ...item,
          generatedFor: req.user._id,
          sourceType: 'ai',
        }))
      );
    }

    const count = await NewsItem.countDocuments({ generatedFor: req.user._id });
    res.json({ message: hasPreference ? '个性化资讯刷新成功' : '资讯刷新成功', count, hasPreference });
  } catch (error) {
    console.error('POST /news/refresh-my error:', error);
    res.status(500).json({ message: '刷新失败：' + error.message });
  }
});

module.exports = router;

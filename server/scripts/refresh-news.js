require('dotenv').config({ path: require('path').join(__dirname, '..', '.env.production') });
const mongoose = require('mongoose');
const NewsItem = require('../models/NewsItem');
const { fetchAllHeadlines } = require('../newsFetcher');

async function callDeepSeek(messages, maxTokens = 4000) {
  const apiKey = process.env.DEEPSEEK_API_KEY || '';
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
  return /\b(2020|2021|2022|2023|2024)\b/.test(text);
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
    } catch (e) {
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
        category: ['tech', 'design', 'creative', 'literature', 'life', 'career', 'science', 'art', 'custom'].includes(item.category) ? item.category : 'custom',
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

async function refreshNews() {
  console.log('[NewsRefresh] 开始聚合今日真实资讯...');
  console.log('[NewsRefresh] Step 1: 抓取 RSS 头条...');

  let realHeadlines = [];
  try {
    realHeadlines = await fetchAllHeadlines();
    console.log(`[NewsRefresh] 获取到 ${realHeadlines.length} 条真实头条`);
  } catch (e) {
    console.log('[NewsRefresh] RSS 获取失败');
  }

  await NewsItem.deleteMany({ generatedFor: null });

  if (realHeadlines.length < 10) {
    console.log(`[NewsRefresh] 真实头条不足 (${realHeadlines.length}条)，不生成，清空旧数据后退出`);
    const finalCount = await NewsItem.countDocuments({ generatedFor: null });
    console.log(`[NewsRefresh] 刷新完成，共 ${finalCount} 条资讯`);
    return finalCount;
  }

  const apiKey = process.env.DEEPSEEK_API_KEY || '';
  if (apiKey) {
    console.log('[NewsRefresh] Step 2: AI 整理摘要...');
    const aiItems = await generateAiNews('REFRESH', 10);

    if (aiItems.length > 0) {
      await NewsItem.insertMany(
        aiItems.map(item => ({
          ...item,
          generatedFor: null,
          sourceType: 'ai',
        }))
      );
      console.log(`[NewsRefresh] AI 整理完成，共 ${aiItems.length} 条资讯`);
    }
  } else {
    console.log('[NewsRefresh] 未配置 DEEPSEEK_API_KEY');
  }

  const finalCount = await NewsItem.countDocuments({ generatedFor: null });
  console.log(`[NewsRefresh] 刷新完成，共 ${finalCount} 条资讯`);
  return finalCount;
}

if (require.main === module) {
  mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/woyouwu', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  }).then(async () => {
    console.log('MongoDB connected');
    await refreshNews();
    process.exit(0);
  }).catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
}

module.exports = refreshNews;

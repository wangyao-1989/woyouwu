require('dotenv').config({ path: require('path').join(__dirname, '..', '.env.production') });
const mongoose = require('mongoose');
const NewsItem = require('../models/NewsItem');
const { fetchAllHeadlines } = require('../newsFetcher');
const ApiUsage = require('../models/ApiUsage');
const { getApiConfig } = require('../utils/apiConfig');

const fs = require('fs');

function logMemory(label) {
  const mem = process.memoryUsage();
  const heapMB = (mem.heapUsed / 1024 / 1024).toFixed(1);
  const heapTotalMB = (mem.heapTotal / 1024 / 1024).toFixed(1);
  const rssMB = (mem.rss / 1024 / 1024).toFixed(1);

  let sysMem = '';
  try {
    const meminfo = fs.readFileSync('/proc/meminfo', 'utf8');
    const total = meminfo.match(/MemTotal:\s+(\d+)/)?.[1];
    const avail = meminfo.match(/MemAvailable:\s+(\d+)/)?.[1];
    if (total && avail) {
      const totalMB = (total / 1024).toFixed(0);
      const availMB = (avail / 1024).toFixed(0);
      const usedPercent = ((1 - avail / total) * 100).toFixed(1);
      sysMem = ` | 系统总:${totalMB}MB 可用:${availMB}MB 占用:${usedPercent}%`;
    }
  } catch (e) {}

  console.log(`[MEM] ${label}: 堆${heapMB}MB/${heapTotalMB}MB RSS:${rssMB}MB${sysMem}`);
}

async function callDeepSeek(messages, maxTokens = 4000) {
  const { endpoint, model, apiKey } = await getApiConfig('newsGeneration');
  const finalKey = apiKey || process.env.DEEPSEEK_API_KEY || '';
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${finalKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.7,
      max_tokens: maxTokens,
    }),
  });

  if (!response.ok) {
    throw new Error('DeepSeek API returned ' + response.status);
  }

  const data = await response.json();
  const result = data.choices?.[0]?.message?.content || '';

  // 记录 API 使用
  const usage = data.usage || {};
  try {
    await ApiUsage.recordUsage({
      apiType: 'newsGeneration',
      promptTokens: usage.prompt_tokens || 0,
      completionTokens: usage.completion_tokens || 0,
      totalTokens: usage.total_tokens,
      status: 'success',
    });
  } catch (e) {
    // 记录失败不阻塞主流程
  }

  return result;
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

async function generateAiNews(promptInput, count = 10, existingHeadlines = null) {
  let realHeadlines = existingHeadlines;
  if (!realHeadlines) {
    try {
      realHeadlines = await fetchAllHeadlines();
    } catch (e) {
      console.log('[generateAiNews] RSS 获取失败');
      return [];
    }
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

  let convoMessages = [];

  for (let attempt = 0; attempt < 2; attempt++) {
    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userContent },
      ...convoMessages,
    ];

    const raw = await callDeepSeek(messages, 4000);
    const cleaned = cleanJsonResponse(raw);

    let parsed;
    try {
      parsed = JSON.parse(cleaned);
    } catch (e) {
      convoMessages = [
        { role: 'assistant', content: raw.substring(0, 500) },
        { role: 'user', content: 'JSON 格式有误，请只返回严格的 JSON 数组，不要任何解释。' },
      ];
      continue;
    }

    if (!Array.isArray(parsed)) {
      convoMessages = [
        { role: 'assistant', content: raw.substring(0, 500) },
        { role: 'user', content: '请返回一个 JSON 数组。' },
      ];
      continue;
    }

    const fresh = filterFresh(parsed);
    if (fresh.length === 0) {
      convoMessages = [
        { role: 'assistant', content: raw.substring(0, 500) },
        { role: 'user', content: `你返回的内容中包含了过去的年份信息（如2024、2023等），请严格按照今天（${todayDate}）的时间来重新生成。` },
      ];
      continue;
    }

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

  return [];
}

async function refreshNews() {
  logMemory('启动');
  console.log('[NewsRefresh] 开始聚合今日真实资讯...');
  console.log('[NewsRefresh] Step 1: 抓取 RSS 头条...');

  let realHeadlines = [];
  try {
    realHeadlines = await fetchAllHeadlines();
    logMemory('RSS抓取完成');
    console.log(`[NewsRefresh] 获取到 ${realHeadlines.length} 条真实头条`);
  } catch (e) {
    console.log('[NewsRefresh] RSS 获取失败');
  }

  await NewsItem.deleteMany({ generatedFor: null });
  logMemory('清理旧数据完成');

  if (realHeadlines.length < 10) {
    console.log(`[NewsRefresh] 真实头条不足 (${realHeadlines.length}条)，不生成，清空旧数据后退出`);
    const finalCount = await NewsItem.countDocuments({ generatedFor: null });
    console.log(`[NewsRefresh] 刷新完成，共 ${finalCount} 条资讯`);
    return finalCount;
  }

  const apiKey = process.env.DEEPSEEK_API_KEY || '';
  if (apiKey) {
    console.log('[NewsRefresh] Step 2: AI 整理摘要...');
    logMemory('AI调用前');
    const aiItems = await generateAiNews('REFRESH', 10, realHeadlines);

    if (aiItems.length > 0) {
      await NewsItem.insertMany(
        aiItems.map(item => ({
          ...item,
          generatedFor: null,
          sourceType: 'ai',
        }))
      );
      logMemory('AI写入完成');
      console.log(`[NewsRefresh] AI 整理完成，共 ${aiItems.length} 条资讯`);
    }
  } else {
    console.log('[NewsRefresh] 未配置 DEEPSEEK_API_KEY');
  }

  const finalCount = await NewsItem.countDocuments({ generatedFor: null });
  console.log(`[NewsRefresh] 刷新完成，共 ${finalCount} 条资讯`);
  logMemory('结束');
  return finalCount;
}

if (require.main === module) {
  mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/woyouwu')
    .then(async () => {
    console.log('MongoDB connected');
    await refreshNews();
    process.exit(0);
  }).catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
}

module.exports = refreshNews;

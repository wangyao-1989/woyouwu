const express = require('express');
const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { auth } = require('../middleware/auth');
const ScraperSave = require('../models/ScraperSave');
const { callDeepSeek } = require('../services/deepSeekService');

const router = express.Router();
const execAsync = promisify(exec);
const TMP_PREFIX = path.join(os.tmpdir(), 'woyouwu-scraper-');

// 清理临时文件
function cleanupTmp(pattern) {
  try {
    const dir = os.tmpdir();
    const files = fs.readdirSync(dir).filter(f => f.startsWith(`woyouwu-scraper-${pattern}`));
    files.forEach(f => { try { fs.unlinkSync(path.join(dir, f)); } catch (e) {} });
  } catch (e) {}
}

// 过滤爬取内容中的网站UI噪音（导航、登录、广告等）
function cleanText(text) {
  if (!text) return text;

  // 按行过滤
  const lines = text.split('\n');
  const cleaned = [];

  for (const line of lines) {
    const trimmed = line.trim();

    // 跳过空行
    if (!trimmed) continue;

    // 跳过单字/超短行（导航菜单项、图标文字等）
    if (trimmed.length <= 2) continue;

    // 跳过网站UI元素
    if (/^(登录|注册|搜索|首页|首页|返回|顶部|更多|设置|收藏|分享|点赞|评论|扫码|下载|关注|发布|选择|热门|推荐|最新|全部|综合|切换|关闭|展开|收起|菜单|导航|筛选|分类)$/.test(trimmed)) continue;

    // 跳过纯应用/下载相关
    if (/^(下载App|手机App|移动App|触屏版|小程序|i车商|本地服务|找论坛|车友圈|汽车之家|移动版|电脑版|客户端|Android版|iOS版|iPhone版|微信公众号|微信小程序|抖音小程序)$/.test(trimmed)) continue;

    // 跳过纯数字/日期（页码、浏览量等）
    if (/^[\d,]+浏览$/.test(trimmed)) continue;
    if (/^[\d-]+\s[\d:]+$/.test(trimmed)) continue;

    // 跳过"当前位置：XXX" 面包屑
    if (/^当前位置[：:]/.test(trimmed)) continue;
    if (/^(首页|目录)(\s*[>＞]\s*(首页|目录))*$/.test(trimmed)) continue;

    // 跳过明显是导航URL的行
    if (trimmed.startsWith('http') && trimmed.length < 60) continue;

    cleaned.push(line);
  }

  // 去重：连续重复行只保留一次
  const deduped = [];
  for (let i = 0; i < cleaned.length; i++) {
    if (i > 0 && cleaned[i].trim() === cleaned[i - 1].trim()) continue;
    deduped.push(cleaned[i]);
  }

  return deduped.join('\n');
}

// 解析百度搜索结果：按 c-container 容器提取，过滤广告
function parseBaiduResults(html, maxResults) {
  const results = [];

  // 按 c-container 切分，每个容器一个搜索结果
  const containers = html.split(/<div[^>]*class="[^"]*c-container[^"]*"/i).slice(1);

  for (const container of containers) {
    if (results.length >= maxResults) break;

    // 跳过广告：ec_im 类、淘宝推广、促销广告等
    if (/class="[^"]*ec_im[^"]*"/i.test(container)) continue;
    if (/simba\.taobao|redirect\.simba/i.test(container)) continue;
    if (/16888\.com|buy\.16888/i.test(container)) continue;

    // 提取标题（h3 内文本）
    const h3Match = container.match(/<h3[^>]*>([\s\S]*?)<\/h3>/i);
    if (!h3Match) continue;
    const titleText = h3Match[1].replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
    if (!titleText || titleText.length < 4) continue;

    // 跳过百度内部链接（图片搜索、企业查询等非目标页面）
    if (titleText.includes('百度图片') || titleText.includes('- 百度图片')) continue;

    // 提取 URL
    let url = '';
    const landurlMatch = container.match(/data-landurl="(https?:\/\/[^"]+)"/i);
    if (landurlMatch) {
      url = landurlMatch[1];
    } else {
      // 优先取 href 中的链接（可能是百度跳转链接，scrapling 会跟随重定向）
      const hrefMatch = container.match(/href="(https?:\/\/(?:www\.)?baidu\.com\/link\?url=[^"]+)"/i)
        || container.match(/href="(https?:\/\/[^"]+)"/i);
      if (hrefMatch) {
        url = hrefMatch[1];
      }
    }
    if (!url) continue;

    // 跳过百度内部服务
    if (/image\.baidu\.com/i.test(url)) continue;
    if (/aiqicha\.baidu\.com/i.test(url) && !titleText.includes('官网')) continue;

    // 提取摘要
    let snippet = '';
    const absMatch = container.match(/<(?:div|span)[^>]*class="[^"]*(?:c-abstract|c-span-last|content-right_)[^"]*"[^>]*>([\s\S]*?)<\/(?:div|span)>/i);
    if (absMatch) {
      snippet = absMatch[1].replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
    }

    results.push({
      url: url.replace(/&amp;/g, '&'),
      title: titleText,
      snippet: snippet || '',
    });
  }

  return results;
}

// 用 DeepSeek 总结提炼爬取内容
async function summarizeContent(content, source) {
  // 内容太短不需要总结
  if (!content || content.length < 200) return '';

  // 截取前 8000 字避免 token 过大
  const truncated = content.substring(0, 8000);

  try {
    const result = await callDeepSeek([
      {
        role: 'system',
        content: `你是一个信息提炼助手。今天是2026年6月20日。用户爬取了网页的纯文本内容，需要你总结提炼关键信息。

要求：
1. 提取网页中的核心信息、关键数据、主要观点
2. 如果内容包含日期，标注出来，优先提取2025-2026年的最新数据
3. 用简洁的中文总结，150-300字
4. 如果内容很少（主要是图片展示型页面），说明"该页面主要为图片/产品展示，文字信息有限"，然后列出能提取到的有效信息
5. 不要编造内容，只基于提供的文本提炼
6. 不要提"根据提供的网页内容"之类的套话，直接给干货`
      },
      {
        role: 'user',
        content: `网页来源：${source}\n\n网页内容：\n${truncated}`
      }
    ]);
    return result.trim();
  } catch (e) {
    console.error('summarizeContent error:', e.message);
    return '';
  }
}

// ---------- 1. 爬取 URL ----------
router.post('/fetch-url', async (req, res) => {
  const ts = Date.now();
  const tmpFile = `${TMP_PREFIX}url-${ts}.txt`;
  try {
    const { url } = req.body;
    if (!url || !url.trim()) {
      return res.status(400).json({ message: '请输入网址' });
    }
    const cleanUrl = url.trim();
    if (!/^https?:\/\/.+/.test(cleanUrl)) {
      return res.status(400).json({ message: '请输入有效的网址（以 http:// 或 https:// 开头）' });
    }

    // 用 Scrapling CLI 爬取
    let fetched = false;
    try {
      await execAsync(`scrapling extract get "${cleanUrl}" "${tmpFile}" --ai-targeted --timeout 30`, { timeout: 60000 });
      fetched = true;
    } catch (e) {
      // get 失败，尝试浏览器渲染模式
      try {
        const htmlFile = `${TMP_PREFIX}url-${ts}.html`;
        const stealthyScript = path.join(__dirname, '..', 'stealthy_fetch.py');
        await execAsync(
          `python3 "${stealthyScript}" "${cleanUrl}" "${htmlFile}" --headless --timeout 60000`,
          { timeout: 120000 }
        );
        // 浏览器取回的是HTML，提取文本写入txt文件
        const htmlContent = fs.readFileSync(htmlFile, 'utf-8');
        fs.unlinkSync(htmlFile);
        const textContent = htmlContent.replace(/<[^>]*>/g, '\n').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
        fs.writeFileSync(tmpFile, textContent, 'utf-8');
        fetched = true;
      } catch (e2) {
        cleanupTmp('url-');
        return res.status(502).json({ message: '网页爬取失败：网站可能无法访问或存在反爬保护' });
      }
    }

    if (!fetched) {
      cleanupTmp('url-');
      return res.status(502).json({ message: '爬取失败' });
    }

    let rawContent = '';
    try {
      rawContent = fs.readFileSync(tmpFile, 'utf-8');
      fs.unlinkSync(tmpFile);
    } catch (e) {
      cleanupTmp('url-');
      return res.status(500).json({ message: '读取爬取内容失败' });
    }

    // 过滤网站UI噪音
    rawContent = cleanText(rawContent);

    // AI 总结提炼
    const aiSummary = await summarizeContent(rawContent, cleanUrl);

    res.json({
      rawContent: rawContent || '(页面内容为空)',
      source: cleanUrl,
      type: 'url',
      title: '',
      aiSummary,
    });
  } catch (error) {
    cleanupTmp('url-');
    console.error('fetch-url error:', error.message);
    res.status(500).json({ message: '爬取失败：' + (error.message || '未知错误') });
  }
});

// ---------- 2. 关键词研究（多源搜索 + AI综合分析）----------

// 解析 Bing 搜索结果
function parseBingResults(html, maxResults) {
  const results = [];
  // Bing 搜索结果在 <li class="b_algo"> 中
  const algoRegex = /<li class="b_algo"[^>]*>([\s\S]*?)<\/li>/gi;
  let match;
  while ((match = algoRegex.exec(html)) !== null && results.length < maxResults) {
    const block = match[1];
    // 提取标题
    const h2Match = block.match(/<h2[^>]*>[\s\S]*?<a[^>]*>([\s\S]*?)<\/a>/i);
    if (!h2Match) continue;
    const title = h2Match[1].replace(/<[^>]*>/g, '').trim();
    if (!title || title.length < 4) continue;
    // 提取URL
    const citeMatch = block.match(/https?:\/\/[^\s"<>]+/);
    const url = citeMatch ? citeMatch[0].replace(/&amp;/g, '&') : '';
    if (!url) continue;
    // 提取摘要
    let snippet = '';
    const snippetMatch = block.match(/<p[^>]*class="[^"]*b_lineclamp[^"]*"[^>]*>([\s\S]*?)<\/p>/i)
      || block.match(/<p[^>]*>([\s\S]*?)<\/p>/i);
    if (snippetMatch) {
      snippet = snippetMatch[1].replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
    }
    results.push({ url, title, snippet: snippet || '', source: 'bing' });
  }
  return results;
}

// AI 查询提炼：把模糊查询变成精准搜索词
async function refineQuery(rawQuery) {
  try {
    const result = await callDeepSeek([
      {
        role: 'system',
        content: `你是搜索策略专家。用户想了解某个主题，你需要将其转化为高效搜索词。

要求：
1. 输出 2-3 个不同角度的搜索词（每个8-20字），覆盖不同信息维度
2. 搜索词要具体、可搜到实际网页（不是问答式）
3. 如果用户输入太宽泛（比如"经济""科技"），在 suggestions 里给出引导建议让用户更具体
4. 如果用户输入已经很具体，返回空 suggestions

返回纯JSON（不要markdown标记）：
{"terms": ["搜索词1", "搜索词2"], "suggestions": "如果太宽泛，引导用户的话（否则空字符串）"}`
      },
      { role: 'user', content: `用户想了解：${rawQuery}` }
    ]);
    const cleaned = result.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
    return JSON.parse(cleaned);
  } catch (e) {
    // 回退：直接用原词
    return { terms: [rawQuery], suggestions: '' };
  }
}

// 搜索单个源
async function searchSource(engine, keyword, ts, timeFilter) {
  let url;
  const tmpFile = `${TMP_PREFIX}${engine}-${ts}.html`;

  if (engine === 'baidu') {
    // 百度时间过滤：&gpc=stf筛选起始值|stftype=1（按时间排序）
    const timeParam = timeFilter ? '&gpc=stf%3D' + timeFilter + '%7Cstftype%3D1' : '';
    url = `https://www.baidu.com/s?wd=${encodeURIComponent(keyword)}${timeParam}`;
  } else {
    // Bing 时间过滤：tbs=qdr:w（周）/ qdr:m（月）
    const timeParam = timeFilter ? `&tbs=${timeFilter}` : '';
    url = `https://www.bing.com/search?q=${encodeURIComponent(keyword)}${timeParam}`;
  }

  try {
    if (engine === 'baidu') {
      // 百度搜索结果需要浏览器渲染JS，用 Patchright (stealthy_fetch.py)
      const stealthyScript = path.join(__dirname, '..', 'stealthy_fetch.py');
      try {
        await execAsync(
          `python3 "${stealthyScript}" "${url}" "${tmpFile}" --headless --timeout 60000`,
          { timeout: 120000 }
        );
      } catch (e) {
        // 浏览器不可用时，回退到 get（只能拿到有限内容）
        try { fs.unlinkSync(tmpFile); } catch (_) {}
        console.error(`Baidu stealthy-fetch 失败，回退 get：${e.message.substring(0, 80)}`);
        await execAsync(`scrapling extract get "${url}" "${tmpFile}" --timeout 20`, { timeout: 60000 });
      }
    } else {
      // Bing 搜索结果不需要JS渲染，get即可
      await execAsync(`scrapling extract get "${url}" "${tmpFile}" --timeout 20`, { timeout: 60000 });
    }

    const html = fs.readFileSync(tmpFile, 'utf-8');
    fs.unlinkSync(tmpFile);

    if (!html || html.trim().length < 200) return [];

    const parser = engine === 'baidu' ? parseBaiduResults : parseBingResults;
    const results = parser(html, 5);

    // 标记来源
    return results.map(r => ({ ...r, source: engine }));
  } catch (e) {
    try { fs.unlinkSync(tmpFile); } catch (_) {}
    console.error(`searchSource ${engine} error:`, e.message);
    return [];
  }
}

// 爬取单个URL内容
async function fetchPageContent(url, ts, index) {
  const tmpFile = `${TMP_PREFIX}page-${ts}-${index}.txt`;
  try {
    await execAsync(`scrapling extract get "${url}" "${tmpFile}" --ai-targeted --timeout 20`, { timeout: 30000 });
    let content = fs.readFileSync(tmpFile, 'utf-8');
    fs.unlinkSync(tmpFile);
    content = cleanText(content);
    return content && content.trim().length > 30 ? content.substring(0, 6000) : '';
  } catch (e) {
    try { fs.unlinkSync(tmpFile); } catch (_) {}
    return '';
  }
}

// AI 综合研究报告 — 核心！不是复制粘贴，而是 AI 消化理解后用自己的话说
async function synthesizeReport(keyword, searchResults, pageContents) {
  // 构建待研究材料
  let materials = `## 用户查询\n${keyword}\n\n`;

  materials += `## 搜索结果（共${searchResults.length}条）\n`;
  searchResults.forEach((r, i) => {
    materials += `${i + 1}. [${r.title}](${r.url}) — ${r.snippet}\n`;
  });

  materials += `\n## 已爬取网页内容\n`;
  pageContents.forEach((pc, i) => {
    materials += `\n### 来源 ${i + 1}：${pc.title}\n${pc.content}\n`;
  });

  try {
    const report = await callDeepSeek([
      {
        role: 'system',
        content: `你是资深信息分析师。今天是 2026年6月20日。用户想了解某个主题，你已经获取了多个网页的内容。请基于这些材料，编写一份综合研究报告。

⚠️ 重点关注2026年的最新信息，标注过时内容。

核心原则：
- 你不是网页复读机！你要像人类分析师一样，消化所有材料后，用自己的话组织成一份有逻辑的报告
- 不要逐条罗列"来源1说...来源2说..."，而是融会贯通，按主题/观点/数据来组织
- 提取最关键的硬数据（数字、日期、金额、百分比）和核心观点
- 清晰标注信息出处（如[来源2]），让用户知道信息的来源
- 如果信息之间有矛盾，指出来
- 如果信息有限，诚实说明"目前掌握的信息有限，以下内容基于已获取的材料"

报告结构：
1. **核心发现**（3-5条要点，每条1-2句话）
2. **详细分析**（按维度展开，每个维度融合多个来源的信息）
3. **信息缺口**（指出哪些方面信息不足，建议进一步关注）
4. **信息来源**（列出参考的网页标题和链接）

字数：300-600字，简洁有料，不要废话。`
      },
      { role: 'user', content: materials }
    ]);
    return report.trim();
  } catch (e) {
    console.error('synthesizeReport error:', e.message);
    return '';
  }
}

// 关键词研究主端点
router.post('/search-keyword', async (req, res) => {
  const ts = Date.now();
  try {
    const { keyword, refine } = req.body;
    if (!keyword || !keyword.trim()) {
      return res.status(400).json({ message: '请输入关键词' });
    }
    const rawKeyword = keyword.trim();

    // ====== 步骤1：AI 查询提炼 ======
    const refined = await refineQuery(rawKeyword);

    // ====== 步骤2：多源并行搜索 ======
    const allTerms = refined.terms.length > 0 ? refined.terms : [rawKeyword];
    const searchPromises = [];
    allTerms.forEach(term => {
      searchPromises.push(searchSource('baidu', `2026年 ${term}`, ts));
      searchPromises.push(searchSource('bing', `2026 ${term}`, ts, 'qdr:m'));
    });

    const allResultSets = await Promise.all(searchPromises);
    // 合并去重
    const seenUrls = new Set();
    const mergedResults = [];
    allResultSets.forEach(set => {
      set.forEach(r => {
        // 规范化URL去重
        const norm = r.url.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '');
        if (!seenUrls.has(norm)) {
          seenUrls.add(norm);
          mergedResults.push(r);
        }
      });
    });

    if (mergedResults.length === 0) {
      return res.json({
        type: 'keyword',
        source: rawKeyword,
        refined,
        report: '',
        searchResults: [],
        message: refined.suggestions || '多源搜索未找到相关结果，建议换个关键词试试',
      });
    }

    // ====== 步骤3：AI 筛选最佳结果 ======
    let selectedUrls = [];
    let aiFilterReason = '';
    try {
      const resultsList = mergedResults.map((r, i) =>
        `${i + 1}. [${r.source.toUpperCase()}] ${r.title}\n   摘要：${r.snippet}\n   网址：${r.url}`
      ).join('\n\n');

      const aiResponse = await callDeepSeek([
        {
          role: 'system',
          content: `你是信息筛选助手。从搜索结果中选出最值得深入阅读的 3-5 条。

标准：
1. 相关性（最高优先级）— 必须与主题密切相关
2. 权威性 — 官方、知名媒体、专业平台优先
3. 互补性 — 选不同来源、不同角度的信息，避免重复

返回纯JSON：
{"selected": [1, 3, 5], "reason": "筛选理由（50字内）"}`
        },
        { role: 'user', content: `主题：${rawKeyword}\n\n搜索结果：\n${resultsList}` }
      ]);

      const parsed = JSON.parse(aiResponse.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim());
      aiFilterReason = parsed.reason || '';
      selectedUrls = (parsed.selected || []).map(i => mergedResults[i - 1]).filter(Boolean);
      if (selectedUrls.length === 0) selectedUrls = mergedResults.slice(0, 3);
    } catch (e) {
      selectedUrls = mergedResults.slice(0, 3);
      aiFilterReason = '（AI筛选暂不可用，取前3条）';
    }

    // ====== 步骤4：并发爬取选中网页 ======
    const pageContents = [];
    const fetchPromises = selectedUrls.map((sel, i) =>
      fetchPageContent(sel.url, ts, i).then(content => {
        if (content) pageContents.push({ title: sel.title, url: sel.url, content, source: sel.source });
      })
    );
    await Promise.all(fetchPromises);

    // ====== 步骤5：AI 综合分析报告 ======
    const report = await synthesizeReport(rawKeyword, mergedResults, pageContents);

    // ====== 步骤6：构造 rawContent（保留原始爬取内容备查）=====
    let rawContent = `## 🔍 搜索主题：${rawKeyword}\n`;
    rawContent += `## 🎯 AI 提炼搜索词：${refined.terms.join(' / ')}\n\n`;
    rawContent += `## 🤖 筛选理由：${aiFilterReason}\n\n`;
    rawContent += `## 📋 多源搜索结果（共 ${mergedResults.length} 条，选中 ${selectedUrls.length} 条）：\n\n`;
    for (let i = 0; i < mergedResults.length; i++) {
      const r = mergedResults[i];
      const sel = selectedUrls.some(s => s.url === r.url);
      rawContent += `${sel ? '✅' : '  '} ${i + 1}. [${r.source.toUpperCase()}] ${r.title}\n   ${r.snippet}\n   🔗 ${r.url}\n\n`;
    }
    if (pageContents.length > 0) {
      rawContent += `\n## 📄 爬取详情：\n\n`;
      pageContents.forEach(pc => {
        rawContent += `### ${pc.title}\n${pc.content}\n---\n\n`;
      });
    }

    res.json({
      rawContent,
      report,
      source: rawKeyword,
      type: 'keyword',
      refined,
      searchResults: mergedResults,
      selectedUrls,
      aiFilterReason,
    });
  } catch (error) {
    cleanupTmp('baidu-');
    cleanupTmp('bing-');
    cleanupTmp('page-');
    console.error('search-keyword error:', error.message);
    res.status(500).json({ message: '研究失败：' + (error.message || '未知错误') });
  }
});

// ---------- 2.5 行业简报模式（三层信息结构）----------

// 解析知乎搜索结果
function parseZhihuResults(html, maxResults) {
  const results = [];
  // 知乎搜索结果在 .List-item 容器中
  const itemRegex = /<div[^>]*class="[^"]*List-item[^"]*"[^>]*>([\s\S]*?)<\/div>\s*<div[^>]*class="[^"]*List-item[^"]*"/gi;
  const items = [];
  let match;
  while ((match = itemRegex.exec(html)) !== null && items.length < maxResults) {
    items.push(match[1]);
  }
  // 如果没匹配到，尝试另一种结构
  if (items.length === 0) {
    const altRegex = /<a[^>]*class="[^"]*TopicLink[^"]*"[^>]*href="(\/question\/\d+\/answer\/\d+)"[^>]*>([\s\S]*?)<\/a>/gi;
    while ((match = altRegex.exec(html)) !== null && results.length < maxResults) {
      results.push({
        url: 'https://www.zhihu.com' + match[1],
        title: match[2].replace(/<[^>]*>/g, '').trim(),
        snippet: '',
        source: 'zhihu',
      });
    }
    return results;
  }

  for (const item of items) {
    if (results.length >= maxResults) break;
    const h2Match = item.match(/<a[^>]*href="(\/[^"]+)"[^>]*>([\s\S]*?)<\/a>/i);
    if (!h2Match) continue;
    const url = 'https://www.zhihu.com' + h2Match[1];
    const title = h2Match[2].replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
    if (!title || title.length < 4) continue;
    const snippet = '';
    results.push({ url, title, snippet, source: 'zhihu' });
  }
  return results;
}

// 搜索社交平台（知乎）
async function searchSocialSource(keyword, ts) {
  const url = `https://www.zhihu.com/search?type=content&q=${encodeURIComponent(keyword)}`;
  const tmpFile = `${TMP_PREFIX}social-${ts}.html`;
  const stealthyScript = path.join(__dirname, '..', 'stealthy_fetch.py');
  try {
    await execAsync(
      `python3 "${stealthyScript}" "${url}" "${tmpFile}" --headless --timeout 60000`,
      { timeout: 120000 }
    );
    const html = fs.readFileSync(tmpFile, 'utf-8');
    fs.unlinkSync(tmpFile);
    if (!html || html.trim().length < 500) return [];
    return parseZhihuResults(html, 5);
  } catch (e) {
    try { fs.unlinkSync(tmpFile); } catch (_) {}
    console.error('searchSocialSource error:', e.message);
    return [];
  }
}

// AI 生成行业简报（三层模板）
async function generateBriefing(topic, newsResults, socialResults, newsContent) {
  let materials = `## 简报主题\n${topic}\n\n`;

  materials += `## 新闻搜索结果（共 ${newsResults.length} 条）\n`;
  newsResults.forEach((r, i) => {
    materials += `${i + 1}. [${r.source.toUpperCase()}] ${r.title} — ${r.snippet}\n   链接：${r.url}\n`;
  });

  if (socialResults.length > 0) {
    materials += `\n## 社交平台讨论（知乎等，共 ${socialResults.length} 条）\n`;
    socialResults.forEach((r, i) => {
      materials += `${i + 1}. ${r.title}\n   链接：${r.url}\n`;
    });
  }

  if (newsContent.length > 0) {
    materials += `\n## 已爬取新闻详情\n`;
    newsContent.forEach((pc, i) => {
      materials += `\n### ${pc.title}\n${pc.content.substring(0, 3000)}\n`;
    });
  }

  try {
    const briefing = await callDeepSeek([
      {
        role: 'system',
        content: `你是资深行业分析师，负责生成结构化的行业每日简报。今天是 2026年6月20日。

**⚠️ 时效性要求：所有内容必须来自2026年的最新信息。丢弃任何2025年及以前的内容。标注为"推测"的除外。**

请严格按以下模板输出。

## 简报模板

### 🌍 全球 Top 10 要闻（按重要性排序）
1. [标题] — [1-2句简述]
每条末尾标注验证等级：🔵确认事实（来源于官方/知名媒体） / 🟡行业推测（分析机构判断） / 🟣网络讨论（社交平台热议）

### 🇨🇳 中国重点（3条）
### 🇪🇺 欧洲重点（3条）  
### 🇺🇸 美国重点（3条）

### 🚗 新能源趋势总结
### 🤖 智能驾驶趋势总结
### 🔗 供应链趋势总结

### 🏢 重点公司动态
Tesla / Toyota / VW / BYD / Geely / Volvo — 各1-2条

### 👤 行业人事变动
CEO/采购/供应链/组织调整

### 💬 舆情对比
媒体观点（专业媒体怎么看）vs 社交平台（知乎/论坛怎么讨论）

---

核心要求：
1. **严格区分验证等级**：每条必须标注 🔵🟡🟣
2. 基于实际搜索到的材料，没有找到信息的部分标注"今日暂无该维度重要信息"
3. 舆情层：对比专业媒体的客观报道 vs 社交平台的讨论情绪
4. 数据必须来自爬取的材料，不要编造
5. 中文输出，简洁有力，每条1-3句话
6. 总长度 800-1500 字`
      },
      { role: 'user', content: materials }
    ]);
    return briefing.trim();
  } catch (e) {
    console.error('generateBriefing error:', e.message);
    return '';
  }
}

// 行业简报端点
router.post('/briefing', async (req, res) => {
  const ts = Date.now();
  try {
    const { topic } = req.body;
    if (!topic || !topic.trim()) {
      return res.status(400).json({ message: '请输入简报主题，如"汽车行业"' });
    }
    const briefingTopic = topic.trim();

    // ====== 1. 并行搜索：新闻源 + 社交源 ======
    const [baiduResults, bingResults, socialResults] = await Promise.all([
      searchSource('baidu', `2026年 ${briefingTopic} 最新新闻`, ts),
      searchSource('bing', `2026 ${briefingTopic} latest news`, ts, 'qdr:m'),
      searchSocialSource(`2026 ${briefingTopic}`, ts),
    ]);

    // 合并新闻结果
    const seenUrls = new Set();
    const mergedNews = [];
    [...baiduResults, ...bingResults].forEach(r => {
      const norm = r.url.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '');
      if (!seenUrls.has(norm)) {
        seenUrls.add(norm);
        mergedNews.push(r);
      }
    });

    if (mergedNews.length === 0) {
      return res.json({
        type: 'briefing',
        source: briefingTopic,
        report: '',
        newsResults: [],
        socialResults: [],
        message: '未找到相关新闻，建议换个关键词试试',
      });
    }

    // ====== 2. AI 筛选最重要的新闻（5-8条） ======
    let topNews = [];
    try {
      const resultsList = mergedNews.map((r, i) =>
        `${i + 1}. [${r.source.toUpperCase()}] ${r.title}\n   摘要：${r.snippet}\n   网址：${r.url}`
      ).join('\n\n');

      const aiResponse = await callDeepSeek([
        {
          role: 'system',
          content: `选出最重要的 5-8 条新闻，优先时效性强、涉及头部公司的。返回JSON {"selected":[1,3,5]}`,
        },
        { role: 'user', content: `简报主题：${briefingTopic}\n\n候选新闻：\n${resultsList}` },
      ]);
      const parsed = JSON.parse(aiResponse.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim());
      topNews = (parsed.selected || []).map(i => mergedNews[i - 1]).filter(Boolean);
      if (topNews.length === 0) topNews = mergedNews.slice(0, 6);
    } catch (e) {
      topNews = mergedNews.slice(0, 6);
    }

    // ====== 3. 并发爬取新闻详情 ======
    const newsContent = [];
    const fetchPromises = topNews.map((r, i) =>
      fetchPageContent(r.url, ts, i).then(content => {
        if (content) newsContent.push({ title: r.title, url: r.url, content, source: r.source });
      })
    );
    await Promise.all(fetchPromises);

    // ====== 4. 生成三层简报 ======
    const report = await generateBriefing(briefingTopic, mergedNews, socialResults, newsContent);

    // ====== 5. 构造 rawContent ======
    let rawContent = `## 🔬 行业简报主题：${briefingTopic}\n\n`;
    rawContent += `## 📰 新闻来源（共 ${mergedNews.length} 条）\n`;
    mergedNews.forEach((r, i) => {
      rawContent += `${i + 1}. [${r.source.toUpperCase()}] ${r.title}\n   🔗 ${r.url}\n`;
    });
    if (socialResults.length > 0) {
      rawContent += `\n## 💬 社交讨论（知乎，共 ${socialResults.length} 条）\n`;
      socialResults.forEach((r, i) => {
        rawContent += `${i + 1}. ${r.title}\n   🔗 ${r.url}\n`;
      });
    }
    if (newsContent.length > 0) {
      rawContent += `\n## 📄 详情\n`;
      newsContent.forEach(pc => {
        rawContent += `### ${pc.title}\n${pc.content.substring(0, 4000)}\n---\n`;
      });
    }

    res.json({
      rawContent,
      report,
      source: briefingTopic,
      type: 'briefing',
      newsResults: mergedNews,
      socialResults,
    });
  } catch (error) {
    cleanupTmp('baidu-');
    cleanupTmp('bing-');
    cleanupTmp('social-');
    cleanupTmp('page-');
    console.error('briefing error:', error.message);
    res.status(500).json({ message: '简报生成失败：' + (error.message || '未知错误') });
  }
});

// ---------- 3. 保存内容 ----------
router.post('/save', auth, async (req, res) => {
  try {
    const { type, source, title, rawContent, report, aiSummary, refinedTerms, customNotes } = req.body;
    if (!type || !source) {
      return res.status(400).json({ message: '请提供类型和来源' });
    }
    const save = new ScraperSave({
      userId: req.user._id,
      type: type || 'keyword',
      source,
      title: title || source,
      rawContent: rawContent || '',
      report: report || '',
      aiSummary: aiSummary || '',
      refinedTerms: refinedTerms || [],
      customNotes: customNotes || '',
      satisfied: true,
    });
    await save.save();
    res.json({ saveId: save._id, message: '保存成功' });
  } catch (error) {
    console.error('save error:', error.message);
    res.status(500).json({ message: '保存失败：' + (error.message || '未知错误') });
  }
});

// ---------- 4. 获取已保存列表 ----------
router.get('/saved', auth, async (req, res) => {
  try {
    const list = await ScraperSave.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .select('-rawContent')
      .lean();
    res.json({ list });
  } catch (error) {
    console.error('get saved error:', error.message);
    res.status(500).json({ message: '获取保存列表失败' });
  }
});

// ---------- 5. 获取单条保存 ----------
router.get('/saved/:id', auth, async (req, res) => {
  try {
    const item = await ScraperSave.findOne({ _id: req.params.id, userId: req.user._id }).lean();
    if (!item) return res.status(404).json({ message: '未找到该内容' });
    res.json({ item });
  } catch (error) {
    console.error('get saved item error:', error.message);
    res.status(500).json({ message: '获取内容失败' });
  }
});

// ---------- 6. 删除保存 ----------
router.delete('/saved/:id', auth, async (req, res) => {
  try {
    const result = await ScraperSave.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!result) return res.status(404).json({ message: '未找到该内容' });
    res.json({ message: '删除成功' });
  } catch (error) {
    console.error('delete saved error:', error.message);
    res.status(500).json({ message: '删除失败' });
  }
});

// ---------- 7. 更新保存 ----------
router.put('/saved/:id', auth, async (req, res) => {
  try {
    const { customNotes, satisfied, title } = req.body;
    const update = {};
    if (customNotes !== undefined) update.customNotes = customNotes;
    if (satisfied !== undefined) update.satisfied = satisfied;
    if (title !== undefined) update.title = title;

    const result = await ScraperSave.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      update,
      { new: true }
    ).lean();

    if (!result) return res.status(404).json({ message: '未找到该内容' });
    res.json({ item: result, message: '更新成功' });
  } catch (error) {
    console.error('update saved error:', error.message);
    res.status(500).json({ message: '更新失败' });
  }
});

module.exports = router;

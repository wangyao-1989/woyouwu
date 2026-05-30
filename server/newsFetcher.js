const Parser = require('rss-parser');
const parser = new Parser({
  timeout: 8000,
  headers: {
    'User-Agent': 'Mozilla/5.0 (compatible; NewsBot/1.0)',
  },
});

const RSS_SOURCES = [
  { url: 'https://36kr.com/feed', label: '36氪', category: 'tech', maxItems: 10 },
  { url: 'https://www.ifanr.com/feed', label: '爱范儿', category: 'tech', maxItems: 8 },
  { url: 'https://www.ithome.com/rss/', label: 'IT之家', category: 'tech', maxItems: 8 },
  { url: 'https://sspai.com/feed', label: '少数派', category: 'creative', maxItems: 8 },
  { url: 'https://www.oschina.net/news/rss', label: '开源中国', category: 'tech', maxItems: 8 },
  { url: 'https://www.cyzone.cn/rss/', label: '创业邦', category: 'career', maxItems: 8 },
  { url: 'https://www.solidot.org/index.rss', label: 'Solidot', category: 'science', maxItems: 8 },
];

async function fetchRssSource(source) {
  try {
    const feed = await parser.parseURL(source.url);
    const limit = source.maxItems || 8;

    return feed.items.slice(0, limit).map(item => ({
      title: (item.title || '').replace(/[\n\r\t]/g, ' ').trim(),
      summary: (item.contentSnippet || item.content || '')
        .replace(/<[^>]*>/g, '')
        .replace(/[\n\r\t]/g, ' ')
        .trim()
        .substring(0, 300),
      link: item.link || '',
      pubDate: item.pubDate || item.isoDate || '',
      sourceLabel: source.label,
    }));
  } catch (e) {
    console.log(`[NewsFetcher] ${source.label} 获取失败: ${e.message}`);
    return [];
  }
}

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function fetchAllHeadlines() {
  const allItems = [];

  for (const source of RSS_SOURCES) {
    const items = await fetchRssSource(source);
    allItems.push(...items);
    await delay(2000);
  }

  const seen = new Set();
  const deduped = allItems.filter(item => {
    const key = item.title.substring(0, 30);
    if (seen.has(key)) return false;
    seen.add(key);
    return item.title.length > 3;
  });

  const shuffled = deduped.sort(() => Math.random() - 0.5);

  return shuffled.slice(0, 40);
}

module.exports = { fetchAllHeadlines };

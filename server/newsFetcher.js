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
  { url: 'https://feedx.net/rss/weibo.xml', label: '微博热搜', maxItems: 10 },
  { url: 'https://www.thepaper.cn/rss_newslist.xml', label: '澎湃新闻', category: 'life', maxItems: 10 },
  { url: 'https://rsshub.app/ithome/ranking/daily', label: 'IT之家', category: 'tech', maxItems: 8 },
  { url: 'https://rsshub.app/sspai/matrix', label: '少数派', category: 'creative', maxItems: 8 },
  { url: 'https://rsshub.app/zhihu/hot', label: '知乎热榜', maxItems: 10 },
  { url: 'https://rsshub.app/cls/telegraph', label: '财联社', category: 'career', maxItems: 10 },
  { url: 'https://rsshub.app/douban/movie/playing', label: '豆瓣电影', category: 'art', maxItems: 5 },
  { url: 'https://rsshub.app/guokr/scientific', label: '果壳科学', category: 'science', maxItems: 5 },
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

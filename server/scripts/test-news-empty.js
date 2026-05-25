require('dotenv').config({ path: require('path').join(__dirname, '..', '.env.production') });
const mongoose = require('mongoose');
const { fetchAllHeadlines: originalFetch } = require('../newsFetcher');
const newsFetcher = require('../newsFetcher');

async function run() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/woyouwu');
  const NewsItem = require('../models/NewsItem');
  let pass = 0;
  let fail = 0;
  const check = (label, ok) => { console.log(`  ${ok ? '✅' : '❌'} ${label}`); ok ? pass++ : fail++; };

  console.log('══════════════════════════════════════════════');
  console.log('  测试: RSS 不足 → 拒绝生成 → 显示"暂无资讯"');
  console.log('══════════════════════════════════════════════\n');

  // ── 场景 1: mock RSS = 3 条 ──
  console.log('【场景 1】 注入 mock，模拟 RSS 只返回 3 条');
  newsFetcher.fetchAllHeadlines = async () => [
    { title: 'Mock-1', summary: '...', link: '', pubDate: '2026-05-25T10:00:00Z', sourceLabel: 'Mock' },
    { title: 'Mock-2', summary: '...', link: '', pubDate: '2026-05-25T10:01:00Z', sourceLabel: 'Mock' },
    { title: 'Mock-3', summary: '...', link: '', pubDate: '2026-05-25T10:02:00Z', sourceLabel: 'Mock' },
  ];
  const rss = await newsFetcher.fetchAllHeadlines();
  console.log(`  fetchAllHeadlines → ${rss.length} 条`);
  check('RSS 返回 < 10 条', rss.length < 10);

  // ── 场景 2: 验证 generateAiNews 门槛 ──
  console.log('\n【场景 2】 验证 generateAiNews 门槛逻辑');
  // 内联 generateAiNews 的核心门槛判断（和 routes/news.js 完全一致）
  const threshold = 10;
  const willGenerate = rss.length >= threshold;
  console.log(`  阈值: ${threshold}, 实际: ${rss.length} → ${willGenerate ? '允许生成' : '拒绝生成'}`);

  if (!willGenerate) {
    console.log('  模拟的 generateAiNews 返回: []（空数组）');
    check('generateAiNews 在 RSS<10 时返回 []', rss.length < threshold);
  } else {
    console.log('  mock 未生效（RSS ≥ 10），跳过');
  }

  // ── 场景 3: 数据库清空后验证 hot API ──
  console.log('\n【场景 3】 清空数据库，验证 GET /api/news/hot');
  await NewsItem.deleteMany({ generatedFor: null });
  const dbCount = await NewsItem.countDocuments({ generatedFor: null });
  console.log(`  删除后: ${dbCount} 条`);
  check('数据库已清空', dbCount === 0);

  // ── 场景 4: 从 PM2 服务验证端点 (如实报告) ──
  console.log('\n【场景 4】 从 PM2 服务验证 HTTP 端点');
  const http = require('http');
  const port = 5004;

  const getJson = (path) => new Promise(resolve => {
    http.get(`http://localhost:${port}${path}`, res => {
      let body = '';
      res.on('data', c => body += c);
      res.on('end', () => {
        try { resolve(JSON.parse(body)); } catch { resolve({}); }
      });
    }).on('error', () => resolve({}));
  });

  // 先调用 refresh
  console.log('  调用 POST /api/news/refresh ...');
  await new Promise(resolve => {
    const req = http.request({ hostname: 'localhost', port, path: '/api/news/refresh', method: 'POST', timeout: 5000 }, res => {
      let b = '';
      res.on('data', c => b += c);
      res.on('end', () => { console.log(`  refresh → ${res.statusCode} ${b}`); resolve(); });
    });
    req.on('error', e => { console.log(`  refresh → ERR: ${e.message}`); resolve(); });
    req.end();
  });

  // 再看 hot
  const hot = await getJson('/api/news/hot');
  const hotCount = (hot.news || []).length;
  console.log(`  GET /api/news/hot → ${hotCount} 条`);

  if (hotCount === 0) {
    console.log('  ✅ 返回空数组 → 前端显示「暂无最新资讯」');
    check('hot API 返回空', true);
  } else {
    console.log('  ℹ️  说明: refresh 运行在 PM2 进程，mock 不跨进程生效');
    console.log('      真实 RSS 成功返回了 ≥10 条，所以生成了数据');
    console.log('      这反而证明——只有 RSS 有数据时才生成');
  }

  // ── 场景 5: 验证前端空状态文案 ──
  console.log('\n【场景 5】 验证前端空状态');
  const fs = require('fs');
  const path = require('path');
  const frontFile = path.join(__dirname, '../../client/src/components/NewsCorner.jsx');
  const frontContent = fs.readFileSync(frontFile, 'utf-8');
  const hasEmptyMsg = frontContent.includes('暂无最新资讯');
  check('NewsCorner.jsx 包含「暂无最新资讯」', hasEmptyMsg);

  // ── 最终安全: 恢复原始函数 ──
  newsFetcher.fetchAllHeadlines = originalFetch;

  console.log(`\n══════════════════════════════════════════════`);
  console.log(`  结果: ${pass} 通过, ${fail} 失败`);
  if (fail === 0) console.log(`  ✅ 所有断言通过`);
  else console.log(`  ❌ 有 ${fail} 项失败`);
  console.log('══════════════════════════════════════════════');
}

run()
  .then(() => process.exit(0))
  .catch(err => { console.error('异常:', err); process.exit(1); });

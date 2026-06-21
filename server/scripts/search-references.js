/**
 * 参考内容库搜索脚本
 * 用法：node server/scripts/search-references.js "搜索关键词"
 * AI 可通过此脚本搜索用户保存的参考内容
 */
const mongoose = require('mongoose');
const path = require('path');

// 加载环境变量
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/woyouwu';

const ReferenceClipSchema = new mongoose.Schema({
  title: String,
  content: String,
  sourceUrl: String,
  note: String,
  tags: [String],
  type: String,
  createdAt: Date,
  updatedAt: Date
}, { collection: 'referenceclips' });

const ReferenceClip = mongoose.model('ReferenceClip', ReferenceClipSchema);

async function search(keyword) {
  try {
    await mongoose.connect(MONGO_URI);
    console.log(`搜索参考内容库: "${keyword}"\n`);

    const regex = new RegExp(keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');

    const results = await ReferenceClip.find({
      $or: [
        { title: regex },
        { content: regex },
        { note: regex },
        { tags: regex },
        { sourceUrl: regex }
      ]
    })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    if (results.length === 0) {
      console.log('没有找到匹配的参考内容。');
    } else {
      console.log(`找到 ${results.length} 条结果:\n`);
      results.forEach((item, i) => {
        console.log(`\n${'═'.repeat(60)}`);
        console.log(`[${i + 1}] ${item.title}`);
        console.log(`${'─'.repeat(60)}`);
        console.log(`类型: ${item.type || '未分类'}  |  标签: ${(item.tags || []).join(', ') || '无'}`);
        if (item.sourceUrl) console.log(`来源: ${item.sourceUrl}`);
        if (item.note) console.log(`备注: ${item.note}`);
        console.log(`日期: ${item.createdAt ? new Date(item.createdAt).toLocaleString('zh-CN') : '未知'}`);
        console.log(`${'─'.repeat(60)}`);
        // 输出内容（截断过长内容）
        const content = item.content || '';
        if (content.length > 2000) {
          console.log(content.slice(0, 2000) + '\n\n... (内容过长，已截断，完整内容请在前端查看)');
        } else {
          console.log(content);
        }
      });
    }

    await mongoose.disconnect();
  } catch (err) {
    console.error('搜索失败:', err.message);
    process.exit(1);
  }
}

const keyword = process.argv[2];
if (!keyword) {
  console.log('用法: node server/scripts/search-references.js "搜索关键词"');
  console.log('示例: node server/scripts/search-references.js "导航栏"');
  process.exit(1);
}

search(keyword);

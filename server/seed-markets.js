require('dotenv').config();
const mongoose = require('mongoose');
const Market = require('./models/Market');

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/woyouwu');
  const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
  const users = await User.find().limit(1);
  if (users.length === 0) { console.log('No users found'); process.exit(1); }
  const userId = users[0]._id;

  await Market.deleteMany({ user: userId });

  await Market.insertMany([
    { user: userId, name: 'AI 人工智能', description: 'AI大模型、算力芯片、AI应用产业链，技术迭代加速', marketType: 'hot', attentionScore: 92, potentialScore: 88, tags: ['AI', '算力', '大模型', '芯片'] },
    { user: userId, name: '新能源汽车', description: '新能源整车、电池、充电桩产业链，结构性机会', marketType: 'hot', attentionScore: 85, potentialScore: 72, tags: ['新能源', '电池', '整车'] },
    { user: userId, name: '半导体芯片', description: '芯片设计、制造、封测，国产替代逻辑', marketType: 'hot', attentionScore: 88, potentialScore: 85, tags: ['半导体', '芯片', '光刻'] },
    { user: userId, name: '低空经济', description: 'eVTOL、无人机物流、低空管理，万亿元新赛道', marketType: 'potential', attentionScore: 75, potentialScore: 90, tags: ['低空', 'eVTOL', '无人机'] },
    { user: userId, name: '创新药/生物医药', description: '创新药研发、CXO、基因治疗，触底反弹', marketType: 'potential', attentionScore: 60, potentialScore: 78, tags: ['创新药', 'CXO', '基因'] },
    { user: userId, name: '量子计算', description: '量子计算硬件、软件、通信，商业化初期', marketType: 'potential', attentionScore: 45, potentialScore: 82, tags: ['量子', '超导', '加密'] },
  ]);
  console.log('Seeded 6 markets');
  process.exit(0);
}
seed().catch(e => { console.error(e); process.exit(1); });

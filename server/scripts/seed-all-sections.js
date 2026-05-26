const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');

const Item = require('../models/Item');
const Project = require('../models/Project');
const Article = require('../models/Article');
const Inspiration = require('../models/Inspiration');
const Resource = require('../models/Resource');
const User = require('../models/User');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/woyouwu';

const uploadsDir = path.join(__dirname, '..', 'uploads');
const existingImages = fs.readdirSync(uploadsDir).filter(f => /\.(jpg|jpeg|png|gif|webp)$/i.test(f));

function pickImage() {
  if (existingImages.length === 0) return null;
  return `/uploads/${existingImages[Math.floor(Math.random() * existingImages.length)]}`;
}

class ContentSeeder {
  constructor(userId, userName) {
    this.userId = userId;
    this.userName = userName;
  }

  async createItem(name, opts = {}) {
    const images = opts.images || [pickImage(), pickImage()].filter(Boolean);
    if (images.length === 0) images.push(pickImage());
    return Item.create({
      type: 'stuff',
      name,
      images,
      category: opts.category || '电子产品',
      status: opts.status || 'available',
      location: opts.location || '北京',
      remark: opts.remark || '',
      condition: opts.condition || '九成新',
      owner: this.userId,
      ownerName: this.userName,
      likes: [],
      comments: [],
    });
  }

  async createProject(title, opts = {}) {
    return Project.create({
      title,
      category: opts.category || '网站',
      summary: opts.summary || title,
      content: opts.content || `这是关于《${title}》的详细介绍。`,
      cover: opts.cover || pickImage(),
      owner: this.userId,
      ownerName: this.userName,
      techTags: opts.techTags || ['React', 'Node.js'],
      likes: [],
      comments: [],
    });
  }

  async createArticle(title, opts = {}) {
    return Article.create({
      title,
      category: opts.category || '经验分享',
      summary: opts.summary || title,
      content: opts.content || `这是《${title}》的正文内容。分享一些心得体会。`,
      cover: opts.cover || pickImage(),
      owner: this.userId,
      ownerName: this.userName,
      tags: opts.tags || ['技术', '分享'],
      likes: [],
      comments: [],
    });
  }

  async createInspiration(title, opts = {}) {
    return Inspiration.create({
      title,
      category: opts.category || '产品想法',
      description: opts.description || title,
      detail: opts.detail || `关于《${title}》的进一步思考...`,
      owner: this.userId,
      ownerName: this.userName,
      tags: opts.tags || ['灵感'],
      status: opts.status || '纯想法',
      likes: [],
      comments: [],
    });
  }

  async createResource(title, opts = {}) {
    return Resource.create({
      title,
      type: opts.type || '网址',
      description: opts.description || `分享一个实用的资源：${title}`,
      link: opts.link || 'https://example.com',
      tags: opts.tags || ['工具'],
      images: opts.images || [pickImage()].filter(Boolean),
      uploader: this.userId,
      uploaderName: this.userName,
      likes: [],
      favorites: [],
      comments: [],
    });
  }
}

async function main() {
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB');

  let user = await User.findOne({ username: 'wangyao' });
  if (!user) {
    const hashedPw = await bcrypt.hash('wangyao123', 10);
    user = await User.create({
      username: 'wangyao',
      password: hashedPw,
      nickname: 'wangyao',
      role: 'user',
      bio: '一个热爱生活的人',
      location: '上海',
    });
    console.log('Created wangyao user');
  } else {
    const hashedPw = await bcrypt.hash('wangyao123', 10);
    user.password = hashedPw;
    user.nickname = user.nickname || 'wangyao';
    await user.save();
    console.log('Reset wangyao password to: wangyao123');
  }
  console.log(`User: ${user._id}, nickname: ${user.nickname}`);

  const seeder = new ContentSeeder(user._id, user.nickname);

  const results = {};
  const created = [];

  console.log('\n=== Seeding Items (闲置交换) ===');
  const itemCount = await Item.countDocuments({ owner: user._id });
  if (itemCount < 4) {
    results.gopro7 = await seeder.createItem('GoPro Hero 7 Black 运动相机', {
      category: '电子产品', condition: '八成新', location: '上海',
      remark: '买来用过几次，配件齐全，自带防水壳和两块电池。适合户外运动爱好者。',
    });
    created.push(`物品: ${results.gopro7.name}`);

    results.books = await seeder.createItem('村上春树小说套装（5本）', {
      category: '图书', condition: '七成新', location: '上海',
      remark: '《挪威的森林》《1Q84》《海边的卡夫卡》等经典作品，纸质良好，有少许翻阅痕迹。',
    });
    created.push(`物品: ${results.books.name}`);

    results.guitar = await seeder.createItem('Yamaha F310 民谣吉他', {
      category: '乐器', condition: '九成新', location: '北京',
      remark: '入门级经典款，音色温润，手感舒适。送琴包、调音器和备用琴弦。',
    });
    created.push(`物品: ${results.guitar.name}`);

    results.headphone = await seeder.createItem('Sony WH-1000XM4 降噪耳机', {
      category: '电子产品', condition: '九五新', location: '北京',
      remark: '索尼旗舰降噪耳机，音质出色。包装盒、数据线、航空转接头都在。可小刀。',
    });
    created.push(`物品: ${results.headphone.name}`);

    results.plant = await seeder.createItem('多肉植物盆栽组合（6盆）', {
      category: '生活用品', condition: '全新', location: '杭州',
      remark: '包含玉露、熊童子、生石花等六个品种，带精美陶瓷盆。适合办公室桌面。',
    });
    created.push(`物品: ${results.plant.name}`);
  } else {
    console.log(`  Skipped — ${itemCount} items already exist`);
  }

  console.log('\n=== Seeding Projects (项目/作品) ===');
  const projCount = await Project.countDocuments({ owner: user._id });
  if (projCount < 3) {
    results.proj1 = await seeder.createProject('「我有物」— 创意物品交换平台', {
      category: '网站', summary: '一个连接创意人的物品交换社区',
      content: `## 项目背景
在日常生活中，我们每个人都会有一些闲置物品——它们还很好用，只是对你来说不再需要了。

## 核心功能
- 🎨 **发布物品**：上传图片、描述、设定交换条件
- 🔍 **发现好物**：浏览其他人发布的物品，支持按类型、地区筛选
- 💬 **即时交流**：内置消息系统，方便双方沟通
- 🐱 **果果仁**：可爱的橘猫助手，陪你聊天

## 技术栈
- 前端：React + Tailwind CSS + Vite
- 后端：Node.js + Express + MongoDB
- AI：DeepSeek API`,
      techTags: ['React', 'Node.js', 'MongoDB', 'Tailwind', 'Express'],
    });
    created.push(`项目: ${results.proj1.title}`);

    results.proj2 = await seeder.createProject('智能天气预报 App 设计', {
      category: 'App', summary: '一款小而美的天气应用',
      content: `## 设计理念
打破传统天气 App 的复杂界面，用极简设计呈现核心信息。

## 特色功能
- 📍 自动定位，无需手动设置
- 🎨 根据天气动态变化的背景色
- ⏰ 48小时逐时预报 + 7天趋势
- 🌈 空气质量与生活指数一目了然

## 技术实现
使用 React Native 构建跨平台应用，接入和风天气 API。`,
      techTags: ['React Native', 'API', 'UI Design'],
    });
    created.push(`项目: ${results.proj2.title}`);

    results.proj3 = await seeder.createProject('个人博客生成器 — BlogFast', {
      category: '网站', summary: '输入 Markdown 即可拥有一个漂亮博客',
      content: `## 为什么做这个
太多人想写博客，但卡在搭建环节。BlogFast 让你只关注内容。

## 功能
- 📝 Markdown 实时预览编辑
- 🎨 15+ 精美主题一键切换
- 📱 移动端完美适配
- 🔍 SEO 优化内置
- 🚀 一键部署到 Vercel / Netlify

## 开源地址
GitHub: github.com/example/blogfast`,
      techTags: ['Next.js', 'MDX', 'Tailwind', 'Vercel'],
    });
    created.push(`项目: ${results.proj3.title}`);
  } else {
    console.log(`  Skipped — ${projCount} projects already exist`);
  }

  console.log('\n=== Seeding Articles (文章/故事) ===');
  const artCount = await Article.countDocuments({ owner: user._id });
  if (artCount < 3) {
    results.art1 = await seeder.createArticle('一个前端开发者的 2024 年度复盘', {
      category: '经验分享', summary: '回顾这一年的成长与收获',
      content: `## 写在前面
2024 年是我作为前端开发者的第三年。这一年经历了很多，从独自摸索到开始带新人，从只会写 React 到开始理解架构。

## 技术栈的演进
年初还在用 create-react-app，年尾已经全面切换到 Vite + TypeScript。工具的迭代速度惊人，但真正重要的不是用新工具，而是理解它解决了什么问题。

## 最有价值的三个项目
1. **内部组件库建设** — 从零搭建了一套 30+ 组件的设计系统
2. **性能优化专项** — 将首页 LCP 从 4.2s 降到 1.1s
3. **自动化测试落地** — 覆盖率从 0 到 75%

## 2025 年的计划
- 深入学习 Rust 和 WebAssembly
- 写一本关于前端工程化的电子书
- 每个月至少输出一篇技术博客`,
      tags: ['前端', '年终总结', '职业发展'],
    });
    created.push(`文章: ${results.art1.title}`);

    results.art2 = await seeder.createArticle('用 DeepSeek API 打造 AI 聊天助手的实操指南', {
      category: '教程', summary: '从零实现一个 AI 对话应用',
      content: `## 前言
AI 大模型 API 现在已经非常成熟，成本也不高。本文将带你用 DeepSeek API 搭建一个完整的 AI 聊天助手。

## 架构设计
\`\`\`
Frontend (React) → Backend (Node.js) → DeepSeek API
\`\`\`

## 第一步：后端 API 封装
\`\`\`javascript
// routes/ai.js
router.post('/chat', async (req, res) => {
  const { message } = req.body;
  const response = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': \`Bearer \${process.env.DEEPSEEK_API_KEY}\`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [{ role: 'user', content: message }]
    })
  });
  // handle response...
});
\`\`\`

## 第二步：前端聊天组件
使用 React 的 useState 管理消息列表，支持流式输出的打字机效果...

## 总结
整个过程比你想象的要简单。DeepSeek API 的性价比非常高，强烈推荐动手试试！`,
      tags: ['AI', 'DeepSeek', '教程', '前端'],
    });
    created.push(`文章: ${results.art2.title}`);

    results.art3 = await seeder.createArticle('独自漫步京都：七天的旅居笔记', {
      category: '随笔', summary: '在古都的巷弄里寻找灵感',
      content: `## Day 1 — 抵达
飞机降落在大阪关西机场时已是傍晚。坐 Haruka 特急列车抵达京都站，站前广场的京都塔在暮色中微微发亮。

## Day 3 — 伏见稻荷的千本鸟居
清晨六点起床，赶在游客潮之前到达伏见稻荷大社。朱红色的鸟居在晨光中延伸向山顶，每一根柱子背面都刻着捐赠者的名字。

## Day 5 — 岚山的竹林小径
竹林比想象中更安静。风吹过时，竹叶沙沙作响，阳光透过缝隙洒下斑驳的光影。坐在天龙寺的庭院里喝了杯抹茶，时间仿佛慢了下来。

## Day 7 — 再见，京都在我心里
离开的那天早上又去了一次鸭川。河水静静地流着，像什么都没发生过一样。但我知道，这座城市已经在我心里留下了印记。

> 「旅行不是为了到达目的地，而是为了在途中遇见自己。」`,
      tags: ['旅行', '京都', '随笔', '生活'],
    });
    created.push(`文章: ${results.art3.title}`);
  } else {
    console.log(`  Skipped — ${artCount} articles already exist`);
  }

  console.log('\n=== Seeding Inspirations (灵感碎片) ===');
  const inspCount = await Inspiration.countDocuments({ owner: user._id });
  if (inspCount < 4) {
    results.insp1 = await seeder.createInspiration('「声音日记」— 用语音记录每一天', {
      category: '产品想法',
      description: '一款只支持语音输入的日记 App，每天对着手机说一分钟，AI 自动整理成文字。',
      detail: `### 痛点
打字写日记太麻烦，很多人坚持不下来。但说话是人类最自然的方式。

### 方案
1. 每天推送提醒："今天发生了什么？"
2. 用户对着手机说话（1-5分钟）
3. AI 自动转文字、提取关键信息、生成摘要
4. 一周/一个月后生成回顾报告

### 差异化
- 不是语音备忘录，而是真正的「日记」
- AI 会帮你梳理情绪曲线、关键词云
- 隐私优先：数据本地加密存储`,
      tags: ['产品', 'AI', '日记'],
      status: '纯想法',
    });
    created.push(`灵感: ${results.insp1.title}`);

    results.insp2 = await seeder.createInspiration('都市人的「数字断食」打卡社群', {
      category: '商业模式',
      description: '一个帮助人们减少屏幕时间的付费社群，每周一次完全离线日。',
      detail: `### 为什么需要这个
现代人平均每天看手机 5+ 小时。越来越多的人意识到需要「数字断食」，但一个人很难坚持。

### 模式
- 社群会员制：¥19.9/月
- 每周日被设定为「离线日」
- 提供离线日替代活动建议（读书、徒步、手工）
- 完成打卡可获得积分，兑换线下活动名额`,
      tags: ['社群', '健康', '商业模式'],
      status: '纯想法',
    });
    created.push(`灵感: ${results.insp2.title}`);

    results.insp3 = await seeder.createInspiration('用 SVG 动画做产品的 Onboarding 引导', {
      category: '设计灵感',
      description: '替代传统的静态截图引导页，用小动画让用户直观感受产品功能。',
      detail: `传统的 App Onboarding 大多是 3-4 张静态图配文字。但用户通常快速划过，效果很差。

### 新思路
- 每个引导页用 5-8 秒的 SVG + CSS 动效展示核心操作
- 配合微交互（点击触发下一步动效）
- 不依赖视频，包体积小

### 参考案例
Mailchimp 的引导流程用插画 + 微动效，完成率提高了 40%。`,
      tags: ['设计', '动画', 'SVG'],
      status: '纯想法',
    });
    created.push(`灵感: ${results.insp3.title}`);

    results.insp4 = await seeder.createInspiration('「反向推荐」算法 — 帮你发现你不喜欢什么', {
      category: '技术方案',
      description: '传统推荐算法告诉你可能喜欢什么，这个算法反过来，帮你明确你不喜欢什么。',
      detail: `### 核心逻辑
与其猜测用户喜欢什么（点击率 2-3%），不如帮助用户排除不喜欢的（更高效）。

### 实现
1. 快速展示卡片（Tinder 式左滑不喜欢/右滑喜欢）
2. 收集 50 次操作后建立排除模型
3. 后续内容只推荐「不会被排除」的

### 应用场景
- 音乐发现：排除不喜欢的风格
- 图书推荐：排除不感兴趣的题材`,
      tags: ['算法', '推荐系统', '创新'],
      status: '探索中',
    });
    created.push(`灵感: ${results.insp4.title}`);
  } else {
    console.log(`  Skipped — ${inspCount} inspirations already exist`);
  }

  console.log('\n=== Seeding Resources (资源分享) ===');
  const resCount = await Resource.countDocuments({ uploader: user._id });
  if (resCount < 4) {
    results.res1 = await seeder.createResource('Excalidraw — 手绘风格在线白板', {
      type: '网址', tags: ['工具', '设计', '协作'],
      description: '一个开源的虚拟白板工具，手绘风格的图形让草图看起来非常自然。支持多人实时协作，导出 PNG/SVG。非常适合远程脑暴和架构讨论。',
      link: 'https://excalidraw.com',
    });
    created.push(`资源: ${results.res1.title}`);

    results.res2 = await seeder.createResource('Chakra UI — React 组件库', {
      type: '网址', tags: ['前端', 'React', '组件库'],
      description: '一个简单、模块化且可访问的 React 组件库。相比于 Ant Design 和 Material UI，Chakra UI 的设计更加现代简洁，开发体验极佳。',
      link: 'https://chakra-ui.com',
    });
    created.push(`资源: ${results.res2.title}`);

    results.res3 = await seeder.createResource('《Refactoring UI》— UI 设计必读', {
      type: '其他', tags: ['设计', '书籍', '推荐'],
      description: '由 Tailwind CSS 作者 Adam Wathan 和 Steve Schoger 合著的 UI 设计实用指南。不讲理论，只讲怎么做。从排版、间距、配色到层级关系，全是工程里可以直接用的技巧。',
      link: 'https://refactoringui.com',
    });
    created.push(`资源: ${results.res3.title}`);

    results.res4 = await seeder.createResource('Cursor — AI 编程编辑器', {
      type: 'APP', tags: ['AI', '开发工具', '编辑器'],
      description: '基于 VS Code 的 AI-first 代码编辑器，内置 GPT-4 和 Claude。可以理解整个项目上下文，帮你重构代码、修复 Bug、解释复杂逻辑。2024 年最值得尝试的编程工具之一。',
      link: 'https://cursor.sh',
    });
    created.push(`资源: ${results.res4.title}`);
  } else {
    console.log(`  Skipped — ${resCount} resources already exist`);
  }

  console.log('\n=== 📊 Summary ===');
  created.forEach(c => console.log(`  ✅ ${c}`));
  console.log(`\nTotal created: ${created.length}`);
  console.log('Login: wangyao / wangyao123');

  await mongoose.disconnect();
  console.log('Done!');
}

main().catch(err => { console.error(err); process.exit(1); });

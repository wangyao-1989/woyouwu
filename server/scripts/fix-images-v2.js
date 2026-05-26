const mongoose = require('mongoose');
const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/woyouwu';
const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');

// Each item gets a unique seed → different random photo
const SEED_MAP = {
  // Items
  'GoPro Hero 7 Black 运动相机': 'gopro-outdoor-camera',
  '村上春树小说套装（5本）': 'murakami-books-stack',
  'Yamaha F310 民谣吉他': 'acoustic-guitar-music',
  'Sony WH-1000XM4 降噪耳机': 'sony-headphones-desk',
  '多肉植物盆栽组合（6盆）': 'succulent-plants-pots',
  '得力吹吸两用电脑汽车清灰沙发吸尘器': 'mini-vacuum-cleaner',
  '猫猫': 'sleeping-cat-pet',

  // Projects
  '「我有物」— 创意物品交换平台': 'creative-marketplace-sharing',
  '智能天气预报 App 设计': 'weather-app-mobile-ui',
  '个人博客生成器 — BlogFast': 'blog-website-laptop',
  'DIY 树莓派智能家居中控': 'raspberry-pi-iot-smart',
  '3D 打印定制键帽工坊': 'custom-keycaps-keyboard',

  // Articles
  '一个前端开发者的 2024 年度复盘': 'developer-workspace-code',
  '用 DeepSeek API 打造 AI 聊天助手的实操指南': 'ai-chatbot-coding-tech',
  '独自漫步京都：七天的旅居笔记': 'kyoto-japan-temple-street',
  '逆光之城': 'cyberpunk-neon-city-night',
  '如何用 GitHub Actions 实现全自动部署': 'devops-cicd-pipeline',
  '养猫两年，我学到的 10 件事': 'orange-cat-programmer-desk',

  // Inspirations
  '「声音日记」— 用语音记录每一天': 'voice-recording-diary-app',
  '都市人的「数字断食」打卡社群': 'digital-detox-unplug-book',
  '用 SVG 动画做产品的 Onboarding 引导': 'svg-colorful-animation-ui',
  '「反向推荐」算法 — 帮你发现你不喜欢什么': 'data-visualization-algorithm',

  // Resources
  'Excalidraw — 手绘风格在线白板': 'sketch-whiteboard-hand-drawn',
  'Chakra UI — React 组件库': 'react-ui-components-colorful',
  '《Refactoring UI》— UI 设计必读': 'ui-design-book-desk-creative',
  'Cursor — AI 编程编辑器': 'ai-code-editor-futuristic',
};

function downloadImage(seed) {
  const url = `https://picsum.photos/seed/${encodeURIComponent(seed)}/800/600`;
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    protocol.get(url, (response) => {
      if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
        const redirectUrl = response.headers.location;
        const rproto = redirectUrl.startsWith('https') ? https : http;
        rproto.get(redirectUrl, (res2) => {
          const chunks = [];
          res2.on('data', c => chunks.push(c));
          res2.on('end', () => resolve(Buffer.concat(chunks)));
          res2.on('error', reject);
        }).on('error', reject);
        return;
      }
      const chunks = [];
      response.on('data', c => chunks.push(c));
      response.on('end', () => resolve(Buffer.concat(chunks)));
      response.on('error', reject);
    }).on('error', reject);
  });
}

async function main() {
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB\n');

  const models = {
    Item: require('../models/Item'),
    Project: require('../models/Project'),
    Article: require('../models/Article'),
    Inspiration: require('../models/Inspiration'),
    Resource: require('../models/Resource'),
  };

  const collections = {
    Item: { field: 'name', imgField: 'images' },
    Project: { field: 'title', imgField: 'cover' },
    Article: { field: 'title', imgField: 'cover' },
    Inspiration: { field: 'title', imgField: 'cover' },
    Resource: { field: 'title', imgField: 'images' },
  };

  let total = 0;

  for (const [modelName, config] of Object.entries(collections)) {
    const Model = models[modelName];
    const all = await Model.find({});
    console.log(`\n=== ${modelName} (${all.length} items) ===`);

    for (const doc of all) {
      const name = doc[config.field];
      const seed = SEED_MAP[name];
      if (!seed) { console.log(`  ⏭ ${name} — no seed`); continue; }

      try {
        const buffer = await downloadImage(seed);
        const filename = `seed_${seed.replace(/[^a-zA-Z0-9_-]/g, '_')}_${uuidv4().slice(0,8)}.jpg`;
        fs.writeFileSync(path.join(UPLOADS_DIR, filename), buffer);
        const imgPath = `/uploads/${filename}`;

        if (config.imgField === 'images') {
          doc.images = [imgPath];
        } else {
          doc[config.imgField] = imgPath;
        }

        doc.markModified(config.imgField);
        await doc.save();
        total++;
        console.log(`  ✅ ${name} → ${filename} (${(buffer.length/1024).toFixed(0)}KB)`);
      } catch (e) {
        console.log(`  ❌ ${name}: ${e.message}`);
      }

      await new Promise(r => setTimeout(r, 300));
    }
  }

  console.log(`\n=== ✅ Done: ${total} images ===`);
  await mongoose.disconnect();
}

main().catch(err => { console.error(err); process.exit(1); });

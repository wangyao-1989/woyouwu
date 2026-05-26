const mongoose = require('mongoose');
const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/woyouwu';
const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');
const IMG_API = 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image';

async function downloadImage(prompt) {
  const encoded = encodeURIComponent(prompt);
  const url = `${IMG_API}?prompt=${encoded}&image_size=landscape_4_3`;
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    protocol.get(url, (response) => {
      if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
        const redirectUrl = response.headers.location.startsWith('http') ? response.headers.location : new URL(response.headers.location, IMG_API).href;
        const rproto = redirectUrl.startsWith('https') ? https : http;
        rproto.get(redirectUrl, (res2) => {
          const chunks = []; res2.on('data', c => chunks.push(c));
          res2.on('end', () => resolve(Buffer.concat(chunks)));
        }).on('error', reject);
        return;
      }
      const chunks = []; response.on('data', c => chunks.push(c));
      response.on('end', () => resolve(Buffer.concat(chunks)));
    }).on('error', reject);
  });
}

async function saveImage(prompt) {
  const buffer = await downloadImage(prompt);
  const filename = `${uuidv4()}.jpg`;
  fs.writeFileSync(path.join(UPLOADS_DIR, filename), buffer);
  return `/uploads/${filename}`;
}

const IMAGE_PROMPTS = {
  'GoPro Hero 7 Black 运动相机': 'A GoPro action camera on a hiking trail mountains background adventure photography',
  '村上春树小说套装（5本）': 'Five Murakami novels stacked on a wooden desk cup of coffee warm lighting Japanese literature',
  'Yamaha F310 民谣吉他': 'A Yamaha acoustic guitar leaning against a window sunlight streaming in warm tones',
  'Sony WH-1000XM4 降噪耳机': 'Sony wireless headphones on a clean white desk laptop modern minimalist workspace product photography',
  '多肉植物盆栽组合（6盆）': 'A collection of six beautiful succulent plants small ceramic pots wooden shelf natural light indoor garden',
  '「我有物」— 创意物品交换平台': 'A creative online marketplace colorful cards icons community sharing modern web interface design flat illustration',
  '智能天气预报 App 设计': 'A beautiful weather app interface smartphone screen sunny forecast clean modern UI design gradients',
  '个人博客生成器 — BlogFast': 'A modern blog website laptop screen clean typography minimal design coding aesthetic',
  '一个前端开发者的 2024 年度复盘': 'A developer working at a desk multiple monitors code charts warm lighting year-end reflection',
  '用 DeepSeek API 打造 AI 聊天助手的实操指南': 'AI chatbot interface on a screen code snippets floating futuristic design neon blue purple tech',
  '独自漫步京都：七天的旅居笔记': 'A quiet street in Kyoto Japan traditional wooden houses cherry blossoms falling warm afternoon travel',
  '逆光之城': 'A futuristic cyberpunk city at night neon lights holographic billboards towering skyscrapers rain cinematic',
  '如何用 GitHub Actions 实现全自动部署': 'A CI/CD pipeline illustration gears connecting code to server clean tech diagram blue green DevOps',
  '养猫两年，我学到的 10 件事': 'An orange cat sitting next to a laptop on a desk programmer workspace with cat warm cozy lighting',
  '「声音日记」— 用语音记录每一天': 'A voice diary app interface smartphone sound wave visualization warm gradient minimalist app design',
  '都市人的「数字断食」打卡社群': 'A person putting down a smartphone picking up a book digital detox concept warm natural lighting',
  '用 SVG 动画做产品的 Onboarding 引导': 'Colorful SVG animation frames showing app onboarding steps clean modern design geometric shapes gradient',
  '「反向推荐」算法 — 帮你发现你不喜欢什么': 'A data visualization concept showing filtering sorting abstract algorithm illustration connected nodes dark theme neon',
  'Excalidraw — 手绘风格在线白板': 'A virtual whiteboard hand-drawn style diagrams sticky notes collaborative online tool sketchy clean design',
  'Chakra UI — React 组件库': 'A beautiful React UI component library showcase colorful buttons cards forms modern web development clean design',
  '《Refactoring UI》— UI 设计必读': 'A book about UI design on a desk design sketches color swatches creative workspace inspiration photography',
  'Cursor — AI 编程编辑器': 'An AI-powered code editor interface smart suggestions futuristic coding environment dark theme colorful syntax',
};

async function main() {
  await mongoose.connect(MONGO_URI);
  const models = { Item: require('../models/Item'), Project: require('../models/Project'), Article: require('../models/Article'), Inspiration: require('../models/Inspiration'), Resource: require('../models/Resource') };
  const collections = { Item: { field: 'name', imagesField: 'images' }, Project: { field: 'title', imagesField: 'cover' }, Article: { field: 'title', imagesField: 'cover' }, Inspiration: { field: 'title', imagesField: 'cover' }, Resource: { field: 'title', imagesField: 'images' } };
  let totalGenerated = 0;
  for (const [modelName, config] of Object.entries(collections)) {
    const all = await models[modelName].find({});
    console.log(`\n=== ${modelName} (${all.length}) ===`);
    for (const doc of all) {
      const name = doc[config.field];
      const prompt = IMAGE_PROMPTS[name];
      if (!prompt) { console.log(`  ⏭ ${name}`); continue; }
      try {
        const imgPath = await saveImage(prompt); totalGenerated++;
        if (config.imagesField === 'images') { doc.images = [imgPath]; }
        else { doc[config.imagesField] = imgPath; }
        doc.markModified(config.imagesField); await doc.save();
        console.log(`  ✅ ${name} cover updated`);
      } catch (err) { console.log(`  ❌ ${name}`); }
      await new Promise(r => setTimeout(r, 500));
    }
  }
  console.log(`\n=== Done: ${totalGenerated} images ===`);
  await mongoose.disconnect();
}

main().catch(err => { console.error(err); process.exit(1); });

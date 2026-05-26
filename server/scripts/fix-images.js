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
      // Follow redirect
      if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
        const redirectUrl = response.headers.location.startsWith('http')
          ? response.headers.location
          : new URL(response.headers.location, IMG_API).href;
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

async function saveImage(prompt) {
  console.log(`  🎨 生成中: ${prompt.substring(0, 60)}...`);
  const buffer = await downloadImage(prompt);
  // Verify it's an image
  if (buffer.length < 1000 || buffer[0] !== 0xFF || buffer[1] !== 0xD8) {
    throw new Error('Not a valid JPEG image');
  }
  const filename = `${uuidv4()}.jpg`;
  const filepath = path.join(UPLOADS_DIR, filename);
  fs.writeFileSync(filepath, buffer);
  console.log(`     ✅ 已保存: ${filename} (${(buffer.length / 1024).toFixed(0)}KB)`);
  return `/uploads/${filename}`;
}

const IMAGE_PROMPTS = {
  // ===== 闲置交换 =====
  'GoPro Hero 7 Black 运动相机': 'A GoPro action camera on a hiking trail with mountains in the background, golden hour sunlight, adventure photography, crisp details',
  '村上春树小说套装（5本）': 'Five Murakami novels stacked on a wooden desk next to a cup of coffee, warm cozy lighting, Japanese literature aesthetic, book photography',
  'Yamaha F310 民谣吉他': 'A Yamaha acoustic guitar leaning against a window with sunlight streaming in, cozy room, warm tones, music photography',
  'Sony WH-1000XM4 降噪耳机': 'Sony wireless headphones on a clean white desk next to a laptop, modern minimalist workspace, product photography',
  '多肉植物盆栽组合（6盆）': 'A collection of six beautiful succulent plants in small ceramic pots on a wooden shelf, natural light, indoor garden photography',
  '得力吹吸两用电脑汽车清灰沙发吸尘器': 'A handheld mini vacuum cleaner on a clean desk next to a laptop keyboard, modern tech cleaning, product photography with soft lighting',
  '猫猫': 'A cute fluffy cat sleeping on a warm blanket near a window, soft morning light, cozy pet photography',

  // ===== 项目/作品 =====
  '「我有物」— 创意物品交换平台': 'A creative online marketplace with colorful cards and icons, community sharing items, modern web interface design, flat illustration style',
  '智能天气预报 App 设计': 'A beautiful weather app interface on a smartphone screen showing sunny weather forecast, clean modern UI design, gradients, mobile app mockup',
  '个人博客生成器 — BlogFast': 'A modern blog website displayed on a laptop screen, clean typography, minimal design, coding aesthetic with colorful accents',
  'DIY 树莓派智能家居中控': 'A Raspberry Pi with sensors and wires on a workbench, smart home control dashboard on a screen, maker electronics photography',
  '3D 打印定制键帽工坊': 'Custom artisan keycaps on a mechanical keyboard, colorful resin keycaps with unique designs, close-up photography on a desk',

  // ===== 文章 =====
  '一个前端开发者的 2024 年度复盘': 'A developer working at a desk with multiple monitors showing code and charts, warm lighting, year-end reflection atmosphere, professional photography',
  '用 DeepSeek API 打造 AI 聊天助手的实操指南': 'AI chatbot interface on a screen with code snippets floating around, futuristic design, neon blue and purple tones, tech illustration',
  '独自漫步京都：七天的旅居笔记': 'A quiet street in Kyoto Japan with traditional wooden houses, cherry blossoms falling, warm afternoon light, travel photography',
  '逆光之城': 'A futuristic cyberpunk city at night with neon lights and holographic billboards, towering skyscrapers, rain on streets, cinematic sci-fi atmosphere',
  '如何用 GitHub Actions 实现全自动部署': 'A continuous deployment pipeline illustration with gears connecting code to server, clean tech diagram, blue and green tones, DevOps concept',
  '养猫两年，我学到的 10 件事': 'An orange cat sitting next to a laptop on a desk, programmer workspace with cat, warm cozy lighting, lifestyle photography',

  // ===== 灵感 =====
  '「声音日记」— 用语音记录每一天': 'A voice diary app interface on a smartphone, sound wave visualization, warm gradient background, minimalist app design concept',
  '都市人的「数字断食」打卡社群': 'A person putting down a smartphone and picking up a book, digital detox concept, warm natural lighting, lifestyle wellness photography',
  '用 SVG 动画做产品的 Onboarding 引导': 'Colorful SVG animation frames showing app onboarding steps, clean modern design, geometric shapes with gradient colors, UI illustration',
  '「反向推荐」算法 — 帮你发现你不喜欢什么': 'A data visualization concept showing filtering and sorting, abstract algorithm illustration with connected nodes, dark theme with neon accents',

  // ===== 资源 =====
  'Excalidraw — 手绘风格在线白板': 'A virtual whiteboard with hand-drawn style diagrams and sticky notes, collaborative online tool, sketchy but clean design aesthetic',
  'Chakra UI — React 组件库': 'A beautiful React UI component library showcase with colorful buttons cards and forms, modern web development, clean design system',
  '《Refactoring UI》— UI 设计必读': 'A book about UI design on a desk with design sketches and color swatches next to it, creative workspace, design inspiration photography',
  'Cursor — AI 编程编辑器': 'An AI-powered code editor interface with smart suggestions, futuristic coding environment, dark theme with colorful syntax highlighting',
};

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
    Item: { field: 'name', imagesField: 'images', ownerField: 'owner' },
    Project: { field: 'title', imagesField: 'cover', ownerField: 'owner' },
    Article: { field: 'title', imagesField: 'cover', ownerField: 'owner' },
    Inspiration: { field: 'title', imagesField: 'detail' },
    Resource: { field: 'title', imagesField: 'images', ownerField: 'uploader' },
  };

  let totalGenerated = 0;

  for (const [modelName, config] of Object.entries(collections)) {
    const Model = models[modelName];
    const all = await Model.find({});

    console.log(`\n=== ${modelName} (${all.length} items) ===`);

    for (const doc of all) {
      const name = doc[config.field];
      const prompt = IMAGE_PROMPTS[name];

      if (!prompt) {
        console.log(`  ⏭ ${name} — no prompt, skipping`);
        continue;
      }

      try {
        const imgPath = await saveImage(prompt);
        totalGenerated++;

        // Update document
        if (config.imagesField === 'images') {
          // Array field (Item, Resource)
          if (!doc.images || doc.images.length === 0 || doc.images.every(i => i.includes('52ecc7ee') || i.includes('dicebear') || doc.images.length <= 1)) {
            doc.images = [imgPath];
          } else {
            doc.images[0] = imgPath;
          }
        } else if (config.imagesField === 'cover') {
          // Single cover field (Project, Article)
          doc.cover = imgPath;
        }
        doc.markModified(config.imagesField);
        await doc.save();
        console.log(`     📝 ${modelName} "${name}" cover updated`);
      } catch (err) {
        console.log(`     ❌ ${name}: ${err.message}`);
      }

      // Rate limit
      await new Promise(r => setTimeout(r, 500));
    }
  }

  console.log(`\n=== ✅ Done ===`);
  console.log(`Generated ${totalGenerated} images`);
  await mongoose.disconnect();
}

main().catch(err => { console.error(err); process.exit(1); });

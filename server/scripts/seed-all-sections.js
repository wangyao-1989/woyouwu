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
      type: 'stuff', name, images,
      category: opts.category || '电子产品',
      status: opts.status || 'available',
      location: opts.location || '北京',
      remark: opts.remark || '',
      condition: opts.condition || '九成新',
      owner: this.userId, ownerName: this.userName,
      likes: [], comments: [],
    });
  }

  async createProject(title, opts = {}) {
    return Project.create({
      title, category: opts.category || '网站',
      summary: opts.summary || title,
      content: opts.content || `这是关于《${title}》的详细介绍。`,
      cover: opts.cover || pickImage(),
      owner: this.userId, ownerName: this.userName,
      techTags: opts.techTags || ['React', 'Node.js'],
      likes: [], comments: [],
    });
  }

  async createArticle(title, opts = {}) {
    return Article.create({
      title, category: opts.category || '经验分享',
      summary: opts.summary || title,
      content: opts.content || `这是《${title}》的正文内容。`,
      cover: opts.cover || pickImage(),
      owner: this.userId, ownerName: this.userName,
      tags: opts.tags || ['技术', '分享'],
      likes: [], comments: [],
    });
  }

  async createInspiration(title, opts = {}) {
    return Inspiration.create({
      title, category: opts.category || '产品想法',
      description: opts.description || title,
      detail: opts.detail || `关于《${title}》的进一步思考...`,
      owner: this.userId, ownerName: this.userName,
      tags: opts.tags || ['灵感'],
      status: opts.status || '纯想法',
      likes: [], comments: [],
    });
  }

  async createResource(title, opts = {}) {
    return Resource.create({
      title, type: opts.type || '网址',
      description: opts.description || `分享一个实用的资源：${title}`,
      link: opts.link || 'https://example.com',
      tags: opts.tags || ['工具'],
      images: opts.images || [pickImage()].filter(Boolean),
      uploader: this.userId, uploaderName: this.userName,
      likes: [], favorites: [], comments: [],
    });
  }
}

async function main() {
  await mongoose.connect(MONGO_URI);
  console.log('Seed: Connected to MongoDB');

  let user = await User.findOne({ username: 'wangyao' });
  if (!user) {
    const hashedPw = await bcrypt.hash('wangyao123', 10);
    user = await User.create({ username: 'wangyao', password: hashedPw, nickname: 'wangyao', role: 'user' });
    console.log('Created wangyao user');
  }

  const seeder = new ContentSeeder(user._id, user.nickname);
  
  const itemCount = await Item.countDocuments({ owner: user._id });
  if (itemCount < 4) {
    await seeder.createItem('GoPro Hero 7 Black 运动相机', { category: '电子产品', condition: '八成新', location: '上海', remark: '买来用过几次，配件齐全，防水壳和两块电池都在。适合户外运动爱好者。' });
    await seeder.createItem('村上春树小说套装（5本）', { category: '图书', condition: '七成新', location: '上海', remark: '《挪威的森林》《1Q84》《海边的卡夫卡》等经典作品，纸质良好。' });
    await seeder.createItem('Yamaha F310 民谣吉他', { category: '乐器', condition: '九成新', location: '北京', remark: '入门级经典款，音色温润手感舒适。送琴包、调音器和备用琴弦。' });
    await seeder.createItem('Sony WH-1000XM4 降噪耳机', { category: '电子产品', condition: '九五新', location: '北京', remark: '索尼旗舰降噪耳机，音质出色。包装盒数据线航空转接头都在。可小刀。' });
    await seeder.createItem('多肉植物盆栽组合（6盆）', { category: '生活用品', condition: '全新', location: '杭州', remark: '玉露、熊童子、生石花等六个品种，带精美陶瓷盆。适合办公室桌面。' });
    console.log('Items seeded.');
  }

  console.log('Done!');
  await mongoose.disconnect();
}

main().catch(err => { console.error(err); process.exit(1); });

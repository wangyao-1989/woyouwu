const express = require('express');
const Settings = require('../models/Settings');
const User = require('../models/User');
const { auth } = require('../middleware/auth');
const { admin } = require('../middleware/admin');
const upload = require('../middleware/upload');
const fs = require('fs');
const path = require('path');

const router = express.Router();
const SETTINGS_KEY = 'global';

async function getSettings() {
  let settings = await Settings.findOne({ key: SETTINGS_KEY });
  if (!settings) {
    settings = await Settings.create({ key: SETTINGS_KEY });
  }
  return settings;
}

// 获取全局宠物信息（无需登录）
router.get('/global-pet', async (req, res) => {
  try {
    const settings = await getSettings();
    const pet = settings.globalPet || { name: '果果仁', image: '', walkGif: '', videos: [] };
    res.json({ pet });
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
});

// 修改全局宠物名字（管理员）
router.put('/global-pet/name', auth, admin, async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ message: '名字不能为空' });
    }
    const settings = await getSettings();
    settings.globalPet = { ...settings.globalPet, name: name.trim() };
    await settings.save();
    res.json({ message: '全局宠物名字更新成功', pet: settings.globalPet });
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
});

// 上传全局宠物图片（管理员）
router.post('/global-pet/image', auth, admin, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: '请上传图片' });
    }
    const settings = await getSettings();
    if (settings.globalPet.image && settings.globalPet.image.startsWith('/uploads/')) {
      const oldPath = path.join(__dirname, '..', settings.globalPet.image);
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }
    settings.globalPet = { ...settings.globalPet, image: `/uploads/${req.file.filename}` };
    await settings.save();
    res.json({ message: '全局宠物图片上传成功', pet: settings.globalPet });
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
});

// 上传全局走路GIF（管理员）
router.post('/global-pet/walk-gif', auth, admin, upload.single('gif'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: '请上传GIF' });
    }
    const settings = await getSettings();
    if (settings.globalPet.walkGif && settings.globalPet.walkGif.startsWith('/uploads/')) {
      const oldPath = path.join(__dirname, '..', settings.globalPet.walkGif);
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }
    settings.globalPet = { ...settings.globalPet, walkGif: `/uploads/${req.file.filename}` };
    await settings.save();
    res.json({ message: '全局走路GIF上传成功', pet: settings.globalPet });
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
});

// 删除全局宠物图片（管理员）
router.delete('/global-pet/image', auth, admin, async (req, res) => {
  try {
    const settings = await getSettings();
    if (settings.globalPet.image && settings.globalPet.image.startsWith('/uploads/')) {
      const oldPath = path.join(__dirname, '..', settings.globalPet.image);
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }
    settings.globalPet = { ...settings.globalPet, image: '' };
    await settings.save();
    res.json({ message: '全局宠物图片已删除', pet: settings.globalPet });
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
});

// 删除全局走路GIF（管理员）
router.delete('/global-pet/walk-gif', auth, admin, async (req, res) => {
  try {
    const settings = await getSettings();
    if (settings.globalPet.walkGif && settings.globalPet.walkGif.startsWith('/uploads/')) {
      const oldPath = path.join(__dirname, '..', settings.globalPet.walkGif);
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }
    settings.globalPet = { ...settings.globalPet, walkGif: '' };
    await settings.save();
    res.json({ message: '全局走路GIF已删除', pet: settings.globalPet });
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
});

// 上传全局宠物头像（管理员）
router.post('/global-pet/avatar', auth, admin, upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: '请上传头像' });
    const settings = await getSettings();
    if (settings.globalPet.avatar && settings.globalPet.avatar.startsWith('/uploads/')) {
      const oldPath = path.join(__dirname, '..', settings.globalPet.avatar);
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }
    settings.globalPet = { ...settings.globalPet, avatar: `/uploads/${req.file.filename}` };
    await settings.save();
    res.json({ message: '全局头像上传成功', pet: settings.globalPet });
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
});

// 删除全局宠物头像（管理员）
router.delete('/global-pet/avatar', auth, admin, async (req, res) => {
  try {
    const settings = await getSettings();
    if (settings.globalPet.avatar && settings.globalPet.avatar.startsWith('/uploads/')) {
      const oldPath = path.join(__dirname, '..', settings.globalPet.avatar);
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }
    settings.globalPet = { ...settings.globalPet, avatar: '' };
    await settings.save();
    res.json({ message: '全局头像已删除', pet: settings.globalPet });
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
});

// 上传全局宠物视频（管理员）
router.post('/global-pet/video', auth, admin, upload.single('video'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: '请上传视频' });
    }
    const title = req.body.title || req.file.originalname;
    const settings = await getSettings();
    const videoEntry = {
      filename: req.file.filename,
      originalName: req.file.originalname,
      title,
      path: `/uploads/${req.file.filename}`,
      createdAt: new Date(),
    };
    settings.globalPet.videos.push(videoEntry);
    await settings.save();
    res.json({ message: '视频上传成功', pet: settings.globalPet });
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
});

// 更新全局宠物视频标题（管理员）
router.put('/global-pet/video/:filename', auth, admin, async (req, res) => {
  try {
    const { title } = req.body;
    if (!title) return res.status(400).json({ message: '标题不能为空' });
    const settings = await getSettings();
    const videoEntry = settings.globalPet.videos.find(v => v.filename === req.params.filename);
    if (!videoEntry) return res.status(404).json({ message: '视频不存在' });
    videoEntry.title = title;
    await settings.save();
    res.json({ message: '标题更新成功', pet: settings.globalPet });
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
});

// 删除全局宠物视频（管理员）
router.delete('/global-pet/video/:filename', auth, admin, async (req, res) => {
  try {
    const settings = await getSettings();
    const videoEntry = settings.globalPet.videos.find(v => v.filename === req.params.filename);
    if (videoEntry && videoEntry.path && videoEntry.path.startsWith('/uploads/')) {
      const filePath = path.join(__dirname, '..', videoEntry.path);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }
    settings.globalPet.videos = settings.globalPet.videos.filter(v => v.filename !== req.params.filename);
    await settings.save();
    res.json({ message: '视频已删除', pet: settings.globalPet });
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
});

// ============ 用户个人宠物设置 API ============

router.get('/my-pet', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('pet');
    if (!user) return res.status(404).json({ message: '用户不存在' });
    const pet = user.pet || { name: '果果仁', image: '', walkGif: '', petCategory: 'cat', customCategory: '', videos: [] };
    res.json({ pet });
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
});

router.put('/my-pet/name', auth, async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ message: '名字不能为空' });
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: '用户不存在' });
    user.pet.name = name.trim();
    await user.save();
    res.json({ message: '宠物名字更新成功', pet: user.pet });
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
});

router.put('/my-pet/category', auth, async (req, res) => {
  try {
    const { petCategory, customCategory } = req.body;
    const validCategories = ['cat', 'dog', 'rabbit', 'hamster', 'bird', 'fox', 'panda', 'custom'];
    if (!petCategory || !validCategories.includes(petCategory)) {
      return res.status(400).json({ message: '无效的宠物品类' });
    }
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: '用户不存在' });
    user.pet.petCategory = petCategory;
    if (petCategory === 'custom' && customCategory) {
      user.pet.customCategory = customCategory.trim().substring(0, 20);
    } else {
      user.pet.customCategory = '';
    }
    await user.save();
    res.json({ message: '宠物品类更新成功', pet: user.pet });
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
});

router.post('/my-pet/image', auth, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: '请上传图片' });
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: '用户不存在' });
    if (user.pet.image && user.pet.image.startsWith('/uploads/')) {
      const oldPath = path.join(__dirname, '..', user.pet.image);
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }
    user.pet.image = `/uploads/${req.file.filename}`;
    await user.save();
    res.json({ message: '宠物图片上传成功', pet: user.pet });
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
});

router.delete('/my-pet/image', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: '用户不存在' });
    if (user.pet.image && user.pet.image.startsWith('/uploads/')) {
      const oldPath = path.join(__dirname, '..', user.pet.image);
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }
    user.pet.image = '';
    await user.save();
    res.json({ message: '宠物图片已删除', pet: user.pet });
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
});

router.post('/my-pet/walk-gif', auth, upload.single('gif'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: '请上传GIF' });
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: '用户不存在' });
    if (user.pet.walkGif && user.pet.walkGif.startsWith('/uploads/')) {
      const oldPath = path.join(__dirname, '..', user.pet.walkGif);
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }
    user.pet.walkGif = `/uploads/${req.file.filename}`;
    await user.save();
    res.json({ message: '走路GIF上传成功', pet: user.pet });
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
});

router.delete('/my-pet/walk-gif', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: '用户不存在' });
    if (user.pet.walkGif && user.pet.walkGif.startsWith('/uploads/')) {
      const oldPath = path.join(__dirname, '..', user.pet.walkGif);
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }
    user.pet.walkGif = '';
    await user.save();
    res.json({ message: '走路动画已删除', pet: user.pet });
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
});

router.post('/my-pet/avatar', auth, upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: '请上传头像' });
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: '用户不存在' });
    if (user.pet.avatar && user.pet.avatar.startsWith('/uploads/')) {
      const oldPath = path.join(__dirname, '..', user.pet.avatar);
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }
    user.pet.avatar = `/uploads/${req.file.filename}`;
    await user.save();
    res.json({ message: '头像上传成功', pet: user.pet });
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
});

router.delete('/my-pet/avatar', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: '用户不存在' });
    if (user.pet.avatar && user.pet.avatar.startsWith('/uploads/')) {
      const oldPath = path.join(__dirname, '..', user.pet.avatar);
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }
    user.pet.avatar = '';
    await user.save();
    res.json({ message: '头像已删除', pet: user.pet });
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
});

router.post('/my-pet/video', auth, upload.single('video'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: '请上传视频' });
    const title = req.body.title || req.file.originalname;
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: '用户不存在' });
    const videoEntry = {
      filename: req.file.filename,
      originalName: req.file.originalname,
      title,
      createdAt: new Date(),
    };
    user.pet.videos.push(videoEntry);
    await user.save();
    res.json({ message: '视频上传成功', pet: user.pet });
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
});

router.put('/my-pet/video/:filename', auth, async (req, res) => {
  try {
    const { title } = req.body;
    if (!title) return res.status(400).json({ message: '标题不能为空' });
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: '用户不存在' });
    const videoEntry = user.pet.videos.find(v => v.filename === req.params.filename);
    if (!videoEntry) return res.status(404).json({ message: '视频不存在' });
    videoEntry.title = title;
    await user.save();
    res.json({ message: '标题更新成功', pet: user.pet });
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
});

router.delete('/my-pet/video/:filename', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: '用户不存在' });
    const videoEntry = user.pet.videos.find(v => v.filename === req.params.filename);
    if (videoEntry) {
      const filePath = path.join(__dirname, '..', 'uploads', videoEntry.filename);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }
    user.pet.videos = user.pet.videos.filter(v => v.filename !== req.params.filename);
    await user.save();
    res.json({ message: '视频已删除', pet: user.pet });
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
});

const VALID_MBTI_TYPES = [
  'INTJ', 'INTP', 'ENTJ', 'ENTP',
  'INFJ', 'INFP', 'ENFJ', 'ENFP',
  'ISTJ', 'ISFJ', 'ESTJ', 'ESFJ',
  'ISTP', 'ISFP', 'ESTP', 'ESFP',
];

router.put('/my-pet/mbti', auth, async (req, res) => {
  try {
    const { mbti } = req.body;
    if (!mbti || !VALID_MBTI_TYPES.includes(mbti)) {
      return res.status(400).json({ message: '无效的MBTI类型' });
    }
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: '用户不存在' });
    user.pet.mbti = mbti;
    await user.save();
    res.json({ message: 'MBTI性格标签已保存', pet: user.pet });
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
});

module.exports = router;

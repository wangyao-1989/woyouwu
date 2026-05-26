const express = require('express');
const User = require('../models/User');
const Resource = require('../models/Resource');
const Item = require('../models/Item');
const Project = require('../models/Project');
const Article = require('../models/Article');
const Inspiration = require('../models/Inspiration');
const { auth } = require('../middleware/auth');
const upload = require('../middleware/upload');
const fs = require('fs');
const path = require('path');

const router = express.Router();

router.get('/list', async (req, res) => {
  try {
    const { search, limit = 20, page = 1 } = req.query;
    const query = {};
    
    if (search) {
      query.$or = [
        { nickname: { $regex: search, $options: 'i' } },
        { username: { $regex: search, $options: 'i' } },
        { bio: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(query)
      .select('-password -email -phone')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await User.countDocuments(query);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayCount = await User.countDocuments({ createdAt: { $gte: today } });

    res.json({ users, total, page: parseInt(page), limit: parseInt(limit), todayCount });
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
});

router.get('/me/resume', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password -email -phone');
    if (!user) return res.status(404).json({ message: '用户不存在' });

    res.json({
      avatar: user.avatar,
      realName: user.realName,
      bio: user.bio,
      skills: user.skills,
      experience: user.experience,
      education: user.education,
      socialLinks: user.socialLinks,
      contactEmail: user.contactEmail,
      location: user.location,
      interests: user.interests,
      isPublic: user.isPublic
    });
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
});

router.put('/me/resume', auth, async (req, res) => {
  try {
    const allowedFields = [
      'realName', 'bio', 'skills', 'experience', 'education',
      'socialLinks', 'contactEmail', 'location', 'interests', 'isPublic'
    ];

    const updates = {};
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        try {
          if (field === 'skills' || field === 'interests' || field === 'experience' || field === 'education' || field === 'socialLinks') {
            updates[field] = typeof req.body[field] === 'string' ? JSON.parse(req.body[field]) : req.body[field];
          } else if (field === 'isPublic') {
            updates[field] = req.body[field] === true || req.body[field] === 'true';
          } else {
            updates[field] = req.body[field];
          }
        } catch (e) {
          updates[field] = req.body[field];
        }
      }
    });

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updates },
      { new: true }
    ).select('-password -email -phone');

    res.json({ message: '简历更新成功', user });
  } catch (error) {
    console.error('Resume update error:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

router.put('/me/resume/visibility', auth, async (req, res) => {
  try {
    const { isPublic } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: { isPublic: isPublic === true || isPublic === 'true' } },
      { new: true }
    ).select('-password -email -phone');

    res.json({ message: '可见性已更新', isPublic: user.isPublic });
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password -email -phone');
    if (!user) {
      return res.status(404).json({ message: '用户不存在' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
});

router.put('/profile', auth, upload.single('avatar'), async (req, res) => {
  try {
    const updates = {};
    const allowedFields = [
      'nickname', 'bio', 'location', 'website',
      'contactWechat', 'contactPhone', 'contactEmail',
      'skills', 'socialLinks', 'theme'
    ];
    
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        try {
          updates[field] = typeof req.body[field] === 'string' && (field === 'skills' || field === 'socialLinks' || field === 'theme')
            ? JSON.parse(req.body[field])
            : req.body[field];
        } catch (e) {
          updates[field] = req.body[field];
        }
      }
    });

    if (req.file) {
      const currentUser = await User.findById(req.user._id);
      if (currentUser.avatar && currentUser.avatar.startsWith('/uploads/')) {
        const oldPath = path.join(__dirname, '..', currentUser.avatar);
        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath);
        }
      }
      updates.avatar = `/uploads/${req.file.filename}`;
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updates },
      { new: true }
    ).select('-password');

    res.json({ message: '更新成功', user });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

router.post('/background', auth, upload.single('background'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: '请上传图片' });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: { background: `/uploads/${req.file.filename}` } },
      { new: true }
    ).select('-password');

    res.json({ message: '背景图更新成功', user });
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
});

router.post('/:id/follow', auth, async (req, res) => {
  try {
    const targetUserId = req.params.id;
    const currentUserId = req.user._id;

    if (targetUserId === currentUserId.toString()) {
      return res.status(400).json({ message: '不能关注自己' });
    }

    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      return res.status(404).json({ message: '用户不存在' });
    }

    const currentUser = await User.findById(currentUserId);
    const isFollowing = currentUser.following.includes(targetUserId);

    if (isFollowing) {
      await User.findByIdAndUpdate(currentUserId, { $pull: { following: targetUserId } });
      await User.findByIdAndUpdate(targetUserId, { $pull: { followers: currentUserId } });
      res.json({ message: '已取消关注', isFollowing: false });
    } else {
      await User.findByIdAndUpdate(currentUserId, { $addToSet: { following: targetUserId } });
      await User.findByIdAndUpdate(targetUserId, { $addToSet: { followers: currentUserId } });
      res.json({ message: '关注成功', isFollowing: true });
    }
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
});

router.get('/:id/stats', async (req, res) => {
  try {
    const itemsCount = await Item.countDocuments({ owner: req.params.id });
    const resourcesCount = await Resource.countDocuments({ uploader: req.params.id });
    
    const user = await User.findById(req.params.id).select('followers following');
    
    res.json({
      items: itemsCount,
      resources: resourcesCount,
      followers: user?.followers?.length || 0,
      following: user?.following?.length || 0
    });
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
});

router.get('/:id/resources', async (req, res) => {
  try {
    const resources = await Resource.find({ uploader: req.params.id })
      .sort({ createdAt: -1 });
    res.json(resources);
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
});

router.get('/:id/items', async (req, res) => {
  try {
    const items = await Item.find({ owner: req.params.id })
      .populate('owner', 'username nickname avatar')
      .sort({ createdAt: -1 });
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
});

router.get('/:id/projects', async (req, res) => {
  try {
    const projects = await Project.find({ owner: req.params.id })
      .populate('owner', 'username nickname avatar')
      .sort({ createdAt: -1 });
    res.json(projects);
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
});

router.get('/:id/articles', async (req, res) => {
  try {
    const articles = await Article.find({ owner: req.params.id })
      .populate('owner', 'username nickname avatar')
      .sort({ createdAt: -1 });
    res.json(articles);
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
});

router.get('/:id/inspirations', async (req, res) => {
  try {
    const inspirations = await Inspiration.find({ owner: req.params.id })
      .populate('owner', 'username nickname avatar')
      .sort({ createdAt: -1 });
    res.json(inspirations);
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
});

router.get('/favorites', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('favorites');
    res.json(user.favorites || []);
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
});

router.get('/:id/resume', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password -email -phone');
    if (!user) return res.status(404).json({ message: '用户不存在' });

    if (!user.isPublic) {
      return res.status(403).json({ message: '该用户简历未公开' });
    }

    res.json({
      nickname: user.nickname,
      avatar: user.avatar,
      realName: user.realName,
      bio: user.bio,
      skills: user.skills,
      experience: user.experience,
      education: user.education,
      socialLinks: user.socialLinks,
      contactEmail: user.contactEmail,
      location: user.location,
      interests: user.interests
    });
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
});

router.post('/pet/image', auth, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: '请上传图片' });
    }

    const user = await User.findById(req.user._id);
    if (user.pet.image && user.pet.image.startsWith('/uploads/')) {
      const oldPath = path.join(__dirname, '..', user.pet.image);
      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
      }
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { $set: { 'pet.image': `/uploads/${req.file.filename}` } },
      { new: true }
    ).select('-password');

    res.json({ message: '宠物图片更新成功', pet: updatedUser.pet });
  } catch (error) {
    console.error('Pet image update error:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

router.put('/pet/name', auth, async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || name.trim().length < 1 || name.trim().length > 20) {
      return res.status(400).json({ message: '宠物名字长度必须在1-20个字符之间' });
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { $set: { 'pet.name': name.trim() } },
      { new: true }
    ).select('-password');

    res.json({ message: '宠物名字更新成功', pet: updatedUser.pet });
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
});

router.get('/pet/info', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('pet');
    res.json({ pet: user.pet });
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
});

router.delete('/pet/image', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (user.pet.image && user.pet.image.startsWith('/uploads/')) {
      const oldPath = path.join(__dirname, '..', user.pet.image);
      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
      }
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { $set: { 'pet.image': '' } },
      { new: true }
    ).select('-password');

    res.json({ message: '宠物图片已删除', pet: updatedUser.pet });
  } catch (error) {
    console.error('Pet image delete error:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

module.exports = router;

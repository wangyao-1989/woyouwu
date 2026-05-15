const express = require('express');
const User = require('../models/User');
const Resource = require('../models/Resource');
const Item = require('../models/Item');
const { auth } = require('../middleware/auth');
const upload = require('../middleware/upload');

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

    res.json({ users, total, page: parseInt(page), limit: parseInt(limit) });
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
      if (req.body.field === 'background') {
        updates.background = `/uploads/${req.file.filename}`;
      } else {
        updates.avatar = `/uploads/${req.file.filename}`;
      }
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

router.get('/favorites', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('favorites');
    res.json(user.favorites || []);
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
});

module.exports = router;

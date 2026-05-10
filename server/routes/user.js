const express = require('express');
const User = require('../models/User');
const Resource = require('../models/Resource');
const { auth } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
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
    const allowedFields = ['nickname', 'contactWechat', 'contactPhone', 'contactEmail'];
    
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    if (req.file) {
      updates.avatar = `/uploads/${req.file.filename}`;
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updates },
      { new: true }
    ).select('-password');

    res.json({ message: '更新成功', user });
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

router.get('/favorites', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('favorites');
    res.json(user.favorites || []);
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
});

module.exports = router;
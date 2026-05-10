const express = require('express');
const Message = require('../models/Message');
const { auth } = require('../middleware/auth');

const router = express.Router();

router.get('/', auth, async (req, res) => {
  try {
    const { isRead, type } = req.query;
    
    const query = { recipient: req.user._id };
    
    if (isRead !== undefined) {
      query.isRead = isRead === 'true';
    }
    if (type) {
      query.type = type;
    }

    const messages = await Message.find(query)
      .populate('sender', 'username nickname avatar')
      .populate('relatedItem', 'name images')
      .populate('relatedResource', 'title')
      .sort({ createdAt: -1 });

    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
});

router.get('/unread-count', auth, async (req, res) => {
  try {
    const count = await Message.countDocuments({ 
      recipient: req.user._id, 
      isRead: false 
    });
    res.json({ count });
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
});

router.put('/:id/read', auth, async (req, res) => {
  try {
    const message = await Message.findOneAndUpdate(
      { _id: req.params.id, recipient: req.user._id },
      { isRead: true },
      { new: true }
    );

    if (!message) {
      return res.status(404).json({ message: '消息不存在' });
    }

    res.json({ message: '已标记为已读' });
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
});

router.put('/read-all', auth, async (req, res) => {
  try {
    await Message.updateMany(
      { recipient: req.user._id, isRead: false },
      { isRead: true }
    );

    res.json({ message: '全部已读' });
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const message = await Message.findOneAndDelete({ 
      _id: req.params.id, 
      recipient: req.user._id 
    });

    if (!message) {
      return res.status(404).json({ message: '消息不存在' });
    }

    res.json({ message: '删除成功' });
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
});

module.exports = router;
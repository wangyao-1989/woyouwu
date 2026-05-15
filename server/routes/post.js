const express = require('express');
const Post = require('../models/Post');
const { auth } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

router.get('/latest', async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const posts = await Post.find()
      .populate('author', 'nickname avatar username')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));
    
    res.json({ posts });
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
});

router.get('/user/:userId', async (req, res) => {
  try {
    const { limit = 10, page = 1 } = req.query;
    const posts = await Post.find({ author: req.params.userId })
      .populate('author', 'nickname avatar username')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));
    
    const total = await Post.countDocuments({ author: req.params.userId });
    
    res.json({ posts, total });
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
});

router.post('/', auth, upload.single('image'), async (req, res) => {
  try {
    const { content } = req.body;
    if (!content || content.trim().length === 0) {
      return res.status(400).json({ message: '内容不能为空' });
    }

    const post = new Post({
      content: content.trim(),
      image: req.file ? `/uploads/${req.file.filename}` : '',
      author: req.user._id
    });

    await post.save();
    await post.populate('author', 'nickname avatar username');

    res.json({ message: '发布成功', post });
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
});

router.post('/:id/like', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: '帖子不存在' });
    }

    const userId = req.user._id.toString();
    const isLiked = post.likes.includes(userId);

    if (isLiked) {
      post.likes = post.likes.filter(id => id.toString() !== userId);
    } else {
      post.likes.push(userId);
    }

    await post.save();
    await post.populate('author', 'nickname avatar username');

    res.json({ 
      message: isLiked ? '已取消点赞' : '点赞成功', 
      post,
      isLiked: !isLiked 
    });
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate('author', 'nickname avatar username');
    
    if (!post) {
      return res.status(404).json({ message: '帖子不存在' });
    }

    res.json(post);
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: '帖子不存在' });
    }

    if (post.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: '无权删除此帖子' });
    }

    await Post.findByIdAndDelete(req.params.id);
    res.json({ message: '删除成功' });
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
});

module.exports = router;

const express = require('express');
const Article = require('../models/Article');
const { auth, optionalAuth } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

router.get('/', optionalAuth, async (req, res) => {
  try {
    const { category, tags, search, sort = '-createdAt', page = 1, limit = 20 } = req.query;
    const query = {};

    if (category) query.category = category;
    if (tags) query.tags = { $in: tags.split(',') };
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { summary: { $regex: search, $options: 'i' } },
        { tags: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Article.countDocuments(query);
    const articles = await Article.find(query)
      .populate('owner', 'username nickname avatar')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    res.json({ articles, total, page: parseInt(page), totalPages: Math.ceil(total / parseInt(limit)) });
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const article = await Article.findById(req.params.id)
      .populate('owner', 'username nickname avatar contactWechat contactPhone contactEmail');

    if (!article) {
      return res.status(404).json({ message: '文章不存在' });
    }

    res.json(article);
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
});

router.post('/', auth, (req, res, next) => {
  upload.single('cover')(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') return res.status(400).json({ message: '文件大小不能超过 20MB' });
      return res.status(400).json({ message: err.message || '文件上传失败' });
    }
    next();
  });
}, async (req, res) => {
  try {
    const { title, category, summary, content, tags, meta } = req.body;

    if (!title || !category || !content) {
      return res.status(400).json({ message: '标题、分类和正文不能为空' });
    }

    let parsedMeta = {};
    if (meta) {
      try { parsedMeta = JSON.parse(meta); } catch { parsedMeta = {}; }
    }

    const article = new Article({
      title,
      cover: req.file ? `/uploads/${req.file.filename}` : '',
      category,
      summary: summary || '',
      content,
      meta: parsedMeta,
      tags: tags ? JSON.parse(tags) : [],
      owner: req.user._id,
      ownerName: req.user.nickname
    });

    await article.save();
    await article.populate('owner', 'username nickname avatar');

    res.status(201).json({ message: '发布成功', article });
  } catch (error) {
    console.error('Create article error:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

router.put('/:id', auth, (req, res, next) => {
  upload.single('cover')(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') return res.status(400).json({ message: '文件大小不能超过 20MB' });
      return res.status(400).json({ message: err.message || '文件上传失败' });
    }
    next();
  });
}, async (req, res) => {
  try {
    const article = await Article.findById(req.params.id);

    if (!article) {
      return res.status(404).json({ message: '文章不存在' });
    }

    if (article.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: '无权限修改此文章' });
    }

    const updates = {};
    const allowedFields = ['title', 'category', 'summary', 'content'];

    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    if (req.body.tags) updates.tags = JSON.parse(req.body.tags);
    if (req.body.meta) {
      try { updates.meta = JSON.parse(req.body.meta); } catch { updates.meta = {}; }
    }
    if (req.file) updates.cover = `/uploads/${req.file.filename}`;

    const updatedArticle = await Article.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true }
    ).populate('owner', 'username nickname avatar');

    res.json({ message: '更新成功', article: updatedArticle });
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const article = await Article.findById(req.params.id);

    if (!article) {
      return res.status(404).json({ message: '文章不存在' });
    }

    if (article.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: '无权限删除此文章' });
    }

    await Article.findByIdAndDelete(req.params.id);
    res.json({ message: '删除成功' });
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
});

router.post('/:id/like', auth, async (req, res) => {
  try {
    const article = await Article.findById(req.params.id);
    if (!article) return res.status(404).json({ message: '文章不存在' });

    const idx = article.likes.indexOf(req.user._id);
    if (idx > -1) {
      article.likes.splice(idx, 1);
    } else {
      article.likes.push(req.user._id);
    }
    await article.save();
    res.json({ likes: article.likes.length, liked: idx === -1 });
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
});

router.post('/:id/favorite', auth, async (req, res) => {
  try {
    const article = await Article.findById(req.params.id);
    if (!article) return res.status(404).json({ message: '文章不存在' });

    const idx = article.favorites.indexOf(req.user._id);
    if (idx > -1) {
      article.favorites.splice(idx, 1);
    } else {
      article.favorites.push(req.user._id);
    }
    await article.save();
    res.json({ favorites: article.favorites.length, favorited: idx === -1 });
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
});

router.post('/:id/comments', auth, async (req, res) => {
  try {
    const { content } = req.body;
    if (!content) return res.status(400).json({ message: '评论内容不能为空' });

    const article = await Article.findById(req.params.id);
    if (!article) return res.status(404).json({ message: '文章不存在' });

    article.comments.push({
      author: req.user._id,
      authorName: req.user.nickname,
      authorAvatar: req.user.avatar || '',
      content
    });
    await article.save();
    await article.populate('comments.author', 'username nickname avatar');

    const newComment = article.comments[article.comments.length - 1];
    res.status(201).json(newComment);
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
});

router.get('/:id/comments', async (req, res) => {
  try {
    const article = await Article.findById(req.params.id)
      .populate('comments.author', 'username nickname avatar');
    if (!article) return res.status(404).json({ message: '文章不存在' });

    res.json(article.comments);
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
});

module.exports = router;
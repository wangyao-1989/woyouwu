const express = require('express');
const Inspiration = require('../models/Inspiration');
const { auth, optionalAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/', optionalAuth, async (req, res) => {
  try {
    const { category, status, search, sort = '-createdAt', page = 1, limit = 20 } = req.query;
    const query = {};

    if (category) query.category = category;
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Inspiration.countDocuments(query);
    const inspirations = await Inspiration.find(query)
      .populate('owner', 'username nickname avatar')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    res.json({ inspirations, total, page: parseInt(page), totalPages: Math.ceil(total / parseInt(limit)) });
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const inspiration = await Inspiration.findById(req.params.id)
      .populate('owner', 'username nickname avatar contactWechat contactPhone contactEmail');

    if (!inspiration) {
      return res.status(404).json({ message: '灵感不存在' });
    }

    res.json(inspiration);
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const { title, category, description, detail, refLinks, tags, status } = req.body;

    if (!title || !category || !description) {
      return res.status(400).json({ message: '标题、分类和描述不能为空' });
    }

    const inspiration = new Inspiration({
      title,
      category,
      description,
      detail: detail || '',
      refLinks: refLinks ? JSON.parse(refLinks) : [],
      tags: tags ? JSON.parse(tags) : [],
      status: status || '纯想法',
      owner: req.user._id,
      ownerName: req.user.nickname
    });

    await inspiration.save();
    await inspiration.populate('owner', 'username nickname avatar');

    res.status(201).json({ message: '发布成功', inspiration });
  } catch (error) {
    console.error('Create inspiration error:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const inspiration = await Inspiration.findById(req.params.id);

    if (!inspiration) {
      return res.status(404).json({ message: '灵感不存在' });
    }

    if (inspiration.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: '无权限修改此灵感' });
    }

    const updates = {};
    const allowedFields = ['title', 'category', 'description', 'detail', 'status'];

    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    if (req.body.refLinks) updates.refLinks = JSON.parse(req.body.refLinks);
    if (req.body.tags) updates.tags = JSON.parse(req.body.tags);

    const updatedInspiration = await Inspiration.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true }
    ).populate('owner', 'username nickname avatar');

    res.json({ message: '更新成功', inspiration: updatedInspiration });
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const inspiration = await Inspiration.findById(req.params.id);

    if (!inspiration) {
      return res.status(404).json({ message: '灵感不存在' });
    }

    if (inspiration.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: '无权限删除此灵感' });
    }

    await Inspiration.findByIdAndDelete(req.params.id);
    res.json({ message: '删除成功' });
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
});

router.post('/:id/like', auth, async (req, res) => {
  try {
    const inspiration = await Inspiration.findById(req.params.id);
    if (!inspiration) return res.status(404).json({ message: '灵感不存在' });

    const idx = inspiration.likes.indexOf(req.user._id);
    if (idx > -1) {
      inspiration.likes.splice(idx, 1);
    } else {
      inspiration.likes.push(req.user._id);
    }
    await inspiration.save();
    res.json({ likes: inspiration.likes.length, liked: idx === -1 });
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
});

router.post('/:id/favorite', auth, async (req, res) => {
  try {
    const inspiration = await Inspiration.findById(req.params.id);
    if (!inspiration) return res.status(404).json({ message: '灵感不存在' });

    const idx = inspiration.favorites.indexOf(req.user._id);
    if (idx > -1) {
      inspiration.favorites.splice(idx, 1);
    } else {
      inspiration.favorites.push(req.user._id);
    }
    await inspiration.save();
    res.json({ favorites: inspiration.favorites.length, favorited: idx === -1 });
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
});

router.post('/:id/comments', auth, async (req, res) => {
  try {
    const { content } = req.body;
    if (!content) return res.status(400).json({ message: '评论内容不能为空' });

    const inspiration = await Inspiration.findById(req.params.id);
    if (!inspiration) return res.status(404).json({ message: '灵感不存在' });

    inspiration.comments.push({
      author: req.user._id,
      authorName: req.user.nickname,
      authorAvatar: req.user.avatar || '',
      content
    });
    await inspiration.save();
    await inspiration.populate('comments.author', 'username nickname avatar');

    const newComment = inspiration.comments[inspiration.comments.length - 1];
    res.status(201).json(newComment);
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
});

router.get('/:id/comments', async (req, res) => {
  try {
    const inspiration = await Inspiration.findById(req.params.id)
      .populate('comments.author', 'username nickname avatar');
    if (!inspiration) return res.status(404).json({ message: '灵感不存在' });

    res.json(inspiration.comments);
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
});

module.exports = router;
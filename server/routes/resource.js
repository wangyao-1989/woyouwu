const express = require('express');
const Resource = require('../models/Resource');
const User = require('../models/User');
const Message = require('../models/Message');
const { auth, optionalAuth } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

router.get('/', optionalAuth, async (req, res) => {
  try {
    const { type, tag, search, sort = '-createdAt' } = req.query;
    
    const query = {};
    
    if (type) query.type = type;
    if (tag) query.tags = tag;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $regex: search, $options: 'i' } }
      ];
    }

    let sortOption = {};
    if (sort === '-createdAt') sortOption = { createdAt: -1 };
    else if (sort === 'createdAt') sortOption = { createdAt: 1 };
    else if (sort === '-likeCount') sortOption = { likeCount: -1 };

    const resources = await Resource.find(query)
      .populate('uploader', 'username nickname avatar')
      .sort(sortOption);

    const result = resources.map(r => ({
      ...r.toObject(),
      isLiked: req.user ? r.likes.includes(req.user._id) : false,
      isFavorited: req.user ? r.favorites.includes(req.user._id) : false
    }));

    res.json(result);
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
});

router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id)
      .populate('uploader', 'username nickname avatar')
      .populate('comments.user', 'username nickname avatar');

    if (!resource) {
      return res.status(404).json({ message: '资源不存在' });
    }

    const result = {
      ...resource.toObject(),
      isLiked: req.user ? resource.likes.includes(req.user._id) : false,
      isFavorited: req.user ? resource.favorites.includes(req.user._id) : false
    };

    res.json(result);
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
});

router.post('/', auth, (req, res, next) => {
  upload.array('images', 10)(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') return res.status(400).json({ message: '文件大小不能超过 20MB' });
      return res.status(400).json({ message: err.message || '文件上传失败' });
    }
    next();
  });
}, async (req, res) => {
  try {
    const { title, type, link, description, tags } = req.body;

    if (!title || !type || !description) {
      return res.status(400).json({ message: '标题、类型和描述不能为空' });
    }

    const images = req.files ? req.files.map(file => `/uploads/${file.filename}`) : [];
    const tagArray = tags ? (Array.isArray(tags) ? tags : tags.split(',').map(t => t.trim()).filter(t => t)) : [];

    const resource = new Resource({
      title,
      type,
      link,
      description,
      tags: tagArray,
      images,
      uploader: req.user._id,
      uploaderName: req.user.nickname,
      uploaderAvatar: req.user.avatar
    });

    await resource.save();
    await resource.populate('uploader', 'username nickname avatar');

    res.status(201).json({ message: '发布成功', resource });
  } catch (error) {
    console.error('Create resource error:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

router.put('/:id', auth, (req, res, next) => {
  upload.array('images', 10)(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') return res.status(400).json({ message: '文件大小不能超过 20MB' });
      return res.status(400).json({ message: err.message || '文件上传失败' });
    }
    next();
  });
}, async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id);

    if (!resource) {
      return res.status(404).json({ message: '资源不存在' });
    }

    if (resource.uploader.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: '无权限修改此资源' });
    }

    const updates = {};
    const allowedFields = ['title', 'type', 'link', 'description', 'tags'];

    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        if (field === 'tags') {
          updates[field] = Array.isArray(req.body[field]) 
            ? req.body[field] 
            : req.body[field].split(',').map(t => t.trim()).filter(t => t);
        } else {
          updates[field] = req.body[field];
        }
      }
    });

    if (req.files && req.files.length > 0) {
      updates.images = req.files.map(file => `/uploads/${file.filename}`);
    }

    const updatedResource = await Resource.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true }
    ).populate('uploader', 'username nickname avatar');

    res.json({ message: '更新成功', resource: updatedResource });
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id);

    if (!resource) {
      return res.status(404).json({ message: '资源不存在' });
    }

    if (resource.uploader.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: '无权限删除此资源' });
    }

    await Resource.findByIdAndDelete(req.params.id);

    await User.updateMany(
      { favorites: req.params.id },
      { $pull: { favorites: req.params.id } }
    );

    res.json({ message: '删除成功' });
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
});

router.post('/:id/like', auth, async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id);

    if (!resource) {
      return res.status(404).json({ message: '资源不存在' });
    }

    const isLiked = resource.likes.includes(req.user._id);

    if (isLiked) {
      resource.likes.pull(req.user._id);
      resource.likeCount = Math.max(0, resource.likeCount - 1);
    } else {
      resource.likes.push(req.user._id);
      resource.likeCount += 1;
    }

    await resource.save();

    res.json({ 
      message: isLiked ? '取消点赞' : '点赞成功', 
      likeCount: resource.likeCount,
      isLiked: !isLiked 
    });
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
});

router.post('/:id/favorite', auth, async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id);
    const user = await User.findById(req.user._id);

    if (!resource || !user) {
      return res.status(404).json({ message: '资源或用户不存在' });
    }

    const isFavorited = user.favorites.includes(resource._id);

    if (isFavorited) {
      user.favorites.pull(resource._id);
      resource.favorites.pull(req.user._id);
      resource.favoriteCount = Math.max(0, resource.favoriteCount - 1);
    } else {
      user.favorites.push(resource._id);
      resource.favorites.push(req.user._id);
      resource.favoriteCount += 1;
    }

    await user.save();
    await resource.save();

    res.json({ 
      message: isFavorited ? '取消收藏' : '收藏成功', 
      favoriteCount: resource.favoriteCount,
      isFavorited: !isFavorited 
    });
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
});

router.post('/:id/comment', auth, async (req, res) => {
  try {
    const { content } = req.body;
    const resource = await Resource.findById(req.params.id);

    if (!resource) {
      return res.status(404).json({ message: '资源不存在' });
    }

    if (!content || !content.trim()) {
      return res.status(400).json({ message: '评论内容不能为空' });
    }

    const comment = {
      user: req.user._id,
      userName: req.user.nickname,
      userAvatar: req.user.avatar,
      content: content.trim(),
      createdAt: new Date()
    };

    resource.comments.push(comment);
    resource.commentCount = resource.comments.length;

    await resource.save();
    await resource.populate('comments.user', 'username nickname avatar');

    const latestComment = resource.comments[resource.comments.length - 1];

    if (resource.uploader.toString() !== req.user._id.toString()) {
      const message = new Message({
        recipient: resource.uploader,
        sender: req.user._id,
        senderName: req.user.nickname,
        senderAvatar: req.user.avatar,
        type: 'resource_comment',
        title: '新评论',
        content: `${req.user.nickname} 评论了你的资源"${resource.title}"`,
        relatedResource: resource._id
      });
      await message.save();
    }

    res.status(201).json({ message: '评论成功', comment: latestComment });
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
});

router.delete('/:id/comment/:commentId', auth, async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id);

    if (!resource) {
      return res.status(404).json({ message: '资源不存在' });
    }

    const comment = resource.comments.id(req.params.commentId);

    if (!comment) {
      return res.status(404).json({ message: '评论不存在' });
    }

    if (comment.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: '无权限删除此评论' });
    }

    comment.deleteOne();
    resource.commentCount = resource.comments.length;

    await resource.save();

    res.json({ message: '删除成功' });
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
});

module.exports = router;
const express = require('express');
const Content = require('../models/Content');
const { auth } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

router.post('/', auth, upload.array('images', 9), async (req, res) => {
  try {
    const { type, title, content, link, category, tags, status } = req.body;

    if (!type) {
      return res.status(400).json({ message: '内容类型不能为空' });
    }

    const images = req.files ? req.files.map(file => `/uploads/${file.filename}`) : [];

    const contentData = {
      type,
      owner: req.user._id,
      images,
      tags: tags ? (Array.isArray(tags) ? tags : JSON.parse(tags)) : []
    };

    if (title) contentData.title = title;
    if (content) contentData.content = content;
    if (link) contentData.link = link;
    if (category) contentData.category = category;
    if (status) contentData.status = status;

    const newContent = new Content(contentData);
    await newContent.save();

    const populatedContent = await Content.findById(newContent._id)
      .populate('owner', 'username nickname avatar')
      .populate('comments.user', 'username nickname avatar');

    res.status(201).json({ message: '发布成功', content: populatedContent });
  } catch (error) {
    console.error('Create content error:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

router.get('/explore', async (req, res) => {
  try {
    const { limit = 20 } = req.query;
    
    const contents = await Content.aggregate([
      { $match: {} },
      { $sample: { size: parseInt(limit) } },
      {
        $lookup: {
          from: 'users',
          localField: 'owner',
          foreignField: '_id',
          as: 'ownerData'
        }
      },
      { $unwind: '$ownerData' },
      {
        $project: {
          type: 1,
          title: 1,
          content: 1,
          link: 1,
          category: 1,
          images: 1,
          tags: 1,
          status: 1,
          views: 1,
          likesCount: { $size: { $ifNull: ['$likes', []] } },
          commentsCount: { $size: { $ifNull: ['$comments', []] } },
          createdAt: 1,
          'owner.username': '$ownerData.username',
          'owner.nickname': '$ownerData.nickname',
          'owner.avatar': '$ownerData.avatar'
        }
      }
    ]);

    res.json({ contents });
  } catch (error) {
    console.error('Explore error:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

router.get('/', async (req, res) => {
  try {
    const { type, search, category, page = 1, limit = 20 } = req.query;
    
    const query = {};
    if (type) query.type = type;
    if (category) query.category = category;
    
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } },
        { tags: { $regex: search, $options: 'i' } }
      ];
    }

    const contents = await Content.find(query)
      .populate('owner', 'username nickname avatar')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Content.countDocuments(query);

    res.json({ contents, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (error) {
    console.error('List content error:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const content = await Content.findByIdAndUpdate(
      req.params.id,
      { $inc: { views: 1 } },
      { new: true }
    )
      .populate('owner', 'username nickname avatar')
      .populate('comments.user', 'username nickname avatar');

    if (!content) {
      return res.status(404).json({ message: '内容不存在' });
    }

    res.json(content);
  } catch (error) {
    console.error('Get content error:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

router.put('/:id', auth, upload.array('images', 9), async (req, res) => {
  try {
    const content = await Content.findById(req.params.id);

    if (!content) {
      return res.status(404).json({ message: '内容不存在' });
    }

    if (content.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: '没有权限修改' });
    }

    const { title, content: contentText, link, category, tags, status } = req.body;

    if (title) content.title = title;
    if (contentText) content.content = contentText;
    if (link) content.link = link;
    if (category) content.category = category;
    if (status) content.status = status;
    if (tags) content.tags = Array.isArray(tags) ? tags : JSON.parse(tags);

    if (req.files && req.files.length > 0) {
      content.images = req.files.map(file => `/uploads/${file.filename}`);
    }

    await content.save();

    const populatedContent = await Content.findById(content._id)
      .populate('owner', 'username nickname avatar')
      .populate('comments.user', 'username nickname avatar');

    res.json({ message: '更新成功', content: populatedContent });
  } catch (error) {
    console.error('Update content error:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const content = await Content.findById(req.params.id);

    if (!content) {
      return res.status(404).json({ message: '内容不存在' });
    }

    if (content.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: '没有权限删除' });
    }

    await Content.findByIdAndDelete(req.params.id);

    res.json({ message: '删除成功' });
  } catch (error) {
    console.error('Delete content error:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

router.post('/:id/like', auth, async (req, res) => {
  try {
    const content = await Content.findById(req.params.id);

    if (!content) {
      return res.status(404).json({ message: '内容不存在' });
    }

    const isLiked = content.likes.includes(req.user._id);

    if (isLiked) {
      content.likes = content.likes.filter(id => id.toString() !== req.user._id.toString());
    } else {
      content.likes.push(req.user._id);
    }

    await content.save();

    res.json({ 
      isLiked: !isLiked, 
      likesCount: content.likes.length 
    });
  } catch (error) {
    console.error('Like error:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

router.post('/:id/favorite', auth, async (req, res) => {
  try {
    const content = await Content.findById(req.params.id);

    if (!content) {
      return res.status(404).json({ message: '内容不存在' });
    }

    const isFavorited = content.favorites.includes(req.user._id);

    if (isFavorited) {
      content.favorites = content.favorites.filter(id => id.toString() !== req.user._id.toString());
    } else {
      content.favorites.push(req.user._id);
    }

    await content.save();

    res.json({ 
      isFavorited: !isFavorited, 
      favoritesCount: content.favorites.length 
    });
  } catch (error) {
    console.error('Favorite error:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

router.post('/:id/comment', auth, async (req, res) => {
  try {
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({ message: '评论内容不能为空' });
    }

    const contentDoc = await Content.findById(req.params.id);

    if (!contentDoc) {
      return res.status(404).json({ message: '内容不存在' });
    }

    const user = await require('../models/User').findById(req.user._id);

    contentDoc.comments.push({
      user: req.user._id,
      userName: user.nickname,
      userAvatar: user.avatar,
      content
    });

    await contentDoc.save();

    const updatedContent = await Content.findById(req.params.id)
      .populate('owner', 'username nickname avatar')
      .populate('comments.user', 'username nickname avatar');

    res.json({ 
      message: '评论成功', 
      comments: updatedContent.comments 
    });
  } catch (error) {
    console.error('Comment error:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

router.delete('/:id/comment/:commentId', auth, async (req, res) => {
  try {
    const content = await Content.findById(req.params.id);

    if (!content) {
      return res.status(404).json({ message: '内容不存在' });
    }

    const comment = content.comments.id(req.params.commentId);

    if (!comment) {
      return res.status(404).json({ message: '评论不存在' });
    }

    if (comment.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: '没有权限删除此评论' });
    }

    comment.deleteOne();
    await content.save();

    res.json({ message: '删除成功' });
  } catch (error) {
    console.error('Delete comment error:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

module.exports = router;
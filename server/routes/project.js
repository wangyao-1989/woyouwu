const express = require('express');
const Project = require('../models/Project');
const { auth, optionalAuth } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

router.get('/', optionalAuth, async (req, res) => {
  try {
    const { category, search, sort = '-createdAt', page = 1, limit = 20, hasVideo } = req.query;
    const query = {};

    if (category) query.category = category;
    if (hasVideo === 'true') query.video = { $ne: '', $exists: true };
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { summary: { $regex: search, $options: 'i' } },
        { techTags: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Project.countDocuments(query);
    const projects = await Project.find(query)
      .populate('owner', 'username nickname avatar')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    const projectsWithDetails = projects.map(p => {
      const obj = p.toObject();
      try { obj.collaborators = JSON.parse(obj.collaborators || '[]'); } catch { obj.collaborators = []; }
      try { obj.techTags = JSON.parse(obj.techTags || '[]'); } catch { obj.techTags = []; }
      return obj;
    });

    res.json({ projects: projectsWithDetails, total, page: parseInt(page), totalPages: Math.ceil(total / parseInt(limit)) });
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('owner', 'username nickname avatar contactWechat contactPhone contactEmail');

    if (!project) {
      return res.status(404).json({ message: '项目不存在' });
    }

    const projectObj = project.toObject();
    try { projectObj.collaborators = JSON.parse(projectObj.collaborators || '[]'); } catch { projectObj.collaborators = []; }
    try { projectObj.techTags = JSON.parse(projectObj.techTags || '[]'); } catch { projectObj.techTags = []; }
    res.json(projectObj);
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
    const { title, category, summary, content, link, techTags, completionDate, collaborators, video, videoSource, videoSourceLink } = req.body;

    if (!title || !category || !summary || !content) {
      return res.status(400).json({ message: '标题、分类、简介和详情不能为空' });
    }

    const project = new Project({
      title,
      cover: req.file ? `/uploads/${req.file.filename}` : '',
      video: video || '',
      videoSource: videoSource || '原创',
      videoSourceLink: videoSourceLink || '',
      category,
      summary,
      content,
      link: link || '',
      techTags: techTags ? JSON.parse(techTags) : [],
      completionDate: completionDate || null,
      collaborators: collaborators || '',
      owner: req.user._id,
      ownerName: req.user.nickname
    });

    await project.save();
    await project.populate('owner', 'username nickname avatar');

    res.status(201).json({ message: '发布成功', project });
  } catch (error) {
    console.error('Create project error:', error);
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
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ message: '项目不存在' });
    }

    if (project.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: '无权限修改此项目' });
    }

    const updates = {};
    const allowedFields = ['title', 'category', 'summary', 'content', 'link', 'collaborators', 'video', 'videoSource', 'videoSourceLink'];

    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    if (req.body.techTags) updates.techTags = JSON.parse(req.body.techTags);
    if (req.body.completionDate !== undefined) updates.completionDate = req.body.completionDate || null;
    if (req.file) updates.cover = `/uploads/${req.file.filename}`;

    const updatedProject = await Project.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true }
    ).populate('owner', 'username nickname avatar');

    res.json({ message: '更新成功', project: updatedProject });
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ message: '项目不存在' });
    }

    if (project.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: '无权限删除此项目' });
    }

    await Project.findByIdAndDelete(req.params.id);
    res.json({ message: '删除成功' });
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
});

router.post('/:id/like', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: '项目不存在' });

    const idx = project.likes.indexOf(req.user._id);
    if (idx > -1) {
      project.likes.splice(idx, 1);
    } else {
      project.likes.push(req.user._id);
    }
    await project.save();
    res.json({ likes: project.likes.length, liked: idx === -1 });
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
});

router.post('/:id/favorite', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: '项目不存在' });

    const idx = project.favorites.indexOf(req.user._id);
    if (idx > -1) {
      project.favorites.splice(idx, 1);
    } else {
      project.favorites.push(req.user._id);
    }
    await project.save();
    res.json({ favorites: project.favorites.length, favorited: idx === -1 });
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
});

router.post('/:id/comments', auth, async (req, res) => {
  try {
    const { content } = req.body;
    if (!content) return res.status(400).json({ message: '评论内容不能为空' });

    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: '项目不存在' });

    project.comments.push({
      author: req.user._id,
      authorName: req.user.nickname,
      authorAvatar: req.user.avatar || '',
      content
    });
    await project.save();
    await project.populate('comments.author', 'username nickname avatar');

    const newComment = project.comments[project.comments.length - 1];
    res.status(201).json(newComment);
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
});

router.get('/:id/comments', async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('comments.author', 'username nickname avatar');
    if (!project) return res.status(404).json({ message: '项目不存在' });

    res.json(project.comments);
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
});

module.exports = router;
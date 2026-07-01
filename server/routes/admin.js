const express = require('express');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const { auth } = require('../middleware/auth');
const { admin } = require('../middleware/admin');
const upload = require('../middleware/upload');
const Settings = require('../models/Settings');
const ApiUsage = require('../models/ApiUsage');
const ReferenceClip = require('../models/ReferenceClip');

const router = express.Router();

const referenceFileDir = path.join(__dirname, '../private-uploads/reference-files');
const referenceAllowedExtensions = new Set([
  '.jpg', '.jpeg', '.png', '.gif', '.webp',
  '.mp4', '.webm', '.ogg',
  '.pdf', '.html', '.htm', '.txt', '.md', '.csv', '.json',
  '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',
  '.zip'
]);
const referenceAllowedMimeTypes = new Set([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'video/mp4',
  'video/webm',
  'video/ogg',
  'application/pdf',
  'text/html',
  'text/plain',
  'text/markdown',
  'text/csv',
  'application/json',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/zip',
  'application/x-zip-compressed',
  'application/octet-stream'
]);

const referenceStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    fs.mkdirSync(referenceFileDir, { recursive: true });
    cb(null, referenceFileDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${uuidv4()}${ext}`);
  }
});

const referenceUpload = multer({
  storage: referenceStorage,
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (referenceAllowedExtensions.has(ext) && referenceAllowedMimeTypes.has(file.mimetype)) {
      return cb(null, true);
    }
    cb(new Error('只支持图片、视频、PDF、HTML、文本、Office 文档和 ZIP 文件'), false);
  },
  limits: {
    fileSize: 50 * 1024 * 1024,
    files: 5
  }
});

const handleReferenceUpload = (req, res, next) => {
  referenceUpload.array('files', 5)(req, res, (err) => {
    if (!err) return next();
    const message = err.code === 'LIMIT_FILE_SIZE' ? '单个文件不能超过 50MB' : err.message;
    return res.status(400).json({ message: message || '文件上传失败' });
  });
};

const normalizeTags = (tags) => {
  if (Array.isArray(tags)) {
    return tags.map(t => String(t).trim()).filter(Boolean);
  }
  if (typeof tags !== 'string') {
    return [];
  }
  const value = tags.trim();
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) {
      return parsed.map(t => String(t).trim()).filter(Boolean);
    }
  } catch (error) {
    // 兼容旧表单的逗号分隔标签
  }
  return value.split(',').map(t => t.trim()).filter(Boolean);
};

const normalizeIdList = (value) => {
  if (Array.isArray(value)) return value.map(String);
  if (typeof value !== 'string' || !value.trim()) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch (error) {
    return value.split(',').map(v => v.trim()).filter(Boolean);
  }
};

const buildReferenceAttachments = (files = []) => files.map(file => ({
  originalName: file.originalname,
  storedName: file.filename,
  mimeType: file.mimetype,
  size: file.size
}));

const removeReferenceFile = (storedName) => {
  if (!storedName) return;
  const filePath = path.join(referenceFileDir, path.basename(storedName));
  fs.promises.unlink(filePath).catch(() => {});
};

const MBTI_TYPES = [
  ['INTJ', 'INTP', 'ENTJ', 'ENTP'],
  ['INFJ', 'INFP', 'ENFJ', 'ENFP'],
  ['ISTJ', 'ISFJ', 'ESTJ', 'ESFJ'],
  ['ISTP', 'ISFP', 'ESTP', 'ESFP']
];

router.get('/mbti-avatar-debug', auth, admin, async (req, res) => {
  try {
    const avatarPath = path.join(__dirname, '../uploads/mbti-avatars.jpg');
    if (!fs.existsSync(avatarPath)) {
      return res.status(404).json({ error: 'No avatar uploaded yet' });
    }
    
    const image = await sharp(avatarPath);
    const metadata = await image.metadata();
    const raw = await image.raw().toBuffer();
    const channels = metadata.channels || 3;
    const width = metadata.width;
    const height = metadata.height;
    
    const sampleLines = [];
    for (let i = Math.floor(height * 0.05); i < Math.floor(height * 0.95); i += Math.floor(height / 30)) {
      let whiteCount = 0;
      for (let j = 0; j < width; j++) {
        const idx = i * width * channels + j * channels;
        const r = raw[idx];
        const g = raw[idx + 1];
        const b = raw[idx + 2];
        if (r > 245 && g > 245 && b > 245) whiteCount++;
      }
      sampleLines.push({ y: i, whitePercent: (whiteCount / width * 100).toFixed(1) });
    }
    
    const sampleCols = [];
    for (let j = Math.floor(width * 0.05); j < Math.floor(width * 0.95); j += Math.floor(width / 30)) {
      let whiteCount = 0;
      for (let i = 0; i < height; i++) {
        const idx = i * width * channels + j * channels;
        const r = raw[idx];
        const g = raw[idx + 1];
        const b = raw[idx + 2];
        if (r > 245 && g > 245 && b > 245) whiteCount++;
      }
      sampleCols.push({ x: j, whitePercent: (whiteCount / height * 100).toFixed(1) });
    }
    
    res.json({
      width,
      height,
      sampleLines,
      sampleCols
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// 简化版：直接上传单张 MBTI 头像到对应类型
router.post('/upload-mbti-avatar-single', auth, admin, upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: '请选择要上传的图片' });
    }

    const mbtiType = (req.body.mbti || '').toUpperCase();
    if (!/^[IE][NS][TF][JP]$/.test(mbtiType)) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ message: '无效的 MBTI 类型，请提供如 INTJ、ENFP 等' });
    }

    const sex = (req.body.sex === 'male' || req.body.sex === 'female') ? req.body.sex : '';
    const baseName = sex ? `${mbtiType.toLowerCase()}-${sex}` : mbtiType.toLowerCase();
    
    const mbtiAvatarsDir = path.join(__dirname, '../uploads/mbti-avatars');
    if (!fs.existsSync(mbtiAvatarsDir)) {
      fs.mkdirSync(mbtiAvatarsDir, { recursive: true });
    }

    const ext = req.file.mimetype === 'image/gif' ? 'gif' : 'png';
    const targetPath = path.join(mbtiAvatarsDir, `${baseName}.${ext}`);

    // 清理旧格式文件（无性别后缀和有性别后缀的旧格式）
    const oldVariants = [
      `${mbtiType.toLowerCase()}.png`, `${mbtiType.toLowerCase()}.gif`,
      `${mbtiType.toLowerCase()}-male.png`, `${mbtiType.toLowerCase()}-male.gif`,
      `${mbtiType.toLowerCase()}-female.png`, `${mbtiType.toLowerCase()}-female.gif`,
    ];
    oldVariants.forEach(v => {
      const p = path.join(mbtiAvatarsDir, v);
      if (p !== targetPath && fs.existsSync(p)) fs.unlinkSync(p);
    });

    if (ext === 'gif') {
      fs.copyFileSync(req.file.path, targetPath);
    } else {
      await sharp(req.file.path)
        .resize(200, 200, { fit: 'contain', background: { r: 240, g: 232, b: 221, alpha: 1 } })
        .png()
        .toFile(targetPath);
    }

    fs.unlinkSync(req.file.path);

    res.json({ message: `${mbtiType}${sex === 'male' ? '(男)' : sex === 'female' ? '(女)' : ''} 头像上传成功！`, url: `/uploads/mbti-avatars/${baseName}.${ext}` });
  } catch (error) {
    console.error('Single MBTI avatar upload error:', error);
    res.status(500).json({ message: '上传失败: ' + error.message });
  }
});

router.post('/upload-mbti-avatar', auth, admin, upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: '请选择要上传的图片' });
    }

    const uploadsDir = path.join(__dirname, '../uploads');
    const mbtiAvatarsDir = path.join(uploadsDir, 'mbti-avatars');
    
    if (!fs.existsSync(mbtiAvatarsDir)) {
      fs.mkdirSync(mbtiAvatarsDir, { recursive: true });
    }

    const image = await sharp(req.file.path);
    const metadata = await image.metadata();
    const width = metadata.width;
    const height = metadata.height;
    
    const raw = await image.raw().toBuffer();
    const channels = metadata.channels || 3;
    
    const findSeparatorLines = (size, isHorizontal) => {
      const lines = [];
      const lineLength = isHorizontal ? width : height;
      
      for (let i = Math.floor(size * 0.05); i < Math.floor(size * 0.95); i++) {
        let whitePixels = 0;
        const startIdx = isHorizontal ? i * width * channels : i * channels;
        
        for (let j = 0; j < lineLength; j++) {
          const idx = startIdx + j * (isHorizontal ? channels : width * channels);
          const r = raw[idx];
          const g = raw[idx + 1];
          const b = raw[idx + 2];
          if (r > 245 && g > 245 && b > 245) {
            whitePixels++;
          }
        }
        
        if (whitePixels > lineLength * 0.7) {
          if (lines.length === 0 || i - lines[lines.length - 1] > 10) {
            lines.push(i);
          }
        }
      }
      
      return lines;
    };
    
    const hLines = findSeparatorLines(height, true);
    const vLines = findSeparatorLines(width, false);
    
    const getTileBounds = (row, col) => {
      const hBoundaries = [0, ...hLines, height];
      const vBoundaries = [0, ...vLines, width];
      
      let top = hBoundaries[row] || row * Math.floor(height / 4);
      let bottom = hBoundaries[row + 1] || (row + 1) * Math.floor(height / 4);
      let left = vBoundaries[col] || col * Math.floor(width / 4);
      let right = vBoundaries[col + 1] || (col + 1) * Math.floor(width / 4);
      
      const cellWidth = right - left;
      const cellHeight = bottom - top;
      const margin = Math.floor(Math.min(cellWidth, cellHeight) * 0.10); // 更大的边距，确保去掉边框
      return {
        left: left + margin,
        top: top + margin,
        width: cellWidth - margin * 2,
        height: cellHeight - margin * 2
      };
    };
    
    const isWhitePixel = (r, g, b) => r > 245 && g > 245 && b > 245;
    
    const findContentBounds = (rawTile, tileWidth, tileHeight) => {
      const ch = 3;
      const edgeWidth = Math.floor(Math.min(tileWidth, tileHeight) * 0.12); // 检查边缘区域
      
      // 检查顶部边缘
      let topCut = 0;
      for (let y = 0; y < Math.min(edgeWidth, tileHeight - 1); y++) {
        let whiteCount = 0;
        for (let x = 0; x < tileWidth; x++) {
          const idx = y * tileWidth * ch + x * ch;
          if (isWhitePixel(rawTile[idx], rawTile[idx + 1], rawTile[idx + 2])) {
            whiteCount++;
          }
        }
        if (whiteCount < tileWidth * 0.7) break; // 如果这一行70%以上不是白色，说明到了内容区域
        topCut = y + 1;
      }
      
      // 检查底部边缘
      let bottomCut = 0;
      for (let y = 0; y < Math.min(edgeWidth, tileHeight - 1); y++) {
        const row = tileHeight - 1 - y;
        let whiteCount = 0;
        for (let x = 0; x < tileWidth; x++) {
          const idx = row * tileWidth * ch + x * ch;
          if (isWhitePixel(rawTile[idx], rawTile[idx + 1], rawTile[idx + 2])) {
            whiteCount++;
          }
        }
        if (whiteCount < tileWidth * 0.7) break;
        bottomCut = y + 1;
      }
      
      // 检查左边缘
      let leftCut = 0;
      for (let x = 0; x < Math.min(edgeWidth, tileWidth - 1); x++) {
        let whiteCount = 0;
        for (let y = 0; y < tileHeight; y++) {
          const idx = y * tileWidth * ch + x * ch;
          if (isWhitePixel(rawTile[idx], rawTile[idx + 1], rawTile[idx + 2])) {
            whiteCount++;
          }
        }
        if (whiteCount < tileHeight * 0.7) break;
        leftCut = x + 1;
      }
      
      // 检查右边缘
      let rightCut = 0;
      for (let x = 0; x < Math.min(edgeWidth, tileWidth - 1); x++) {
        const col = tileWidth - 1 - x;
        let whiteCount = 0;
        for (let y = 0; y < tileHeight; y++) {
          const idx = y * tileWidth * ch + col * ch;
          if (isWhitePixel(rawTile[idx], rawTile[idx + 1], rawTile[idx + 2])) {
            whiteCount++;
          }
        }
        if (whiteCount < tileHeight * 0.7) break;
        rightCut = x + 1;
      }
      
      const resultWidth = tileWidth - leftCut - rightCut;
      const resultHeight = tileHeight - topCut - bottomCut;
      
      // 至少保留一些空间
      if (resultWidth < tileWidth * 0.5 || resultHeight < tileHeight * 0.5) {
        return null;
      }
      
      return {
        left: leftCut,
        top: topCut,
        width: resultWidth,
        height: resultHeight
      };
    };
    
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 4; col++) {
        const mbtiType = MBTI_TYPES[row][col];
        const tilePath = path.join(mbtiAvatarsDir, `${mbtiType.toLowerCase()}.png`);
        
        if (fs.existsSync(tilePath)) {
          fs.unlinkSync(tilePath);
        }
        
        const bounds = getTileBounds(row, col);
        
        // 直接裁剪后调整大小，不做额外内容检测
        await image.clone()
          .extract(bounds)
          .resize(200, 200, {
            fit: 'contain',
            background: { r: 240, g: 232, b: 221, alpha: 1 }
          })
          .png()
          .toFile(tilePath);
      }
    }
    
    fs.unlinkSync(req.file.path);

    res.json({ 
      message: 'MBTI头像上传成功',
      detectedHLines: hLines,
      detectedVLines: vLines
    });
  } catch (error) {
    console.error('MBTI avatar upload error:', error);
    res.status(500).json({ message: 'MBTI头像上传失败: ' + error.message });
  }
});

router.get('/mbti-avatar/:type', (req, res) => {
  const type = req.params.type.toLowerCase();
  const avatarPath = path.join(__dirname, '../uploads/mbti-avatars', `${type}.png`);
  if (fs.existsSync(avatarPath)) {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.sendFile(avatarPath);
  } else {
    res.status(404).json({ message: 'MBTI avatar not found' });
  }
});

// 检查网站Logo是否存在
router.get('/logo', async (req, res) => {
  const logoPath = path.join(__dirname, '../uploads/logo.png');
  if (fs.existsSync(logoPath)) {
    res.status(200).json({ exists: true });
  } else {
    res.status(404).json({ exists: false });
  }
});

// 上传网站Logo
router.post('/upload-logo', auth, admin, upload.single('logo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: '请选择要上传的文件' });
    }

    const logoPath = path.join(__dirname, '../uploads/logo.png');

    await sharp(req.file.path)
      .resize(200, 200, { fit: 'inside', withoutEnlargement: true })
      .png()
      .toFile(logoPath);

    if (req.file.path !== logoPath) {
      fs.unlinkSync(req.file.path);
    }

    res.json({ message: 'Logo上传成功！', url: '/uploads/logo.png' });
  } catch (error) {
    console.error('Logo upload error:', error);
    if (req.file && req.file.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ message: 'Logo上传失败: ' + error.message });
  }
});

const EXTERNAL_API_DEFAULTS = {
  aiChat: { apiKey: '', endpoint: 'https://ark.cn-beijing.volces.com/api/v3/chat/completions', model: 'doubao-seed-2-0-pro-260215' },
  newsGeneration: { apiKey: '', endpoint: 'https://ark.cn-beijing.volces.com/api/v3/chat/completions', model: 'doubao-seed-2-0-pro-260215' },
  resumeParse: { apiKey: '', endpoint: 'https://ark.cn-beijing.volces.com/api/v3/chat/completions', model: 'doubao-seed-2-0-pro-260215' },
  textToImage: { apiKey: '', endpoint: 'https://tokenhub.tencentmaas.com/v1/api/image/submit', model: 'hy-image-v3.0' },
};

// 获取全局设置
router.get('/settings', auth, admin, async (req, res) => {
  try {
    const settingsDoc = await Settings.getGlobalSettings();
    const settings = settingsDoc.toObject();

    // 合并缺失的 API 配置默认值
    if (!settings.externalApiConfig) {
      settings.externalApiConfig = { ...EXTERNAL_API_DEFAULTS };
    } else {
      for (const [key, defaults] of Object.entries(EXTERNAL_API_DEFAULTS)) {
        if (!settings.externalApiConfig[key]) {
          settings.externalApiConfig[key] = { ...defaults };
        }
      }
    }

    const envKey = process.env.DEEPSEEK_API_KEY || '';
    if (envKey) {
      for (const key of ['aiChat', 'newsGeneration', 'resumeParse']) {
        if (settings.externalApiConfig[key] && !settings.externalApiConfig[key].apiKey) {
          settings.externalApiConfig[key].apiKey = envKey;
        }
      }
    }
    res.json({ settings });
  } catch (error) {
    console.error('获取设置失败:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 更新全局设置
router.put('/settings', auth, admin, async (req, res) => {
  try {
    const { externalApis, externalApiConfig } = req.body;
    
    const settings = await Settings.getGlobalSettings();
    
    if (externalApis) {
      settings.externalApis = {
        ...settings.externalApis,
        ...externalApis,
      };
    }
    
    if (externalApiConfig) {
      settings.externalApiConfig = {
        ...settings.externalApiConfig,
        ...externalApiConfig,
      };
    }
    
    await settings.save();
    res.json({ message: '设置已更新', settings });
  } catch (error) {
    console.error('更新设置失败:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 获取公共API开关状态（无需管理员权限）
router.get('/settings/public', async (req, res) => {
  try {
    const settings = await Settings.getGlobalSettings();
    res.json({ 
      externalApis: settings.externalApis || {
        aiChat: true,
        newsGeneration: true,
        resumeParse: true,
        mbtiAvatar: true,
      }
    });
  } catch (error) {
    console.error('获取公共设置失败:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 获取API使用统计
router.get('/api-usage/stats', auth, admin, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const { stats, modelStats } = await ApiUsage.getStats({ startDate, endDate });
    const dailyStats = await ApiUsage.getDailyStats({ startDate, endDate });
    
    res.json({ 
      stats, 
      modelStats,
      dailyStats 
    });
  } catch (error) {
    console.error('获取API使用统计失败:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// ==================== 参考内容库 ====================

// 获取参考内容列表（支持搜索和分页）
router.get('/references', auth, admin, async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '', type = '' } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    let query = {};
    if (search) {
      // 使用 MongoDB 全文搜索
      query.$text = { $search: search };
    }
    if (type && ['webpage', 'code', 'design', 'other'].includes(type)) {
      query.type = type;
    }

    const [items, total] = await Promise.all([
      ReferenceClip.find(query, search ? { score: { $meta: 'textScore' } } : {})
        .sort(search ? { score: { $meta: 'textScore' } } : { createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate('createdBy', 'username nickname avatar')
        .lean(),
      ReferenceClip.countDocuments(query)
    ]);

    res.json({
      items,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit))
    });
  } catch (error) {
    // 如果全文搜索索引不存在，回退到正则搜索
    if (error.message && error.message.includes('text index')) {
      try {
        const { page = 1, limit = 20, search = '', type = '' } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        let query = {};
        if (search) {
          const regex = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
          query.$or = [
            { title: regex },
            { content: regex },
            { note: regex },
            { tags: regex },
              { sourceUrl: regex },
              { 'attachments.originalName': regex }
          ];
        }
        if (type && ['webpage', 'code', 'design', 'other'].includes(type)) {
          query.type = type;
        }

        const [items, total] = await Promise.all([
          ReferenceClip.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit))
            .populate('createdBy', 'username nickname avatar')
            .lean(),
          ReferenceClip.countDocuments(query)
        ]);

        return res.json({
          items,
          total,
          page: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit))
        });
      } catch (fallbackError) {
        console.error('参考内容搜索失败:', fallbackError);
        return res.status(500).json({ message: '搜索失败' });
      }
    }
    console.error('获取参考内容列表失败:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 获取单个参考内容
router.get('/references/:id', auth, admin, async (req, res) => {
  try {
    const item = await ReferenceClip.findById(req.params.id)
      .populate('createdBy', 'username nickname avatar')
      .lean();

    if (!item) {
      return res.status(404).json({ message: '参考内容不存在' });
    }

    res.json({ item });
  } catch (error) {
    console.error('获取参考内容失败:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 创建参考内容
router.post('/references', auth, admin, handleReferenceUpload, async (req, res) => {
  try {
    const { title, content, sourceUrl, note, tags, type } = req.body;
    const attachments = buildReferenceAttachments(req.files);

    if (!title || !title.trim()) {
      attachments.forEach(attachment => removeReferenceFile(attachment.storedName));
      return res.status(400).json({ message: '标题不能为空' });
    }
    if ((!content || !content.trim()) && attachments.length === 0) {
      attachments.forEach(attachment => removeReferenceFile(attachment.storedName));
      return res.status(400).json({ message: '请填写内容或上传文件' });
    }

    const clip = await ReferenceClip.create({
      title: title.trim(),
      content: (content || '').trim(),
      attachments,
      sourceUrl: (sourceUrl || '').trim(),
      note: (note || '').trim(),
      tags: normalizeTags(tags),
      type: type || 'webpage',
      createdBy: req.user._id
    });

    res.status(201).json({ message: '参考内容已保存', item: clip });
  } catch (error) {
    buildReferenceAttachments(req.files).forEach(attachment => removeReferenceFile(attachment.storedName));
    console.error('创建参考内容失败:', error);
    res.status(500).json({ message: '保存失败' });
  }
});

// 更新参考内容
router.put('/references/:id', auth, admin, handleReferenceUpload, async (req, res) => {
  try {
    const { title, content, sourceUrl, note, tags, type } = req.body;
    const newAttachments = buildReferenceAttachments(req.files);
    const removedAttachmentIds = normalizeIdList(req.body.removedAttachmentIds);

    const clip = await ReferenceClip.findById(req.params.id);
    if (!clip) {
      return res.status(404).json({ message: '参考内容不存在' });
    }

    if (title !== undefined) clip.title = title.trim();
    if (content !== undefined) clip.content = content.trim();
    if (sourceUrl !== undefined) clip.sourceUrl = (sourceUrl || '').trim();
    if (note !== undefined) clip.note = (note || '').trim();
    if (tags !== undefined) clip.tags = normalizeTags(tags);
    if (type !== undefined) clip.type = type;
    const removedIdSet = new Set(removedAttachmentIds);
    const keptAttachments = clip.attachments.filter(attachment => !removedIdSet.has(attachment._id.toString()));
    if (!clip.title || !clip.title.trim()) {
      newAttachments.forEach(attachment => removeReferenceFile(attachment.storedName));
      return res.status(400).json({ message: '标题不能为空' });
    }
    if ((!clip.content || !clip.content.trim()) && keptAttachments.length + newAttachments.length === 0) {
      newAttachments.forEach(attachment => removeReferenceFile(attachment.storedName));
      return res.status(400).json({ message: '请填写内容或上传文件' });
    }
    clip.attachments.forEach((attachment) => {
      if (removedIdSet.has(attachment._id.toString())) {
        removeReferenceFile(attachment.storedName);
      }
    });
    clip.attachments = keptAttachments;
    if (newAttachments.length > 0) {
      clip.attachments.push(...newAttachments);
    }

    await clip.save();

    res.json({ message: '参考内容已更新', item: clip });
  } catch (error) {
    buildReferenceAttachments(req.files).forEach(attachment => removeReferenceFile(attachment.storedName));
    console.error('更新参考内容失败:', error);
    res.status(500).json({ message: '更新失败' });
  }
});

// 下载参考内容附件
router.get('/references/:id/attachments/:attachmentId/download', auth, admin, async (req, res) => {
  try {
    const clip = await ReferenceClip.findById(req.params.id);
    if (!clip) {
      return res.status(404).json({ message: '参考内容不存在' });
    }

    const attachment = clip.attachments.id(req.params.attachmentId);
    if (!attachment) {
      return res.status(404).json({ message: '附件不存在' });
    }

    const filePath = path.join(referenceFileDir, path.basename(attachment.storedName));
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: '文件不存在' });
    }

    res.download(filePath, attachment.originalName);
  } catch (error) {
    console.error('下载参考内容附件失败:', error);
    res.status(500).json({ message: '下载失败' });
  }
});

// 删除参考内容
router.delete('/references/:id', auth, admin, async (req, res) => {
  try {
    const clip = await ReferenceClip.findByIdAndDelete(req.params.id);
    if (!clip) {
      return res.status(404).json({ message: '参考内容不存在' });
    }
    clip.attachments.forEach(attachment => removeReferenceFile(attachment.storedName));

    res.json({ message: '参考内容已删除' });
  } catch (error) {
    console.error('删除参考内容失败:', error);
    res.status(500).json({ message: '删除失败' });
  }
});

module.exports = router;

const express = require('express');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');
const { auth } = require('../middleware/auth');
const { admin } = require('../middleware/admin');
const upload = require('../middleware/upload');
const Settings = require('../models/Settings');
const ApiUsage = require('../models/ApiUsage');

const router = express.Router();

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

// 获取全局设置
router.get('/settings', auth, admin, async (req, res) => {
  try {
    const settingsDoc = await Settings.getGlobalSettings();
    const settings = settingsDoc.toObject();
    const envKey = process.env.DEEPSEEK_API_KEY || '';
    if (settings.externalApiConfig && envKey) {
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

module.exports = router;

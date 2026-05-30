const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const router = express.Router();

const upload = multer({
  dest: path.join(__dirname, '../temp'),
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error('只允许上传图片文件'));
  }
});

router.post('/', upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: '没有上传文件' });
    }
    const tempPath = req.file.path;
    const targetPath = path.join(__dirname, '../../client/public/mbti-avatars.jpg');
    fs.renameSync(tempPath, targetPath);
    res.json({ message: '上传成功！文件已保存到 public/mbti-avatars.jpg' });
  } catch (error) {
    console.error('上传错误:', error);
    res.status(500).json({ message: '上传失败: ' + error.message });
  }
});

const tempDir = path.join(__dirname, '../temp');
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir);
}

module.exports = router;

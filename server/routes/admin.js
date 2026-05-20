const express = require('express');
const path = require('path');
const fs = require('fs');
const { auth } = require('../middleware/auth');
const { admin } = require('../middleware/admin');
const upload = require('../middleware/upload');

const router = express.Router();

router.post('/upload-logo', auth, admin, upload.single('logo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: '请选择要上传的图片' });
    }

    const uploadsDir = path.join(__dirname, '../uploads');
    const logoDestPath = path.join(uploadsDir, 'logo.png');
    
    if (fs.existsSync(logoDestPath)) {
      fs.unlinkSync(logoDestPath);
    }

    fs.renameSync(req.file.path, logoDestPath);

    res.json({ 
      message: 'Logo上传成功',
      logoUrl: '/uploads/logo.png'
    });
  } catch (error) {
    console.error('Logo upload error:', error);
    res.status(500).json({ message: 'Logo上传失败' });
  }
});

router.get('/logo', (req, res) => {
  const logoPath = path.join(__dirname, '../uploads/logo.png');
  if (fs.existsSync(logoPath)) {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.sendFile(logoPath);
  } else {
    res.status(404).json({ message: 'Logo not found' });
  }
});

module.exports = router;

const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { execFile } = require('child_process');

const router = express.Router();

const pdfUpload = multer({
  dest: '/tmp/pdf-convert',
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf' || file.originalname.endsWith('.pdf')) {
      cb(null, true);
    } else {
      cb(new Error('仅支持 PDF 文件'));
    }
  },
});

const imageUpload = multer({
  dest: '/tmp/img-convert',
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['image/png', 'image/jpeg', 'image/webp', 'image/bmp', 'image/tiff'];
    if (allowed.includes(file.mimetype) || /\.(png|jpe?g|webp|bmp|tiff?)$/i.test(file.originalname)) {
      cb(null, true);
    } else {
      cb(new Error('仅支持图片文件 (PNG/JPG/WebP/BMP/TIFF)'));
    }
  },
});

/**
 * POST /api/convert/pdf-to-docx
 * Convert PDF to editable Word document using LibreOffice
 */
router.post('/pdf-to-docx', pdfUpload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: '请上传 PDF 文件' });
  }

  const pdfPath = req.file.path;
  const outDir = '/tmp/pdf-convert-out';
  const baseName = path.basename(req.file.originalname, '.pdf');

  try {
    // Ensure output directory exists
    if (!fs.existsSync(outDir)) {
      fs.mkdirSync(outDir, { recursive: true });
    }

    // Run pdf2docx Python script (reliable, no background process)
    await new Promise((resolve, reject) => {
      execFile(
        'python3',
        [
          path.join(__dirname, '..', 'scripts', 'pdf2docx_convert.py'),
          pdfPath,
          path.join(outDir, baseName + '.docx'),
        ],
        { timeout: 120000, maxBuffer: 1024 * 1024 },
        (err, stdout, stderr) => {
          if (err) {
            reject(new Error(stderr || err.message));
          } else {
            resolve(stdout);
          }
        }
      );
    });

    const docxPath = path.join(outDir, baseName + '.docx');

    if (!fs.existsSync(docxPath)) {
      throw new Error('转换失败：未生成 DOCX 文件');
    }

    // Send the DOCX file
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(baseName + '.docx')}`);
    const stream = fs.createReadStream(docxPath);
    stream.pipe(res);

    // Cleanup after response
    stream.on('end', () => {
      try { fs.unlinkSync(pdfPath); } catch {}
      try { fs.unlinkSync(docxPath); } catch {}
    });

  } catch (err) {
    console.error('PDF to DOCX error:', err.message);
    // Cleanup
    try { fs.unlinkSync(pdfPath); } catch {}
    res.status(500).json({ error: 'PDF 转换失败: ' + err.message });
  }
});

/**
 * POST /api/convert/image-to-docx
 * Convert image to editable Word document using PaddleOCR Online API (layout-preserving)
 */
router.post('/image-to-docx', imageUpload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: '请上传图片文件' });
  }

  const imgPath = req.file.path;
  const baseName = path.basename(req.file.originalname, path.extname(req.file.originalname));
  const outDir = '/tmp/img-convert-out';
  const docxPath = path.join(outDir, baseName + '.docx');

  try {
    if (!fs.existsSync(outDir)) {
      fs.mkdirSync(outDir, { recursive: true });
    }

    // Call PaddleOCR API Python script
    await new Promise((resolve, reject) => {
      execFile(
        'python3',
        [
          path.join(__dirname, '..', 'scripts', 'paddle_api_convert.py'),
          imgPath,
          docxPath,
        ],
        { timeout: 300000, maxBuffer: 1024 * 1024 },
        (err, stdout, stderr) => {
          if (err) {
            reject(new Error(stderr || err.message));
          } else {
            resolve(stdout);
          }
        }
      );
    });

    if (!fs.existsSync(docxPath)) {
      throw new Error('转换失败：未生成 DOCX 文件');
    }

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(baseName + '.docx')}`);
    const stream = fs.createReadStream(docxPath);
    stream.pipe(res);

    stream.on('end', () => {
      try { fs.unlinkSync(imgPath); } catch {}
      try { fs.unlinkSync(docxPath); } catch {}
    });

  } catch (err) {
    console.error('Image to DOCX error:', err.message);
    try { fs.unlinkSync(imgPath); } catch {}
    res.status(500).json({ error: '图片转 Word 失败: ' + err.message });
  }
});

/**
 * POST /api/convert/remove-bg
 * Remove image background using rembg (AI-based, local)
 */
router.post('/remove-bg', imageUpload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: '请上传图片文件' });
  }

  const imgPath = req.file.path;
  const outDir = '/tmp/img-convert-out';
  const outPath = path.join(outDir, 'nobg_' + Date.now() + '.png');

  try {
    if (!fs.existsSync(outDir)) {
      fs.mkdirSync(outDir, { recursive: true });
    }

    await new Promise((resolve, reject) => {
      execFile(
        'python3',
        [
          path.join(__dirname, '..', 'scripts', 'rembg_convert.py'),
          imgPath,
          outPath,
        ],
        { timeout: 120000, maxBuffer: 1024 * 1024 },
        (err, stdout, stderr) => {
          if (err) {
            reject(new Error(stderr || err.message));
          } else {
            resolve(stdout);
          }
        }
      );
    });

    if (!fs.existsSync(outPath)) {
      throw new Error('处理失败：未生成输出文件');
    }

    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Content-Disposition', 'inline; filename="nobg.png"');
    const stream = fs.createReadStream(outPath);
    stream.pipe(res);

    stream.on('end', () => {
      try { fs.unlinkSync(imgPath); } catch {}
      try { fs.unlinkSync(outPath); } catch {}
    });

  } catch (err) {
    console.error('Remove BG error:', err.message);
    try { fs.unlinkSync(imgPath); } catch {}
    res.status(500).json({ error: '背景去除失败: ' + err.message });
  }
});

module.exports = router;

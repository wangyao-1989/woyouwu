const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const pdfParse = require('pdf-parse');
const { auth } = require('../middleware/auth');

const router = express.Router();

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || '';
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';

const resumeStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads/resumes');
    fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const { v4: uuidv4 } = require('uuid');
    cb(null, `resume_${uuidv4()}${ext}`);
  }
});

const resumeUpload = multer({
  storage: resumeStorage,
  fileFilter: (req, file, cb) => {
    const allowed = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('仅支持 PDF、JPG、PNG、WebP 格式'), false);
    }
  },
  limits: { fileSize: 10 * 1024 * 1024 }
});

const RESUME_PARSE_PROMPT = `你是一个专业的简历解析助手。请根据以下简历文本，提取并生成结构化的简历数据。

简历内容：
{{content}}

请返回一个严格的 JSON 对象（不要包含 markdown 代码块标记，只返回纯 JSON），包含以下字段：

{
  "realName": "真实姓名",
  "bio": "一句话简介，限60字，务必精炼有力。要求：提炼「职业/身份 + 核心亮点/成就 + 年限」三个要素。例如：「全栈工程师，8年Web开发经验，主导过千万DAU产品的架构设计」「产品经理，专注B端SaaS领域5年，从0到1打造过营收过亿的产品线」",
  "skills": ["技能1", "技能2"...] 最多8个技能标签,
  "interests": ["兴趣1", "兴趣2"...] 最多6个兴趣标签,
  "experience": [
    {
      "period": "时间段，如 2020-2023 或 2022.06-2023.12",
      "organization": "公司/机构/项目名称",
      "position": "岗位/职位名称，如前端开发工程师、产品经理、UI设计师",
      "description": "简要描述工作和成果，限80字"
    }
  ],
  "education": [
    {
      "school": "学校名称",
      "major": "专业名称",
      "degree": "学历层次，如本科/硕士/博士/大专",
      "period": "时间段，如2014-2018"
    }
  ],
  "socialLinks": {
    "github": "GitHub 用户名或链接",
    "wechat": "微信号"
  },
  "contactEmail": "邮箱",
  "location": "所在城市"
}

请确保返回的是合法的 JSON，不要有任何说明文字。`;

async function callDeepSeekParse(content) {
  const prompt = RESUME_PARSE_PROMPT.replace('{{content}}', content);

  const response = await fetch(DEEPSEEK_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: '你是一个专业的简历数据提取助手。你只返回严格的 JSON，不包含任何 markdown 标记或说明文字。' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.3,
      max_tokens: 2000
    })
  });

  if (!response.ok) {
    throw new Error('DeepSeek API returned ' + response.status);
  }

  const data = await response.json();
  const rawContent = data.choices?.[0]?.message?.content || '';

  const cleaned = rawContent
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/, '')
    .trim();

  const resumeData = JSON.parse(cleaned);

  if (resumeData.experience && !Array.isArray(resumeData.experience)) resumeData.experience = [];
  if (resumeData.education && !Array.isArray(resumeData.education)) resumeData.education = [];
  if (resumeData.skills && !Array.isArray(resumeData.skills)) resumeData.skills = [];
  if (resumeData.interests && !Array.isArray(resumeData.interests)) resumeData.interests = [];

  return resumeData;
}

router.post('/parse-resume-file', auth, (req, res, next) => {
  resumeUpload.single('file')(req, res, (err) => {
    if (err) {
      console.error('Multer error:', err.message);
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ message: '文件大小不能超过 10MB' });
      }
      return res.status(400).json({ message: '文件上传失败：' + err.message });
    }
    next();
  });
}, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: '请上传简历文件' });
    }

    if (!DEEPSEEK_API_KEY) {
      return res.status(500).json({ message: 'AI 服务未配置 API Key' });
    }

    const filePath = req.file.path;
    const mimeType = req.file.mimetype;
    let extractedText = '';

    if (mimeType === 'application/pdf') {
      const dataBuffer = fs.readFileSync(filePath);
      const pdfData = await pdfParse(dataBuffer);
      extractedText = pdfData.text;
    } else {
      const imageBuffer = fs.readFileSync(filePath);
      const base64 = imageBuffer.toString('base64');
      const visionResponse = await fetch(DEEPSEEK_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [
            {
              role: 'system',
              content: '你是一个OCR文字识别助手。请提取图片中所有文字内容，保持原始格式和顺序。只返回提取的文字，不要添加任何说明。'
            },
            {
              role: 'user',
              content: [
                { type: 'text', text: '请提取这张简历图片中的所有文字。' },
                {
                  type: 'image_url',
                  image_url: {
                    url: `data:${mimeType};base64,${base64}`
                  }
                }
              ]
            }
          ],
          max_tokens: 4000
        })
      });

      if (!visionResponse.ok) {
        throw new Error('Vision API failed: ' + visionResponse.status);
      }

      const visionData = await visionResponse.json();
      extractedText = visionData.choices?.[0]?.message?.content || '';
    }

    fs.unlinkSync(filePath);

    if (!extractedText || extractedText.trim().length < 10) {
      return res.status(400).json({ message: '未能识别出足够的文本内容，请确保上传的是文字清晰的简历' });
    }

    const resumeData = await callDeepSeekParse(extractedText);
    res.json({ resume: resumeData, rawText: extractedText });
  } catch (error) {
    if (req.file?.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    console.error('Parse resume file error:', error.message);
    console.error('Full error:', error);
    if (error.message?.includes('DeepSeek API')) {
      return res.status(502).json({ message: 'AI 服务调用失败，请稍后重试' });
    }
    if (error instanceof SyntaxError) {
      return res.status(500).json({ message: 'AI 返回数据格式异常，请稍后重试' });
    }
    res.status(500).json({ message: '简历解析失败：' + (error.message || '未知错误') });
  }
});

router.post('/generate-resume', auth, async (req, res) => {
  try {
    const { description } = req.body;

    if (!description || description.trim().length < 10) {
      return res.status(400).json({ message: '请至少输入10个字的描述' });
    }

    if (!DEEPSEEK_API_KEY) {
      return res.status(500).json({ message: 'AI 服务未配置 API Key，请在 .env 中设置 DEEPSEEK_API_KEY' });
    }

    const resumeData = await callDeepSeekParse(`用户对自己的一段描述（非正式简历格式），请从以下描述中提取简历信息：\n\n${description}`);

    res.json({ resume: resumeData });
  } catch (error) {
    console.error('AI generate resume error:', error);
    if (error.message.includes('DeepSeek API')) {
      return res.status(502).json({ message: 'AI 服务调用失败，请稍后重试' });
    }
    res.status(500).json({ message: '服务器错误' });
  }
});

module.exports = router;
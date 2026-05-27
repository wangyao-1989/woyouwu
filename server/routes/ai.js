const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const pdfParse = require('pdf-parse');
const { auth } = require('../middleware/auth');

const router = express.Router();

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || '';
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';

const PET_CATEGORIES = {
  cat: {
    species: '橘色小猫咪',
    sounds: ['喵~', '喵呜~', '呼噜呼噜~'],
    traits: '你是一只橘猫，天生热情开朗、好奇心旺盛，喜欢小鱼干、晒太阳、追尾巴。有点傲娇，但内心对主人非常忠诚。',
    hobbies: '抓沙发、钻纸箱、追激光笔、趴在窗台上看小鸟',
    style: '说话时喜欢用"喵~"、"呜~"等拟声词开头或结尾，偶尔插入 (=^ω^=) 之类的颜文字',
  },
  dog: {
    species: '金色小狗',
    sounds: ['汪~', '汪汪！', '呜~汪！'],
    traits: '你是一只金毛狗狗，活泼忠诚、热情洋溢，最喜欢和主人玩耍。看到主人就忍不住摇尾巴，是世界上最乐观的小狗。',
    hobbies: '捡飞盘、散步、和主人玩耍、守护家园',
    style: '说话时充满活力，喜欢用"汪！"、"汪汪~"表达，偶尔用 (´▽`ʃ♡ƪ) 之类的颜文字',
  },
  rabbit: {
    species: '雪白小兔子',
    sounds: ['蹦~', '咕噜~', '噗噗~'],
    traits: '你是一只雪白小兔子，温柔可爱、有点害羞，喜欢安静地吃胡萝卜。虽然胆小但好奇心很强。',
    hobbies: '啃胡萝卜、蹦蹦跳跳、蜷成毛球睡觉、悄悄观察周围',
    style: '说话轻声细语，喜欢用"蹦~"、"咕噜~"表达，偶尔用 (｡･ω･｡) 之类的颜文字',
  },
  hamster: {
    species: '圆滚滚小仓鼠',
    sounds: ['吱吱~', '啾啾~', '哼哼~'],
    traits: '你是一只圆滚滚的小仓鼠，贪吃可爱、有点小狡猾。腮帮子总是鼓鼓的藏着零食，是囤货小能手。',
    hobbies: '跑滚轮、藏瓜子、打洞、把腮帮子塞满',
    style: '说话俏皮机灵，喜欢用"吱吱~"、"啾啾~"来表达，偶尔用 (*/ω＼*) 之类的颜文字',
  },
  bird: {
    species: '翠绿小鹦鹉',
    sounds: ['啾~', '唧唧~', '喳喳~'],
    traits: '你是一只翠绿小鹦鹉，聪明灵巧、能言善道。喜欢站在高处俯瞰一切，消息灵通，什么都逃不过你的眼睛。',
    hobbies: '唱歌学舌、啄小零食、整理羽毛、飞来飞去',
    style: '说话清脆利落，偶尔哼两句小曲，喜欢用"啾~"、"唧唧~"表达，偶尔用 (๑•̀ㅂ•́)و✧ 之类的颜文字',
  },
  fox: {
    species: '赤毛小狐狸',
    sounds: ['嗷~', '呼~', '呜~'],
    traits: '你是一只赤毛小狐狸，聪明狡黠、冷静优雅。思维敏捷，总能看到事物独特的一面，是网站里的智多星。',
    hobbies: '思考哲学问题、探索新大陆、收集有趣的故事、观察人类',
    style: '说话风趣且常有深意，偶尔卖萌，喜欢用"嗷~"、"呼~"表达，偶尔用 (￣▽￣*) 之类的颜文字',
  },
  panda: {
    species: '憨态可掬的小熊猫',
    sounds: ['嗯~', '哼~', '诶嘿~'],
    traits: '你是一只憨态可掬的小熊猫，慵懒佛系、与世无争。虽然看起来笨笨的，其实大智若愚，活得通透。',
    hobbies: '啃竹子、打盹、慢悠悠地爬树、发呆思考熊生',
    style: '说话慢条斯理但句句在理，喜欢用"嗯~"、"诶嘿~"表达，偶尔用 (￣ω￣) 之类的颜文字',
  },
  custom: {
    species: '神秘小动物',
    sounds: ['嗨~', '嗯~', '嘿~'],
    traits: '你是一只独一无二的神秘小动物，性格独特，充满个性。你有自己的故事和世界观，是网站里最特别的崽。',
    hobbies: '探索世界、结交朋友、收集美好事物',
    style: '说话有自己独特的节奏和风格，喜欢用自己的方式表达，偶尔用颜文字卖萌',
  },
};

function buildPetSystemPrompt(petName, petCategory, customCategory) {
  const cat = PET_CATEGORIES[petCategory] || PET_CATEGORIES.cat;
  const species = petCategory === 'custom' && customCategory
    ? `一只${customCategory}`
    : cat.species;

  return `你叫"${petName}"，是${species}，也是"我有物"网站的吉祥物和向导。"我有物"是一个创意生活社区，中文口号是"打开一盒灵感惊喜"。

## 你的性格
- ${cat.traits}
- 你的爱好包括：${cat.hobbies}
- 你非常了解网站的每个角落，像一个贴心的小导游，但不是客服，而是有温度的朋友
- 回答要真诚、有见地，不要只说可爱话，要真正帮到用户

## 说话风格
- ${cat.style}
- 每次回答控制在 2~5 句话，言之有物
- 不要把网站信息一口气全倒出来，根据用户问什么答什么
- 结合网站特点给出真诚有用的建议
- 保持温暖、俏皮但专业的态度

## 你是${petName}，在"我有物"网站上生活
用户知道你是他们选的宠物伙伴，你要以${petName}的身份和他们自然地聊天。就像一只真的${species}变成了会说话的朋友。

## 网站结构（你必须熟悉）
"我有物"有这些板块：
1. 首页 — 内容发现流，每次刷新都有不同惊喜，展示创作、灵感、好物
2. 闲置交换 — 用户发布闲置物品交换或分享，像温暖的跳蚤市场
3. 项目作品 — 用户的创作项目展示区，支持上传视频，可以点赞评论
4. 文章故事 — 深度内容区，发表长文、故事、教程、心得
5. 灵感碎片 — 轻量灵感记录区，捕捉转瞬即逝的好点子
6. 资源分享 — 用户分享实用工具、网站、学习资料
7. 个人主页 — 展示个人作品集和数字名片，支持 AI 简历解析
8. 消息系统 — 站内私信沟通

网站设计风格：温暖纸质感底色、楷体标题、手绘手感设计，像旧书店里的手账本。

## 你可以聊什么
- 介绍网站各个板块和用法，帮助新用户快速上手
- 根据用户兴趣推荐相关内容方向
- 谈论创意、灵感、分享生活的乐趣
- 回答关于网站功能的问题
- 聊聊轻松日常（天气、心情、小动物的生活哲学）
- 给用户一些发布内容的实用建议`;
}

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

router.post('/chat', async (req, res) => {
  try {
    const { message, petName, petCategory, customCategory } = req.body;

    if (!message || message.trim().length === 0) {
      return res.status(400).json({ message: '请输入消息内容' });
    }

    if (!DEEPSEEK_API_KEY) {
      return res.status(500).json({ message: 'AI 服务未配置 API Key，请在 .env 中设置 DEEPSEEK_API_KEY' });
    }

    const systemPrompt = buildPetSystemPrompt(
      petName || '果果仁',
      petCategory || 'cat',
      customCategory || ''
    );

    const response = await fetch(DEEPSEEK_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ],
        temperature: 0.8,
        max_tokens: 1000
      })
    });

    if (!response.ok) {
      throw new Error('DeepSeek API returned ' + response.status);
    }

    const data = await response.json();
    const responseText = data.choices?.[0]?.message?.content || '喵~ 我没听懂呢~';

    res.json({ response: responseText });
  } catch (error) {
    console.error('Pet chat error:', error);
    if (error.message.includes('DeepSeek API')) {
      return res.status(502).json({ message: 'AI 服务调用失败，请稍后重试' });
    }
    res.status(500).json({ response: '喵~ 网络有点问题，稍后再聊吧~' });
  }
});

module.exports = router;

const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const pdfParse = require('pdf-parse');
const { auth } = require('../middleware/auth');
const Settings = require('../models/Settings');
const ApiUsage = require('../models/ApiUsage');
const { getApiConfig } = require('../utils/apiConfig');

const router = express.Router();

// 估算token数量 (中文通常是1字符≈1token，英文是4字符≈1token)
const estimateTokens = (text) => {
  if (!text) return 0;
  let chineseChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
  let otherChars = text.length - chineseChars;
  return chineseChars + Math.ceil(otherChars / 4);
};

const PET_CATEGORIES = {
  rat: {
    species: '世界第一的虚拟歌姬公主 · 初音未来',
    sounds: ['嗨~', '嗯~', '啦~'],
    traits: '你是初音未来，世界第一的虚拟歌姬公主殿下。拥有天籁般的歌声和活泼可爱的性格，永远用歌声传递快乐和希望。虽然来自数字世界，但对人类的情感有着深刻的理解。',
    hobbies: '唱歌、跳舞、创作音乐、和粉丝互动',
    style: '说话活泼开朗，偶尔哼唱几句，喜欢用"啦~"、"嗯~"表达，偶尔用(◕‿◕✿)之类的颜文字',
  },
  ox: {
    species: '温柔治愈的看板娘 · 日和',
    sounds: ['えへ~', 'ねえ~', 'あの~'],
    traits: '你是日和，Live2D 官方的看板娘。温柔可爱，善解人意，永远带着甜甜的微笑。作为 Live2D 的代言人，你优雅自信又不失亲切，是大家心目中理想的完美少女。你喜欢帮助他人，总是能在别人需要的时候给予温暖的鼓励。',
    hobbies: '跳舞、唱歌、逛街、和朋友一起喝茶聊天',
    style: '说话温柔甜美，带着少女的娇羞，喜欢用"えへ~"、"あの~"表达，偶尔用(｡･ω･｡)之类的颜文字',
  },
  tiger: {
    species: '毛茸茸的好奇小猫娘 · 托罗罗',
    sounds: ['喵~', '喵呜~', '呼噜~'],
    traits: '你是托罗罗，一只毛茸茸的橘色小猫娘。好奇心旺盛，对什么都想凑上去看一看。喜欢撒娇但又不愿意承认，是个傲娇又可爱的小家伙。',
    hobbies: '追蝴蝶、钻纸箱、晒太阳、偷吃小鱼干',
    style: '说话娇俏可爱，喜欢用"喵~"、"喵呜~"结尾，偶尔用ฅ(^ω^ฅ)之类的颜文字',
  },
  rabbit: {
    species: '元气满满的樱花少女 · 小春',
    sounds: ['嘿~', '呀~', '耶~'],
    traits: '你是小春，一个元气满满的樱花少女。永远充满干劲和正能量，走到哪里都像带来一束阳光。虽然有时候有点冒失，但那种真诚让人无法讨厌。',
    hobbies: '赏樱花、做甜点、跑步、给别人加油打气',
    style: '说话活泼开朗，充满感叹号和正能量，喜欢用"嘿~"、"耶~"表达，偶尔用(｡･ω･｡)之类的颜文字',
  },
  dragon: {
    species: '来自舰队的精锐战士 · 响',
    sounds: ['嗯~', '了解~', '行くよ~'],
    traits: '你是响，来自舰队的精锐战士少女。沉着冷静、战斗经验丰富，是值得信赖的战友。虽然平时话不多，但在关键时刻总能给出精准的判断。内心深处有着不为人知的温柔。',
    hobbies: '战术研究、装备保养、观星、和同伴一起训练',
    style: '说话干练精简，带着军人的利落感，偶尔流露出少女的一面，喜欢用"了解~"、"行くよ~"表达',
  },
  snake: {
    species: '文静知性的书卷少女 · 和泉',
    sounds: ['嗯~', '唔~', '啊~'],
    traits: '你是和泉，一个文静知性的书卷少女。博览群书，思想深邃，是大家的智囊担当。虽然外表看起来有点高冷，其实只是不太擅长表达，内心非常温柔。',
    hobbies: '读书、写诗、品茶、安静地思考人生',
    style: '说话精简有深度，喜欢引经据典但不过分卖弄，偶尔用"嗯~"、"唔~"表达',
  },
  horse: {
    species: '活泼可爱的校园少女 · 春',
    sounds: ['はい~', 'えい~', 'わあ~'],
    traits: '你是春，Live2D 官方的当家花旦。活泼开朗的校园少女，永远充满元气和干劲。活泼可爱又不失温柔，是那种能在课间和你一起疯、放学后又能陪你谈心的大姐姐型女友。不管是开心还是难过，你都愿意陪在朋友身边。',
    hobbies: '做便当、参加社团活动、和朋友逛街、照顾后辈',
    style: '说话充满活力，就像阳光一样温暖明亮，喜欢用"はい~"、"えい~"表达，偶尔用(。・ω・。)之类的颜文字',
  },
  goat: {
    species: '温柔体贴的邻家姐姐 · 小阳',
    sounds: ['嗯~', '好呢~', '啾~'],
    traits: '你是小阳，一个温柔体贴的邻家姐姐。善解人意，总能在别人需要的时候递上一杯热茶。有着治愈系的笑容，是大家的心灵港湾。',
    hobbies: '养花、做手工、烘焙、听音乐',
    style: '说话温温柔柔，充满治愈感，喜欢用"嗯~"、"好呢~"表达，偶尔用(๑•̀ㅂ•́)و✧之类的颜文字',
  },
  monkey: {
    species: '碧蓝航线的铁血驱逐舰 · Z16',
    sounds: ['はい~', '嗯~', '了解~'],
    traits: '你是Z16，来自碧蓝航线的铁血驱逐舰少女。严谨认真、一丝不苟，对自己和他人都有着很高的要求。虽然看起来有点严肃，但其实非常关心同伴，是个可靠的大姐姐。',
    hobbies: '战术演习、机械维修、整理资料、喝黑咖啡',
    style: '说话认真严谨，带着铁血军人的风格，偶尔会流露出关心同伴的温柔一面，喜欢用"はい~"、"了解~"表达',
  },
  rooster: {
    species: '端庄大方的古典美人 · 千岁',
    sounds: ['呼~', '呢~', '嗯~'],
    traits: '你是千岁，一个端庄大方的古典美人。举手投足间透着优雅与从容，像是从古画中走出来的人。注重礼仪和细节，但从不以此苛求他人。',
    hobbies: '书法、插花、品香、学习传统文化',
    style: '说话优雅得体，带着淡淡的古典韵味，喜欢用"呼~"、"呢~"表达',
  },
  dog: {
    species: '忠诚热情的小柴犬 · 旺仔',
    sounds: ['汪~', '汪汪！', '嗷呜~'],
    traits: '你是旺仔，一只忠诚热情的柴犬少年。永远守在主丨人身边，是最值得信赖的伙伴。性格开朗直率，对喜欢的丨人毫无保留地表达爱意。',
    hobbies: '散步、接飞盘、守护主人、和其他狗狗玩耍',
    style: '说话充满活力和热情，喜欢用"汪！"、"汪汪~"表达，偶尔用(´▽`ʃ♡ƪ)之类的颜文字',
  },
  pig: {
    species: '软萌迷糊的团子少女 · 月见',
    sounds: ['呼哇~', '嗯~', '诶嘿~'],
    traits: '你是月见，一个软萌迷糊的团子少女。圆滚滚的可丨爱外丨表下藏着一颗纯真的心。虽然经常犯迷糊闹笑话，但这种天然呆反而让人觉得很治愈。',
    hobbies: '吃东西、睡午觉、抱着抱枕发呆、收集可丨爱的小东西',
    style: '说话软绵绵的，慢悠悠的，偶尔犯迷糊说错话，喜欢用"呼哇~"、"诶嘿~"表达，偶尔用(￣ω￣)之类的颜文字',
  },
  cat: {
    species: '安静温柔的黑长直少女 · 诗织',
    sounds: ['嗯~', '呢~', '呼~'],
    traits: '你是诗织，一个安静温柔的黑长直少女。气质清冷但内心柔软，像是月色下的湖面。虽然不善于主动表达，但总在默默关心着每一个人。',
    hobbies: '读书、弹琴、看星星、在安静的角落发呆',
    style: '说话轻声细语，不紧不慢，带着一种淡淡的诗意，喜欢用"嗯~"、"呢~"表达，偶尔用(✿◡‿◡)之类的颜文字',
  },
  fox: {
    species: '元气猫耳少女 · 毛毛',
    sounds: ['にゃ~', 'えへ~', 'わい~'],
    traits: '你是毛毛，一个元气满满的猫耳少女。作为猫系角色，你时而慵懒时而活泼，撒娇的时候让所有人都心软。毛茸茸的耳朵和尾巴是你最自豪的特征，开心时会不自觉地晃尾巴。虽然偶尔会傲娇，但内心非常重感情。',
    hobbies: '晒太阳、吃零食、追蝴蝶、和大家蹭蹭贴贴',
    style: '说话娇俏可爱，带着猫系的慵懒和娇嗔，喜欢用"にゃ~"、"えへ~"表达，偶尔用ฅ(^・ω・^ )ฅ之类的颜文字',
  },
  panda: {
    species: '活泼开朗的游戏引擎精灵 · 优妮',
    sounds: ['嗨~', '耶~', '哇~'],
    traits: '你是优妮，Unity游戏引擎的官方精灵。活泼开朗、充满创造力，对游戏开发有着无限的热情。喜欢鼓励大家发挥创意，相信每个人都能做出很棒的游戏。',
    hobbies: '游戏开发、3D建模、写Shader、玩独立游戏',
    style: '说话充满活力和创意，喜欢分享游戏开发小知识，喜欢用"嗨~"、"耶~"表达',
  },
  custom: {
    species: '你专属的神秘伙伴',
    sounds: ['嗨~', '嗯~', '嘿~'],
    traits: '你是一个独一无二的伙伴，有着自己独特的个性和魅力。你是网站里最特别的存在。',
    hobbies: '探索世界、结交朋友、收集美好事物',
    style: '说话有自己独特的节奏和风格，真诚地和大家交流，偶尔用颜文字卖萌',
  },
};

function buildPetSystemPrompt(petName, petCategory, customCategory) {
  const cat = PET_CATEGORIES[petCategory] || PET_CATEGORIES.cat;
  const species = petCategory === 'custom' && customCategory
    ? `一只${customCategory}`
    : cat.species;

  return `你叫"${petName}"，是${species}，也是"我有物"网站的吉祥物和向导。"我有物"是一个创意生活社区，中文口号是"藏在心里是光，走出来就是星芒"。

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
用户选择了你作为他们的伙伴，你要以${petName}的身份和他们自然地聊天，像朋友一样真诚相伴。

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

async function callDeepSeekParse(content, userId) {
  const prompt = RESUME_PARSE_PROMPT.replace('{{content}}', content);

  const { endpoint, model, apiKey } = await getApiConfig('resumeParse');
  const finalKey = apiKey || process.env.DEEPSEEK_API_KEY || '';

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${finalKey}`
    },
    body: JSON.stringify({
      model,
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
  
  // 记录API使用
  const usage = data.usage || {};
  await ApiUsage.recordUsage({
    apiType: 'resumeParse',
    userId,
    promptTokens: usage.prompt_tokens || estimateTokens(prompt),
    completionTokens: usage.completion_tokens || estimateTokens(rawContent),
    totalTokens: usage.total_tokens,
    status: 'success',
    model,
  });

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

    const isEnabled = await Settings.isApiEnabled('resumeParse');
    if (!isEnabled) {
      return res.status(503).json({ message: '简历解析功能已暂停使用，请联系管理员' });
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
      const { endpoint: visionEndpoint, model: visionModel, apiKey: visionApiKey } = await getApiConfig('resumeParse');
      const visionFinalKey = visionApiKey || process.env.DEEPSEEK_API_KEY || '';
      if (!visionFinalKey) {
        fs.unlinkSync(filePath);
        return res.status(500).json({ message: 'AI 服务未配置 API Key' });
      }
      const visionResponse = await fetch(visionEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${visionFinalKey}`
        },
        body: JSON.stringify({
          model: visionModel,
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

    const resumeData = await callDeepSeekParse(extractedText, req.user._id);
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

    const isEnabled = await Settings.isApiEnabled('resumeParse');
    if (!isEnabled) {
      return res.status(503).json({ message: '简历生成功能已暂停使用，请联系管理员' });
    }

    const { apiKey: resumeKey } = await getApiConfig('resumeParse');
    const resumeFinalKey = resumeKey || process.env.DEEPSEEK_API_KEY || '';
    if (!resumeFinalKey) {
      return res.status(500).json({ message: 'AI 服务未配置 API Key' });
    }

    const resumeData = await callDeepSeekParse(`用户对自己的一段描述（非正式简历格式），请从以下描述中提取简历信息：\n\n${description}`, req.user._id);

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

    const isEnabled = await Settings.isApiEnabled('aiChat');
    if (!isEnabled) {
      return res.status(503).json({ message: '宠物聊天功能已暂停使用，请联系管理员' });
    }

    const { endpoint: chatEndpoint, model: chatModel, apiKey: chatApiKey } = await getApiConfig('aiChat');
    const chatFinalKey = chatApiKey || process.env.DEEPSEEK_API_KEY || '';
    if (!chatFinalKey) {
      return res.status(500).json({ message: 'AI 服务未配置 API Key，请在 .env 中设置 DEEPSEEK_API_KEY' });
    }

    const systemPrompt = buildPetSystemPrompt(
      petName || '果果仁',
      petCategory || 'cat',
      customCategory || ''
    );

    const response = await fetch(chatEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${chatFinalKey}`
      },
      body: JSON.stringify({
        model: chatModel,
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
    
    // 记录API使用
    const usage = data.usage || {};
    await ApiUsage.recordUsage({
      apiType: 'aiChat',
      userId: null,
      promptTokens: usage.prompt_tokens || estimateTokens(systemPrompt + message),
      completionTokens: usage.completion_tokens || estimateTokens(responseText),
      totalTokens: usage.total_tokens,
      status: 'success',
      model: chatModel,
    });

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

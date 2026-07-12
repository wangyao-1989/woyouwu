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

function buildResumePrompt(content, targetIndustry) {
  // ——— buildResumePrompt：禁止编造，但必须专业润色 ———
  const industryGuide = targetIndustry
    ? '\n## 目标行业：' + targetIndustry + '\n\n' +
      '你需要针对【' + targetIndustry + '】行业重新组织简历内容的呈现逻辑。\n\n' +
      '**步骤：**\n' +
      '1. 深读原文，提炼所有事实信息。\n' +
      '2. 思考 ' + targetIndustry + ' 行业最看重什么能力。\n' +
      '3. 把行业最看重的能力放到最显眼的位置（bio 优先提及，skills 排前面，description 句子结构的重心靠前）。\n\n' +
      '**行业视角参考（用于判断突出什么，不是用于编造内容）：**\n' +
      '- 电商：增长、转化、供应链、数据分析、用户运营\n' +
      '- 车企：供应链管理、质量管理、项目交付、成本控制、流程标准化\n' +
      '- 金融/保险：合规、风控、客户关系管理、业绩达成、渠道拓展\n' +
      '- 医疗：合规、数据安全、患者体验、临床验证\n' +
      '- 互联网：产品迭代、技术架构、用户增长、敏捷开发\n' +
      '- 教育：课程设计、用户留存、内容运营、学习效果\n'
    : '';

  const industryHint = targetIndustry
    ? '\n\n重要提示：目标行业为【' + targetIndustry + '】。把与该行业最相关的能力放在最前面。'
    : '';

  return '你是一位资深简历润色专家。你的任务是把一份口语化、平铺直叙的简历，改写为专业、有力、打动人心的简历。\n\n' +
    '## 核心原则：分档处理\n\n' +
    '处理每条经历描述时，先快速判断它属于哪一档，再按对应档位执行。\n\n' +
    '### A档：原文已很专业（动词强、术语准、句式完整、逻辑清晰）\n' +
    '→ 微调即可：更换1-2个动词让表达更新鲜，调整短语句序让节奏更好。**不可原样复制**——至少要有可感知的改动。\n\n' +
    '### B档：原文中等（有一定专业度但措辞平淡、句式单一）\n' +
    '→ 中调：升级弱动词、补充行业术语、丰富句式结构、补全逻辑链条（如"分析数据"补充"为决策提供支持"）。\n\n' +
    '### C档：原文平淡简短（"负责X""协助Y""参与Z"类，一句话带过）\n' +
    '→ 深度润色必须重写：用强动词替换、补全工作上下文、展开展业术语、用专业句式重新组织。**这类条目改动幅度要最大。**\n\n' +
    '### 红线（违者不合格）\n' +
    '- 禁止编造任何数字（百分比、金额、日期等），原文没有就绝不能出现\n' +
    '- 禁止编造技能/公司/项目/职位名称\n' +
    '- 禁止编造行业经验声明、奖项、证书\n' +
    '- **禁止任何一条经历描述原样复制**——即使A档也必须做可感知的改动\n\n' +
    '### 润色示例（对照学习）\n\n' +
    '【C档示例】原文："负责车险等保险业务开拓与客户关系维护"\n' +
    '  ❌ 错误：原样保留（零润色）\n' +
    '  ✅ 正确："主导车险等保险产品线的市场拓展，建立并持续深化核心客户关系管理体系"\n' +
    '  — "负责"→"主导"，"业务开拓"→"市场拓展"，"客户关系维护"→"核心客户关系管理体系"\n\n' +
    '【C档示例】原文："协助数学课程教学与学生辅导"\n' +
    '  ❌ 错误：原样保留（零润色）\n' +
    '  ✅ 正确："承担数学课程教学任务，负责学生学业辅导与课后跟进，帮助学生提升数学成绩与学习兴趣"\n' +
    '  — "协助"→"承担"，"教学"→"教学任务"，"学生辅导"→"学业辅导与课后跟进"\n\n' +
    '【B档示例】原文："负责数据报表的制作和分析"\n' +
    '  ❌ 错误："负责数据报表的制作和分析，提升运营效率60%"（"60%"是编造的）\n' +
    '  ✅ 正确："负责运营数据报表的搭建与分析，为管理决策提供数据支持"\n' +
    '  — "制作"→"搭建"，补充了分析的目的（合理推断，不属编造）\n\n' +
    '【A档示例】原文："负责系统架构设计与核心模块开发，带领5人团队完成项目交付"\n' +
    '  ❌ 错误：原样保留（即使是A档也不能复制）\n' +
    '  ✅ 正确："主导系统架构设计与核心模块研发，带领5人技术团队高效完成项目交付与迭代升级"\n' +
    '  — "负责"→"主导"，"开发"→"研发"，"完成"→"高效完成...与迭代升级"，保持原意但表达更丰富\n\n' +
    '## 具体输出规范\n\n' +
    '- **bio**：提炼「职业/身份 + ' + (targetIndustry || '行业') + '最相关的能力 + 年限」三要素。用专业有力的措辞，把最匹配的能力放在前面。限60字。\n' +
    '- **skills**：从原文提取技能，按与' + (targetIndustry || '目标行业') + '的相关性从高到低排序。用行业术语表达（如"客户关系管理"替代"维护客户"）。最多8个。\n' +
    '- **experience.description**：从原文工作内容出发，用专业句式重新组织，60-80字。\n' +
    '  * **严禁以"负责""参与""协助"开头**——必须用强动词替换（主导/搭建/推动/优化/重构/深耕/赋能）\n' +
    '  * 用专业术语（业务流程/产品线/管理体系/决策支持 等）\n' +
    '  * 补充合理推断的上下文（如"分析数据"→"为决策提供数据支持"），但不编造具体成果数字\n' +
    '- **interests**：只使用原文提到的兴趣，最多6个。\n\n' +
    industryGuide + '\n' +
    '## 原文输入\n```\n' + content + '\n```\n\n' +
    '## 输出格式\n' +
    '返回纯 JSON（不要 markdown 标记）：\n' +
    '{\n' +
    '  "realName": "姓名",\n' +
    '  "bio": "一句话简介（60字内）",\n' +
    '  "skills": ["技能1", "技能2"...],\n' +
    '  "interests": ["兴趣1", "兴趣2"...],\n' +
    '  "experience": [{\n' +
    '    "period": "时间段",\n' +
    '    "organization": "公司或项目名",\n' +
    '    "position": "职位",\n' +
    '    "description": "润色后专业描述（60-80字）"\n' +
    '  }],\n' +
    '  "education": [{\n' +
    '    "school": "学校",\n' +
    '    "major": "专业",\n' +
    '    "degree": "学历",\n' +
    '    "period": "时间段"\n' +
    '  }],\n' +
    '  "socialLinks": {"github": "", "wechat": ""},\n' +
    '  "contactEmail": "邮箱",\n' +
    '  "location": "城市"\n' +
    '}';
}

// ——— buildPolishPrompt：对已有简历做行业定向润色 ———
function buildPolishPrompt(resumeText, targetIndustry) {
  return '你是一位资深简历润色专家。\n\n' +
    '## 你的任务\n\n' +
    '下面是一份已经生成的简历。用户希望针对【' + targetIndustry + '】行业重新调整这份简历的表述。\n\n' +
    '你需要做三件事（缺一不可，不做即为失职）：\n\n' +
    '### 第一件：排序重组\n' +
    '- **skills 重新排序**：把与 ' + targetIndustry + ' 行业最相关的技能排到最前面。当前顺序未必最优，你必须按 ' + targetIndustry + ' 的用人偏好重新排序。\n' +
    '- **description 句子重组**：把每段经历中对 ' + targetIndustry + ' 最有价值的工作内容移到句子最前面。\n' +
    '- **bio 重新定位**：从 ' + targetIndustry + ' 行业角度重写一句话简介，突出该行业最看重的能力。\n\n' +
    '### 第二件：措辞润色\n' +
    '- 把平淡的描述改写得更专业有力：用强动词（主导/搭建/推动/深耕），用专业术语（产品线/管理体系/决策支持），用完整句式（通过/从而/以）串联逻辑。\n' +
    '- **不是复制原文**，而是用更专业、更打动人心的语言重新表述相同的事实。\n\n' +
    '### 第三件：红线自检\n' +
    '- 有没有编造数字？→ 有就删除\n' +
    '- 有没有编造技能？→ 有就删除\n' +
    '- 有没有编造行业声明？→ 有就删除\n\n' +
    '### 润色示例（对照学习）\n' +
    '原文描述："负责车险等保险业务开拓与客户关系维护"\n' +
    '❌ 错误：原样保留不变（这是失职）\n' +
    '✅ 正确："主导车险等保险产品线的市场拓展，建立并持续深化核心客户关系管理体系"\n\n' +
    '## 当前简历\n\n' + resumeText + '\n\n' +
    '## 输出\n\n' +
    '请返回纯 JSON（不要 markdown）：\n' +
    '{\n' +
    '  "realName": "姓名",\n' +
    '  "bio": "面向' + targetIndustry + '的一句话简介",\n' +
    '  "skills": ["与' + targetIndustry + '相关的排前面"],\n' +
    '  "interests": ["兴趣"],\n' +
    '  "experience": [{"organization": "公司名", "position": "职位", "period": "时间段", "description": "润色后描述"}],\n' +
    '  "education": [{"school": "学校", "major": "专业", "degree": "学历", "period": "时间段"}],\n' +
    '  "socialLinks": {"github": "", "wechat": ""},\n' +
    '  "contactEmail": "邮箱",\n' +
    '  "location": "城市"\n' +
    '}';
}

async function callDeepSeekParse(content, userId, targetIndustry = '') {
  const prompt = buildResumePrompt(content, targetIndustry);

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
        { role: 'system', content: '你是一位严谨的简历润色专家。你必须逐条改写每一段经历描述——即使原文很短也要用专业语言重写，严禁原样复制。只返回严格 JSON。' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.2,
      max_tokens: 3000
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

// 针对性润色：用目标行业视角重新表述已有简历
async function callDeepSeekPolish(resumeText, targetIndustry, userId) {
  const prompt = buildPolishPrompt(resumeText, targetIndustry);

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
        { role: 'system', content: '你是一位严谨的简历润色专家。先分析每条经历的档位（A/B/C），再按档位执行对应力度的润色——A档微调、B档中调、C档深度重写。只返回严格 JSON。' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.25,
      max_tokens: 3000
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

// 提取 PDF 文本：pdf-parse → pdfjs-dist → pdf2json → 原始字节流 四级备用
async function extractPdfText(dataBuffer) {
  // 第一级：pdf-parse
  let lastError;
  try {
    const pdfData = await pdfParse(dataBuffer);
    if (pdfData.text && pdfData.text.trim().length > 20) {
      console.log('[PDF] pdf-parse 成功，提取', pdfData.text.length, '字符');
      return pdfData.text;
    }
    lastError = new Error('pdf-parse 提取文本过短（' + (pdfData.text?.length || 0) + '字符）');
  } catch (e) {
    lastError = e;
  }
  console.warn('[PDF] pdf-parse 失败:', lastError.message, '→ 尝试 pdfjs-dist');

  // 第二级：pdfjs-dist
  try {
    const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');
    const uint8 = Uint8Array.from(dataBuffer);
    const loadingTask = pdfjsLib.getDocument({ data: uint8, disableFontFace: true, verbosity: 0 });
    const pdfDoc = await loadingTask.promise;
    const pages = [];
    for (let i = 1; i <= pdfDoc.numPages; i++) {
      const page = await pdfDoc.getPage(i);
      const content = await page.getTextContent();
      const text = content.items.map(item => item.str).join(' ');
      if (text.trim()) pages.push(text.trim());
    }
    const result = pages.join('\n');
    if (result.trim().length >= 20) {
      console.log('[PDF] pdfjs-dist 成功，提取', result.length, '字符');
      return result;
    }
    lastError = new Error('pdfjs-dist 提取文本过短（' + result.length + '字符）');
  } catch (e) {
    lastError = e;
  }
  console.warn('[PDF] pdfjs-dist 失败:', lastError.message, '→ 尝试 pdf2json');

  // 第三级：pdf2json（完全不同的解析器）
  try {
    const result = await new Promise((resolve, reject) => {
      const PDFParser = require('pdf2json');
      const pdfParser = new PDFParser();
      pdfParser.on('pdfParser_dataReady', (pdfData) => {
        try {
          const texts = [];
          for (const page of pdfData.formImage.Pages || []) {
            for (const textObj of page.Texts || []) {
              const text = decodeURIComponent(textObj.R?.map(t => t.T || '').join('') || '');
              if (text.trim()) texts.push(text.trim());
            }
          }
          const result = texts.join('\n');
          if (result.trim().length >= 20) {
            resolve(result);
          } else {
            reject(new Error('pdf2json 提取文本过短（' + result.length + '字符）'));
          }
        } catch (e) {
          reject(e);
        }
      });
      pdfParser.on('pdfParser_dataError', (err) => {
        reject(new Error('pdf2json 解析错误：' + (err.parserError?.message || err.message || '未知')));
      });
      pdfParser.parseBuffer(dataBuffer);
    });
    if (result && result.trim().length >= 20) {
      console.log('[PDF] pdf2json 成功，提取', result.length, '字符');
      return result;
    }
    lastError = new Error('pdf2json 返回空');
  } catch (e) {
    lastError = e;
  }
  console.warn('[PDF] pdf2json 失败:', lastError.message, '→ 尝试原始字节流提取');

  // 第四级：直接扫描 PDF 原始字节流，提取 BT...ET 之间的文本
  // 不依赖任何解析器，直接正则匹配 PDF 文本操作符
  try {
    const raw = dataBuffer.toString('latin1');
    const texts = [];
    // 匹配 BT ... ET 之间的文本块
    const btBlocks = raw.match(/BT[\s\S]*?ET/g);
    if (btBlocks) {
      for (const block of btBlocks) {
        // 提取 Tj、TJ、'、" 操作符中的文本
        // (text) Tj — 简单文本
        const tjMatches = block.match(/\(([^)]*)\)\s*Tj/g);
        if (tjMatches) {
          for (const m of tjMatches) {
            const text = m.match(/\(([^)]*)\)/)?.[1] || '';
            if (text.trim()) texts.push(text.trim());
          }
        }
        // [(text) num (text)] TJ — 文本数组
        const tjArrayMatch = block.match(/\[([^\]]*)\]\s*TJ/);
        if (tjArrayMatch) {
          const arrContent = tjArrayMatch[1];
          const arrTexts = arrContent.match(/\(([^)]*)\)/g);
          if (arrTexts) {
            const combined = arrTexts.map(t => t.slice(1, -1)).join('');
            if (combined.trim()) texts.push(combined.trim());
          }
        }
      }
    }
    const result = texts.join('\n');
    if (result.trim().length >= 20) {
      console.log('[PDF] 原始字节流提取成功，提取', result.length, '字符');
      return result;
    }
    throw new Error('原始字节流提取文本过短（' + result.length + '字符），PDF 可能为扫描图片');
  } catch (e) {
    console.error('[PDF] 所有四级解析均失败，最终错误:', e.message);
    throw new Error('PDF 解析失败，请尝试将 PDF 转为 JPG/PNG 图片后重新上传。原因：' + (e.message || '未知'));
  }
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
      extractedText = await extractPdfText(dataBuffer);
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

    const targetIndustry = req.body.targetIndustry || '';
    const resumeData = await callDeepSeekParse(extractedText, req.user._id, targetIndustry);
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

    const targetIndustry = req.body.targetIndustry || '';
    const resumeData = await callDeepSeekParse(`用户对自己的一段描述：\n\n${description}`, req.user._id, targetIndustry);

    res.json({ resume: resumeData });
  } catch (error) {
    console.error('AI generate resume error:', error);
    if (error.message?.includes('DeepSeek API')) {
      return res.status(502).json({ message: 'AI 服务调用失败，请稍后重试' });
    }
    if (error instanceof SyntaxError) {
      return res.status(500).json({ message: 'AI 返回数据格式异常，请稍后重试' });
    }
    res.status(500).json({ message: '服务器错误' });
  }
});

// 针对性润色：将已有简历按目标行业重新调整措辞
router.post('/polish-resume', auth, async (req, res) => {
  try {
    const { resume, targetIndustry } = req.body;

    if (!targetIndustry || targetIndustry.trim().length < 2) {
      return res.status(400).json({ message: '请输入目标行业（至少2个字）' });
    }

    if (!resume || !resume.realName) {
      return res.status(400).json({ message: '请先生成或填写简历内容' });
    }

    const isEnabled = await Settings.isApiEnabled('resumeParse');
    if (!isEnabled) {
      return res.status(503).json({ message: '简历功能已暂停使用，请联系管理员' });
    }

    const { apiKey: resumeKey } = await getApiConfig('resumeParse');
    const resumeFinalKey = resumeKey || process.env.DEEPSEEK_API_KEY || '';
    if (!resumeFinalKey) {
      return res.status(500).json({ message: 'AI 服务未配置 API Key' });
    }

    // 将结构化简历转为文本，供 AI 理解
    const resumeText = [
      `姓名：${resume.realName || ''}`,
      `简介：${resume.bio || ''}`,
      `技能：${(resume.skills || []).join('、')}`,
      `兴趣：${(resume.interests || []).join('、')}`,
      `邮箱：${resume.contactEmail || ''}`,
      `城市：${resume.location || ''}`,
      `工作经历：`,
      ...(resume.experience || []).map(e =>
        `- ${e.period || ''} ${e.organization || e.company || ''} ${e.position || e.title || ''}：${e.description || ''}`
      ),
      `教育经历：`,
      ...(resume.education || []).map(e =>
        `- ${e.period || ''} ${e.school || ''} ${e.major || ''} ${e.degree || ''}`
      ),
      `社交链接：${resume.socialLinks?.github || ''} ${resume.socialLinks?.wechat || ''}`
    ].join('\n');

    const aiResult = await callDeepSeekPolish(resumeText, targetIndustry.trim(), req.user._id);

    // 合并：固定字段用原始数据，只有 bio/skills/description 用 AI 输出
    const merged = {
      realName: resume.realName || aiResult.realName || '',
      bio: aiResult.bio || resume.bio || '',
      skills: aiResult.skills?.length ? aiResult.skills : (resume.skills || []),
      interests: aiResult.interests?.length ? aiResult.interests : (resume.interests || []),
      experience: (resume.experience || []).map((orig, i) => ({
        organization: orig.organization || orig.company || '',
        position: orig.position || orig.title || '',
        period: orig.period || '',
        description: aiResult.experience?.[i]?.description || orig.description || ''
      })),
      education: resume.education || [],
      socialLinks: resume.socialLinks || { github: '', wechat: '' },
      contactEmail: resume.contactEmail || '',
      location: resume.location || ''
    };

    res.json({ resume: merged });
  } catch (error) {
    console.error('Polish resume error:', error);
    if (error.message?.includes('DeepSeek API')) {
      return res.status(502).json({ message: 'AI 服务调用失败，请稍后重试' });
    }
    if (error instanceof SyntaxError) {
      return res.status(500).json({ message: 'AI 返回数据格式异常，请稍后重试' });
    }
    res.status(500).json({ message: '润色失败：' + (error.message || '未知错误') });
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

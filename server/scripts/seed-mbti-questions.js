const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const MBTIQuestion = require('../models/MBTIQuestion');

const questions = [
  // ===== EI 维度 (15题) =====
  {
    text: '结束了一整天高强度的工作或社交后，你更倾向于：',
    poleA: '约几个朋友吃饭聊天，换个方式放松',
    poleB: '一个人回家刷剧、看书或打游戏，安静回血',
    dimension: 'EI', traitA: 'E', scene: 'general', version: 'both', order: 1,
  },
  {
    text: '周末没有任何安排，你更可能：',
    poleA: '主动约人出去逛逛，哪怕只是在附近走走',
    poleB: '享受难得的独处时光，做点自己想做的事',
    dimension: 'EI', traitA: 'E', scene: 'general', version: 'both', order: 2,
  },
  {
    text: '遇到一个棘手的问题，你的第一反应是：',
    poleA: '找朋友或同事聊聊，在对话中理清思路',
    poleB: '先自己认真想一想，有了结论再告诉别人',
    dimension: 'EI', traitA: 'E', scene: 'self', version: 'both', order: 3,
  },
  {
    text: '参加一个陌生的聚会，你更接近以下哪种状态：',
    poleA: '主动认识不同的人，和很多人简短交流',
    poleB: '找一两个看起来投缘的人深入聊，或者安静观察',
    dimension: 'EI', traitA: 'E', scene: 'social', version: 'both', order: 4,
  },
  {
    text: '在团队头脑风暴中，你通常：',
    poleA: '边想边说，哪怕想法不成熟也先抛出来碰撞',
    poleB: '先听大家说，在心里整理好观点再发言',
    dimension: 'EI', traitA: 'E', scene: 'workplace', version: 'both', order: 5,
  },
  {
    text: '长途旅行时，你更享受：',
    poleA: '和旅伴一路聊天、玩游戏，热闹地度过时间',
    poleB: '看看窗外风景、戴上耳机听音乐，沉浸在自己的世界里',
    dimension: 'EI', traitA: 'E', scene: 'general', version: 'professional', order: 6,
  },
  {
    text: '被要求在众人面前即兴发言，你的感受是：',
    poleA: '虽然紧张，但也有点兴奋，觉得是个展示的机会',
    poleB: '内心非常抗拒，希望能提前准备或者干脆跳过',
    dimension: 'EI', traitA: 'E', scene: 'workplace', version: 'professional', order: 7,
  },
  {
    text: '你的手机快没电了，接下来两个小时你会在外面等人，你会：',
    poleA: '找周围的人聊天，或者观察街上的行人',
    poleB: '找个角落坐下来，在脑子里想事情，一点不觉得无聊',
    dimension: 'EI', traitA: 'E', scene: 'general', version: 'professional', order: 8,
  },
  {
    text: '在一个全是陌生人的兴趣小组里，你倾向于：',
    poleA: '很快融入，主动表达自己的看法和经验',
    poleB: '先观察几次，等熟悉了氛围再慢慢参与',
    dimension: 'EI', traitA: 'E', scene: 'social', version: 'professional', order: 9,
  },
  {
    text: '当你感到压力大的时候，更有效的恢复方式是：',
    poleA: '出去和朋友待在一起，哪怕只是坐着不说话',
    poleB: '把自己关在房间里，暂时切断外界联系',
    dimension: 'EI', traitA: 'E', scene: 'self', version: 'professional', order: 10,
  },
  {
    text: '用三个词来形容你在朋友中的形象：',
    poleA: '活跃、健谈、气氛担当',
    poleB: '安静、倾听者、话少但有深度',
    dimension: 'EI', traitA: 'E', scene: 'social', version: 'professional', order: 11,
  },
  {
    text: '开会时领导问"大家有什么想法？"，你：',
    poleA: '通常第一个或前几个发言的人里就有你',
    poleB: '你倾向于等别人先说，或者会后单独沟通',
    dimension: 'EI', traitA: 'E', scene: 'workplace', version: 'professional', order: 12,
  },
  {
    text: '如果连续三天没有任何社交活动，你会：',
    poleA: '开始觉得闷，想找人互动一下',
    poleB: '完全没问题，甚至觉得这种节奏很舒适',
    dimension: 'EI', traitA: 'E', scene: 'general', version: 'professional', order: 13,
  },
  {
    text: '在咖啡厅办公或学习时，你更喜欢：',
    poleA: '热闹一点的环境，周围有人气反而更能专注',
    poleB: '安静的角落，最好周围没人打扰',
    dimension: 'EI', traitA: 'E', scene: 'general', version: 'professional', order: 14,
  },
  {
    text: '和一个刚认识不久的人同行十分钟，你更可能：',
    poleA: '主动找话题，尽量不让气氛冷下来',
    poleB: '如果对方不说话，你觉得安静地走也挺好',
    dimension: 'EI', traitA: 'E', scene: 'social', version: 'professional', order: 15,
  },

  // ===== SN 维度 (15题) =====
  {
    text: '看一部悬疑电影时，你更容易被什么吸引：',
    poleA: '紧凑的剧情推进、精妙的细节伏笔和逻辑',
    poleB: '背后的隐喻、世界观设定和让人回味的开放式结局',
    dimension: 'SN', traitA: 'S', scene: 'general', version: 'both', order: 16,
  },
  {
    text: '学习一项新技能，你更偏好：',
    poleA: '跟着教程一步步操作，先做出成果再说',
    poleB: '先了解背后的原理和框架，搞清楚"为什么"再动手',
    dimension: 'SN', traitA: 'S', scene: 'self', version: 'both', order: 17,
  },
  {
    text: '老板让你做一个方案，你最先做的事是：',
    poleA: '找类似案例、收集具体数据和可参考的模板',
    poleB: '先构思整体蓝图，想清楚核心创意和差异化方向',
    dimension: 'SN', traitA: 'S', scene: 'workplace', version: 'both', order: 18,
  },
  {
    text: '你更欣赏哪一种同事：',
    poleA: '做事细致、有条理，能把每个环节落到实处的人',
    poleB: '想法大胆、有远见，总能提出新思路和新方向的人',
    dimension: 'SN', traitA: 'S', scene: 'workplace', version: 'both', order: 19,
  },
  {
    text: '别人给你介绍一个概念时，你通常先问：',
    poleA: '"这具体是什么？能举个实际例子吗？"',
    poleB: '"这背后是什么逻辑？和其他概念有什么关联？"',
    dimension: 'SN', traitA: 'S', scene: 'general', version: 'both', order: 20,
  },
  {
    text: '装修新家时，你花更多精力在：',
    poleA: '选什么材质、颜色怎么搭配、家具好不好用等实际体验',
    poleB: '整体的风格调性、空间想要传达的感觉和氛围',
    dimension: 'SN', traitA: 'S', scene: 'general', version: 'professional', order: 21,
  },
  {
    text: '回忆一次旅行，你最先想到的是：',
    poleA: '吃过的某道菜、住过的某个房间、路上的某个具体场景',
    poleB: '那次旅行的整体感觉，以及它给你带来的思考和改变',
    dimension: 'SN', traitA: 'S', scene: 'general', version: 'professional', order: 22,
  },
  {
    text: '面对一个新的工具或APP，你通常：',
    poleA: '直接开始用，在用的过程中摸索功能',
    poleB: '先浏览一遍全部功能，理解整体设计逻辑再深入',
    dimension: 'SN', traitA: 'S', scene: 'self', version: 'professional', order: 23,
  },
  {
    text: '写一份报告时，你更擅长：',
    poleA: '用数据和事实说话，给出清晰、可验证的结论',
    poleB: '提炼核心观点，找到有洞察力的角度和解读',
    dimension: 'SN', traitA: 'S', scene: 'workplace', version: 'professional', order: 24,
  },
  {
    text: '你更可能对哪类内容感兴趣：',
    poleA: '一本详细介绍某个行业运作方式的书',
    poleB: '一篇探讨未来十年社会可能如何变化的文章',
    dimension: 'SN', traitA: 'S', scene: 'self', version: 'professional', order: 25,
  },
  {
    text: '做菜时，你更接近以下哪种风格：',
    poleA: '严格按照菜谱的用量和步骤来做，保证不出错',
    poleB: '大致看一遍菜谱后凭感觉来，喜欢即兴发挥',
    dimension: 'SN', traitA: 'S', scene: 'general', version: 'professional', order: 26,
  },
  {
    text: '听别人讲一个故事，你更容易注意到：',
    poleA: '故事里的时间线、人物关系和具体发生了什么',
    poleB: '故事背后想传达的含义和能联想到的其他事情',
    dimension: 'SN', traitA: 'S', scene: 'general', version: 'professional', order: 27,
  },
  {
    text: '你更认同哪种工作习惯：',
    poleA: '把现有流程打磨到极致，在确定性中提高效率',
    poleB: '不断尝试新方法，哪怕可能会失败也要突破常规',
    dimension: 'SN', traitA: 'S', scene: 'workplace', version: 'professional', order: 28,
  },
  {
    text: '朋友让你推荐一本书，你更可能推荐：',
    poleA: '一本实用性强的书，读完就能用到生活中',
    poleB: '一本能引发思考的书，读完会让世界观发生一些变化',
    dimension: 'SN', traitA: 'S', scene: 'social', version: 'professional', order: 29,
  },
  {
    text: '解决一个问题时，你更信任：',
    poleA: '自己或他人过往的经验、已经被验证过的方法',
    poleB: '突然冒出来的灵感，哪怕它暂时没有数据支撑',
    dimension: 'SN', traitA: 'S', scene: 'self', version: 'professional', order: 30,
  },

  // ===== TF 维度 (15题) =====
  {
    text: '朋友向你倾诉他把一个重要项目搞砸了，你第一反应是：',
    poleA: '帮他复盘问题出在哪，一起想补救办法',
    poleB: '先安抚他的情绪，告诉他"这不是你的错"',
    dimension: 'TF', traitA: 'T', scene: 'social', version: 'both', order: 31,
  },
  {
    text: '团队在讨论两个方案，各有优劣，你更倾向于：',
    poleA: '列出每个方案的利弊分数，选综合得分最高的',
    poleB: '考虑哪个方案大家执行起来更舒服、更愿意投入',
    dimension: 'TF', traitA: 'T', scene: 'workplace', version: 'both', order: 32,
  },
  {
    text: '当有人对你提出批评时，你第一时间更在意：',
    poleA: '对方说的内容有没有道理、是否基于事实',
    poleB: '对方的语气和方式是否尊重你、出发点是否善意',
    dimension: 'TF', traitA: 'T', scene: 'self', version: 'both', order: 33,
  },
  {
    text: '做一个重要决定时，你更多依靠：',
    poleA: '理性分析，列出优缺点，计算投入产出比',
    poleB: '内心感受，问自己"这样做对吗？会不会后悔？"',
    dimension: 'TF', traitA: 'T', scene: 'self', version: 'both', order: 34,
  },
  {
    text: '团队里两个人因为工作方式不同起了争执，你更可能：',
    poleA: '客观分析两种方式的实际效果差异，找出事实依据',
    poleB: '分别找两人聊聊，理解各自的感受，帮忙调和关系',
    dimension: 'TF', traitA: 'T', scene: 'workplace', version: 'both', order: 35,
  },
  {
    text: '你更欣赏以下哪种品质：',
    poleA: '公正客观，敢于说真话，哪怕会得罪人',
    poleB: '温和善良，懂得照顾别人感受，让人如沐春风',
    dimension: 'TF', traitA: 'T', scene: 'self', version: 'professional', order: 36,
  },
  {
    text: '如果你发现同事的一个错误可能会影响项目进度，你倾向于：',
    poleA: '直接指出来，给出具体的问题和改进建议',
    poleB: '用比较委婉的方式提醒，尽量不让对方难堪',
    dimension: 'TF', traitA: 'T', scene: 'workplace', version: 'professional', order: 37,
  },
  {
    text: '在挑选一件商品时，让你最终下单的关键通常是：',
    poleA: '性价比高、参数过硬、评测数据好',
    poleB: '颜值高、品牌理念打动你、用着有幸福感',
    dimension: 'TF', traitA: 'T', scene: 'general', version: 'professional', order: 38,
  },
  {
    text: '看一部催泪电影，你通常在什么场景下会流泪：',
    poleA: '不太容易哭，更关注剧情逻辑和人物行为是否合理',
    poleB: '很容易被戳中泪点，角色的情绪会直接感染到你',
    dimension: 'TF', traitA: 'T', scene: 'general', version: 'professional', order: 39,
  },
  {
    text: '年终评估时，你更希望领导关注你：',
    poleA: '做出了多少可量化的成果，完成了哪些关键指标',
    poleB: '在团队中起到了什么作用，为他人提供了哪些支持',
    dimension: 'TF', traitA: 'T', scene: 'workplace', version: 'professional', order: 40,
  },
  {
    text: '当你和伴侣（或好友）产生分歧时，你更想：',
    poleA: '坐下来把逻辑说清楚，谁更有道理听谁的',
    poleB: '先确认彼此的情绪都没问题，再慢慢聊事情本身',
    dimension: 'TF', traitA: 'T', scene: 'relationship', version: 'professional', order: 41,
  },
  {
    text: '一个不太熟的人来找你帮忙，你呢：',
    poleA: '评估自己有没有能力和时间，再决定帮不帮',
    poleB: '很难拒绝，觉得别人开口了就是信任你',
    dimension: 'TF', traitA: 'T', scene: 'social', version: 'professional', order: 42,
  },
  {
    text: '你认为一个"好的决策"最重要的标准是：',
    poleA: '在当时的条件下，这是最合理、最高效的选择',
    poleB: '这个决定没有伤害任何人，自己心里也过得去',
    dimension: 'TF', traitA: 'T', scene: 'self', version: 'professional', order: 43,
  },
  {
    text: '评价一个人是否"聪明"，你更看重：',
    poleA: '逻辑清晰、分析能力强、能快速抓住问题本质',
    poleB: '善于理解他人、懂得人情世故、有共情能力',
    dimension: 'TF', traitA: 'T', scene: 'social', version: 'professional', order: 44,
  },
  {
    text: '你参与了一个公益项目，更让你有成就感的反馈是：',
    poleA: '数据表明这个项目确实解决了某个具体问题',
    poleB: '收到受助者真诚的感谢，能感受到自己的付出被看见',
    dimension: 'TF', traitA: 'T', scene: 'self', version: 'professional', order: 45,
  },

  // ===== JP 维度 (15题) =====
  {
    text: '出门旅行前，你更接近以下哪种状态：',
    poleA: '做好详细攻略，每天的行程、交通、餐厅都提前安排好',
    poleB: '只订好机票酒店，到了当地随走随逛，保持灵活性',
    dimension: 'JP', traitA: 'J', scene: 'general', version: 'both', order: 46,
  },
  {
    text: '周五收到一个下周三截止的任务，你通常会：',
    poleA: '周末就开始规划，争取周一就完成初稿',
    poleB: '周二晚上集中爆发，在 deadline 前高效搞定',
    dimension: 'JP', traitA: 'J', scene: 'workplace', version: 'both', order: 47,
  },
  {
    text: '你的书桌或工作台通常是：',
    poleA: '整理得井井有条，每样东西都有固定的位置',
    poleB: '看起来有点乱，但你知道每样东西在哪，乱中有序',
    dimension: 'JP', traitA: 'J', scene: 'general', version: 'both', order: 48,
  },
  {
    text: '对于未来的规划，你更倾向于：',
    poleA: '有清晰的短期目标和长期路线图，每一步都心里有数',
    poleB: '有个大方向就好，具体怎么走看机会和情况再调整',
    dimension: 'JP', traitA: 'J', scene: 'self', version: 'both', order: 49,
  },
  {
    text: '一件事情悬而未决时，你的状态是：',
    poleA: '心里一直挂着，很想尽快把它敲定下来',
    poleB: '不着急，等更多的信息出现再决定也行',
    dimension: 'JP', traitA: 'J', scene: 'self', version: 'both', order: 50,
  },
  {
    text: '如果原定计划被意外打乱，你的第一反应是：',
    poleA: '有点烦躁，需要一点时间重新调整和适应',
    poleB: '无所谓，正好看看还有什么新的可能性',
    dimension: 'JP', traitA: 'J', scene: 'general', version: 'professional', order: 51,
  },
  {
    text: '对于"待办清单"这种工具，你更接近：',
    poleA: '经常用，划掉一项很有成就感，是日常管理的必需品',
    poleB: '偶尔心血来潮写一下，但坚持不了几天就放弃了',
    dimension: 'JP', traitA: 'J', scene: 'self', version: 'professional', order: 52,
  },
  {
    text: '朋友突然约你半小时后见面，你：',
    poleA: '不太舒服，希望至少提前半天约，让你有准备的时间',
    poleB: '很乐意，临时起意的见面往往更有惊喜感',
    dimension: 'JP', traitA: 'J', scene: 'social', version: 'professional', order: 53,
  },
  {
    text: '你更认同哪种工作节奏：',
    poleA: '每天有计划地推进，保持稳定的输出',
    poleB: '状态好的时候疯狂输出，状态差的时候就歇着',
    dimension: 'JP', traitA: 'J', scene: 'workplace', version: 'professional', order: 54,
  },
  {
    text: '你给自己设定了一个目标，三个月后：',
    poleA: '你很清楚自己已经完成了多少、还差多少',
    poleB: '你可能都不记得当初定的是什么目标了，但做了其他有意思的事',
    dimension: 'JP', traitA: 'J', scene: 'self', version: 'professional', order: 55,
  },
  {
    text: '关于"截止日期"，你的态度是：',
    poleA: '它给了你动力和节奏感，有 deadline 效率更高',
    poleB: '它让你焦虑，没有 deadline 你也能把事情做好',
    dimension: 'JP', traitA: 'J', scene: 'workplace', version: 'professional', order: 56,
  },
  {
    text: '你对"规则"的看法更接近：',
    poleA: '规则让事情有序运转，大多数时候应该遵守',
    poleB: '规则是为目的服务的，如果规则不合理就应该灵活变通',
    dimension: 'JP', traitA: 'J', scene: 'self', version: 'professional', order: 57,
  },
  {
    text: '学习一门课程时，你更享受：',
    poleA: '课程有清晰的大纲和进度安排，按部就班完成很有满足感',
    poleB: '根据自己的兴趣跳着学，今天看这部分明天翻那部分',
    dimension: 'JP', traitA: 'J', scene: 'self', version: 'professional', order: 58,
  },
  {
    text: '参加一个为期两天的培训，你更希望：',
    poleA: '主办方提前把详细日程发出来，精确到每个时段做什么',
    poleB: '只知道大体安排就好，留出随机的讨论和自由时间',
    dimension: 'JP', traitA: 'J', scene: 'workplace', version: 'professional', order: 59,
  },
  {
    text: '假期最后一天，想到明天要上班/上学，你通常会：',
    poleA: '提前准备好明天的衣服和要带的东西，早点休息',
    poleB: '不想这些，尽情享受假期的最后几个小时',
    dimension: 'JP', traitA: 'J', scene: 'general', version: 'professional', order: 60,
  },
];

async function seed() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/woyouwu';
    await mongoose.connect(mongoUri);
    console.log('MongoDB connected');

    await MBTIQuestion.deleteMany({});
    console.log('Cleared existing questions');

    const inserted = await MBTIQuestion.insertMany(questions);
    console.log(`Seeded ${inserted.length} questions successfully`);

    const stats = {};
    inserted.forEach(q => {
      const key = `${q.dimension}_${q.version}`;
      stats[key] = (stats[key] || 0) + 1;
    });
    console.log('Distribution:', stats);

    await mongoose.disconnect();
    console.log('Done');
    process.exit(0);
  } catch (err) {
    console.error('Seed failed:', err);
    process.exit(1);
  }
}

seed();

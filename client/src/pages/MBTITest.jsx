import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const SCALE_OPTIONS = [
  { value: 3, label: '更倾向左侧' },
  { value: 2, label: '倾向左侧' },
  { value: 1, label: '略倾向左侧' },
  { value: -1, label: '略倾向右侧' },
  { value: -2, label: '倾向右侧' },
  { value: -3, label: '更倾向右侧' },
];

const SCALE_DOTS = [
  { value: 3, size: 48, fontSize: 16 },
  { value: 2, size: 40, fontSize: 14 },
  { value: 1, size: 34, fontSize: 13 },
  { value: -1, size: 34, fontSize: 13 },
  { value: -2, size: 40, fontSize: 14 },
  { value: -3, size: 48, fontSize: 16 },
];

const DIM_LABELS = { EI: '精力来源', SN: '信息获取', TF: '决策方式', JP: '生活态度' };
const TRAIT_LABELS = { E: '外向 (E)', I: '内向 (I)', S: '实感 (S)', N: '直觉 (N)', T: '思考 (T)', F: '情感 (F)', J: '判断 (J)', P: '感知 (P)' };


const MBTI_PROFILES = {
  INTJ: {
    title: '建筑师', emoji: '🏛️', color: '#6366f1',
    overview: 'INTJ型的人是战略思想家，拥有出色的全局观和长远规划能力。你天生善于将复杂的信息整合成清晰的蓝图，并对未来有着敏锐的洞察力。你热爱知识、追求效率，不喜欢无意义的闲聊和重复劳动。在人群中你通常保持低调，但内心世界极为丰富，时刻在构建和完善自己的思想体系。你对自己和他人都有很高的标准，信奉"要么不做，做就做到最好"。',
    strengths: '战略思维，能看清复杂问题的本质并制定长远计划；高度独立，不依赖他人的认可来做决定；求知欲强，持续学习新知识并将其转化为实际方案；坚韧不拔，确定目标后会排除万难去实现。',
    weaknesses: '可能因过于注重逻辑而显得冷漠疏离；对低效和愚蠢缺乏耐心，有时会不经意间伤害他人感受；完美主义倾向可能导致大包大揽、难以放手；不善于表达情感，让人际沟通变得困难。',
    work: '你最适合需要深度思考和战略规划的工作环境。喜欢有明确目标和自主权的项目，讨厌频繁的会议和微观管理。团队中你更愿意扮演幕后的策略师，而非台前的领导者。',
    love: '在感情中你忠诚且深思熟虑，不会轻易投入一段关系，一旦认定对方，会认真经营并以行动证明你的承诺。你欣赏有思想深度、独立自主的伴侣。',
    growth: '学会在追求完美的同时接受不完美；主动练习表达情感和欣赏他人；记住不是所有人都以同样的速度和方式思考，耐心是一种智慧。',
    careers: '科学家、工程师、律师、战略顾问、大学教授、软件架构师，投资分析师',
  },
  INTP: {
    title: '逻辑学家', emoji: '🔬', color: '#8b5cf6',
    overview: 'INTP型的人是知识的探索者，你对世界运转的底层逻辑有着永不满足的好奇心。你享受独自思考和钻研的过程，常常沉浸在抽象概念和复杂理论的海洋中。对新鲜想法的兴奋往往超过对实际执行的热情。在社交方面，你更愿意找到能与你在思想层面深度交流的人，而不是泛泛之交。',
    strengths: '卓越的逻辑分析和抽象思维能力；对任何领域都能快速深入，自学能力强；客观中立，能以理性态度审视各种观点；创意十足，能将看似不相关的概念连接起来。',
    weaknesses: '容易陷入"分析瘫痪"，过度思考而迟迟不行动；对日常生活细节（如家务、理财）缺乏兴趣和条理；可能因过于沉浸在思想中而忽略周围人的情感需求；社交场合中经常显得疏离或心不在焉。',
    work: '你需要在有足够自主权和智力挑战的环境中才能发挥最佳状态。喜欢结构灵活、鼓励创新的工作文化，反感死板的规章制度。独自钻研时效率最高。',
    love: '你在感情中追求精神上的契合，外表和物质条件远没有思想上的共鸣重要。可能需要较长时间才能打开心扉，但一旦投入会很专注。',
    growth: '将想法付诸行动，哪怕只是小小的一步；培养对日常生活的管理能力；有意识地关照身边人的感受，情商和智商同样重要。',
    careers: '程序员、数据科学家、哲学家、数学家，游戏设计师、研究员、作家',
  },
  ENTJ: {
    title: '指挥官', emoji: '👑', color: '#f59e0b',
    overview: 'ENTJ型的人是天生的领导者，你自信果敢、目标明确，总能迅速看清局势并制定行动计划。你不畏惧挑战和困难，反而视之为证明自己的机会。你善于激励和引导他人，在团队中自然而然会成为核心人物。你的魅力和果断让人信服，但也需要注意不要因此变得傲慢或过于强势。',
    strengths: '卓越的领导力和组织能力，能将混乱的局面理出头绪；目标驱动，一旦确定方向就全力以赴；沟通能力强，善于说服他人并凝聚共识；果敢决断，在关键时刻能快速做出决策。',
    weaknesses: '可能因过于强势而忽略他人的感受和意见；对效率的追求有时会让你显得不近人情；不太善于处理情绪化的情况，倾向于用理性"碾压"一切；对自己的判断过于自信，可能忽视不同的声音。',
    work: '你在需要决策和领导力的岗位上如鱼得水。喜欢有挑战性的项目和足够大的自主权，讨厌被琐碎规则束缚。你对团队成员有明确的要求，但也会为团队的成功全力以赴。',
    love: '在感情中你同样具有掌控欲，需要一段势均力敌的关系。你欣赏有主见、有追求、不轻易被你压倒的伴侣。虽然外表强势，但内心深处也渴望被理解和照顾。',
    growth: '学会倾听，给别人表达的空间；情感并非软弱，适度展现脆弱反而让人更愿意追随你；不是所有问题都需要你来解决，信任团队。',
    careers: '企业高管、创业者、政治家、律师、管理顾问、军事指挥官、项目总监',
  },
  ENTP: {
    title: '辩论家', emoji: '💡', color: '#f97316',
    overview: 'ENTP型的人是思想的开创者，你聪明机智、口才超群，总能从别人看不到的角度发现机会。你享受智力上的挑战和辩论的过程，不是为了争胜负，而是享受思想碰撞的火花。你兴趣广泛、适应力强，但有时也因"三分钟热度"而留下许多未完成的项目。',
    strengths: '极强的创新能力和发散思维，能快速想出多种解决方案；口才出色，善于即兴表达和辩论；适应力超群，在快速变化的环境中游刃有余；天生的创业精神，对机会有敏锐的嗅觉。',
    weaknesses: '容易对事物失去兴趣，导致很多项目半途而废；有时候辩论只是为了好玩而非解决问题，会让他人感到疲惫；不擅长处理重复性的日常事务；冲动之下可能做出不理智的决定。',
    work: '你适合在需要创新和变化的领域中发挥才能。不喜欢一尘不变的工作内容，需要持续的智力刺激。创业、咨询或创意行业是你的舞台。',
    love: '在感情中你充满激情和新鲜感，总能给伴侣带来惊喜。你欣赏能与你在智力上较量的伴侣，平淡无奇的关系会让你感到乏味。',
    growth: '学会将一个项目坚持到底，哪怕热情消退；有时闭嘴比辩论更重要；建立自己的日常习惯和纪律。',
    careers: '创业者、广告创意、律师，投资人、产品经理、演讲家、编剧',
  },
  INFJ: {
    title: '提倡者', emoji: '🌿', color: '#10b981',
    overview: 'INFJ型的人是最罕见的性格类型之一，你内心深邃、富有理想主义色彩。你拥有极强的直觉力和共情能力，常常能在他人尚未开口时便感知到他们的情绪和需求。你追求人生的意义和价值，渴望为世界带来积极的改变。你外表温和但内心坚定，对于自己相信的事情有着不屈的意志。',
    strengths: '极强的洞察力和直觉，能看透事物的本质和人的真实意图；富有同理心，是天生的倾听者和疗愈者；理想主义驱动，愿意为信念付出行动；创造力丰富，善于用文字或艺术表达内心世界。',
    weaknesses: '对自己和他人要求过高，容易陷入完美主义的焦虑；过于敏感，容易被他人的情绪影响和消耗；不喜欢冲突，有时会为了避免不愉快而压抑自己；偶尔会因为过度理想化而对现实感到失望。',
    work: '你需要在有意义的工作中找到满足感。适合从事能帮助他人或推动社会进步的领域。需要一定的独处时间来整理思绪和恢复精力。',
    love: '你在感情中追求灵魂层面的连接，对肤浅的关系不感兴趣。你全心全意地投入，期待同等的真诚和深度。你很会照顾伴侣的感受，但也需要对方理解你的内心世界。',
    growth: '学会设立边界，不是所有人的问题都需要你来解决；接受世界的不完美，完美主义是行动的最大敌人；适当表达自己的需求，不要总是扮演"照顾者"。',
    careers: '心理咨询师、作家、教育工作者、社工、人力资源、艺术家、医生',
  },
  INFP: {
    title: '调停者', emoji: '🕊️', color: '#ec4899',
    overview: 'INFP型的人是理想主义的守护者，你的内心世界如同一座充满美和善意的花园。你拥有强烈的价值观和信念，做任何事情都追随内心的声音。你温柔、忠诚且富有创造力，总能用独特的视角看待世界。虽然外表看起来安静含蓄，但内心燃烧着改变世界的热情。',
    strengths: '极强的创造力和想象力，能从平凡中发现不平凡的美；价值观坚定，不会为了利益而违背原则；对亲近的人无比忠诚和温柔，是最理想的倾听者和支持者；文字和艺术表达能力出色。',
    weaknesses: '过于理想化，现实与理想的落差容易让你受伤；难以接受批评，会把他人的意见当作对自我价值的否定；有时在行动前想得太多，陷入内耗；不善于处理实用的日常事务。',
    work: '你需要在能表达自我且有价值观认同的环境中工作。适合从事创造性、帮助性或需要深度的职业。金钱和地位不是你的主要驱动力。',
    love: '你在感情中浪漫而专注，渴望找到"灵魂伴侣"。会为爱付出很多，但也容易因为过度投入而受伤。你欣赏真诚、温柔且有深度的伴侣。',
    growth: '将梦想转化为具体的行动步骤；学会接受建设性的批评并将其视为成长的机会；照顾好自己的实际生活，脚踏实地才能让理想飞得更高。',
    careers: '作家、设计师、心理咨询师、教师，音乐家、插画师、非营利组织工作者',
  },
  ENFJ: {
    title: '主人公', emoji: '⭐', color: '#ef4444',
    overview: 'ENFJ型的人是天生的教育者和激励者，你充满魅力、富有同理心，总能准确地感知他人的需求并给予帮助。你拥有极强的沟通和引导能力，在人群中如同一盏明灯。你最大的满足来自于看到他人因为你的帮助而成长和进步。你对人际关系投入极深，但也因此容易忘记照顾自己。',
    strengths: '卓越的沟通和人际交往能力，善于建立信任和连接；极强的共情能力，能感受他人的情绪并给予恰当的回应；天生的领导力，但不同于ENTJ的命令式，你更偏向启发和激励；责任感强，对承诺的事情绝不敷衍。',
    weaknesses: '过于在意他人的感受和评价，容易因此忽视自己的需求；操心太多，总想帮所有人解决问题，导致自己精力透支；对批评敏感，把它当作对自己人格的否定；有时会用自己的价值观去要求别人。',
    work: '你适合从事能发挥人际优势和领导力的工作。在教育、辅导、团队管理和公共关系领域尤为出色。你渴望被需要和被认可。',
    love: '在感情中你热情、细心且忠诚，会不遗余力地经营关系。你是那种会记得每一个纪念日并为对方精心准备惊喜的人。需要的是一个能同样珍视你的付出的伴侣。',
    growth: '学会说"不"，你的精力不是无限的；花时间独处，倾听自己内心的声音；不是所有人都需要被拯救，尊重他人自己的成长节奏。',
    careers: '教师、培训师、心理咨询师、HR总监、政治家、主持人、公关经理',
  },
  ENFP: {
    title: '竞选者', emoji: '🎨', color: '#f97316',
    overview: 'ENFP型的人是热情的探索者，你的生活充满了好奇心和无限可能。你热爱与人交往，能在与不同人的互动中获得能量和灵感。你拥有惊人的创造力和发散思维，能看到别人看不到的连接和机会。自由和可能性是你最珍视的东西，任何形式的束缚都会让你想要逃离。',
    strengths: '极强的创造力和灵感，是团队中脑洞最活跃的人；热情洋溢、富有感染力，能鼓舞和带动周围的人；善于共情和理解他人，是受欢迎的倾听者和朋友；适应力强，能在变化中找到新的方向。',
    weaknesses: '注意力容易分散，可能同时开始很多事情却难以完成；情绪起伏较大，容易受环境和他人影响；对日常琐事缺乏耐心，不喜欢被规矩和流程束缚；有时过于理想化，低估现实困难。',
    work: '你需要一个充满变化、自由且有创造空间的工作环境。讨厌重复劳动和严格的规定。在需要想象力、人际沟通和灵活应变的岗位上发光发亮。',
    love: '在感情中你热情浪漫，总能用创意和真诚打动对方。你追求的是深入，真诚的连接，不喜欢游戏的套路。但你也需要个人空间，太粘人的关系会让你感到窒息。',
    growth: '学会聚焦，把热情转化为持续的行动；建立基本的规划和生活习惯，自由不等于随意；培养兑现承诺的能力，不要因为新鲜感而轻易放弃。',
    careers: '记者、创业者、心理咨询师、演员、广告创意、用户体验设计师、幼教',
  },

  ISTJ: {
    title: '物流师', emoji: '⚙️', color: '#64748b',
    overview: 'ISTJ型的人是秩序和规则的守护者，你严谨务实、踏实可靠。你喜欢用事实和数据说话，每一个决定背后都有充分的依据。在别人看来，你可能是最"靠谱"的那个人——答应的事一定做到，交付的工作一定达标。你不喜欢夸夸其谈，用行动而非言语来证明自己。传统和规则对你而言不是束缚，而是让世界有序运转的基石。',
    strengths: '极强的责任心和执行力，是团队中最值得信赖的成员；注重细节和数据，做事有迹可循、有据可查；持之以恒，有始有终，不会半途而废；客观公正，不偏不倚地对待每一个人和每一件事。',
    weaknesses: '可能因循守旧，对新事物和新方法持怀疑态度；不太擅长应对突发变化和不确定性；有时过于注重规则而忽略了人的情感需求；表达方式直接，可能无意中伤害他人。',
    work: '你在有明确流程和标准的工作环境中表现最出色。喜欢清晰的任务分工和可衡量的成果。混乱和不确定性会让你感到不适。',
    love: '在感情中你稳重且专一，用行动而非甜言蜜语来表达爱。你不会轻易承诺，但一旦承诺就绝不辜负。你需要的是一个能理解并尊重你需要秩序和稳定的伴侣。',
    growth: '保持开放的心态，新的方法不一定比旧的方法差；试着表达你的感受，身边的人需要知道你的想法；偶尔打破一下日常，小小的冒险会带来惊喜。',
    careers: '会计师、审计师、军人、法官、公务员，质量管理员、数据分析师',
  },
  ISFJ: {
    title: '守卫者', emoji: '🛡️', color: '#84cc16',
    overview: 'ISFJ型的人是默默守护的天使，你温柔细腻、忠诚可靠，总是在别人需要的时候伸出援手。你有着惊人的记忆力——不是记公式和数据，而是记得每个人喜欢什么、需要什么。你从不喜欢成为焦点，但却是让周围一切正常运转的"幕后英雄"。你的善良不是软弱，而是一种安静而坚定的力量。',
    strengths: '极强的责任心和奉献精神，是团队中最默默付出的那个人；细心体贴，善于发现并满足他人的需求；记忆力出色，特别擅长记住关于人的细节；脚踏实地，做事务实有条理。',
    weaknesses: '过于谦让，容易忽视和压抑自己的需求；害怕冲突和批评，有时会为了和谐而委屈自己；不太善于表达和争取，好的机会常常擦肩而过；对自己缺乏信心，低估自己的价值和能力。',
    work: '你适合在一个温暖、稳定且有明确价值的团队中工作。喜欢能切实帮助到他人的工作内容。需要被认可和感激的反馈来保持动力。',
    love: '在感情中你全心全意、无微不至，会记得每一个重要的日子和对方说过的每一句话。你渴望的是一段安稳、被珍视的长期关系。',
    growth: '学会说"我需要"，你的需求同样重要；不要害怕冲突，适度表达不同意见不会破坏关系；相信自己的能力，你比你想象的更有价值。',
    careers: '护士、教师、行政助理、社工、图书管理员、客服专员、档案管理员',
  },
  ESTJ: {
    title: '总经理', emoji: '📋', color: '#0ea5e9',
    overview: 'ESTJ型的人是高效的管理者和执行者，你喜欢把事情安排得井井有条。你有强大的组织能力和执行力，一旦制定了计划就会全力以赴地去完成。你诚实直率，讨厌拐弯抹角和效率低下的沟通方式。在团队中你往往是那个拍板的人——不是因为权力欲，而是因为你觉得"必须有人来做决定"。',
    strengths: '卓越的组织和管理能力，能将复杂任务分解为清晰的执行步骤；果断高效，不拖延、不纠结，是团队中的"定海神针"；诚实守信，言出必行，说到一定做到；务实理性，做决策基于事实而非情绪。',
    weaknesses: '有时过于强势，容易忽略他人的感受和不同意见；对规则和流程的依赖可能让你显得僵化；不太善于处理需要情感和直觉的事务；对自己和他人要求严格，可能给团队带来压力。',
    work: '你适合在需要强大执行力和组织能力的岗位上发挥所长。喜欢有清晰的结构和晋升通道的工作环境。管理岗位是你自然而然的方向。',
    love: '在感情中你同样认真负责，会把经营关系当作一个"项目"来对待。你欣赏诚实、可靠、有担当的伴侣。虽然不擅长甜言蜜语，但你会用行动证明你的在乎。',
    growth: '学会灵活变通，规则是为目标服务的，不是目标本身；多倾听、少下结论，别人的感受也值得被重视；偶尔放松一下，完美主义会让你错过很多乐趣。',
    careers: 'CEO、运营经理、项目经理、法官、军官、财务主管、学校校长',
  },
  ESFJ: {
    title: '执政官', emoji: '🤝', color: '#14b8a6',
    overview: 'ESFJ型的人是社交圈中的暖阳，你热心周到、善于照顾他人，总是第一个发现谁需要帮助的人。你拥有极强的社交直觉和组织能力，能让每个人都感到被关心、被重视。和谐的人际关系是你最大的动力源泉。你在朋友圈中是大家信赖的倾诉对象，因为你知道如何让人感到安心。',
    strengths: '极强的社交能力和人脉经营能力，是团队的"粘合剂"；细心周到，能关注到每个人的需求和感受；务实可靠，说到做到，让人放心；善于创造温暖和谐的氛围，让周围人感到舒适。',
    weaknesses: '过于在意他人的看法和评价，容易因此迷失自己；害怕冲突和被拒绝，有时会违背自己的意愿去取悦别人；对变化的适应能力相对较弱，喜欢熟悉的人和事；可能因为关注眼前的人际和谐而忽略了长远规划。',
    work: '你适合在需要人际互动和服务的领域中发光发热。喜欢一个有温暖氛围的团队。被需要和被感谢是你工作中最大的满足感。',
    love: '在感情中你体贴入微、用心经营，是理想的生活伴侣。你渴望稳定的婚姻和家庭生活，会不遗余力地让伴侣感到幸福。',
    growth: '学会问问自己想要什么，而不只是别人需要什么；不要因为害怕冲突而压抑真实想法；给自己一些独处的时间，了解内在的自我。',
    careers: '护士、教师、酒店管理、婚礼策划师、社工、客户经理、人事专员',
  },
  ISTP: {
    title: '鉴赏家', emoji: '🔧', color: '#a855f7',
    overview: 'ISTP型的人是冷静的实干家，你天生对"事物如何运作"有着浓厚的好奇心。你喜欢动手操作和亲身体验，相比理论更喜欢在实践中学习和验证。在危机中你异常冷静，能迅速分析形势并采取行动。你独立、务实，不喜欢被过多的规则和人情束缚。在别人慌成一团时，你往往是那个默默修好一切的人。',
    strengths: '极强的动手能力和技术天赋，能快速掌握各种工具和技能；在危机中保持冷静并迅速反应，是天生的"救火队员"；务实高效，不会被无关紧要的事情分散注意力；善于独立解决问题，不依赖他人。',
    weaknesses: '不善于表达情感和需求，容易让他人觉得难以接近；有时过于独立，不习惯也不喜欢寻求帮助；对长期规划和抽象概念兴趣不大，可能错过一些重要的发展机会；社交和团队协作不是你的强项。',
    work: '你适合需要动手能力和即时解决问题的技术类工作。喜欢自由和灵活的工作方式，讨厌冗长的会议和繁琐的报告。',
    love: '在感情中你是行动派，用"做"而非"说"来表达爱意。你需要一个能给你足够个人空间的伴侣。你不喜欢戏剧化的情感表达，更欣赏实在的陪伴。',
    growth: '偶尔走出舒适区，主动表达你的感受和想法；接受团队协作，一个人能走得快，但一群人能走得远；花点时间思考未来，规划不是浪费时间。',
    careers: '工程师、飞行员、外科医生、机械师，法医、消防员、程序员',
  },
  ISFP: {
    title: '探险家', emoji: '🌸', color: '#d946ef',
    overview: 'ISFP型的人是温柔的艺术灵魂，你用感官和心灵来体验这个世界。你拥有一双发现美的眼睛，能从最平凡的日常中找到诗意。你随和友善，不喜欢冲突和控制，更愿意给每个人空间做自己。你活在当下，享受此刻的美好，而不是活在计划和焦虑中。你的善良和审美让你成为最让人感到舒服的存在。',
    strengths: '极强的审美能力和艺术天赋，对色彩、形状和质感有天然的敏感度；随和友善、让人感到放松和舒服；真诚不伪装，做真实的自己；适应力强，能在变化中保持内心的平静。',
    weaknesses: '不太擅长口头表达自己的想法和感受；对批评特别敏感，容易因此退缩和封闭；缺乏长远的规划和目标，有时会因此错过重要的机会；倾向于逃避冲突和困难，而不是正面面对。',
    work: '你适合从事创意或手工艺类的工作，需要能发挥审美和动手能力的岗位。喜欢灵活的工作节奏和较少的人际压力。',
    love: '在感情中你温柔而浪漫，用行动和细节而非言语来表达爱意。你需要的是一个能给你安全感并欣赏你独特美感的伴侣。',
    growth: '试着用语言表达你的感受，身边的人需要听到；面对困难不逃避，每一次面对都是成长；为自己设定一些目标，方向感会让你更安心。',
    careers: '设计师、摄影师、花艺师、按摩师、兽医、画家、时尚设计',
  },
  ESTP: {
    title: '企业家', emoji: '🚀', color: '#eab308',
    overview: 'ESTP型的人是行动派的冒险家，你精力充沛、反应敏捷，能在瞬息万变的环境中抓住机会。你不喜欢纸上谈兵，更相信在实践中检验真理。在别人还在犹豫时你已经出手了——有时候成功，有时候学到经验。你的魅力和感染力让你在人群中闪闪发光，但你对刺激的追求也可能让你陷入麻烦。',
    strengths: '极强的行动力和执行力，想到就做，绝不犹豫；反应敏捷，在高压和紧急情况下表现出色；社交达人，能快速融入任何环境并建立关系；善于抓住商机和机会，有敏锐的市场嗅觉。',
    weaknesses: '容易冲动，不经深思熟虑就做出决定；对长期规划和抽象概念缺乏耐心；有时为了刺激和冒险而忽视了风险和安全；三分钟热度，对一件事情的热情可能很快消退。',
    work: '你适合快节奏、充满变化和挑战的工作环境。销售、创业、应急响应等需要快速反应和决策的岗位是你的舞台。',
    love: '在感情中你充满激情和活力，总能让关系保持新鲜感。你喜欢和伴侣一起尝试新事物，讨厌平淡和例行公事。但你需要的是一个能接受你的冒险精神同时也给你安全感的人。',
    growth: '做重要决定前多思考一步，投资式的耐心比投机式的冲动更长久；培养完成一件事情的习惯，坚持本身就是一种能力；关注身边人的感受，你的行动力对某些人来说可能是压力。',
    careers: '销售总监、创业者、急救员、运动员、演员，投资交易员、特警',
  },
  ESFP: {
    title: '表演者', emoji: '🎭', color: '#f43f5e',
    overview: 'ESFP型的人是生活的表演者，你活力四射、享受当下，是人群中的开心果。你对美和快乐有着天生的追求，总能发现生活中的乐趣并感染身边的人。你喜欢成为注意力的中心——不是因为虚荣，而是因为你真的很善于给人带来快乐。你对生活充满热情，愿意尝试一切新鲜有趣的事物。',
    strengths: '极强的社交能力和感染力，能让任何场合活跃起来；乐观积极、随遇而安，是团队的"欢乐源泉"；观察力敏锐，善于捕捉他人的情绪和需求；善于发现美和享受生活，有良好的审美和生活品味。',
    weaknesses: '注意力容易分散，难以坚持完成长期任务；比较在意他人的关注和认可，容易被外界评价影响；有时过于追求当下的快乐，忽略了长远影响；不擅长处理需要深度分析和抽象思维的问题。',
    work: '你适合从事需要人际互动和创造力的工作。喜欢热闹、有趣的工作环境。表演、服务、时尚等让你展现自我的领域是你的菜。',
    love: '在感情中你热情洋溢、充满惊喜，总会让伴侣感受到被爱和被关注。你需要一个能陪伴你体验生活、享受当下的伴侣，但同时也能在必要时给予你稳定的支持。',
    growth: '学会延迟满足，眼前的快乐有时需要为长远的目标让路；独立思考，不要过度依赖外界的反馈来确认自我价值；培养耐心和坚持，有些美好的事物需要时间来沉淀。',
    careers: '演员、歌手、健身教练、导游、销售、活动策划、时尚博主',
  },
};

const ZODIAC_PROFILES = {
  aries: {
    name: '白羊座', emoji: '♈', dateRange: '3/21 - 4/19', element: '火象', ruler: '火星',
    overview: '白羊座是十二星座的开端，像初春的第一缕阳光，充满蓬勃的生命力和开拓精神。你勇敢直率、敢作敢为，有着天生的竞争意识和不服输的劲头。你不喜欢拐弯抹角和犹豫不决，想到就去做是你的风格。虽然有时候显得冲动，但你的真诚和热情让人很难不喜欢你。',
    traits: '勇敢、直率、热情、行动力强、竞争意识强；但也可能冲动、缺乏耐心、容易急躁。',
    love: '在感情中你热烈真诚，爱就大声说出来，不玩暧昧。你需要一个能跟上你节奏的伴侣。',
    work: '适合开创性的工作，能发挥你的冲劲和领导力。创业、销售、竞技体育都很适合。',
  },
  taurus: {
    name: '金牛座', emoji: '♉', dateRange: '4/20 - 5/20', element: '土象', ruler: '金星',
    overview: '金牛座如同春日里沉实的大地，稳重而有力量。你追求稳定和品质，对美好事物有着天然的鉴赏力。你坚定且有耐心，一旦认定了目标就会一步一步地走下去。别人说你慢，其实你只是在稳稳地走；别人说你固执，其实你比谁都清楚什么值得坚持。',
    traits: '稳重、忠诚、有耐心、审美力强、务实；但也可能固执、占有欲强、不爱改变。',
    love: '在感情中你专一而深情，慢热但长久。你需要的是一个能给你安全感并能一起享受生活的伴侣。',
    work: '适合需要耐心和坚持的工作。金融、艺术、餐饮、建筑领域是你的长项。',
  },
  gemini: {
    name: '双子座', emoji: '♊', dateRange: '5/21 - 6/21', element: '风象', ruler: '水星',
    overview: '双子座是十二星座中最灵动的存在，你聪明机敏、好奇心旺盛，像春末夏初的风一样轻盈多变。你善于沟通和学习，能快速掌握新知识并在不同话题之间自如切换。你的头脑里仿佛有两个人在同时思考，总能从不同角度看待问题。',
    traits: '聪明、口才好、适应力强、好奇心旺盛、多才多艺；但也可能善变、注意力分散、不够深入。',
    love: '在感情中你需要智力上的刺激和新鲜感。你欣赏聪慧有趣、能和你聊到天亮的伴侣。',
    work: '适合需要沟通、创意和灵活性的工作。传媒、教育、销售、写作领域很匹配。',
  },
  cancer: {
    name: '巨蟹座', emoji: '♋', dateRange: '6/22 - 7/22', element: '水象', ruler: '月亮',
    overview: '巨蟹座是十二星座中最温暖的存在，你情感细腻、忠诚顾家。你有着极强的记忆力和保护欲，尤其是对亲近的人。你的情绪如月亮的盈亏一般细腻而丰富，有时连你自己也说不清为什么突然忧伤或幸福。你建造的"家"不只是房子，是让人感到安全的港湾。',
    traits: '温柔、顾家、忠诚、情感细腻、直觉力强；但也可能情绪化、过于敏感、自我保护意识过强。',
    love: '在感情中你会把伴侣当作家人来照顾，体贴入微。你需要的是一个能理解你情绪波动并给予安全感的伴侣。',
    work: '适合需要同理心和细致关怀的工作。教育、护理、心理咨询、餐饮行业很合适。',
  },
  leo: {
    name: '狮子座', emoji: '♌', dateRange: '7/23 - 8/22', element: '火象', ruler: '太阳',
    overview: '狮子座是十二星座中的王者，你自信大方，光芒四射，像盛夏的太阳一样让人无法忽视。你拥有天生的领导力和气场，在人群中自然而然会成为焦点。你慷慨大气、重情重义，对认可的人会倾尽所有。你需要被认可和赞美，这不是虚荣，而是你持续发光的动力源泉。',
    traits: '自信、慷慨、有领导力、热情忠诚、创造力强；但也可能自负、爱面子、控制欲强。',
    love: '在感情中你热情而忠诚，喜欢浪漫和仪式感。你需要的是一个能欣赏你光芒同时也让你感到被爱的伴侣。',
    work: '适合需要展示和领导力的工作。演艺、管理、创业、奢侈品行业是你的主场。',
  },
  virgo: {
    name: '处女座', emoji: '♍', dateRange: '8/23 - 9/22', element: '土象', ruler: '水星',
    overview: '处女座是十二星座中最细致的匠人，你追求完美和精确，有着一双善于发现问题的眼睛。你思维缜密、逻辑清晰，做事有条不紊。你对细节的关注让人惊叹——别人忽略的地方，你一眼就能看出问题。你不是在挑剔，而是发自内心地希望一切都能变得更好。',
    traits: '细腻、严谨、分析力强、务实可靠、服务精神；但也可能过于挑剔、焦虑、钻牛角尖。',
    love: '在感情中你也许不善于甜言蜜语，但会用行动默默照顾对方的一切。你需要的是一个能理解你的"挑剔"其实是关心的伴侣。',
    work: '适合需要精确和细致的工作。医疗、数据分析、编辑、品质管理、研究员一骑绝尘。',
  },
  libra: {
    name: '天秤座', emoji: '♎', dateRange: '9/23 - 10/23', element: '风象', ruler: '金星',
    overview: '天秤座是十二星座中的优雅使者，你追求平衡与和谐，对美好事物有着与生俱来的品味。你善于从多个角度看待问题，总是试图找到最公平的解决方案。你是天生的社交家，懂得如何让每个人都感到舒适。不过这种对平衡的追求有时也会让你陷入犹豫不决的困境——因为每个选项看起来都有道理。',
    traits: '优雅、公正、有品味、善于社交、追求和谐；但也可能犹豫不决、过度依赖外界认可、难以拒绝。',
    love: '在感情中你追求精神和审美的契合，渴望一段优雅而平等的关系。你需要一个能与你在思想和品味上共鸣的伴侣。',
    work: '适合需要审美和人际协调的工作。设计、法律、外交、时尚、公关领域很合适。',
  },
  scorpio: {
    name: '天蝎座', emoji: '♏', dateRange: '10/24 - 11/22', element: '水象', ruler: '冥王星',
    overview: '天蝎座是十二星座中最深邃的存在，你神秘、敏锐且有着惊人的洞察力。你擅长看透表象直达本质，很多事情都逃不过你的眼睛。你不喜欢肤浅的交流，渴望真实和深度。你的情感如同一座冰山——表面平静，水下却蕴藏着巨大的能量。一旦你决定信任一个人，会付出全部的忠诚。',
    traits: '深邃、敏锐、意志坚定、忠诚、洞察力强；但也可能多疑、占有欲强、极端、不轻易释怀。',
    love: '在感情中你投入且专注，爱就是全身心的交付。你需要的是一个值得你信任并能与你灵魂对话的伴侣。',
    work: '适合需要深度分析和洞察力的工作。心理学、侦探、科研，投资、医学领域是你的强项。',
  },
  sagittarius: {
    name: '射手座', emoji: '♐', dateRange: '11/23 - 12/21', element: '火象', ruler: '木星',
    overview: '射手座是十二星座中最自由的灵魂，你乐观开朗、热爱冒险和探索。你的世界没有国界，你对未知的事物永远保持热情和好奇心。你不喜欢被束缚——无论是物理上的还是精神上的。你是一个天生的人生哲学爱好者，总是在旅途中思考人生的意义。不过有时候话说得太直，可能不小心伤到别人。',
    traits: '乐观、自由、幽默、热爱探索、思想开放；但也可能粗心大意、不够稳重、说话太直、不安定的感觉。',
    love: '在感情中你追求轻松快乐的关系，不喜欢太沉重的情感绑架。你需要的是一个能陪你一起看世界的伴侣。',
    work: '适合需要自由和探索的工作。旅行、教育、出版、外贸、哲学领域是你的天下。',
  },
  capricorn: {
    name: '摩羯座', emoji: '♑', dateRange: '12/22 - 1/19', element: '土象', ruler: '土星',
    overview: '摩羯座是十二星座中最坚韧的攀登者，你踏实稳重、目标感极强，有着超乎常人的耐力和自律。你知道成功没有捷径，所以愿意付出比任何人都多的努力。你不喜欢抱怨，也不擅长表达情感，但你的行动比任何人都更有说服力。时间是你最好的朋友——你在沉默中积累，在忍耐中成长。',
    traits: '踏实、自律、有责任感、意志坚定、目标导向；但也可能过于严肃、工作狂、不善表达情感、对自己和他人苛刻。',
    love: '在感情中你虽然不善表达，但极度负责和忠诚。你需要的是一个能理解你沉默是表达方式的伴侣。',
    work: '适合需要耐力和规划的长期性工作。管理、工程、金融、建筑，政府工作是你的主场。',
  },
  aquarius: {
    name: '水瓶座', emoji: '♒', dateRange: '1/20 - 2/18', element: '风象', ruler: '天王星',
    overview: '水瓶座是十二星座中的革新者，你独立、前卫且有着独特的思维方式。你从不盲从潮流，因为你本身就是潮流的创造者。你关注社会议题和人类的未来，有着超越个体的宏大视野。你对朋友真诚且忠诚，但同时又保持着距离感——这种矛盾正是你独特魅力的来源。',
    traits: '独立、创新、理性、博爱，前瞻性强；但也可能疏离、叛逆、情绪波动大、难以捉摸。',
    love: '在感情中你需要智力和精神上的共鸣多过日常的甜蜜。你需要的是一个能尊重你的独立空间的伴侣。',
    work: '适合需要创新和独立思考的工作。科技、设计、公益、科学研究领域是你的天下。',
  },
  pisces: {
    name: '双鱼座', emoji: '♓', dateRange: '2/19 - 3/20', element: '水象', ruler: '海王星',
    overview: '双鱼座是十二星座中最浪漫的梦想家，你温柔、感性且富有极强的想象力和共情能力。你就像一个行走的情感探测器，能精准感知周围每个人的情绪波动。你的内心世界如同深邃的海洋，住着无数的梦想和故事。艺术和音乐是你的灵魂语言，现实世界的粗糙有时会让你想要逃离。',
    traits: '温柔、有想象力、富有同理心、艺术天赋强、直觉力强；但也可能过于敏感、逃避现实、容易受伤、边界模糊。',
    love: '在感情中你浪漫至极，愿意为爱付出一切。你需要的是一个能保护你脆弱内心并能理解你梦想的伴侣。',
    work: '适合需要创意和情感表达的工作。艺术，音乐、心理咨询、公益、影视行业是你的灵魂所向。',
  },
};

const AVATAR_MOTIFS = {
  INTJ: { shapes: ['hexagon', 'lines'], secondary: '#312e81' },
  INTP: { shapes: ['circles', 'dots'], secondary: '#4c1d95' },
  ENTJ: { shapes: ['diamond', 'rays'], secondary: '#92400e' },
  ENTP: { shapes: ['star', 'spiral'], secondary: '#9a3412' },
  INFJ: { shapes: ['leaf', 'glow'], secondary: '#064e3b' },
  INFP: { shapes: ['flower', 'wave'], secondary: '#831843' },
  ENFJ: { shapes: ['sun', 'heart'], secondary: '#7f1d1d' },
  ENFP: { shapes: ['sparkle', 'rainbow'], secondary: '#9a3412' },
  ISTJ: { shapes: ['grid', 'square'], secondary: '#334155' },
  ISFJ: { shapes: ['shield', 'circle'], secondary: '#365314' },
  ESTJ: { shapes: ['compass', 'block'], secondary: '#0c4a6e' },
  ESFJ: { shapes: ['people', 'ring'], secondary: '#115e59' },
  ISTP: { shapes: ['gear', 'cross'], secondary: '#581c87' },
  ISFP: { shapes: ['petal', 'moon'], secondary: '#701a75' },
  ESTP: { shapes: ['bolt', 'arrow'], secondary: '#854d0e' },
  ESFP: { shapes: ['burst', 'confetti'], secondary: '#881337' },
};

const generateAvatarSVG = (mbti) => {
  const profile = MBTI_PROFILES[mbti];
  if (!profile) return '';
  return `/uploads/mbti-avatars/${mbti.toLowerCase()}.png?t=${Date.now()}`;
};

const getCombinedAnalysis = (mbti, zodiac) => {
  if (!mbti || !zodiac) return null;
  const mbtiProfile = MBTI_PROFILES[mbti];
  const zodProfile = ZODIAC_PROFILES[zodiac];
  if (!mbtiProfile || !zodProfile) return null;

  const mbtiTitle = mbtiProfile.title;
  const zodName = zodProfile.name;
  const element = zodProfile.element;

  const elementMatches = {
    '火象': { desc: `你的${zodName}属于火象星座，火象特质赋予你热情和行动力，这与${mbtiTitle}的果断和目标导向相辅相成。你是一个既有大局观又能快速行动的人，在团队中往往是开拓者和推动者。但火象的冲动也可能让你在一些时候跟${mbtiTitle}的谨慎思维发生冲突，这是你需要平衡的地方。` },
    '土象': { desc: `你的${zodName}属于土象星座，土象特质赋予你稳重和耐力，这与${mbtiTitle}的分析能力结合，让你成为一个既严肃又有鉴赏力的人。你做事踏实，不轻易冒险，但一旦决定就会坚持到底。土象的固执和${mbtiTitle}的原则性叠加时，记得给自己留一点弹性空间。` },
    '风象': { desc: `你的${zodName}属于风象星座，风象特质赋予你灵活和沟通能力，这与${mbtiTitle}的智力特质相结合，让你成为一个思维敏捷、善于表达的人。你能在不同观点之间自如切换，是天生的沟通者和创意人。不过风象的善变和${mbtiTitle}的深度思考可能会有拉锯，适时停下来深入一个方向会更好。` },
    '水象': { desc: `你的${zodName}属于水象星座，水象特质赋予你深刻的感情和直觉力，这与${mbtiTitle}的洞察力相结合，让你成为一个既有感性深度又能理性分析的人。你能感知他人的情绪，同时也能保持自己的判断。但水象的敏感和${mbtiTitle}的深思叠加时，可能会走向过度内耗，记得关照自己的情绪健康。` },
  };

  return {
    mbtiProfile,
    zodProfile,
    elementAnalysis: elementMatches[element]?.desc || '',
  };
};

function MBTITest() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState('intro');
  const [testMode, setTestMode] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [selectedZodiac, setSelectedZodiac] = useState('');
  const [savedMbti, setSavedMbti] = useState('');
  const [savedZodiac, setSavedZodiac] = useState('');
  const [saving, setSaving] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [fetchError, setFetchError] = useState('');
  const [toast, setToast] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [generatingAvatar, setGeneratingAvatar] = useState(false);
  const [generatedAvatarUrl, setGeneratedAvatarUrl] = useState('');
  const [avatarSaving, setAvatarSaving] = useState(false);
  const [cardKey, setCardKey] = useState(0);

  const showToast = (message, type) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    if (!loading && user && user.pet) {
      if (user.pet.mbti) setSavedMbti(user.pet.mbti);
      if (user.pet.zodiac) {
        setSavedZodiac(user.pet.zodiac);
        setSelectedZodiac(user.pet.zodiac);
      }
    }
  }, [user, loading]);

  const fetchQuestions = useCallback(async (mode) => {
    setFetching(true);
    setFetchError('');
    try {
      const res = await axios.get('/api/mbti/questions', { params: { mode } });
      if (res.data.questions?.length > 0) {
        setQuestions(res.data.questions);
        return true;
      }
      setFetchError('题库尚未初始化，请联系管理员');
      return false;
    } catch (err) {
      setFetchError(err.response?.data?.message || '获取题库失败');
      return false;
    } finally { setFetching(false); }
  }, []);

  const startTest = async (mode) => {
    setTestMode(mode);
    const ok = await fetchQuestions(mode);
    if (ok) { setStep('testing'); setCurrentIdx(0); setAnswers({}); setResult(null); }
  };

  const selectAnswer = (value) => {
    const q = questions[currentIdx];
    const newAnswers = { ...answers, [q._id]: value };
    setAnswers(newAnswers);
    if (currentIdx < questions.length - 1) {
      setCardKey(prev => prev + 1);
      setTimeout(() => setCurrentIdx(prev => prev + 1), 200);
    } else {
      setTimeout(() => calculateResult(newAnswers), 100);
    }
  };

  const prevQuestion = () => {
    if (currentIdx > 0) {
      setCardKey(prev => prev + 1);
      setTimeout(() => setCurrentIdx(prev => prev - 1), 200);
    }
  };

  const calculateResult = (finalAnswers) => {
    const scores = { E: 0, I: 0, S: 0, N: 0, T: 0, F: 0, J: 0, P: 0 };
    const dimTotals = { EI: 0, SN: 0, TF: 0, JP: 0 };
    const opposite = { E: 'I', I: 'E', S: 'N', N: 'S', T: 'F', F: 'T', J: 'P', P: 'J' };
    questions.forEach(q => {
      const raw = finalAnswers[q._id];
      if (raw === undefined || raw === null) return;
      if (raw > 0) scores[q.traitA] += raw;
      else scores[opposite[q.traitA]] += Math.abs(raw);
      dimTotals[q.dimension] += Math.abs(raw);
    });
    const totalPossible = questions.reduce((s, q) => s + 3, 0) / 4;
    const percentages = {};
    Object.keys(dimTotals).forEach(d => { percentages[d] = dimTotals[d] > 0 ? Math.round((dimTotals[d] / totalPossible) * 100) : 0; });
    const type = [scores.E >= scores.I ? 'E' : 'I', scores.S >= scores.N ? 'S' : 'N', scores.T >= scores.F ? 'T' : 'F', scores.J >= scores.P ? 'J' : 'P'].join('');
    setResult({ type, scores, percentages, dimTotals });
    setStep('result');
    setActiveTab('overview');
  };

  const saveMBTI = async () => {
    if (!user) { showToast('请先登录再保存', 'error'); return; }
    setSaving(true);
    try {
      await axios.put('/api/settings/my-pet/mbti', { mbti: result.type });
      setSavedMbti(result.type);
      window.dispatchEvent(new CustomEvent('pet-refresh'));
      if (selectedZodiac) await saveZodiacInternal();
      else showToast('性格标签已保存到你的宠物上！', 'success');
    } catch (err) {
      showToast('保存失败：' + (err.response?.data?.message || '网络错误'), 'error');
    } finally { setSaving(false); }
  };

  const saveZodiacInternal = async () => {
    try {
      await axios.put('/api/settings/my-pet/zodiac', { zodiac: selectedZodiac });
      setSavedZodiac(selectedZodiac);
      window.dispatchEvent(new CustomEvent('pet-refresh'));
    } catch (_) {}
  };

  const saveZodiacOnly = async () => {
    if (!user) { showToast('请先登录再保存', 'error'); return; }
    setSaving(true);
    try {
      await axios.put('/api/settings/my-pet/zodiac', { zodiac: selectedZodiac });
      setSavedZodiac(selectedZodiac);
      window.dispatchEvent(new CustomEvent('pet-refresh'));
      showToast('星座已保存！', 'success');
    } catch (err) {
      showToast('保存失败', 'error');
    } finally { setSaving(false); }
  };

  const generateAvatar = () => {
    if (!result) return;
    setGeneratingAvatar(true);
    setTimeout(() => {
      try {
        const avatarUrl = generateAvatarSVG(result.type);
        if (avatarUrl) {
          setGeneratedAvatarUrl(avatarUrl);
          showToast('专属头像已生成！', 'success');
        } else {
          showToast('暂未找到该类型的头像，请在后台上传', 'error');
        }
      } catch (error) {
        showToast('头像生成失败，请稍后再试', 'error');
      } finally { setGeneratingAvatar(false); }
    }, 300);
  };

  const saveAvatarAsPet = async () => {
    if (!user || !generatedAvatarUrl) return;
    setAvatarSaving(true);
    try {
      const blob = await (await fetch(generatedAvatarUrl)).blob();
      const formData = new FormData();
      formData.append('avatar', blob, 'mbti-avatar.png');
      await axios.post('/api/settings/my-pet/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      window.dispatchEvent(new CustomEvent('pet-refresh'));
      showToast('头像已设为宠物头像！', 'success');
    } catch (err) {
      showToast(err.response?.data?.message || '设置头像失败', 'error');
    } finally { setAvatarSaving(false); }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#fbfbfd] to-[#f5f5f7]">
        <div className="w-12 h-12 rounded-full border-[3px] border-[#e5e5ea] border-t-indigo-400 animate-spin"></div>
      </div>
    );
  }

  const answeredCount = Object.keys(answers).length;
  const progress = questions.length > 0 ? Math.round((answeredCount / questions.length) * 100) : 0;
  const currentQ = questions[currentIdx];
  const combinedAnalysis = result ? getCombinedAnalysis(result.type, selectedZodiac || savedZodiac) : null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#fbfbfd] to-[#f5f5f7] py-20">
      <div className="max-w-[540px] mx-auto px-5">

        {/* ─────────── INTRO STEP ─────────── */}
        {step === 'intro' && (
          <div className="mbti-fade-in">
            <div className="bg-white rounded-[32px] overflow-hidden"
              style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.06), 0 2px 8px rgba(0,0,0,0.04), 0 0 0 1px rgba(0,0,0,0.04)' }}>
              <div className="h-1.5 bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400"></div>
              <div className="px-9 pt-8 pb-8">

                <div className="flex items-center justify-center mb-6">
                  <div className="w-20 h-20 rounded-[22px] flex items-center justify-center"
                    style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.12), rgba(139,92,246,0.12))' }}>
                    <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="url(#mbti-grad)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                      <defs><linearGradient id="mbti-grad" x1="0" y1="0" x2="24" y2="24"><stop stopColor="#6366f1"/><stop offset="1" stopColor="#8b5cf6"/></linearGradient></defs>
                      <path d="M12 2a5 5 0 0 0-5 5v1a5 5 0 0 0 10 0V7a5 5 0 0 0-5-5z"/>
                      <path d="M7 14a5 5 0 0 0 10 0"/>
                      <circle cx="12" cy="12" r="10"/>
                      <circle cx="12" cy="12" r="3"/>
                      <circle cx="12" cy="12" r="0.8" fill="url(#mbti-grad)"/>
                    </svg>
                  </div>
                </div>

                <h1 className="text-[28px] font-semibold tracking-[-0.02em] text-[#1d1d1f] text-center mb-2">
                  性格探索之旅
                </h1>
                <p className="text-[15px] text-[#86868b] text-center mb-2 max-w-[380px] mx-auto leading-relaxed">
                  结合 MBTI 与星座，解锁你独特的性格密码
                </p>
                <p className="text-[13px] text-[#6e6e73] text-center mb-8">
                  每个问题都没有标准答案 — 跟随你的直觉选择即可
                </p>

                {savedMbti && MBTI_PROFILES[savedMbti] && (
                  <div className="mb-6 p-4 rounded-2xl bg-[#f5f5f7] border border-[#e8e8ed] mbti-stagger">
                    <p className="text-[11px] text-[#86868b] mb-2 uppercase tracking-[0.05em] font-semibold">你的上次结果</p>
                    <div className="flex items-center justify-center gap-3 flex-wrap">
                      <span className="text-2xl">{MBTI_PROFILES[savedMbti].emoji}</span>
                      <span className="text-2xl font-bold tracking-tight" style={{ color: MBTI_PROFILES[savedMbti].color }}>{savedMbti}</span>
                      <span className="text-sm text-[#6e6e73]">{MBTI_PROFILES[savedMbti].title}</span>
                    </div>
                  </div>
                )}

                <div className="mb-7">
                  <p className="text-[13px] text-[#1d1d1f] mb-3 font-semibold">你的星座 <span className="text-[#86868b] font-normal">（可选）</span></p>
                  <div className="grid grid-cols-4 gap-2">
                    {Object.entries(ZODIAC_PROFILES).map(([key, zod]) => (
                      <button key={key}
                        onClick={() => setSelectedZodiac(selectedZodiac === key ? '' : key)}
                        className={'p-2.5 rounded-2xl text-center transition-all duration-200 ' + (
                          selectedZodiac === key
                            ? 'bg-gradient-to-br from-indigo-400 via-purple-400 to-pink-400 text-white shadow-[0_4px_12px_rgba(99,102,241,0.3)] scale-[1.05]'
                            : 'bg-[#f5f5f7] text-[#4a3728] hover:bg-[#e8e8ed] active:scale-95'
                        )}>
                        <div className="text-lg mb-0.5">{zod.emoji}</div>
                        <div className="text-[10px] font-medium">{zod.name}</div>
                      </button>
                    ))}
                  </div>
                  {selectedZodiac && !savedMbti && user && (
                    <button onClick={saveZodiacOnly} disabled={saving}
                      className="mt-3 text-[13px] text-indigo-500 font-medium hover:text-purple-500 transition-colors">
                      {saving ? '保存中...' : '仅保存星座信息'}
                    </button>
                  )}
                </div>

                {fetchError && (
                  <div className="mb-6 p-4 bg-red-50 rounded-2xl text-red-500 text-[13px] border border-red-100">{fetchError}</div>
                )}

                <p className="text-[13px] text-[#1d1d1f] mb-4 font-semibold">选择测试模式</p>
                <div className="grid grid-cols-2 gap-3 mb-2">
                  <button onClick={() => startTest('express')} disabled={fetching}
                    className="group p-5 rounded-2xl bg-[#f5f5f7] hover:bg-white transition-all text-left border border-transparent hover:border-[#e8e8ed] active:scale-[0.97]"
                    style={{ hover: { boxShadow: '0 8px 30px rgba(0,0,0,0.06)' } }}>
                    <div className="w-10 h-10 rounded-xl mb-3 flex items-center justify-center"
                      style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(139,92,246,0.15))' }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
                    </div>
                    <div className="font-semibold text-[15px] text-[#1d1d1f] mb-0.5">极速版</div>
                    <div className="text-[12px] text-[#86868b]">约 20 题 · 2–3 分钟</div>
                  </button>
                  <button onClick={() => startTest('professional')} disabled={fetching}
                    className="group p-5 rounded-2xl bg-[#f5f5f7] hover:bg-white transition-all text-left border border-transparent hover:border-[#e8e8ed] active:scale-[0.97]"
                    style={{ hover: { boxShadow: '0 8px 30px rgba(0,0,0,0.06)' } }}>
                    <div className="w-10 h-10 rounded-xl mb-3 flex items-center justify-center"
                      style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(139,92,246,0.15))' }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>
                    </div>
                    <div className="font-semibold text-[15px] text-[#1d1d1f] mb-0.5">专业版</div>
                    <div className="text-[12px] text-[#86868b]">约 60 题 · 6–10 分钟</div>
                  </button>
                </div>
                {fetching && (
                  <div className="flex items-center justify-center gap-2.5 text-indigo-500 text-[13px] mt-1">
                    <div className="w-4 h-4 rounded-full border-2 border-[#e5e5ea] border-t-indigo-400 animate-spin"></div>
                    正在加载题库…
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ─────────── TESTING STEP ─────────── */}
        {step === 'testing' && currentQ && (
          <div key={cardKey} className="mbti-card-enter">
            <div className="bg-white rounded-[32px] overflow-hidden"
              style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.06), 0 2px 8px rgba(0,0,0,0.04), 0 0 0 1px rgba(0,0,0,0.04)' }}>
              <div className="h-1.5 bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400"></div>
              <div className="px-8 pt-7 pb-8">

                <div className="mb-7">
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-3">
                      <span className="text-[13px] font-semibold text-[#1d1d1f]">
                        {currentIdx + 1}<span className="text-[#86868b] font-normal"> / {questions.length}</span>
                      </span>
                      <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full text-white"
                        style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                        {testMode === 'express' ? '极速' : '专业'}
                      </span>
                    </div>
                    <span className="text-[11px] font-medium px-3 py-1 rounded-full bg-[#f5f5f7] text-[#6e6e73]">
                      {DIM_LABELS[currentQ.dimension]}
                    </span>
                  </div>
                  <div className="w-full h-1 bg-[#e5e5ea] rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-500 ease-out bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400"
                      style={{ width: progress + '%' }}></div>
                  </div>
                </div>

                <h2 className="text-[21px] font-semibold text-[#1d1d1f] text-center leading-relaxed mb-8 tracking-[-0.015em] max-w-[460px] mx-auto">
                  {currentQ.text}
                </h2>

                <div className="flex items-stretch gap-4 mb-8">
                  <div className="flex-1 bg-[#f5f5f7] rounded-2xl p-4 flex items-center justify-center text-center border border-[#edede8] min-h-[72px]">
                    <p className="text-[13px] font-medium text-[#1d1d1f] leading-snug">{currentQ.poleA}</p>
                  </div>
                  <div className="flex items-center">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#d2d2d7" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>
                  </div>
                  <div className="flex-1 bg-[#f5f5f7] rounded-2xl p-4 flex items-center justify-center text-center border border-[#edede8] min-h-[72px]">
                    <p className="text-[13px] font-medium text-[#1d1d1f] leading-snug">{currentQ.poleB}</p>
                  </div>
                </div>

                <p className="text-[11px] text-[#86868b] text-center mb-4 font-medium tracking-[0.02em] uppercase">选择倾向程度</p>

                <div className="flex items-center justify-between mb-1 px-2">
                  <span className="text-[11px] font-semibold text-emerald-500 tracking-[0.01em]">更倾向左侧</span>
                  <span className="text-[11px] font-semibold text-purple-500 tracking-[0.01em]">更倾向右侧</span>
                </div>

                <div className="flex items-center justify-center gap-2 mb-8">
                  {SCALE_DOTS.map((dot) => {
                    const isSelected = answers[currentQ._id] === dot.value;
                    const isLeft = dot.value > 0;
                    let selectedBg, selectedShadow, hoverBg;
                    if (isLeft) {
                      selectedBg = 'linear-gradient(135deg, #34C759, #30B44D)';
                      selectedShadow = '0 6px 18px rgba(52,199,89,0.35)';
                      hoverBg = 'rgba(52,199,89,0.08)';
                    } else {
                      selectedBg = 'linear-gradient(135deg, #AF52DE, #8944C4)';
                      selectedShadow = '0 6px 18px rgba(175,82,222,0.35)';
                      hoverBg = 'rgba(175,82,222,0.08)';
                    }
                    return (
                      <button key={dot.value}
                        onClick={() => selectAnswer(dot.value)}
                        className="relative rounded-full flex items-center justify-center cursor-pointer select-none transition-transform duration-150 ease-out"
                        style={{
                          width: dot.size + 'px',
                          height: dot.size + 'px',
                          fontSize: dot.fontSize + 'px',
                          fontWeight: 600,
                          minWidth: '44px',
                          minHeight: '44px',
                          background: isSelected ? selectedBg : '#f5f5f7',
                          color: isSelected ? 'white' : '#86868b',
                          border: isSelected ? 'none' : '2px solid #e8e8ed',
                          boxShadow: isSelected ? selectedShadow : 'none',
                          transform: isSelected ? 'scale(1.08)' : 'scale(1)',
                          zIndex: isSelected ? 2 : 0,
                        }}
                        onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = '#e8e8ed'; }}
                        onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = '#f5f5f7'; }}
                      >
                        {Math.abs(dot.value)}
                      </button>
                    );
                  })}
                </div>

                <div className="flex items-center justify-between pt-5 border-t border-[#f0f0f5]">
                  <button onClick={prevQuestion}
                    disabled={currentIdx === 0}
                    className="flex items-center gap-1.5 px-3 py-2.5 text-[13px] text-[#6e6e73] hover:text-[#1d1d1f] transition-colors disabled:opacity-25 disabled:cursor-not-allowed font-medium rounded-full hover:bg-[#f5f5f7]">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
                    上一题
                  </button>
                  <div className="flex gap-1.5 items-center">
                    {questions.map((_, i) => (
                      <div key={i}
                        className={'rounded-full transition-all duration-300 ' + (
                          i === currentIdx
                            ? 'w-5 h-1.5 bg-gradient-to-r from-indigo-400 to-purple-400'
                            : answers[questions[i]._id] !== undefined
                              ? 'w-1.5 h-1.5 bg-indigo-300/50'
                              : 'w-1.5 h-1.5 bg-[#e5e5ea]'
                        )}></div>
                    ))}
                  </div>
                  <span className="text-[12px] text-[#86868b] font-medium w-10 text-right tabular-nums">{progress}%</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ─────────── RESULT STEP ─────────── */}
        {step === 'result' && result && MBTI_PROFILES[result.type] && (
          <div className="mbti-fade-in">
            <div className="bg-white rounded-[32px] overflow-hidden"
              style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.06), 0 2px 8px rgba(0,0,0,0.04), 0 0 0 1px rgba(0,0,0,0.04)' }}>
              <div className="h-1.5 bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400"></div>
              <div className="px-8 pt-7 pb-8">

                <div className="text-center mb-7">
                  <div className="w-20 h-20 rounded-[24px] mx-auto mb-5 flex items-center justify-center text-[42px]"
                    style={{
                      background: `linear-gradient(135deg, ${MBTI_PROFILES[result.type].color}18, ${MBTI_PROFILES[result.type].color}0A)`,
                      boxShadow: `0 4px 16px ${MBTI_PROFILES[result.type].color}18`
                    }}>
                    {MBTI_PROFILES[result.type].emoji}
                  </div>
                  <h1 className="text-[48px] font-bold tracking-[-0.03em] mb-1"
                    style={{ color: MBTI_PROFILES[result.type].color }}>{result.type}</h1>
                  <p className="text-[18px] font-semibold text-[#1d1d1f]">{MBTI_PROFILES[result.type].title}</p>
                  <p className="text-[12px] text-[#86868b] mt-1.5">
                    {testMode === 'express' ? '极速版' : '专业版'} · {questions.length} 题
                  </p>
                </div>

                <div className="mb-7">
                  {generatedAvatarUrl ? (
                    <div className="flex flex-col items-center">
                      <div
                        className="w-[130px] h-[130px] rounded-[28px] shadow-lg bg-[#f5f5f7] bg-center bg-cover ring-[3px] ring-white"
                        style={{ backgroundImage: `url(${generatedAvatarUrl})` }}
                      />
                      <div className="mt-4 flex gap-2.5 justify-center flex-wrap">
                        <button onClick={generateAvatar} disabled={generatingAvatar}
                          className="px-4 py-2.5 rounded-full text-[13px] font-medium border-2 border-[#e5e5ea] text-[#6e6e73] hover:border-[#d2d2d7] hover:text-[#1d1d1f] transition-all disabled:opacity-50">
                          {generatingAvatar ? '重新生成中…' : '重新生成'}
                        </button>
                        <button onClick={saveAvatarAsPet} disabled={avatarSaving}
                          className="px-4 py-2.5 rounded-full text-[13px] font-medium text-white transition-all hover:opacity-90 disabled:opacity-50"
                          style={{ background: `linear-gradient(135deg, ${MBTI_PROFILES[result.type].color}, ${AVATAR_MOTIFS[result.type]?.secondary || '#6366f1'})` }}>
                          {avatarSaving ? '设置中…' : '设为宠物头像'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center">
                      <p className="text-[13px] text-[#86868b] mb-3">AI 为你生成专属性格头像</p>
                      <button onClick={generateAvatar} disabled={generatingAvatar}
                        className="px-5 py-3 rounded-full text-[14px] font-medium text-white transition-all hover:opacity-90 disabled:opacity-60 shadow-[0_4px_16px_rgba(0,0,0,0.12)]"
                        style={{ background: `linear-gradient(135deg, ${MBTI_PROFILES[result.type].color}, ${AVATAR_MOTIFS[result.type]?.secondary || '#6366f1'})` }}>
                        {generatingAvatar ? (
                          <span className="inline-flex items-center gap-2">
                            <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin inline-block"></span>
                            AI 正在绘制…
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-2">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 19l7-7 3 3-7 7-3-3z"/><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/><path d="M2 2l7.586 7.586"/><circle cx="11" cy="11" r="2"/></svg>
                            生成专属头像
                          </span>
                        )}
                      </button>
                    </div>
                  )}
                </div>

                <div className="flex gap-1 mb-6 bg-[#f5f5f7] rounded-2xl p-1.5">
                  {['overview', 'detail', 'zodiac', 'combined'].map(tab => (
                    <button key={tab}
                      onClick={() => setActiveTab(tab)}
                      disabled={tab === 'zodiac' && !combinedAnalysis?.zodProfile}
                      className={'flex-1 px-2 py-2.5 rounded-xl text-[12px] font-semibold transition-all whitespace-nowrap ' + (
                        activeTab === tab
                          ? 'bg-white text-[#1d1d1f]'
                          : 'text-[#86868b] hover:text-[#6e6e73]'
                      ) + (tab === 'zodiac' && !combinedAnalysis?.zodProfile ? ' opacity-40 cursor-not-allowed' : '')}
                      style={activeTab === tab ? { boxShadow: '0 2px 8px rgba(0,0,0,0.06)' } : {}}>
                      {tab === 'overview' ? '总览' : tab === 'detail' ? '深度' : tab === 'zodiac' ? '星座' : '综合'}
                    </button>
                  ))}
                </div>

                {activeTab === 'overview' && (
                  <div className="space-y-3">
                    <div className="rounded-2xl p-5 bg-[#f5f5f7] border border-[#e8e8ed]">
                      <p className="text-[14px] text-[#1d1d1f] leading-relaxed">{MBTI_PROFILES[result.type].overview}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-2xl p-4 bg-emerald-500/6 border border-emerald-500/12">
                        <p className="text-[12px] font-semibold text-emerald-600 mb-1.5 flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block"></span>优势特点
                        </p>
                        <p className="text-[12px] text-[#6e6e73] leading-relaxed">{MBTI_PROFILES[result.type].strengths}</p>
                      </div>
                      <div className="rounded-2xl p-4 bg-purple-500/6 border border-purple-500/12">
                        <p className="text-[12px] font-semibold text-purple-600 mb-1.5 flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-purple-500 inline-block"></span>潜在弱点
                        </p>
                        <p className="text-[12px] text-[#6e6e73] leading-relaxed">{MBTI_PROFILES[result.type].weaknesses}</p>
                      </div>
                    </div>
                    <div className="rounded-2xl p-5 bg-[#f5f5f7] border border-[#e8e8ed]">
                      <p className="text-[13px] font-semibold text-[#1d1d1f] mb-4">各维度得分</p>
                      {[{ d: 'EI', a: 'E', b: 'I' }, { d: 'SN', a: 'S', b: 'N' }, { d: 'TF', a: 'T', b: 'F' }, { d: 'JP', a: 'J', b: 'P' }].map(({ d, a, b }) => {
                        const total = result.scores[a] + result.scores[b];
                        const aPct = total > 0 ? Math.round((result.scores[a] / total) * 100) : 50;
                        return (
                          <div key={d} className="mb-4 last:mb-0">
                            <div className="flex justify-between text-[12px] text-[#86868b] mb-2">
                              <span className="font-medium">{DIM_LABELS[d]}</span>
                              <span className="font-semibold text-[#1d1d1f]">{result.percentages[d]}%</span>
                            </div>
                            <div className="flex items-center gap-2.5">
                              <span className="text-[11px] font-bold w-5 text-right text-[#6e6e73]">{a}</span>
                              <div className="flex-1 h-1.5 bg-[#e5e5ea] rounded-full overflow-hidden flex">
                                <div className="h-full rounded-l-full transition-all duration-700"
                                  style={{
                                    width: aPct + '%',
                                    minWidth: result.scores[a] > 0 ? '6px' : '0',
                                    background: result.type.includes(a)
                                      ? `linear-gradient(90deg, ${MBTI_PROFILES[result.type].color}, ${AVATAR_MOTIFS[result.type]?.secondary || '#6366f1'})`
                                      : '#d2d2d7'
                                  }}></div>
                                <div className="h-full rounded-r-full transition-all duration-700"
                                  style={{
                                    width: (100 - aPct) + '%',
                                    minWidth: result.scores[b] > 0 ? '6px' : '0',
                                    background: result.type.includes(b)
                                      ? `linear-gradient(90deg, ${MBTI_PROFILES[result.type].color}, ${AVATAR_MOTIFS[result.type]?.secondary || '#6366f1'})`
                                      : '#d2d2d7'
                                  }}></div>
                              </div>
                              <span className="text-[11px] font-bold w-5 text-[#6e6e73]">{b}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {activeTab === 'detail' && (
                  <div className="space-y-3">
                    <div className="rounded-2xl p-5 bg-[#f5f5f7] border border-[#e8e8ed]">
                      <p className="text-[13px] font-semibold text-[#1d1d1f] mb-1.5">你是谁</p>
                      <p className="text-[14px] text-[#1d1d1f] leading-relaxed">{MBTI_PROFILES[result.type].overview}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-2xl p-4 bg-emerald-500/6 border border-emerald-500/12">
                        <p className="text-[12px] font-semibold text-emerald-600 mb-1.5 flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block"></span>你的优势
                        </p>
                        <p className="text-[12px] text-[#6e6e73] leading-relaxed">{MBTI_PROFILES[result.type].strengths}</p>
                      </div>
                      <div className="rounded-2xl p-4 bg-purple-500/6 border border-purple-500/12">
                        <p className="text-[12px] font-semibold text-purple-600 mb-1.5 flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-purple-500 inline-block"></span>你的弱点
                        </p>
                        <p className="text-[12px] text-[#6e6e73] leading-relaxed">{MBTI_PROFILES[result.type].weaknesses}</p>
                      </div>
                    </div>
                    <div className="rounded-2xl p-4 bg-indigo-500/6 border border-indigo-500/12">
                      <p className="text-[12px] font-semibold text-indigo-600 mb-1.5 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 inline-block"></span>工作与事业
                      </p>
                      <p className="text-[12px] text-[#6e6e73] leading-relaxed">{MBTI_PROFILES[result.type].work}</p>
                      <p className="text-[11px] text-[#86868b] mt-2 leading-relaxed">适合职业：{MBTI_PROFILES[result.type].careers}</p>
                    </div>
                    <div className="rounded-2xl p-4 bg-purple-500/6 border border-purple-500/12">
                      <p className="text-[12px] font-semibold text-purple-600 mb-1.5 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-purple-500 inline-block"></span>爱情与人际
                      </p>
                      <p className="text-[12px] text-[#6e6e73] leading-relaxed">{MBTI_PROFILES[result.type].love}</p>
                    </div>
                    <div className="rounded-2xl p-4 bg-pink-500/6 border border-pink-500/12">
                      <p className="text-[12px] font-semibold text-pink-600 mb-1.5 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-pink-500 inline-block"></span>成长建议
                      </p>
                      <p className="text-[12px] text-[#6e6e73] leading-relaxed">{MBTI_PROFILES[result.type].growth}</p>
                    </div>
                  </div>
                )}

                {activeTab === 'zodiac' && combinedAnalysis?.zodProfile && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-4 p-5 rounded-2xl bg-[#f5f5f7] border border-[#e8e8ed]">
                      <span className="text-5xl">{combinedAnalysis.zodProfile.emoji}</span>
                      <div>
                        <p className="text-[20px] font-bold text-[#1d1d1f]">{combinedAnalysis.zodProfile.name}</p>
                        <p className="text-[12px] text-[#86868b]">{combinedAnalysis.zodProfile.dateRange} · {combinedAnalysis.zodProfile.element} · 守护星 {combinedAnalysis.zodProfile.ruler}</p>
                      </div>
                    </div>
                    <div className="rounded-2xl p-5 bg-[#f5f5f7] border border-[#e8e8ed]">
                      <p className="text-[14px] text-[#1d1d1f] leading-relaxed">{combinedAnalysis.zodProfile.overview}</p>
                    </div>
                    <div className="rounded-2xl p-4 bg-emerald-500/6 border border-emerald-500/12">
                      <p className="text-[12px] font-semibold text-emerald-600 mb-1.5">性格特质</p>
                      <p className="text-[12px] text-[#6e6e73] leading-relaxed">{combinedAnalysis.zodProfile.traits}</p>
                    </div>
                    <div className="rounded-2xl p-4 bg-purple-500/6 border border-purple-500/12">
                      <p className="text-[12px] font-semibold text-purple-600 mb-1.5">感情观</p>
                      <p className="text-[12px] text-[#6e6e73] leading-relaxed">{combinedAnalysis.zodProfile.love}</p>
                    </div>
                    <div className="rounded-2xl p-4 bg-indigo-500/6 border border-indigo-500/12">
                      <p className="text-[12px] font-semibold text-indigo-600 mb-1.5">事业方向</p>
                      <p className="text-[12px] text-[#6e6e73] leading-relaxed">{combinedAnalysis.zodProfile.work}</p>
                    </div>
                  </div>
                )}

                {activeTab === 'combined' && combinedAnalysis && (
                  <div className="space-y-3">
                    <div className="rounded-2xl p-6 bg-[#f5f5f7] border border-[#e8e8ed]">
                      <p className="text-[16px] font-bold text-[#1d1d1f] mb-4">
                        {combinedAnalysis.zodProfile
                          ? `${combinedAnalysis.zodProfile.name} × ${result.type} ${MBTI_PROFILES[result.type].title} 综合分析`
                          : `${result.type} ${MBTI_PROFILES[result.type].title} 分析`}
                      </p>
                      {combinedAnalysis.zodProfile ? (
                        <>
                          <p className="text-[14px] text-[#1d1d1f] leading-relaxed mb-5">{combinedAnalysis.elementAnalysis}</p>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="rounded-2xl p-4 bg-white border border-[#e8e8ed]">
                              <p className="text-[12px] font-semibold text-indigo-600 mb-1.5">{combinedAnalysis.mbtiProfile.title}（{result.type}）特点</p>
                              <p className="text-[12px] text-[#6e6e73]">{combinedAnalysis.mbtiProfile.strengths}</p>
                            </div>
                            <div className="rounded-2xl p-4 bg-white border border-[#e8e8ed]">
                              <p className="text-[12px] font-semibold text-purple-600 mb-1.5">{combinedAnalysis.zodProfile.name}特点</p>
                              <p className="text-[12px] text-[#6e6e73]">{combinedAnalysis.zodProfile.traits}</p>
                            </div>
                          </div>
                          <p className="text-[12px] text-[#86868b] mt-5 text-center leading-relaxed">
                            你的性格由 MBTI 心理类型和星座特质共同塑造。MBTI 揭示了你的底层思维模式，星座则为你的性格增添了独特的情感色彩和能量倾向。两者相辅相成，让你成为一个立体而独特的个体。
                          </p>
                        </>
                      ) : (
                        <div className="text-center py-5">
                          <p className="text-[14px] text-[#86868b] mb-1">尚未选择星座信息</p>
                          <p className="text-[12px] text-[#6e6e73]">返回首页选择你的星座，即可查看综合分析</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex gap-3 justify-center flex-wrap mt-8 pt-6 border-t border-[#e8e8ed]">
                  {user ? (
                    savedMbti === result.type ? (
                      <div className="px-6 py-3 rounded-full text-white font-semibold text-[14px]"
                        style={{
                          background: `linear-gradient(135deg, ${MBTI_PROFILES[result.type].color}, ${AVATAR_MOTIFS[result.type]?.secondary || '#6366f1'})`,
                          boxShadow: `0 4px 16px ${MBTI_PROFILES[result.type].color}40`
                        }}>
                        ✓ 已保存
                      </div>
                    ) : (
                      <button onClick={saveMBTI} disabled={saving}
                        className="px-6 py-3 rounded-full text-white font-semibold text-[14px] transition-all hover:opacity-90 disabled:opacity-50"
                        style={{
                          background: `linear-gradient(135deg, ${MBTI_PROFILES[result.type].color}, ${AVATAR_MOTIFS[result.type]?.secondary || '#6366f1'})`,
                          boxShadow: `0 4px 16px ${MBTI_PROFILES[result.type].color}40`
                        }}>
                        {saving ? '保存中…' : '保存结果到宠物'}
                      </button>
                    )
                  ) : (
                    <div className="text-[14px] text-[#86868b]">
                      请先 <button onClick={() => navigate('/login')} className="text-indigo-500 font-semibold hover:text-purple-500 transition-colors">登录</button> 后再保存
                    </div>
                  )}
                  <button onClick={() => { setStep('intro'); setResult(null); setQuestions([]); }}
                    className="px-6 py-3 rounded-full border-2 border-[#e8e8ed] text-[#6e6e73] hover:border-[#d2d2d7] hover:text-[#1d1d1f] transition-all text-[14px] font-semibold">
                    重新测试
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {toast && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-[100] px-5 py-3 rounded-full shadow-lg text-[14px] font-semibold backdrop-blur-xl"
          style={{
            background: toast.type === 'success'
              ? 'linear-gradient(135deg, #34c759, #30d158)'
              : toast.type === 'error'
                ? 'linear-gradient(135deg, #ff3b30, #ff453a)'
                : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            color: 'white'
          }}>
          {toast.message}
        </div>
      )}
    </div>
  );
}

export default MBTITest;

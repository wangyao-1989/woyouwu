import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const DIM_LABELS = { EI: '精力来源', SN: '信息获取', TF: '决策方式', JP: '生活态度' };
const TRAIT_LABELS = { E: '外向 (E)', I: '内向 (I)', S: '实感 (S)', N: '直觉 (N)', T: '思考 (T)', F: '情感 (F)', J: '判断 (J)', P: '感知 (P)' };

const SLIDER_STOPS = [
  { value: 3, label: '完全同意' },
  { value: 2, label: '比较同意' },
  { value: 1, label: '有点同意' },
  { value: -1, label: '有点同意' },
  { value: -2, label: '比较同意' },
  { value: -3, label: '完全同意' },
];

/* 使用服务器 AI 生成的动漫角色头像，优先 GIF 动图 */
const AVATAR_EXT_CACHE = {};
const getAvatarUrl = (mbti, gender) => {
  const key = `${mbti}_${gender}`;
  const ext = AVATAR_EXT_CACHE[key] || 'png';
  const genderedName = gender ? `${mbti.toLowerCase()}-${gender}` : mbti.toLowerCase();
  return `/uploads/mbti-avatars/${genderedName}.${ext}`;
};

// ─── MBTI 性格数据（保持不变）───
const MBTI_PROFILES = {
  INTJ: {
    title: '建筑师', emoji: '🏛️', color: '#6366f1',
    overview: 'INTJ型的人是战略思想家，拥有出色的全局观和长远规划能力。你天生善于将复杂的信息整合成清晰的蓝图，并对未来有着敏锐的洞察力。你热爱知识、追求效率，不喜欢无意义的闲聊和重复劳动。在人群中你通常保持低调，但内心世界极为丰富，时刻在构建和完善自己的思想体系。',
    strengths: '战略思维，能看清复杂问题的本质并制定长远计划；高度独立，不依赖他人的认可来做决定；求知欲强，持续学习新知识并将其转化为实际方案；坚韧不拔，确定目标后会排除万难去实现。',
    weaknesses: '可能因过于注重逻辑而显得冷漠疏离；对低效和愚蠢缺乏耐心，有时会不经意间伤害他人感受；完美主义倾向可能导致大包大揽、难以放手；不善于表达情感，让人际沟通变得困难。',
    work: '你最适合需要深度思考和战略规划的工作环境。喜欢有明确目标和自主权的项目，讨厌频繁的会议和微观管理。团队中你更愿意扮演幕后的策略师，而非台前的领导者。',
    love: '在感情中你忠诚且深思熟虑，不会轻易投入一段关系，一旦认定对方，会认真经营并以行动证明你的承诺。你欣赏有思想深度、独立自主的伴侣。',
    growth: '学会在追求完美的同时接受不完美；主动练习表达情感和欣赏他人；记住不是所有人都以同样的速度和方式思考，耐心是一种智慧。',
    careers: '科学家、工程师、律师、战略顾问、大学教授、软件架构师，投资分析师',
  },
  INTP: {
    title: '逻辑学家', emoji: '🔬', color: '#8b5cf6',
    overview: 'INTP型的人是知识的探索者，你对世界运转的底层逻辑有着永不满足的好奇心。你享受独自思考和钻研的过程，常常沉浸在抽象概念和复杂理论的海洋中。对新鲜想法的兴奋往往超过对实际执行的热情。',
    strengths: '卓越的逻辑分析和抽象思维能力；对任何领域都能快速深入，自学能力强；客观中立，能以理性态度审视各种观点；创意十足，能将看似不相关的概念连接起来。',
    weaknesses: '容易陷入"分析瘫痪"，过度思考而迟迟不行动；对日常生活细节缺乏兴趣和条理；可能因过于沉浸在思想中而忽略周围人的情感需求。',
    work: '你需要在有足够自主权和智力挑战的环境中才能发挥最佳状态。喜欢结构灵活、鼓励创新的工作文化，反感死板的规章制度。独自钻研时效率最高。',
    love: '你在感情中追求精神上的契合，外表和物质条件远没有思想上的共鸣重要。可能需要较长时间才能打开心扉，但一旦投入会很专注。',
    growth: '将想法付诸行动，哪怕只是小小的一步；培养对日常生活的管理能力；有意识地关照身边人的感受。',
    careers: '程序员、数据科学家、哲学家、数学家，游戏设计师、研究员、作家',
  },
  ENTJ: {
    title: '指挥官', emoji: '👑', color: '#f59e0b',
    overview: 'ENTJ型的人是天生的领导者，你自信果敢、目标明确，总能迅速看清局势并制定行动计划。你不畏惧挑战和困难，反而视之为证明自己的机会。你善于激励和引导他人，在团队中自然而然会成为核心人物。',
    strengths: '卓越的领导力和组织能力，能将混乱的局面理出头绪；目标驱动，一旦确定方向就全力以赴；沟通能力强，善于说服他人并凝聚共识；果敢决断，在关键时刻能快速做出决策。',
    weaknesses: '可能因过于强势而忽略他人的感受和意见；对效率的追求有时会让你显得不近人情；不太善于处理情绪化的情况。',
    work: '你在需要决策和领导力的岗位上如鱼得水。喜欢有挑战性的项目和足够大的自主权。你对团队成员有明确的要求，但也会为团队的成功全力以赴。',
    love: '在感情中你同样具有掌控欲，需要一段势均力敌的关系。你欣赏有主见、有追求、不轻易被你压倒的伴侣。虽然外表强势，但内心深处也渴望被理解和照顾。',
    growth: '学会倾听，给别人表达的空间；情感并非软弱，适度展现脆弱反而让人更愿意追随你。',
    careers: '企业高管、创业者、政治家、律师、管理顾问、军事指挥官、项目总监',
  },
  ENTP: {
    title: '辩论家', emoji: '💡', color: '#f97316',
    overview: 'ENTP型的人是思想的开创者，你聪明机智、口才超群，总能从别人看不到的角度发现机会。你享受智力上的挑战和辩论的过程，不是为了争胜负，而是享受思想碰撞的火花。你兴趣广泛、适应力强。',
    strengths: '极强的创新能力和发散思维，能快速想出多种解决方案；口才出色，善于即兴表达和辩论；适应力超群，在快速变化的环境中游刃有余；天生的创业精神。',
    weaknesses: '容易对事物失去兴趣，导致很多项目半途而废；有时候辩论只是为了好玩而非解决问题；不擅长处理重复性的日常事务。',
    work: '你适合在需要创新和变化的领域中发挥才能。不喜欢一尘不变的工作内容，需要持续的智力刺激。创业、咨询或创意行业是你的舞台。',
    love: '在感情中你充满激情和新鲜感，总能给伴侣带来惊喜。你欣赏能与你在智力上较量的伴侣，平淡无奇的关系会让你感到乏味。',
    growth: '学会将一个项目坚持到底，哪怕热情消退；有时闭嘴比辩论更重要；建立自己的日常习惯和纪律。',
    careers: '创业者、广告创意、律师，投资人、产品经理、演讲家、编剧',
  },
  INFJ: {
    title: '提倡者', emoji: '🌿', color: '#10b981',
    overview: 'INFJ型的人是最罕见的性格类型之一，你内心深邃、富有理想主义色彩。你拥有极强的直觉力和共情能力，常常能在他人尚未开口时便感知到他们的情绪和需求。你追求人生的意义和价值，渴望为世界带来积极的改变。',
    strengths: '极强的洞察力和直觉，能看透事物的本质和人的真实意图；富有同理心，是天生的倾听者和疗愈者；理想主义驱动，愿意为信念付出行动；创造力丰富。',
    weaknesses: '对自己和他人要求过高，容易陷入完美主义的焦虑；过于敏感，容易被他人的情绪影响和消耗；不喜欢冲突，有时会为了避免不愉快而压抑自己。',
    work: '你需要在有意义的工作中找到满足感。适合从事能帮助他人或推动社会进步的领域。需要一定的独处时间来整理思绪和恢复精力。',
    love: '你在感情中追求灵魂层面的连接，对肤浅的关系不感兴趣。你全心全意地投入，期待同等的真诚和深度。你很会照顾伴侣的感受，但也需要对方理解你的内心世界。',
    growth: '学会设立边界，不是所有人的问题都需要你来解决；接受世界的不完美，完美主义是行动的最大敌人。',
    careers: '心理咨询师、作家、教育工作者、社工、人力资源、艺术家、医生',
  },
  INFP: {
    title: '调停者', emoji: '🕊️', color: '#ec4899',
    overview: 'INFP型的人是理想主义的守护者，你的内心世界如同一座充满美和善意的花园。你拥有强烈的价值观和信念，做任何事情都追随内心的声音。你温柔、忠诚且富有创造力，总能用独特的视角看待世界。',
    strengths: '极强的创造力和想象力，能从平凡中发现不平凡的美；价值观坚定，不会为了利益而违背原则；对亲近的人无比忠诚和温柔，是最理想的倾听者和支持者。',
    weaknesses: '过于理想化，现实与理想的落差容易让你受伤；难以接受批评，会把他人的意见当作对自我价值的否定；有时在行动前想得太多，陷入内耗。',
    work: '你需要在能表达自我且有价值观认同的环境中工作。适合从事创造性、帮助性或需要深度的职业。金钱和地位不是你的主要驱动力。',
    love: '你在感情中浪漫而专注，渴望找到"灵魂伴侣"。会为爱付出很多，但也容易因为过度投入而受伤。你欣赏真诚、温柔且有深度的伴侣。',
    growth: '将梦想转化为具体的行动步骤；学会接受建设性的批评并将其视为成长的机会；照顾好自己的实际生活。',
    careers: '作家、设计师、心理咨询师、教师，音乐家、插画师、非营利组织工作者',
  },
  ENFJ: {
    title: '主人公', emoji: '⭐', color: '#ef4444',
    overview: 'ENFJ型的人是天生的教育者和激励者，你充满魅力、富有同理心，总能准确地感知他人的需求并给予帮助。你拥有极强的沟通和引导能力，在人群中如同一盏明灯。你最大的满足来自于看到他人因为你的帮助而成长和进步。',
    strengths: '卓越的沟通和人际交往能力，善于建立信任和连接；极强的共情能力，能感受他人的情绪并给予恰当的回应；天生的领导力，偏向启发和激励；责任感强。',
    weaknesses: '过于在意他人的感受和评价，容易因此忽视自己的需求；操心太多，总想帮所有人解决问题，导致自己精力透支；对批评敏感。',
    work: '你适合从事能发挥人际优势和领导力的工作。在教育、辅导、团队管理和公共关系领域尤为出色。你渴望被需要和被认可。',
    love: '在感情中你热情、细心且忠诚，会不遗余力地经营关系。你是那种会记得每一个纪念日并为对方精心准备惊喜的人。需要的是一个能同样珍视你的付出的伴侣。',
    growth: '学会说"不"，你的精力不是无限的；花时间独处，倾听自己内心的声音；不是所有人都需要被拯救，尊重他人自己的成长节奏。',
    careers: '教师、培训师、心理咨询师、HR总监、政治家、主持人、公关经理',
  },
  ENFP: {
    title: '竞选者', emoji: '🎨', color: '#f97316',
    overview: 'ENFP型的人是热情的探索者，你的生活充满了好奇心和无限可能。你热爱与人交往，能在与不同人的互动中获得能量和灵感。你拥有惊人的创造力和发散思维，能看到别人看不到的连接和机会。自由和可能性是你最珍视的东西。',
    strengths: '极强的创造力和灵感，是团队中脑洞最活跃的人；热情洋溢、富有感染力，能鼓舞和带动周围的人；善于共情和理解他人；适应力强。',
    weaknesses: '注意力容易分散，可能同时开始很多事情却难以完成；情绪起伏较大，容易受环境和他人影响；对日常琐事缺乏耐心。',
    work: '你需要一个充满变化、自由且有创造空间的工作环境。讨厌重复劳动和严格的规定。在需要想象力、人际沟通和灵活应变的岗位上发光发亮。',
    love: '在感情中你热情浪漫，总能用创意和真诚打动对方。你追求的是深入真诚的连接，不喜欢游戏的套路。但你也需要个人空间。',
    growth: '学会聚焦，把热情转化为持续的行动；建立基本的规划和生活习惯，自由不等于随意；培养兑现承诺的能力。',
    careers: '记者、创业者、心理咨询师、演员、广告创意、用户体验设计师、幼教',
  },
  ISTJ: {
    title: '物流师', emoji: '⚙️', color: '#64748b',
    overview: 'ISTJ型的人是秩序和规则的守护者，你严谨务实、踏实可靠。你喜欢用事实和数据说话，每一个决定背后都有充分的依据。在别人看来，你可能是最"靠谱"的那个人——答应的事一定做到，交付的工作一定达标。',
    strengths: '极强的责任心和执行力，是团队中最值得信赖的成员；注重细节和数据，做事有迹可循；持之以恒，有始有终；客观公正。',
    weaknesses: '可能因循守旧，对新事物和新方法持怀疑态度；不太擅长应对突发变化和不确定性；有时过于注重规则而忽略了人的情感需求。',
    work: '你在有明确流程和标准的工作环境中表现最出色。喜欢清晰的任务分工和可衡量的成果。混乱和不确定性会让你感到不适。',
    love: '在感情中你稳重且专一，用行动而非甜言蜜语来表达爱。你不会轻易承诺，但一旦承诺就绝不辜负。你需要的是一个能理解并尊重你需要秩序和稳定的伴侣。',
    growth: '保持开放的心态，新的方法不一定比旧的方法差；试着表达你的感受；偶尔打破一下日常，小小的冒险会带来惊喜。',
    careers: '会计师、审计师、军人、法官、公务员，质量管理员、数据分析师',
  },
  ISFJ: {
    title: '守卫者', emoji: '🛡️', color: '#84cc16',
    overview: 'ISFJ型的人是默默守护的天使，你温柔细腻、忠诚可靠，总是在别人需要的时候伸出援手。你有着惊人的记忆力——不是记公式和数据，而是记得每个人喜欢什么、需要什么。你的善良不是软弱，而是一种安静而坚定的力量。',
    strengths: '极强的责任心和奉献精神，是团队中最默默付出的那个人；细心体贴，善于发现并满足他人的需求；记忆力出色，特别擅长记住关于人的细节。',
    weaknesses: '过于谦让，容易忽视和压抑自己的需求；害怕冲突和批评，有时会为了和谐而委屈自己；不太善于表达和争取。',
    work: '你适合在一个温暖、稳定且有明确价值的团队中工作。喜欢能切实帮助到他人的工作内容。需要被认可和感激的反馈来保持动力。',
    love: '在感情中你全心全意、无微不至，会记得每一个重要的日子和对方说过的每一句话。你渴望的是一段安稳、被珍视的长期关系。',
    growth: '学会说"我需要"，你的需求同样重要；不要害怕冲突，适度表达不同意见不会破坏关系；相信自己的能力。',
    careers: '护士、教师、行政助理、社工、图书管理员、客服专员、档案管理员',
  },
  ESTJ: {
    title: '总经理', emoji: '📋', color: '#0ea5e9',
    overview: 'ESTJ型的人是高效的管理者和执行者，你喜欢把事情安排得井井有条。你有强大的组织能力和执行力，一旦制定了计划就会全力以赴地去完成。你诚实直率，讨厌拐弯抹角和效率低下的沟通方式。',
    strengths: '卓越的组织和管理能力，能将复杂任务分解为清晰的执行步骤；果断高效，不拖延、不纠结，是团队中的"定海神针"；诚实守信，言出必行。',
    weaknesses: '有时过于强势，容易忽略他人的感受和不同意见；对规则和流程的依赖可能让你显得僵化；不太善于处理需要情感和直觉的事务。',
    work: '你适合在需要强大执行力和组织能力的岗位上发挥所长。喜欢有清晰的结构和晋升通道的工作环境。管理岗位是你自然而然的方向。',
    love: '在感情中你同样认真负责，会把经营关系当作一个"项目"来对待。你欣赏诚实、可靠、有担当的伴侣。虽然不擅长甜言蜜语，但你会用行动证明你的在乎。',
    growth: '学会灵活变通，规则是为目标服务的，不是目标本身；多倾听、少下结论；偶尔放松一下。',
    careers: 'CEO、运营经理、项目经理、法官、军官、财务主管、学校校长',
  },
  ESFJ: {
    title: '执政官', emoji: '🤝', color: '#14b8a6',
    overview: 'ESFJ型的人是社交圈中的暖阳，你热心周到、善于照顾他人，总是第一个发现谁需要帮助的人。你拥有极强的社交直觉和组织能力，能让每个人都感到被关心、被重视。和谐的人际关系是你最大的动力源泉。',
    strengths: '极强的社交能力和人脉经营能力，是团队的"粘合剂"；细心周到，能关注到每个人的需求和感受；务实可靠，说到做到；善于创造温暖和谐的氛围。',
    weaknesses: '过于在意他人的看法和评价，容易因此迷失自己；害怕冲突和被拒绝，有时会违背自己的意愿去取悦别人；对变化的适应能力相对较弱。',
    work: '你适合在需要人际互动和服务的领域中发光发热。喜欢一个有温暖氛围的团队。被需要和被感谢是你工作中最大的满足感。',
    love: '在感情中你体贴入微、用心经营，是理想的生活伴侣。你渴望稳定的婚姻和家庭生活，会不遗余力地让伴侣感到幸福。',
    growth: '学会问问自己想要什么，而不只是别人需要什么；不要因为害怕冲突而压抑真实想法；给自己一些独处的时间。',
    careers: '护士、教师、酒店管理、婚礼策划师、社工、客户经理、人事专员',
  },
  ISTP: {
    title: '鉴赏家', emoji: '🔧', color: '#a855f7',
    overview: 'ISTP型的人是冷静的实干家，你天生对"事物如何运作"有着浓厚的好奇心。你喜欢动手操作和亲身体验，相比理论更喜欢在实践中学习和验证。在危机中你异常冷静，能迅速分析形势并采取行动。',
    strengths: '极强的动手能力和技术天赋，能快速掌握各种工具和技能；在危机中保持冷静并迅速反应，是天生的"救火队员"；务实高效；善于独立解决问题。',
    weaknesses: '不善于表达情感和需求，容易让他人觉得难以接近；有时过于独立，不习惯也不喜欢寻求帮助；对长期规划和抽象概念兴趣不大。',
    work: '你适合需要动手能力和即时解决问题的技术类工作。喜欢自由和灵活的工作方式，讨厌冗长的会议和繁琐的报告。',
    love: '在感情中你是行动派，用"做"而非"说"来表达爱意。你需要一个能给你足够个人空间的伴侣。你不喜欢戏剧化的情感表达，更欣赏实在的陪伴。',
    growth: '偶尔走出舒适区，主动表达你的感受和想法；接受团队协作，一个人能走得快，但一群人能走得远。',
    careers: '工程师、飞行员、外科医生、机械师，法医、消防员、程序员',
  },
  ISFP: {
    title: '探险家', emoji: '🌸', color: '#d946ef',
    overview: 'ISFP型的人是温柔的艺术灵魂，你用感官和心灵来体验这个世界。你拥有一双发现美的眼睛，能从最平凡的日常中找到诗意。你随和友善，不喜欢冲突和控制，更愿意给每个人空间做自己。',
    strengths: '极强的审美能力和艺术天赋，对色彩、形状和质感有天然的敏感度；随和友善、让人感到放松和舒服；真诚不伪装，做真实的自己；适应力强。',
    weaknesses: '不太擅长口头表达自己的想法和感受；对批评特别敏感，容易因此退缩和封闭；缺乏长远的规划和目标；倾向于逃避冲突和困难。',
    work: '你适合从事创意或手工艺类的工作，需要能发挥审美和动手能力的岗位。喜欢灵活的工作节奏和较少的人际压力。',
    love: '在感情中你温柔而浪漫，用行动和细节而非言语来表达爱意。你需要的是一个能给你安全感并欣赏你独特美感的伴侣。',
    growth: '试着用语言表达你的感受；面对困难不逃避，每一次面对都是成长；为自己设定一些目标。',
    careers: '设计师、摄影师、花艺师、按摩师、兽医、画家、时尚设计',
  },
  ESTP: {
    title: '企业家', emoji: '🚀', color: '#eab308',
    overview: 'ESTP型的人是行动派的冒险家，你精力充沛、反应敏捷，能在瞬息万变的环境中抓住机会。你不喜欢纸上谈兵，更相信在实践中检验真理。在别人还在犹豫时你已经出手了——有时候成功，有时候学到经验。',
    strengths: '极强的行动力和执行力，想到就做，绝不犹豫；反应敏捷，在高压和紧急情况下表现出色；社交达人，能快速融入任何环境；善于抓住商机和机会。',
    weaknesses: '容易冲动，不经深思熟虑就做出决定；对长期规划和抽象概念缺乏耐心；有时为了刺激和冒险而忽视了风险和安全；三分钟热度。',
    work: '你适合快节奏、充满变化和挑战的工作环境。销售、创业、应急响应等需要快速反应和决策的岗位是你的舞台。',
    love: '在感情中你充满激情和活力，总能让关系保持新鲜感。你喜欢和伴侣一起尝试新事物，讨厌平淡和例行公事。',
    growth: '做重要决定前多思考一步，投资式的耐心比投机式的冲动更长久；培养完成一件事情的习惯。',
    careers: '销售总监、创业者、急救员、运动员、演员，投资交易员、特警',
  },
  ESFP: {
    title: '表演者', emoji: '🎭', color: '#f43f5e',
    overview: 'ESFP型的人是生活的表演者，你活力四射、享受当下，是人群中的开心果。你对美和快乐有着天生的追求，总能发现生活中的乐趣并感染身边的人。你喜欢成为注意力的中心——不是因为虚荣，而是因为你真的很善于给人带来快乐。',
    strengths: '极强的社交能力和感染力，能让任何场合活跃起来；乐观积极、随遇而安，是团队的"欢乐源泉"；观察力敏锐；善于发现美和享受生活。',
    weaknesses: '注意力容易分散，难以坚持完成长期任务；比较在意他人的关注和认可；有时过于追求当下的快乐，忽略了长远影响；不擅长处理需要深度分析的问题。',
    work: '你适合从事需要人际互动和创造力的工作。喜欢热闹、有趣的工作环境。表演、服务、时尚等让你展现自我的领域是你的菜。',
    love: '在感情中你热情洋溢、充满惊喜，总会让伴侣感受到被爱和被关注。你需要一个能陪伴你体验生活、享受当下的伴侣。',
    growth: '学会延迟满足，眼前的快乐有时需要为长远的目标让路；独立思考，不要过度依赖外界的反馈来确认自我价值。',
    careers: '演员、歌手、健身教练、导游、销售、活动策划、时尚博主',
  },
};

// ─── 星座数据（保持不变）───
const ZODIAC_PROFILES = {
  aries: { name: '白羊座', emoji: '♈', dateRange: '3/21 - 4/19', element: '火象', ruler: '火星', overview: '白羊座是十二星座的开端，像初春的第一缕阳光，充满蓬勃的生命力和开拓精神。你勇敢直率、敢作敢为，有着天生的竞争意识和不服输的劲头。你不喜欢拐弯抹角和犹豫不决，想到就去做是你的风格。', traits: '勇敢、直率、热情、行动力强、竞争意识强；但也可能冲动、缺乏耐心、容易急躁。', love: '在感情中你热烈真诚，爱就大声说出来，不玩暧昧。你需要一个能跟上你节奏的伴侣。', work: '适合开创性的工作，能发挥你的冲劲和领导力。创业、销售、竞技体育都很适合。' },
  taurus: { name: '金牛座', emoji: '♉', dateRange: '4/20 - 5/20', element: '土象', ruler: '金星', overview: '金牛座如同春日里沉实的大地，稳重而有力量。你追求稳定和品质，对美好事物有着天然的鉴赏力。你坚定且有耐心，一旦认定了目标就会一步一步地走下去。', traits: '稳重、忠诚、有耐心、审美力强、务实；但也可能固执、占有欲强、不爱改变。', love: '在感情中你专一而深情，慢热但长久。你需要的是一个能给你安全感并能一起享受生活的伴侣。', work: '适合需要耐心和坚持的工作。金融、艺术、餐饮、建筑领域是你的长项。' },
  gemini: { name: '双子座', emoji: '♊', dateRange: '5/21 - 6/21', element: '风象', ruler: '水星', overview: '双子座是十二星座中最灵动的存在，你聪明机敏、好奇心旺盛，像春末夏初的风一样轻盈多变。你善于沟通和学习，能快速掌握新知识并在不同话题之间自如切换。', traits: '聪明、好奇、善于沟通、适应力强；但也可能多变、矛盾、缺乏耐心。', love: '在感情中你追求精神上的交流和新鲜感，需要能与你天马行空对话的伴侣。', work: '适合需要灵活和沟通能力的工作。媒体、教育、销售、公关等领域让你大展拳脚。' },
  cancer: { name: '巨蟹座', emoji: '♋', dateRange: '6/22 - 7/22', element: '水象', ruler: '月亮', overview: '巨蟹座是十二星座中最温柔的守护者，你情感细腻、善解人意，像月光一样温柔地照耀着身边的人。你对家和安全感有着深深的眷恋，是朋友圈中最贴心的那个人。', traits: '温柔、顾家、直觉强、有保护欲；但也可能情绪化、过度敏感、防御心强。', love: '在感情中你极度忠诚和专一，把伴侣视为生命中最重要的存在。需要满满的安全感。', work: '适合需要关怀和细心的工作。教育、护理、餐饮、室内设计等能发挥你的温暖特质。' },
  leo: { name: '狮子座', emoji: '♌', dateRange: '7/23 - 8/22', element: '火象', ruler: '太阳', overview: '狮子座是十二星座中的王者，你自信大方、光芒四射，走到哪里都是焦点。你拥有一颗温暖而慷慨的心，愿意保护和照顾你爱的人。被认可和赞美是你最强的动力。', traits: '自信、大方、有领导力、慷慨热情；但也可能自负、虚荣、固执己见。', love: '在感情中你热情似火，喜欢主导和掌控关系。你宠伴侣，但同样需要被崇拜和赞美。', work: '适合能发挥领导力和创造力的工作。管理、演艺、设计、创业都是你的舞台。' },
  virgo: { name: '处女座', emoji: '♍', dateRange: '8/23 - 9/22', element: '土象', ruler: '水星', overview: '处女座是十二星座中最细致入微的完美主义者，你追求精益求精、注重细节，有着敏锐的分析能力。你对自己和他人都有很高的标准，但你的出发点往往是希望一切变得更好。', traits: '细致、有条理、分析力强、追求完美；但也可能挑剔、焦虑、对自己要求过高。', love: '在感情中你含蓄而认真，用实际的行动和细节来表达关心。你需要的是一段踏实稳定的关系。', work: '适合需要精确和细致的工作。医疗、技术、编辑、审计等需要专业精神的领域最适合你。' },
  libra: { name: '天秤座', emoji: '♎', dateRange: '9/23 - 10/23', element: '风象', ruler: '金星', overview: '天秤座是十二星座中最优雅的外交家，你追求平衡与和谐，讨厌冲突和不公平。你对美有着敏锐的直觉，不论走到哪里都带着优雅的气质，让人感到如沐春风。', traits: '优雅、公正、善于社交、有审美力；但也可能犹豫不决、逃避冲突、取悦他人。', love: '在感情中你是最浪漫的恋人，喜欢一切都是美好的。你需要一段和谐美好的关系。', work: '适合需要审美和协调能力的工作。法律、艺术、时尚、公关等让你发挥优雅优势。' },
  scorpio: { name: '天蝎座', emoji: '♏', dateRange: '10/24 - 11/22', element: '水象', ruler: '冥王星', overview: '天蝎座是十二星座中最深沉而富有力量的星座，你拥有极强的洞察力和直觉，能看透人心和事物的本质。你对感情极度专一和投入，爱恨分明，绝不中庸。', traits: '深沉、有洞察力、意志坚定、感情专一；但也可能占有欲强、记仇、多疑。', love: '在感情中你爱得深沉而激烈，不容背叛。你需要的是一段灵魂级别的深刻连接。', work: '适合需要深度和洞察力的工作。心理学、研究、刑侦、投资领域能发挥你的直觉。' },
  sagittarius: { name: '射手座', emoji: '♐', dateRange: '11/23 - 12/21', element: '火象', ruler: '木星', overview: '射手座是十二星座中最自由自在的旅行者，你乐观开朗、热爱冒险和探索，讨厌被束缚。你对生活充满热情，总是能看到事情光明的一面。你是人群中的"快乐源泉"。', traits: '乐观、自由、爱冒险、豁达真诚；但也可能粗心、缺乏责任感、过于直率。', love: '在感情中你追求的是自由和快乐，需要一段轻鞋愉快、不互相束缚的关系。', work: '适合需要开放思维和探索精神的工作。旅行、教育、文化、体育是你发挥的领域。' },
  capricorn: { name: '摩羯座', emoji: '♑', dateRange: '12/22 - 1/19', element: '土象', ruler: '土星', overview: '摩羯座是十二星座中最坚韧的攀登者，你稳重、自律、有强烈的责任感和目标意识。你不怕慢，只怕不够稳。你的成功不是靠运气，而是靠一步一个脚印走出来的。', traits: '坚韧、自律、责任感强、务实；但也可能保守、过于严肃、工作狂。', love: '在感情中你认真务实，不会轻易开始一段关系，但一旦投入就会竭尽全力去维护。', work: '适合需要耐力和责任感的工作。管理、金融、建筑、科研等需要长期坚持的领域。' },
  aquarius: { name: '水瓶座', emoji: '♒', dateRange: '1/20 - 2/18', element: '风象', ruler: '天王星', overview: '水瓶座是十二星座中最特立独行的发明家，你独立、创新、思想前卫，常常走在时代的前沿。你热爱自由，不被任何教条所束缚。你是朋友圈中的"外星人"——独特而迷人。', traits: '独立、创新、思想前卫、重视友情；但也可能冷淡、叛逆、难以捉摸。', love: '在感情中你追求精神上的共鸣和独立空间，讨厌粘人和占有的关系。', work: '适合需要创新和独立思维的工作。科技、设计、社会创新等给你无限发挥空间。' },
  pisces: { name: '双鱼座', emoji: '♓', dateRange: '2/19 - 3/20', element: '水象', ruler: '海王星', overview: '双鱼座是十二星座中最梦幻的诗人，你温柔善良、富有想象力和同情心，内心世界如海洋般深邃和多彩。你对美和艺术有着天然的连接，是最容易被打动的灵魂。', traits: '温柔、富有同情心、想象力丰富、有艺术天赋；但也可能逃避现实、过于敏感、缺乏边界。', love: '在感情中你是最浪漫的恋人，把爱情视作生命中最重要的事。需要的是一段梦幻而专注的关系。', work: '适合需要创造力和共情能力的工作。艺术、音乐、心理咨询、慈善等工作让你发光。' },
};

const getCombinedAnalysis = (mbti, zodiac) => {
  if (!mbti || !zodiac) return null;
  const mbtiProfile = MBTI_PROFILES[mbti];
  const zodProfile = ZODIAC_PROFILES[zodiac];
  if (!mbtiProfile || !zodProfile) return null;

  const elementMatches = {
    '火象': { desc: `你的${zodProfile.name}属于火象星座，火象特质赋予你热情和行动力，这与${mbtiProfile.title}的果断和目标导向相辅相成。你是一个既有大局观又能快速行动的人，在团队中往往是开拓者和推动者。但火象的冲动也可能让你在一些时候跟${mbtiProfile.title}的谨慎思维发生冲突，这是你需要平衡的地方。` },
    '土象': { desc: `你的${zodProfile.name}属于土象星座，土象特质赋予你稳重和耐力，这与${mbtiProfile.title}的分析能力结合，让你成为一个既严肃又有鉴赏力的人。你做事踏实，不轻易冒险，但一旦决定就会坚持到底。土象的固执和${mbtiProfile.title}的原则性叠加时，记得给自己留一点弹性空间。` },
    '风象': { desc: `你的${zodProfile.name}属于风象星座，风象特质赋予你灵活和沟通能力，这与${mbtiProfile.title}的智力特质相结合，让你成为一个思维敏捷、善于表达的人。你能在不同观点之间自如切换，是天生的沟通者和创意人。不过风象的善变和${mbtiProfile.title}的深度思考可能会有拉锯，适时停下来深入一个方向会更好。` },
    '水象': { desc: `你的${zodProfile.name}属于水象星座，水象特质赋予你深刻的感情和直觉力，这与${mbtiProfile.title}的洞察力相结合，让你成为一个既有感性深度又能理性分析的人。你能感知他人的情绪，同时也能保持自己的判断。但水象的敏感和${mbtiProfile.title}的深思叠加时，可能会走向过度内耗，记得关照自己的情绪健康。` },
  };

  return { mbtiProfile, zodProfile, elementAnalysis: elementMatches[zodProfile.element]?.desc || '' };
};

// ─── 主组件 ───
function MBTITest() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState('intro');
  const [testMode, setTestMode] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [gender, setGender] = useState(null); // 'male' | 'female'
  const [selectedZodiac, setSelectedZodiac] = useState('');
  const [savedMbti, setSavedMbti] = useState('');
  const [savedZodiac, setSavedZodiac] = useState('');
  const [saving, setSaving] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [fetchError, setFetchError] = useState('');
  const [toast, setToast] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [avatarSaving, setAvatarSaving] = useState(false);
  const [avatarError, setAvatarError] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [avatarCacheBuster, setAvatarCacheBuster] = useState(0);
  const [sliderValue, setSliderValue] = useState(null);
  const [cardAnim, setCardAnim] = useState('enter');
  const sliderTrackRef = useRef(null);

  const showToast = (msg, type) => {
    setToast({ message: msg, type });
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
    setFetching(true); setFetchError('');
    try {
      const res = await axios.get('/api/mbti/questions', { params: { mode } });
      if (res.data.questions?.length > 0) { setQuestions(res.data.questions); return true; }
      setFetchError('题库尚未初始化，请联系管理员'); return false;
    } catch (err) {
      setFetchError(err.response?.data?.message || '获取题库失败'); return false;
    } finally { setFetching(false); }
  }, []);

  const startTest = async (mode) => {
    setTestMode(mode);
    const ok = await fetchQuestions(mode);
    if (ok) { setStep('testing'); setCurrentIdx(0); setAnswers({}); setResult(null); setSliderValue(null); setCardAnim('enter'); }
  };

  const selectAnswer = (value) => {
    const q = questions[currentIdx];
    const newAnswers = { ...answers, [q._id]: value };
    setAnswers(newAnswers);
    setCardAnim('exit');
    if (currentIdx < questions.length - 1) {
      setTimeout(() => { setCurrentIdx(prev => prev + 1); setSliderValue(null); setCardAnim('enter'); }, 250);
    } else {
      setTimeout(() => calculateResult(newAnswers), 150);
    }
  };

  const prevQuestion = () => {
    if (currentIdx > 0) {
      setCardAnim('exit');
      setTimeout(() => {
        setCurrentIdx(prev => prev - 1);
        setSliderValue(answers[questions[currentIdx - 1]?._id] ?? null);
        setCardAnim('enter');
      }, 250);
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
    setStep('gender_select');
  };

  const selectGender = (g) => {
    setGender(g);
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
      if (selectedZodiac) {
        await axios.put('/api/settings/my-pet/zodiac', { zodiac: selectedZodiac });
        setSavedZodiac(selectedZodiac);
      }
      showToast('已保存到你的宠物上！', 'success');
    } catch (err) {
      showToast('保存失败：' + (err.response?.data?.message || '网络错误'), 'error');
    } finally { setSaving(false); }
  };

  const saveAvatarAsPet = async () => {
    if (!user || !result) return;
    setAvatarSaving(true);
    try {
      const avatarUrl = getAvatarUrl(result.type, gender);
      const imgRes = await fetch(avatarUrl);
      const blob = await imgRes.blob();
      const formData = new FormData();
      formData.append('avatar', blob, 'mbti-avatar.png');
      await axios.post('/api/settings/my-pet/avatar', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      window.dispatchEvent(new CustomEvent('pet-refresh'));
      showToast('头像已设为宠物头像！', 'success');
    } catch (err) {
      showToast('设置头像失败', 'error');
    } finally { setAvatarSaving(false); }
  };

  const regenerateAvatar = async () => {
    if (!result || regenerating) return;
    setRegenerating(true);
    try {
      await axios.post('/api/mbti/generate-avatar', { mbti: result.type, sex: gender });
      // 清除缓存强制重新加载
      delete AVATAR_EXT_CACHE[`${result.type}_${gender}`];
      setAvatarError(false);
      setAvatarCacheBuster(prev => prev + 1);
      showToast('新头像已生成！', 'success');
    } catch (err) {
      showToast('生成失败，请稍后重试', 'error');
    } finally { setRegenerating(false); }
  };

  const saveZodiacOnly = async () => {
    if (!user) { showToast('请先登录再保存', 'error'); return; }
    setSaving(true);
    try {
      await axios.put('/api/settings/my-pet/zodiac', { zodiac: selectedZodiac });
      setSavedZodiac(selectedZodiac);
      window.dispatchEvent(new CustomEvent('pet-refresh'));
      showToast('星座已保存！', 'success');
    } catch (err) { showToast('保存失败', 'error'); } finally { setSaving(false); }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fafafa]">
        <div className="w-8 h-8 border-2 border-gray-200 border-t-gray-800 rounded-full animate-spin" />
      </div>
    );
  }

  const answeredCount = Object.keys(answers).length;
  const progress = questions.length > 0 ? Math.round((answeredCount / questions.length) * 100) : 0;
  const currentQ = questions[currentIdx];
  const profile = result ? MBTI_PROFILES[result.type] : null;
  const combinedAnalysis = result ? getCombinedAnalysis(result.type, selectedZodiac || savedZodiac) : null;

  return (
    <div className="min-h-screen bg-[#fafafa]">
      {/* 顶部导航 */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-100/50">
        <div className="max-w-xl mx-auto px-5 h-12 flex items-center">
          <button onClick={() => navigate('/')} className="text-gray-400 hover:text-gray-700 transition-colors text-sm flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            首页
          </button>
          <span className="mx-auto text-sm font-medium text-gray-400 tracking-wide">性格测试</span>
          <div className="w-12" />
        </div>
      </header>

      <div className="max-w-xl mx-auto px-5 py-6">
        {/* ─── 介绍页 ─── */}
        {step === 'intro' && (
          <div className="animate-[fadeIn_0.4s_ease-out]">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gray-900 text-white mb-4">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">探索你的人格密码</h1>
              <p className="mt-2 text-sm text-gray-500">基于荣格心理学理论，了解最真实的自己</p>
            </div>

            {savedMbti && (
              <div className="bg-white rounded-2xl p-4 mb-6 border border-gray-100" style={{ borderLeftWidth: 3, borderLeftColor: MBTI_PROFILES[savedMbti]?.color || '#6366f1' }}>
                <p className="text-xs text-gray-400 mb-1">上次测试结果</p>
                <div className="flex items-center gap-2">
                  <span className="text-lg">{MBTI_PROFILES[savedMbti]?.emoji}</span>
                  <span className="text-base font-bold" style={{ color: MBTI_PROFILES[savedMbti]?.color }}>{savedMbti}</span>
                  <span className="text-sm text-gray-500">- {MBTI_PROFILES[savedMbti]?.title}</span>
                </div>
              </div>
            )}

            {/* 星座选择 */}
            <div className="bg-white rounded-2xl p-4 mb-4 border border-gray-100">
              <p className="text-sm font-medium text-gray-700 mb-3">你的星座（可选，综合解读更准）</p>
              <div className="grid grid-cols-4 gap-1.5">
                {Object.entries(ZODIAC_PROFILES).map(([key, z]) => (
                  <button
                    key={key}
                    onClick={() => setSelectedZodiac(selectedZodiac === key ? '' : key)}
                    className={`py-2 rounded-xl text-xs font-medium transition-all ${
                      selectedZodiac === key
                        ? 'bg-gray-900 text-white shadow-sm'
                        : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                    }`}
                  >
                    {z.emoji} {z.name}
                  </button>
                ))}
              </div>
            </div>

            {/* 测试模式 */}
            <div className="space-y-3">
              <button
                onClick={() => startTest('standard')}
                disabled={fetching}
                className="w-full bg-gray-900 text-white rounded-2xl py-4 font-medium hover:bg-gray-800 transition-colors disabled:opacity-50"
              >
                {fetching ? '加载题库中...' : '标准测试 · 60题'}
              </button>
              <button
                onClick={() => startTest('quick')}
                disabled={fetching}
                className="w-full bg-white text-gray-700 rounded-2xl py-4 font-medium border border-gray-200 hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                {fetching ? '加载题库中...' : '快速测试 · 20题'}
              </button>
            </div>
            {fetchError && <p className="mt-3 text-sm text-red-500 text-center">{fetchError}</p>}
          </div>
        )}

        {/* ─── 答题页 ─── */}
        {step === 'testing' && currentQ && (
          <div className="animate-[fadeIn_0.3s_ease-out]" key={currentIdx}>
            {/* 进度 */}
            <div className="flex items-center gap-3 mb-8">
              <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-gray-900 rounded-full transition-all duration-500 ease-out" style={{ width: `${progress}%` }} />
              </div>
              <span className="text-sm font-medium text-gray-400 tabular-nums">{currentIdx + 1}/{questions.length}</span>
            </div>

            {/* 维度标签 */}
            <div className="mb-3">
              <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
                {DIM_LABELS[currentQ.dimension]}
              </span>
            </div>

            {/* 题目 */}
            <h2 className={`text-2xl font-semibold text-gray-900 leading-relaxed mb-10 transition-all duration-200 ${
              cardAnim === 'exit' ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'
            }`}>
              {currentQ.text}
            </h2>

            {/* 两极对比卡片 */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-center">
                <div className="text-xs text-blue-400 mb-1 font-medium">选项 A</div>
                <div className="text-sm font-semibold text-blue-700 leading-snug">{currentQ.poleA}</div>
              </div>
              <div className="bg-purple-50 border border-purple-100 rounded-xl p-4 text-center">
                <div className="text-xs text-purple-400 mb-1 font-medium">选项 B</div>
                <div className="text-sm font-semibold text-purple-700 leading-snug">{currentQ.poleB}</div>
              </div>
            </div>

            {/* 滑块 */}
            <div className="mb-6">
              <div className="relative h-10 flex items-center" ref={sliderTrackRef}>
                <div className="absolute inset-x-0 h-1.5 rounded-full bg-gray-100">
                  {sliderValue && (
                    <div className={`absolute top-0 bottom-0 rounded-full transition-all duration-200 ${
                      sliderValue > 0 ? 'bg-gray-800 left-1/2' : 'bg-gray-800 right-1/2'
                    }`} style={sliderValue > 0
                      ? { width: `${(sliderValue / 3) * 50}%` }
                      : { width: `${(Math.abs(sliderValue) / 3) * 50}%`, right: 0 }
                    } />
                  )}
                </div>
                {SLIDER_STOPS.map((stop, idx) => {
                  const isSelected = sliderValue === stop.value;
                  const position = (idx / (SLIDER_STOPS.length - 1)) * 100;
                  return (
                    <button
                      key={stop.value}
                      onClick={() => selectAnswer(stop.value)}
                      className={`absolute z-10 w-7 h-7 rounded-full transition-all duration-200 ${
                        isSelected
                          ? 'bg-gray-900 scale-125 shadow-lg shadow-gray-900/20'
                          : 'bg-white border-2 border-gray-200 hover:border-gray-400'
                      }`}
                      style={{ left: `calc(${position}% - 14px)` }}
                    />
                  );
                })}
              </div>
              {/* 刻度标签 */}
              <div className="flex justify-between px-0 mt-2">
                {[-3, -2, -1, 1, 2, 3].map(v => (
                  <span key={v} className="text-xs text-gray-300 w-7 text-center">{Math.abs(v)}</span>
                ))}
              </div>
            </div>

            {/* 导航 */}
            <div className="flex justify-between items-center">
              <button
                onClick={prevQuestion}
                disabled={currentIdx === 0}
                className="text-sm text-gray-400 disabled:opacity-30 hover:text-gray-600 transition-colors"
              >
                上一题
              </button>
              <div className="flex gap-1">
                {questions.slice(0, Math.min(questions.length, 20)).map((q, idx) => (
                  <div key={idx} className={`w-1.5 h-1.5 rounded-full transition-colors ${
                    idx < currentIdx ? 'bg-gray-900' : idx === currentIdx ? 'bg-gray-400' : 'bg-gray-200'
                  }`} />
                ))}
              </div>
              <span className="text-xs text-gray-300">{progress}%</span>
            </div>
          </div>
        )}
        
        {/* ─── 性别选择 ─── */}
        {step === 'gender_select' && result && (
          <div className="animate-[fadeIn_0.4s_ease-out] flex flex-col items-center justify-center min-h-[300px]">
            <div className="text-center mb-6">
              <div className="text-5xl mb-3">{MBTI_PROFILES[result.type]?.emoji || '✨'}</div>
              <p className="text-base text-gray-500 font-medium">你的性格类型</p>
              <h2 className="text-2xl font-bold text-gray-800 mt-1">{result.type} · {MBTI_PROFILES[result.type]?.title}</h2>
            </div>
            
            <p className="text-base text-gray-400 mb-9">生成头像前，请选择你的性别</p>

            <div className="flex gap-5">
              <button
                onClick={() => selectGender('male')}
                className="group flex flex-col items-center gap-3 px-10 py-8 rounded-2xl border-2 border-blue-100 bg-blue-50/50 hover:bg-blue-50 hover:border-blue-300 hover:shadow-lg transition-all duration-300"
              >
                <div className="text-5xl group-hover:scale-110 transition-transform">👨</div>
                <span className="text-base font-semibold text-blue-700">男生</span>
              </button>
              <button
                onClick={() => selectGender('female')}
                className="group flex flex-col items-center gap-3 px-10 py-8 rounded-2xl border-2 border-pink-100 bg-pink-50/50 hover:bg-pink-50 hover:border-pink-300 hover:shadow-lg transition-all duration-300"
              >
                <div className="text-5xl group-hover:scale-110 transition-transform">👩</div>
                <span className="text-base font-semibold text-pink-700">女生</span>
              </button>
            </div>
          </div>
        )}

        {/* ─── 结果页 ─── */}
        {step === 'result' && profile && (
          <div className="animate-[fadeIn_0.5s_ease-out]">
            {/* 类型头部 */}
            <div className="text-center mb-8">
              <div className="relative inline-block mb-6">
                {profile && !avatarError ? (
                  <img
                    src={getAvatarUrl(result.type, gender)}
                    alt="性格头像"
                    className="w-24 h-24 rounded-2xl border-2 border-gray-100 object-cover"
                    onError={(e) => {
                      const key = `${result.type}_${gender}`;
                      if (AVATAR_EXT_CACHE[key] !== 'gif') {
                        AVATAR_EXT_CACHE[key] = 'gif';
                        const genderedName = gender ? `${result.type.toLowerCase()}-${gender}` : result.type.toLowerCase();
                        e.currentTarget.src = `/uploads/mbti-avatars/${genderedName}.gif`;
                      } else {
                        setAvatarError(true);
                      }
                    }}
                  />
                ) : (
                  <div className="w-24 h-24 rounded-2xl bg-gray-100 flex items-center justify-center text-3xl">
                    {profile.emoji}
                  </div>
                )}
              </div>
              <div className="text-4xl font-bold tracking-tight mb-1" style={{ color: profile.color }}>
                {result.type}
              </div>
              <div className="text-lg font-medium text-gray-900">{profile.emoji} {profile.title}</div>
              <div className="flex items-center justify-center gap-2 mt-1">
                <p className="text-xs text-gray-400">
                  {testMode === 'quick' ? '快速测试 · 20题' : '标准测试 · 60题'}
                </p>
                {gender && (
                  <span className={`inline-flex items-center gap-0.5 text-xs font-medium px-1.5 py-0.5 rounded-full ${gender === 'male' ? 'bg-blue-50 text-blue-600' : 'bg-pink-50 text-pink-600'}`}>
                    {gender === 'male' ? '👨' : '👩'} {gender === 'male' ? '男' : '女'}
                  </span>
                )}
              </div>
            </div>

            {/* 头像操作 */}
            <div className="flex justify-center gap-3 mb-8">
              <button
                onClick={saveAvatarAsPet}
                disabled={avatarSaving || !user}
                className="px-4 py-2 rounded-xl bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-50"
              >
                {avatarSaving ? '设置中...' : '设为宠物头像'}
              </button>
              <button
                onClick={regenerateAvatar}
                disabled={regenerating}
                className="px-4 py-2 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                {regenerating ? '生成中...' : '重新生成头像'}
              </button>
              {!user && <span className="text-xs text-gray-400 self-center">登录后可设置</span>}
            </div>

            {/* 维度得分 */}
            <div className="bg-white rounded-2xl p-5 mb-4 border border-gray-100">
              <p className="text-sm font-medium text-gray-700 mb-4">维度得分</p>
              <div className="space-y-4">
                {(['EI', 'SN', 'TF', 'JP']).map((dim) => {
                  const pct = result.percentages[dim];
                  const traits = dim.split('');
                  const dimLabels = { EI: ['E', 'I'], SN: ['S', 'N'], TF: ['T', 'F'], JP: ['J', 'P'] }[dim];
                  return (
                    <div key={dim}>
                      <div className="flex justify-between text-xs text-gray-500 mb-1.5">
                        <span>{dimLabels[0]} · {TRAIT_LABELS[dimLabels[0]]?.replace(/\(.*\)/, '').trim()}</span>
                        <span>{TRAIT_LABELS[dimLabels[1]]?.replace(/\(.*\)/, '').trim()} · {dimLabels[1]}</span>
                      </div>
                      <div className="relative h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="absolute top-0 bottom-0 rounded-full transition-all duration-700"
                          style={{
                            width: `${pct}%`,
                            background: `linear-gradient(to right, #e5e7eb, ${profile.color})`,
                          }}
                        />
                      </div>
                      <div className="flex justify-between text-[10px] text-gray-300 mt-1">
                        <span>{100 - pct}%</span>
                        <span>{pct}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Tab 切换 */}
            <div className="flex gap-1 mb-4 bg-gray-100 rounded-xl p-1">
              {[
                { key: 'overview', label: '总览' },
                { key: 'deep', label: '深度解析' },
                { key: 'zodiac', label: '星座' },
                { key: 'combined', label: '综合' },
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${
                    activeTab === tab.key
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab 内容 */}
            <div className="bg-white rounded-2xl p-5 border border-gray-100 mb-6">
              {activeTab === 'overview' && (
                <div>
                  <p className="text-sm text-gray-600 leading-relaxed">{profile.overview}</p>
                  <div className="grid grid-cols-2 gap-3 mt-5">
                    <div className="bg-emerald-50 rounded-xl p-3">
                      <p className="text-xs font-medium text-emerald-700 mb-1">优势</p>
                      <p className="text-xs text-emerald-600/80 leading-relaxed">{profile.strengths}</p>
                    </div>
                    <div className="bg-amber-50 rounded-xl p-3">
                      <p className="text-xs font-medium text-amber-700 mb-1">成长空间</p>
                      <p className="text-xs text-amber-600/80 leading-relaxed">{profile.weaknesses}</p>
                    </div>
                  </div>
                </div>
              )}
              {activeTab === 'deep' && (
                <div className="space-y-4">
                  <div>
                    <p className="text-xs font-medium text-gray-400 mb-1">你是谁</p>
                    <p className="text-sm text-gray-700">{profile.overview.slice(0, 80)}...</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-400 mb-1">优势</p>
                    <p className="text-sm text-gray-700">{profile.strengths}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-400 mb-1">弱点</p>
                    <p className="text-sm text-gray-700">{profile.weaknesses}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-400 mb-1">工作与事业</p>
                    <p className="text-sm text-gray-700">{profile.work}</p>
                    <p className="text-xs text-gray-400 mt-1">适合职业：{profile.careers}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-400 mb-1">爱情与人际</p>
                    <p className="text-sm text-gray-700">{profile.love}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-400 mb-1">成长建议</p>
                    <p className="text-sm text-gray-700">{profile.growth}</p>
                  </div>
                </div>
              )}
              {activeTab === 'zodiac' && (
                selectedZodiac || savedZodiac ? (
                  <div>
                    {(() => {
                      const zKey = selectedZodiac || savedZodiac;
                      const z = ZODIAC_PROFILES[zKey];
                      if (!z) return <p className="text-sm text-gray-400">未选择星座</p>;
                      return (
                        <div className="space-y-4">
                          <div className="flex items-center gap-2">
                            <span className="text-xl">{z.emoji}</span>
                            <span className="font-medium text-gray-900">{z.name}</span>
                            <span className="text-xs text-gray-400">{z.dateRange} · {z.element} · {z.ruler}</span>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-gray-400 mb-1">星座概述</p>
                            <p className="text-sm text-gray-700">{z.overview}</p>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-gray-400 mb-1">性格特质</p>
                            <p className="text-sm text-gray-700">{z.traits}</p>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-gray-400 mb-1">感情观</p>
                            <p className="text-sm text-gray-700">{z.love}</p>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-gray-400 mb-1">事业方向</p>
                            <p className="text-sm text-gray-700">{z.work}</p>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <p className="text-sm text-gray-400 mb-4">请先在首页选择你的星座，获取星座解读</p>
                    <button onClick={() => { setStep('intro'); }} className="text-sm text-gray-800 font-medium underline">返回选择</button>
                  </div>
                )
              )}
              {activeTab === 'combined' && (
                combinedAnalysis ? (
                  <div className="space-y-4">
                    <p className="text-sm text-gray-700 leading-relaxed">{combinedAnalysis.elementAnalysis}</p>
                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <div className="bg-gray-50 rounded-xl p-3 text-center">
                        <p className="text-xs text-gray-400 mb-0.5">MBTI</p>
                        <p className="text-sm font-medium" style={{ color: profile.color }}>{profile.title} · {result.type}</p>
                      </div>
                      <div className="bg-gray-50 rounded-xl p-3 text-center">
                        <p className="text-xs text-gray-400 mb-0.5">星座</p>
                        <p className="text-sm font-medium text-gray-700">{combinedAnalysis.zodProfile.name} · {combinedAnalysis.zodProfile.element}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <p className="text-sm text-gray-400">请先在首页选择你的星座，获取综合解读</p>
                  </div>
                )
              )}
            </div>

            {/* 底部操作 */}
            <div className="flex gap-3">
              {user ? (
                savedMbti === result.type ? (
                  <div className="flex-1 py-3 text-center text-sm text-emerald-600 font-medium bg-emerald-50 rounded-xl">
                    ✓ 已保存
                  </div>
                ) : (
                  <button
                    onClick={saveMBTI}
                    disabled={saving}
                    className="flex-1 py-3 bg-gray-900 text-white rounded-xl text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-50"
                  >
                    {saving ? '保存中...' : '保存结果'}
                  </button>
                )
              ) : (
                <button onClick={() => navigate('/login')} className="flex-1 py-3 bg-gray-900 text-white rounded-xl text-sm font-medium">
                  登录以保存
                </button>
              )}
              <button
                onClick={() => { setStep('intro'); setResult(null); }}
                className="flex-1 py-3 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                重新测试
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <div className={`fixed top-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-xl text-sm font-medium shadow-lg animate-[fadeIn_0.2s_ease-out] ${
          toast.type === 'success' ? 'bg-gray-900 text-white' : 'bg-red-500 text-white'
        }`}>
          {toast.message}
        </div>
      )}
    </div>
  );
}

export default MBTITest;

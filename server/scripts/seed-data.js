const mongoose = require('mongoose');
const Content = require('../models/Content');
require('../models/User');

const testContents = [
  {
    type: 'achievement',
    title: '个人作品集网站',
    content: '花了三个月时间打造的个人作品集网站，使用 React + Next.js 构建，包含项目展示、博客文章、技能介绍等模块。整体设计采用现代简约风格，响应式布局适配各种设备。',
    link: 'https://github.com/example/portfolio',
    category: '网页作品',
    tags: ['前端', 'React', 'Next.js', '作品集'],
    status: 'available'
  },
  {
    type: 'achievement',
    title: '开源项目：Markdown 编辑器',
    content: '一款轻量级的 Markdown 编辑器，支持实时预览、代码高亮、导出 PDF 等功能。已在 GitHub 上获得 500+ Star，被多个开源项目采用。',
    link: 'https://github.com/example/md-editor',
    category: '项目',
    tags: ['开源', 'JavaScript', 'Markdown', '编辑器'],
    status: 'available'
  },
  {
    type: 'achievement',
    title: '技术博客：React Hooks 深入解析',
    content: '深入探讨 React Hooks 的原理和最佳实践，包括 useState、useEffect、useContext 等核心 Hooks 的使用场景和性能优化技巧。',
    link: 'https://blog.example.com/react-hooks',
    category: '文章',
    tags: ['React', 'Hooks', '前端', '技术博客'],
    status: 'available'
  },
  {
    type: 'inspiration',
    content: '今天突然想到：设计系统不应该只是组件的集合，更应该是一种思维方式，帮助团队在混乱中找到秩序。',
    tags: ['设计', '产品', '思维'],
    status: 'available'
  },
  {
    type: 'inspiration',
    content: '好的代码应该像一首诗，既要有清晰的结构，又要有优美的韵律。每一行都应该有它存在的理由。',
    tags: ['编程', '代码', '美学'],
    status: 'available'
  },
  {
    type: 'inspiration',
    content: '用户体验不是功能的堆砌，而是情感的传递。让用户感受到被理解和被尊重，这才是好的产品。',
    tags: ['UX', '产品设计', '用户体验'],
    status: 'available'
  },
  {
    type: 'inspiration',
    content: '学习任何新东西的最佳方式：先模仿，再创造，最后超越。站在巨人的肩膀上，但要有自己的思考。',
    tags: ['学习', '成长', '方法论'],
    status: 'available'
  },
  {
    type: 'item',
    title: '无线蓝牙耳机',
    content: '使用一年左右，音质还不错，续航大约4小时。因为换了新耳机，这个闲置了，送给需要的朋友。',
    category: '其他',
    tags: ['数码', '耳机', '闲置'],
    status: 'available'
  },
  {
    type: 'item',
    title: 'Python 编程书籍',
    content: '《Python编程：从入门到实践》第二版，几乎全新，附带书签。适合初学者学习 Python。',
    category: '其他',
    tags: ['书籍', '编程', 'Python'],
    status: 'available'
  },
  {
    type: 'item',
    title: '复古台灯',
    content: '北欧风格复古台灯，暖光，适合书房使用。搬家带不走，希望找到新主人。',
    category: '其他',
    tags: ['家居', '装饰', '台灯'],
    status: 'available'
  },
  {
    type: 'item',
    title: '机械键盘',
    content: '87键青轴机械键盘，RGB背光，使用两年，按键手感依然很好。换了静音键盘，这个出给喜欢机械键盘的朋友。',
    category: '工具',
    tags: ['数码', '键盘', '机械'],
    status: 'available'
  },
  {
    type: 'achievement',
    title: '移动端天气 App',
    content: '使用 Flutter 开发的天气应用，支持全球天气查询、空气质量指数、生活指数等功能。界面简洁美观，性能流畅。',
    link: 'https://play.google.com/store/apps/details?id=com.example.weather',
    category: '项目',
    tags: ['Flutter', '移动开发', '天气', 'App'],
    status: 'available'
  },
  {
    type: 'inspiration',
    content: '真正的创新不是发明新事物，而是把已有的事物重新组合，创造出新的价值。',
    tags: ['创新', '创意', '设计'],
    status: 'available'
  },
  {
    type: 'achievement',
    title: '在线代码编辑器',
    content: '支持多种编程语言的在线代码编辑器，支持语法高亮、代码格式化、运行结果实时展示。适合在线教学和代码分享。',
    link: 'https://code.example.com',
    category: '网页作品',
    tags: ['在线工具', '代码编辑', '教育'],
    status: 'available'
  },
  {
    type: 'item',
    title: '多肉植物组合',
    content: '三盆可爱的多肉植物，已经养了半年，状态很好。因为要出差，寻找有爱心的人收养它们。',
    category: '其他',
    tags: ['植物', '多肉', '礼物'],
    status: 'available'
  },
  {
    type: 'inspiration',
    content: '效率不是做更多的事，而是做更少但更重要的事。学会说不，是提升效率的第一步。',
    tags: ['效率', '时间管理', '生活哲学'],
    status: 'available'
  },
  {
    type: 'achievement',
    title: 'Node.js 后端框架',
    content: '基于 Express 封装的轻量级后端框架，提供路由自动注册、中间件管理、参数校验等功能，帮助快速构建 RESTful API。',
    link: 'https://github.com/example/node-framework',
    category: '项目',
    tags: ['Node.js', '后端', '框架', 'API'],
    status: 'available'
  },
  {
    type: 'item',
    title: '帆布托特包',
    content: '简约风格帆布托特包，容量大，适合日常通勤。洗过一次，状态良好。',
    category: '衣物',
    tags: ['包包', '日常', '环保'],
    status: 'available'
  },
  {
    type: 'inspiration',
    content: '好的代码注释不是解释代码做什么，而是解释为什么这么做。代码本身已经说明了做什么。',
    tags: ['编程', '代码规范', '最佳实践'],
    status: 'available'
  },
  {
    type: 'achievement',
    title: '数据可视化仪表盘',
    content: '企业级数据可视化解决方案，支持多种图表类型、实时数据更新、自定义主题等功能。已服务多家企业客户。',
    link: 'https://dashboard.example.com',
    category: '网页作品',
    tags: ['数据可视化', '图表', '企业服务'],
    status: 'available'
  }
];

async function seedData() {
  try {
    await mongoose.connect('mongodb://localhost:27017/woyouwu', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    const count = await Content.countDocuments();
    if (count > 0) {
      console.log(`数据库中已有 ${count} 条数据，跳过插入`);
      process.exit(0);
    }

    const adminUser = await mongoose.model('User').findOne({ username: 'admin' });
    if (!adminUser) {
      console.error('请先创建管理员账户');
      process.exit(1);
    }

    const contentsWithOwner = testContents.map(content => ({
      ...content,
      owner: adminUser._id
    }));

    await Content.insertMany(contentsWithOwner);
    console.log(`成功插入 ${testContents.length} 条测试数据！`);

    process.exit(0);
  } catch (error) {
    console.error('插入测试数据失败:', error);
    process.exit(1);
  }
}

seedData();
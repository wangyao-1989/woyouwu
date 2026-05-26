const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/woyouwu';

async function main() {
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB\n');

  const Article = require('../models/Article');
  const Project = require('../models/Project');
  const User = require('../models/User');

  let user = await User.findOne({ username: 'wangyao' });
  if (!user) {
    user = await User.create({
      username: 'wangyao',
      password: await bcrypt.hash('wangyao123', 10),
      nickname: '王耀',
    });
    console.log('Created wangyao user');
  }

  // ===== 1. 给现有项目添加视频 =====
  console.log('=== 给项目添加视频 ===');
  const projects = await Project.find({ owner: user._id }).sort({ createdAt: -1 });
  const videos = [
    '/uploads/test-video-01.mp4',
    '/uploads/test-video-02.mp4',
    '/uploads/test-video-03.mp4',
    '/uploads/test-video-04.mp4',
    '/uploads/test-video-05.mp4',
    '/uploads/test-video-07.mp4',
  ];

  let videoIdx = 0;
  for (const p of projects.slice(0, 3)) {
    if (!p.video || !p.video.trim()) {
      p.video = videos[videoIdx % videos.length];
      p.videoSource = '原创';
      await p.save();
      console.log(`  ✅ ${p.title} → video added`);
      videoIdx++;
    } else {
      console.log(`  ⏭ ${p.title} — already has video`);
    }
  }

  // If fewer than 3 projects, create more with video
  if (projects.length < 4) {
    const extra = [
      {
        title: 'DIY 树莓派智能家居中控',
        category: 'App',
        summary: '用树莓派搭建全屋智能控制中心',
        content: '## 项目概述\n用 Raspberry Pi 4 + Home Assistant 搭建全屋智能中控，支持灯光、空调、窗帘自动控制。\n\n## 硬件清单\n- Raspberry Pi 4 (4GB)\n- Zigbee USB Dongle\n- DHT22 温湿度传感器 ×3\n- 继电器模块 ×4\n\n## 成果\n实现了手机 App / 语音 / 自动化规则三种控制方式。',
        techTags: ['树莓派', 'IoT', 'HomeAssistant', 'Python'],
      },
      {
        title: '3D 打印定制键帽工坊',
        category: '设计',
        summary: '用 Blender 建模 + 3D 打印做专属键帽',
        content: '## 起因\n市面上的键帽要么太贵要么不够个性，干脆自己设计打印。\n\n## 流程\n1. Blender 建模 → 2. SLA 树脂打印 → 3. 打磨上色 → 4. UV 固化\n\n## 成果\n已经做了 20+ 款定制键帽，包括猫咪、蘑菇、宇航员等主题。',
        techTags: ['Blender', '3D打印', '设计'],
      },
    ];

    for (const e of extra) {
      const p = await Project.create({
        ...e,
        owner: user._id,
        ownerName: user.nickname,
        video: videos[videoIdx % videos.length],
        videoSource: '原创',
        cover: `/uploads/logo.png`,
      });
      console.log(`  ✅ Created: ${p.title} (with video)`);
      videoIdx++;
    }
  }

  // ===== 2. 补充丢失的文章，包括小说 =====
  console.log('\n=== 补充文章/故事 ===');

  const articlesToAdd = [
    {
      title: '逆光之城',
      category: '随笔',
      summary: '一个发生在未来都市的悬疑故事',
      content: `## 第一章：霓虹下的阴影

公元 2147 年，新上海。

林墨站在第 432 层的天桥上，俯瞰着脚下永不停歇的光流。这座城市从来没有真正的黑夜——巨型全息广告牌将天空染成了永恒的深蓝色，无人机的尾灯像流星一样划过天际。

"又收到了。"耳麦里传来搭档陈果的声音，"第三起了，手法一模一样。"

林墨调出全息投影。三张受害者的照片在半空中旋转：都是年轻女性，都在深夜独自出行，都被人从背后——他关掉了投影。

"我十分钟后到。"他说。

警用飞行器停在天桥侧面的平台上。林墨打开舱门时，潮湿的空气裹挟着合成食物的味道扑面而来。下层区。他皱了皱眉。十年前他刚入行时，这一带还算是中产社区。现在，抬头只能看到上层区的底部——那片永远遮住阳光的金属苍穹。

"这边。"陈果站在一条窄巷入口，周围已经拉起了警戒线。她的表情比平时更冷。

林墨走过去，然后停住了。

墙壁上有字。不是涂鸦，而是用某种激光刻上去的，工整得近乎印刷体：

\`\`\`
黑暗中没有影子
因为光从未抵达
\`\`\`

"前两个现场也有字吗？"林墨问。

"有。"陈果调出档案，"第一个现场刻的是「城市睡着了」，第二个是「但有人在醒着」。"

林墨盯着墙上的句子，突然感到一阵寒意。不是因为死者的惨状——他见过太多——而是因为这三句话连起来，是他最爱的诗。

他从未告诉过任何人。

---

*（未完待续）*`,
      tags: ['小说', '科幻', '悬疑'],
    },
    {
      title: '如何用 GitHub Actions 实现全自动部署',
      category: '教程',
      summary: '告别手动发布，让代码推送即部署',
      content: `## 为什么需要 CI/CD

每次改完代码都要手动 npm run build、scp 到服务器、重启 PM2 的日子该结束了。

## GitHub Actions 配置

在项目根目录创建 \`.github/workflows/deploy.yml\`：

\`\`\`yaml
name: Deploy to Server
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npm run build
      - name: Deploy via SSH
        uses: appleboy/scp-action@v0.1.7
        with:
          host: \${{ secrets.SSH_HOST }}
          username: \${{ secrets.SSH_USER }}
          key: \${{ secrets.SSH_KEY }}
          source: "dist/*"
          target: "/www/wwwroot/your-site/client/"
      - name: Restart service
        uses: appleboy/ssh-action@v1.0.3
        with:
          host: \${{ secrets.SSH_HOST }}
          username: \${{ secrets.SSH_USER }}
          key: \${{ secrets.SSH_KEY }}
          script: pm2 reload all
\`\`\`

## 设置 Secrets

在 GitHub 仓库 Settings → Secrets 中添加：
- SSH_HOST: 你的服务器IP
- SSH_USER: 服务器用户
- SSH_KEY: SSH 私钥

从今以后，git push 就是部署。享受自动化吧！`,
      tags: ['DevOps', 'CI/CD', 'GitHub', '教程'],
    },
    {
      title: '养猫两年，我学到的 10 件事',
      category: '随笔',
      summary: '一个程序员和一只橘猫的共生指南',
      content: `## 1. 键盘不属于你
当你坐下来写代码时，猫会觉得你的键盘是世界上最温暖的猫窝。解决方案：在桌边放一个加热垫。

## 2. 凌晨三点是合法的狂欢时间
不要试图改变它。你只能接受。

## 3. 光头比毛绒玩具有趣
所有激光笔都是对猫智商的合法诈骗。但看在它们满足的表情上，继续骗吧。

## 4. 猫对 bug 有第六感
每次调试到关键处，猫会精准地踩在键盘上——通常刚好按到 Ctrl+W。

## 5. 纸箱 > 猫窝
不用解释了。所有养猫人都懂。

## 6. 猫粮的价格曲线是你工资的三倍
通货膨胀只影响猫粮。

## 7. 你的床是它的床
你只是被允许在上面睡觉。

## 8. 它知道自己的名字，只是不在乎
喊它一百遍，它唯一会回应的时候是你打开罐头的那一秒。

## 9. 喂猫是最重要的 daily standup
比任何晨会都准时，误差不超过三分钟。

## 10. 你终究会变成那个在手机里全是猫照片的人
承认吧。那里面已经没有自拍了。`,
      tags: ['生活', '猫咪', '随笔'],
    },
  ];

  for (const a of articlesToAdd) {
    const exists = await Article.findOne({ title: a.title, owner: user._id });
    if (exists) {
      console.log(`  ⏭ ${a.title} — already exists`);
      continue;
    }
    const article = await Article.create({
      ...a,
      owner: user._id,
      ownerName: user.nickname,
      cover: `/uploads/logo.png`,
    });
    console.log(`  ✅ ${article.title}`);
  }

  // Summary
  console.log('\n=== ✅ 修复完成 ===');
  const projCount = await Project.countDocuments({ owner: user._id });
  const artCount = await Article.countDocuments({ owner: user._id });
  const videoProjects = await Project.find({ owner: user._id, video: { $ne: '', $exists: true } });
  console.log(`项目: ${projCount}（其中 ${videoProjects.length} 个有视频）`);
  console.log(`文章: ${artCount}`);
  console.log('首页视频卡片和文章故事均恢复正常！');

  await mongoose.disconnect();
}

main().catch(err => { console.error(err); process.exit(1); });

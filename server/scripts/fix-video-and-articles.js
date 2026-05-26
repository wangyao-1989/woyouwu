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
    user = await User.create({ username: 'wangyao', password: await bcrypt.hash('wangyao123', 10), nickname: '王耀' });
    console.log('Created wangyao user');
  }

  console.log('=== 给项目添加视频 ===');
  const projects = await Project.find({ owner: user._id }).sort({ createdAt: -1 });
  const videos = ['/uploads/test-video-01.mp4','/uploads/test-video-02.mp4','/uploads/test-video-03.mp4','/uploads/test-video-04.mp4','/uploads/test-video-05.mp4','/uploads/test-video-07.mp4'];

  let videoIdx = 0;
  for (const p of projects.slice(0, 3)) {
    if (!p.video || !p.video.trim()) { p.video = videos[videoIdx % videos.length]; p.videoSource = '原创'; await p.save(); console.log(`  ✅ ${p.title} → video added`); videoIdx++; }
    else { console.log(`  ⏭ ${p.title} — already has video`); }
  }

  if (projects.length < 4) {
    const extra = [
      { title: 'DIY 树莓派智能家居中控', category: 'App', summary: '用树莓派搭建全屋智能控制中心', content: '用 Raspberry Pi 4 + Home Assistant 搭建全屋智能中控。', techTags: ['树莓派', 'IoT', 'HomeAssistant', 'Python'] },
      { title: '3D 打印定制键帽工坊', category: '设计', summary: '用 Blender 建模 + 3D 打印做专属键帽', content: 'Blender 建模 → SLA 树脂打印 → 打磨上色 → UV 固化。已经做了 20+ 款定制键帽。', techTags: ['Blender', '3D打印', '设计'] },
    ];
    for (const e of extra) {
      await Project.create({ ...e, owner: user._id, ownerName: user.nickname, video: videos[videoIdx % videos.length], videoSource: '原创', cover: '/uploads/logo.png' });
      console.log(`  ✅ Created: ${e.title} (with video)`); videoIdx++;
    }
  }

  console.log('\n=== 补充文章/故事 ===');
  const articlesToAdd = [
    { title: '逆光之城', category: '随笔', summary: '一个发生在未来都市的悬疑故事', content: '## 第一章：霓虹下的阴影\n\n公元 2147 年，新上海。\n\n林墨站在第 432 层的天桥上，俯瞰着脚下永不停歇的光流。这座城市从来没有真正的黑夜……', tags: ['小说', '科幻', '悬疑'] },
    { title: '如何用 GitHub Actions 实现全自动部署', category: '教程', summary: '告别手动发布，让代码推送即部署', content: '## 为什么需要 CI/CD\n\n每次改完代码都要手动 npm run build、scp 到服务器的日子该结束了。\n\n配置 .github/workflows/deploy.yml 即可。', tags: ['DevOps', 'CI/CD', 'GitHub', '教程'] },
    { title: '养猫两年，我学到的 10 件事', category: '随笔', summary: '一个程序员和一只橘猫的共生指南', content: '## 1. 键盘不属于你\n当你坐下来写代码时，猫会觉得你的键盘是世界上最温暖的猫窝。\n## 2. 凌晨三点是合法的狂欢时间\n不要试图改变它。你只能接受。', tags: ['生活', '猫咪', '随笔'] },
  ];

  for (const a of articlesToAdd) {
    const exists = await Article.findOne({ title: a.title, owner: user._id });
    if (exists) { console.log(`  ⏭ ${a.title} — already exists`); continue; }
    await Article.create({ ...a, owner: user._id, ownerName: user.nickname, cover: '/uploads/logo.png' });
    console.log(`  ✅ ${a.title}`);
  }

  console.log('\n=== ✅ 修复完成 ===');
  await mongoose.disconnect();
}

main().catch(err => { console.error(err); process.exit(1); });

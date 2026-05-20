const mongoose = require('mongoose');
const User = require('../models/User');

const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'admin123';
const ADMIN_NICKNAME = '管理员';

async function createAdmin() {
  try {
    await mongoose.connect('mongodb://localhost:27017/woyouwu', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    const existingAdmin = await User.findOne({ username: ADMIN_USERNAME });
    if (existingAdmin) {
      await User.deleteOne({ username: ADMIN_USERNAME });
      console.log('已删除旧的管理员账户');
    }

    const admin = new User({
      username: ADMIN_USERNAME,
      password: ADMIN_PASSWORD,
      nickname: ADMIN_NICKNAME,
      role: 'admin'
    });

    await admin.save();
    console.log(`管理员账户创建成功：`);
    console.log(`用户名: ${ADMIN_USERNAME}`);
    console.log(`密码: ${ADMIN_PASSWORD}`);
    console.log(`昵称: ${ADMIN_NICKNAME}`);

    process.exit(0);
  } catch (error) {
    console.error('创建管理员失败:', error);
    process.exit(1);
  }
}

createAdmin();
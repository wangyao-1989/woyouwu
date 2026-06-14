const mongoose = require('mongoose');
const User = require('../models/User');

mongoose.connect('mongodb://localhost:27017/woyouwu');

const resetAdminPassword = async () => {
  try {
    const admin = await User.findOne({ username: 'admin' });

    if (admin) {
      // 直接设明文密码，pre('save') 钩子会自动 hash
      admin.password = 'admin123';
      await admin.save();
      console.log('管理员密码已重置为: admin123');
    } else {
      const newAdmin = new User({
        username: 'admin',
        nickname: '管理员',
        email: 'admin@example.com',
        password: 'admin123',
        role: 'admin',
      });
      await newAdmin.save();
      console.log('管理员账号已创建: admin / admin123');
    }

    process.exit(0);
  } catch (error) {
    console.error('重置密码失败:', error);
    process.exit(1);
  }
};

resetAdminPassword();

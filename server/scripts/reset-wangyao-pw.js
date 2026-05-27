require('dotenv').config({ path: require('path').join(__dirname, '.env.production') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

(async () => {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/woyouwu');
  const User = require('../models/User');

  const hash = await bcrypt.hash('wangyao123', 10);
  const result = await User.updateOne(
    { username: 'wangyao' },
    { $set: { password: hash } }
  );
  console.log('Updated:', result.modifiedCount, 'docs for wangyao');
  console.log('Password now: wangyao123');
  process.exit(0);
})();

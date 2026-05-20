const User = require('../models/User');

const admin = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: '没有管理员权限' });
    }
    next();
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
};

module.exports = { admin };
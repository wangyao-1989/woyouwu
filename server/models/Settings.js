const mongoose = require('mongoose');

const SettingsSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true,
  },
  // 全局宠物设置
  globalPet: {
    image: { type: String, default: '' },
    walkGif: { type: String, default: '' },
    avatar: { type: String, default: '' },
    name: { type: String, default: '果果仁' },
    videos: [{
      filename: String,
      originalName: String,
      title: { type: String, default: '' },
      path: String,
      createdAt: Date,
    }],
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

SettingsSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Settings', SettingsSchema);

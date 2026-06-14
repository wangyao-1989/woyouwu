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
  // 外部API开关设置
  externalApis: {
    aiChat: { type: Boolean, default: true },
    newsGeneration: { type: Boolean, default: true },
    resumeParse: { type: Boolean, default: true },
    mbtiAvatar: { type: Boolean, default: true },
    textToImage: { type: Boolean, default: true },
  },
  // 外部API配置（每个板块独立）
  externalApiConfig: {
    aiChat: {
      apiKey: { type: String, default: '' },
      endpoint: { type: String, default: 'https://ark.cn-beijing.volces.com/api/v3/chat/completions' },
      model: { type: String, default: 'doubao-seed-2-0-pro-260215' },
    },
    newsGeneration: {
      apiKey: { type: String, default: '' },
      endpoint: { type: String, default: 'https://ark.cn-beijing.volces.com/api/v3/chat/completions' },
      model: { type: String, default: 'doubao-seed-2-0-pro-260215' },
    },
    resumeParse: {
      apiKey: { type: String, default: '' },
      endpoint: { type: String, default: 'https://ark.cn-beijing.volces.com/api/v3/chat/completions' },
      model: { type: String, default: 'doubao-seed-2-0-pro-260215' },
    },
    textToImage: {
      apiKey: { type: String, default: '' },
      endpoint: { type: String, default: 'https://tokenhub.tencentmaas.com/v1/api/image/submit' },
      model: { type: String, default: 'hy-image-v3.0' },
    },
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

// 获取或创建全局设置
SettingsSchema.statics.getGlobalSettings = async function() {
  let settings = await this.findOne({ key: 'global' });
  if (!settings) {
    settings = await this.create({ key: 'global' });
  }
  return settings;
};

// 检查特定API是否启用
SettingsSchema.statics.isApiEnabled = async function(apiName) {
  const settings = await this.getGlobalSettings();
  return settings.externalApis?.[apiName] !== false;
};

module.exports = mongoose.model('Settings', SettingsSchema);

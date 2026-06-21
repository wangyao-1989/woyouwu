const mongoose = require('mongoose');

const scraperSaveSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  type: {
    type: String,
    enum: ['url', 'keyword', 'briefing'],
    required: true,
  },
  // 爬取来源：URL 或关键词
  source: {
    type: String,
    required: true,
  },
  // 标题
  title: {
    type: String,
    default: '',
  },
  // 原始爬取内容
  rawContent: {
    type: String,
    default: '',
  },
  // AI 综合研究报告
  report: {
    type: String,
    default: '',
  },
  // AI 总结内容（URL模式用）
  aiSummary: {
    type: String,
    default: '',
  },
  // 搜索时的提炼词
  refinedTerms: [String],
  // 用户自定义笔记
  customNotes: {
    type: String,
    default: '',
  },
  // 是否标记为满意
  satisfied: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('ScraperSave', scraperSaveSchema);

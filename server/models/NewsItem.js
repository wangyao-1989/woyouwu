const mongoose = require('mongoose');

const newsItemSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    maxlength: 200
  },
  summary: {
    type: String,
    default: '',
    maxlength: 600
  },
  detail: {
    type: String,
    default: '',
    maxlength: 2000
  },
  cover: {
    type: String,
    default: ''
  },
  category: {
    type: String,
    enum: ['tech', 'design', 'creative', 'literature', 'life', 'career', 'science', 'art', 'custom'],
    required: true
  },
  sourceType: {
    type: String,
    enum: ['project', 'article', 'inspiration', 'resource', 'item', 'content', 'ai'],
    default: 'ai'
  },
  sourceId: {
    type: mongoose.Schema.Types.ObjectId,
    default: null
  },
  sourceUrl: {
    type: String,
    default: ''
  },
  author: {
    nickname: { type: String, default: 'AI 资讯' },
    avatar: { type: String, default: '' },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }
  },
  generatedFor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
    index: true
  },
  isAiGenerated: {
    type: Boolean,
    default: true
  },
  relatedKeywords: [{
    type: String
  }],
  hotScore: {
    type: Number,
    default: 0
  },
  publishDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

newsItemSchema.index({ hotScore: -1 });
newsItemSchema.index({ publishDate: -1 });
newsItemSchema.index({ category: 1, hotScore: -1 });
newsItemSchema.index({ sourceId: 1 });
newsItemSchema.index({ generatedFor: 1, publishDate: -1 });

newsItemSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('NewsItem', newsItemSchema);

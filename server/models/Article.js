const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  authorName: { type: String, required: true },
  authorAvatar: { type: String, default: '' },
  content: { type: String, required: true, maxlength: 500 },
  createdAt: { type: Date, default: Date.now }
});

const articleSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 100 },
  cover: { type: String, default: '' },
  category: {
    type: String,
    required: true,
    enum: ['经验分享', '教程', '随笔', '书评影评', '技术文章', '其他']
  },
  summary: { type: String, required: true, trim: true, maxlength: 100 },
  content: { type: String, required: true, maxlength: 50000 },
  meta: { type: mongoose.Schema.Types.Mixed, default: {} },
  tags: [{ type: String, trim: true }],
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  ownerName: { type: String, required: true },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  favorites: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  comments: [commentSchema],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

articleSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Article', articleSchema);
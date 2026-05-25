const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  authorName: { type: String, required: true },
  authorAvatar: { type: String, default: '' },
  content: { type: String, required: true, maxlength: 500 },
  createdAt: { type: Date, default: Date.now }
});

const inspirationSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 100 },
  category: {
    type: String,
    required: true,
    enum: ['产品想法', '设计灵感', '技术方案', '商业模式', '其他']
  },
  description: { type: String, required: true, trim: true, maxlength: 200 },
  detail: { type: String, default: '', maxlength: 5000 },
  refLinks: [{ type: String, trim: true }],
  tags: [{ type: String, trim: true }],
  status: {
    type: String,
    enum: ['纯想法', '探索中', '已落地'],
    default: '纯想法'
  },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  ownerName: { type: String, required: true },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  favorites: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  comments: [commentSchema],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

inspirationSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Inspiration', inspirationSchema);
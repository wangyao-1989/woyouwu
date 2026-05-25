const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  authorName: { type: String, required: true },
  authorAvatar: { type: String, default: '' },
  content: { type: String, required: true, maxlength: 500 },
  createdAt: { type: Date, default: Date.now }
});

const projectSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 100 },
  cover: { type: String, default: '' },
  video: { type: String, default: '' },
  videoSource: { type: String, default: '原创' },
  videoSourceLink: { type: String, trim: true, default: '' },
  category: {
    type: String,
    required: true,
    enum: ['网站', 'App', '设计', '视频', '音乐', '写作', '其他']
  },
  summary: { type: String, required: true, trim: true, maxlength: 30 },
  content: { type: String, required: true, maxlength: 10000 },
  link: { type: String, trim: true, default: '' },
  techTags: [{ type: String, trim: true }],
  completionDate: { type: Date },
  collaborators: { type: String, trim: true, default: '' },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  ownerName: { type: String, required: true },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  favorites: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  comments: [commentSchema],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

projectSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Project', projectSchema);
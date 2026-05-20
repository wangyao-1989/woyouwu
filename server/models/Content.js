const mongoose = require('mongoose');

const contentSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['achievement', 'inspiration', 'item'],
    required: true,
    index: true
  },
  title: {
    type: String,
    trim: true,
    maxlength: 200
  },
  content: {
    type: String,
    maxlength: 5000
  },
  link: {
    type: String,
    trim: true
  },
  category: {
    type: String,
    enum: ['网页作品', '文章', '项目', '工具', '衣物', '会员卡', '其他'],
    default: '其他'
  },
  images: [{
    type: String
  }],
  tags: [{
    type: String,
    trim: true
  }],
  status: {
    type: String,
    enum: ['available', 'given', 'exchanged', 'borrowed'],
    default: 'available'
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  favorites: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  comments: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    userName: {
      type: String,
      required: true
    },
    userAvatar: {
      type: String,
      default: ''
    },
    content: {
      type: String,
      required: true,
      maxlength: 1000
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  views: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

contentSchema.index({ createdAt: -1 });
contentSchema.index({ type: 1, createdAt: -1 });

contentSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

contentSchema.virtual('likesCount').get(function() {
  return this.likes ? this.likes.length : 0;
});

contentSchema.virtual('commentsCount').get(function() {
  return this.comments ? this.comments.length : 0;
});

contentSchema.set('toJSON', { virtuals: true });
contentSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Content', contentSchema);
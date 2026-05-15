const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 20
  },
  email: {
    type: String,
    unique: true,
    sparse: true,
    trim: true,
    lowercase: true
  },
  phone: {
    type: String,
    unique: true,
    sparse: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  nickname: {
    type: String,
    required: true,
    trim: true,
    maxlength: 30
  },
  avatar: {
    type: String,
    default: ''
  },
  bio: {
    type: String,
    default: '',
    maxlength: 500
  },
  background: {
    type: String,
    default: ''
  },
  location: {
    type: String,
    default: '',
    maxlength: 100
  },
  website: {
    type: String,
    default: ''
  },
  skills: [{
    type: String,
    maxlength: 20
  }],
  socialLinks: {
    weibo: { type: String, default: '' },
    github: { type: String, default: '' },
    twitter: { type: String, default: '' },
    bilibili: { type: String, default: '' },
    zhihu: { type: String, default: '' },
    qq: { type: String, default: '' }
  },
  contactWechat: {
    type: String,
    default: ''
  },
  contactPhone: {
    type: String,
    default: ''
  },
  contactEmail: {
    type: String,
    default: ''
  },
  theme: {
    primaryColor: {
      type: String,
      default: '#6366f1'
    },
    layout: {
      type: String,
      enum: ['default', 'compact', 'wide'],
      default: 'default'
    }
  },
  favorites: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Resource'
  }],
  followers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  following: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);

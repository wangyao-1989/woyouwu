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
  smsVerified: {
    type: Boolean,
    default: false
  },
  registerIp: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['active', 'muted', 'banned'],
    default: 'active'
  },
  muteExpiresAt: {
    type: Date,
    default: null
  },
  banReason: {
    type: String,
    default: ''
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
  realName: {
    type: String,
    default: '',
    maxlength: 20
  },
  bio: {
    type: String,
    default: '',
    maxlength: 60
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
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
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
  interests: [{
    type: String,
    maxlength: 20
  }],
  experience: [{
    period: { type: String, default: '' },
    organization: { type: String, default: '' },
    position: { type: String, default: '' },
    description: { type: String, default: '' }
  }],
  education: [{
    school: { type: String, default: '' },
    major: { type: String, default: '' },
    degree: { type: String, default: '' },
    period: { type: String, default: '' }
  }],
  isPublic: {
    type: Boolean,
    default: false
  },
  pet: {
    image: {
      type: String,
      default: ''
    },
    walkGif: {
      type: String,
      default: ''
    },
    name: {
      type: String,
      default: '果果仁'
    },
    videos: [{
      filename: { type: String },
      originalName: { type: String },
      label: { type: String, default: '' },
      createdAt: { type: Date, default: Date.now }
    }]
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

userSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    ret.id = ret._id;
    delete ret.__v;
    return ret;
  }
});

module.exports = mongoose.model('User', userSchema);

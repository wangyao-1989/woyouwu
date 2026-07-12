const mongoose = require('mongoose');

const borrowRecordSchema = new mongoose.Schema({
  item: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Item',
    required: true
  },
  borrower: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  borrowerName: {
    type: String,
    required: true
  },
  expectedReturnDate: {
    type: Date,
    required: true
  },
  actualReturnDate: {
    type: Date
  },
  pickupMethod: {
    type: String,
    enum: ['self_pickup', 'delivery', '自取', '邮寄'],
    default: 'self_pickup'
  },
  message: {
    type: String,
    trim: true,
    maxlength: 500,
    default: ''
  },
  contactInfo: {
    type: String,
    trim: true,
    default: ''
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'shipped', 'picked_up', 'returned', 'rejected'],
    default: 'pending'
  },
  messageId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  },
  shippedAt: {
    type: Date
  },
  pickedUpAt: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const itemSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['achievement', 'idea', 'project', 'article', 'stuff'],
    default: 'stuff'
  },
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  images: [{
    type: String,
    required: true
  }],
  category: {
    type: String,
    trim: true,
    default: ''
  },
  condition: {
    type: String,
    trim: true,
    default: ''
  },
  borrowStartDate: {
    type: Date,
    default: null
  },
  borrowEndDate: {
    type: Date,
    default: null
  },
  link: {
    type: String,
    trim: true,
    default: ''
  },
  remark: {
    type: String,
    trim: true,
    maxlength: 500
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  ownerName: {
    type: String,
    required: true
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
  status: {
    type: String,
    enum: ['available', 'given', 'exchanged', 'borrowed', '可借用', '已借出', '维修中', '收回发布'],
    default: 'available'
  },
  location: {
    type: String,
    trim: true,
    maxlength: 200
  },
  coordinates: {
    lat: { type: Number },
    lng: { type: Number }
  },
  borrower: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  borrowerName: {
    type: String
  },
  expectedReturnDate: {
    type: Date
  },
  borrowHistory: [borrowRecordSchema],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

itemSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Item', itemSchema);
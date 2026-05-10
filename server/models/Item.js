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
  status: {
    type: String,
    enum: ['pending', 'approved', 'returned', 'rejected'],
    default: 'pending'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const itemSchema = new mongoose.Schema({
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
    enum: ['工具', '衣物', '药物', '会员卡', '其他'],
    required: true
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
    enum: ['可借用', '已借出', '维修中'],
    default: '可借用'
  },
  location: {
    type: String,
    trim: true,
    maxlength: 200
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
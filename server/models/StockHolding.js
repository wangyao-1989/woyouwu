const mongoose = require('mongoose');

const StockHoldingSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  stockCode: {
    type: String,
    required: true,
  },
  stockName: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ['stock', 'etf'],
    default: 'stock',
  },
  shares: {
    type: Number,
    default: 0,
  },
  costPrice: {
    type: String,
    default: '0.0000',
  },
  currentPrice: {
    type: String,
    default: null,
  },
  sector: {
    type: String,
    default: '',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// 复合索引确保同一用户不能重复添加同一股票
StockHoldingSchema.index({ user: 1, stockCode: 1 }, { unique: true });

StockHoldingSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('StockHolding', StockHoldingSchema);

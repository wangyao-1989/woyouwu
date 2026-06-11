const mongoose = require('mongoose');

const marketCompanySchema = new mongoose.Schema({
  stockCode: { type: String, required: true },
  stockName: { type: String, required: true },
  link: { type: String, default: '' },
  description: { type: String, default: '' },
  marketCap: { type: Number, default: 0 },
  chainPosition: { type: String, default: '' },
}, { timestamps: true });

const marketSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  description: { type: String, required: true },
  marketType: { type: String, enum: ['hot', 'potential'], default: 'potential' },
  attentionScore: { type: Number, default: 50, min: 0, max: 100 },
  potentialScore: { type: Number, default: 50, min: 0, max: 100 },
  icon: { type: String, default: '' },
  tags: [{ type: String }],
  companies: [marketCompanySchema],
  analysis: {
    content: String,
    generatedAt: Date,
    type: String,
  },
}, { timestamps: true });

module.exports = mongoose.model('Market', marketSchema);

const mongoose = require('mongoose');

const ApiUsageSchema = new mongoose.Schema({
  apiType: {
    type: String,
    required: true,
    enum: ['aiChat', 'newsGeneration', 'resumeParse', 'mbtiAvatar'],
    index: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true,
  },
  promptTokens: {
    type: Number,
    default: 0,
  },
  completionTokens: {
    type: Number,
    default: 0,
  },
  totalTokens: {
    type: Number,
    default: 0,
  },
  status: {
    type: String,
    enum: ['success', 'failed'],
    default: 'success',
  },
  errorMessage: String,
  model: {
    type: String,
    default: '',
  },
  date: {
    type: Date,
    default: Date.now,
    index: true,
  },
});

// 静态方法：记录API使用
ApiUsageSchema.statics.recordUsage = async function(data) {
  try {
    return await this.create({
      apiType: data.apiType,
      userId: data.userId,
      promptTokens: data.promptTokens || 0,
      completionTokens: data.completionTokens || 0,
      totalTokens: data.totalTokens || (data.promptTokens || 0) + (data.completionTokens || 0),
      status: data.status || 'success',
      errorMessage: data.errorMessage,
      model: data.model || '',
    });
  } catch (error) {
    console.error('记录API使用失败:', error);
  }
};

// 静态方法：获取统计数据
ApiUsageSchema.statics.getStats = async function(options = {}) {
  const { apiType, startDate, endDate, userId } = options;
  const match = {};

  if (apiType) match.apiType = apiType;
  if (userId) match.userId = userId;
  if (startDate || endDate) {
    match.date = {};
    if (startDate) match.date.$gte = new Date(startDate);
    if (endDate) match.date.$lte = new Date(endDate);
  }

  const stats = await this.aggregate([
    { $match: match },
    {
      $group: {
        _id: '$apiType',
        totalPromptTokens: { $sum: '$promptTokens' },
        totalCompletionTokens: { $sum: '$completionTokens' },
        totalTokens: { $sum: '$totalTokens' },
        totalCalls: { $sum: 1 },
        successCalls: { $sum: { $cond: [{ $eq: ['$status', 'success'] }, 1, 0] } },
        failedCalls: { $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] } },
      },
    },
  ]);

  const modelStats = await this.aggregate([
    { $match: { ...match, model: { $ne: '' } } },
    {
      $group: {
        _id: { apiType: '$apiType', model: '$model' },
        totalTokens: { $sum: '$totalTokens' },
        totalCalls: { $sum: 1 },
      },
    },
    { $sort: { '_id.apiType': 1, totalTokens: -1 } },
  ]);

  return { stats, modelStats };
};

// 静态方法：获取每日统计
ApiUsageSchema.statics.getDailyStats = async function(options = {}) {
  const { apiType, startDate, endDate } = options;
  const match = {};

  if (apiType) match.apiType = apiType;
  if (startDate || endDate) {
    match.date = {};
    if (startDate) match.date.$gte = new Date(startDate);
    if (endDate) match.date.$lte = new Date(endDate);
  }

  const stats = await this.aggregate([
    { $match: match },
    {
      $group: {
        _id: {
          date: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
          apiType: '$apiType',
        },
        totalTokens: { $sum: '$totalTokens' },
        totalCalls: { $sum: 1 },
      },
    },
    { $sort: { '_id.date': 1 } },
  ]);

  return stats;
};

module.exports = mongoose.model('ApiUsage', ApiUsageSchema);

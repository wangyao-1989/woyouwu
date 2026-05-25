const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  reporter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  reporterName: {
    type: String,
    required: true
  },
  targetType: {
    type: String,
    required: true,
    enum: ['item', 'resource', 'content', 'post', 'comment', 'user']
  },
  targetId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  targetTitle: {
    type: String,
    default: ''
  },
  targetOwner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  targetOwnerName: {
    type: String,
    default: ''
  },
  reason: {
    type: String,
    required: true,
    enum: [
      'spam',
      'harassment',
      'inappropriate',
      'violence',
      'fraud',
      'copyright',
      'illegal',
      'other'
    ]
  },
  description: {
    type: String,
    maxlength: 1000
  },
  status: {
    type: String,
    enum: ['pending', 'investigating', 'resolved', 'dismissed'],
    default: 'pending',
    index: true
  },
  handler: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  handlerNote: {
    type: String,
    maxlength: 1000
  },
  action: {
    type: String,
    enum: ['ignore', 'warn', 'block_content', 'delete_content', 'mute_user', 'ban_user', null],
    default: null
  },
  handledAt: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }
});

reportSchema.index({ status: 1, createdAt: -1 });
reportSchema.index({ targetType: 1, targetId: 1 });

module.exports = mongoose.model('Report', reportSchema);
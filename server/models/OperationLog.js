const mongoose = require('mongoose');

const operationLogSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true
  },
  username: {
    type: String,
    default: ''
  },
  action: {
    type: String,
    required: true,
    enum: [
      'register', 'login', 'logout',
      'item_create', 'item_update', 'item_delete',
      'resource_create', 'resource_update', 'resource_delete',
      'content_create', 'content_update', 'content_delete',
      'post_create', 'post_delete',
      'comment_create', 'comment_delete',
      'borrow_request', 'borrow_approve', 'borrow_reject', 'borrow_return',
      'like', 'favorite', 'follow', 'unfollow',
      'profile_update',
      'admin_mute_user', 'admin_unmute_user', 'admin_ban_user', 'admin_unban_user',
      'admin_block_content', 'admin_unblock_content', 'admin_delete_content',
      'report_create', 'report_handle',
      'sms_send'
    ],
    index: true
  },
  targetType: {
    type: String,
    enum: ['user', 'item', 'resource', 'content', 'post', 'comment', 'report', 'system', null],
    default: null
  },
  targetId: {
    type: mongoose.Schema.Types.ObjectId,
    default: null,
    index: true
  },
  detail: {
    type: String,
    maxlength: 1000
  },
  sourceIp: {
    type: String,
    default: ''
  },
  sourcePort: {
    type: String,
    default: ''
  },
  userAgent: {
    type: String,
    default: ''
  },
  method: {
    type: String,
    default: ''
  },
  path: {
    type: String,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }
});

operationLogSchema.index({ createdAt: -1 });
operationLogSchema.index({ action: 1, createdAt: -1 });
operationLogSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('OperationLog', operationLogSchema);
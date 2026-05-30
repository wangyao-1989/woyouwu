const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  senderName: {
    type: String,
    required: true
  },
  senderAvatar: {
    type: String,
    default: ''
  },
  type: {
    type: String,
    enum: ['borrow_request', 'borrow_approved', 'borrow_rejected', 'borrow_shipped', 'borrow_picked_up', 'borrow_returned', 'resource_comment', 'comment_reply'],
    required: true
  },
  title: {
    type: String,
    required: true,
    maxlength: 200
  },
  content: {
    type: String,
    required: true,
    maxlength: 500
  },
  relatedItem: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Item'
  },
  relatedResource: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Resource'
  },
  isRead: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

messageSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });

module.exports = mongoose.model('Message', messageSchema);
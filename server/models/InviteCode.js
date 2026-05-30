const mongoose = require('mongoose');

const inviteCodeSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true
  },
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  usedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  status: {
    type: String,
    enum: ['active', 'used', 'revoked'],
    default: 'active'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  usedAt: {
    type: Date,
    default: null
  }
});

inviteCodeSchema.index({ creator: 1, status: 1 });

inviteCodeSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    ret.id = ret._id;
    delete ret.__v;
    return ret;
  }
});

module.exports = mongoose.model('InviteCode', inviteCodeSchema);

const mongoose = require('mongoose');

const newsPreferenceSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  categories: [{
    type: String,
    enum: ['tech', 'design', 'creative', 'literature', 'life', 'career', 'science', 'art'],
  }],
  customKeywords: [{
    type: String,
    maxlength: 30
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

newsPreferenceSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

newsPreferenceSchema.pre('findOneAndUpdate', function(next) {
  this.set({ updatedAt: new Date() });
  next();
});

module.exports = mongoose.model('NewsPreference', newsPreferenceSchema);

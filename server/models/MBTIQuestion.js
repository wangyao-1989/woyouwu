const mongoose = require('mongoose');

const mbtiQuestionSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true,
  },
  poleA: {
    type: String,
    required: true,
  },
  poleB: {
    type: String,
    required: true,
  },
  dimension: {
    type: String,
    required: true,
    enum: ['EI', 'SN', 'TF', 'JP'],
  },
  traitA: {
    type: String,
    required: true,
    enum: ['E', 'I', 'S', 'N', 'T', 'F', 'J', 'P'],
  },
  scene: {
    type: String,
    default: 'general',
    enum: ['general', 'workplace', 'social', 'self', 'relationship'],
  },
  version: {
    type: String,
    default: 'both',
    enum: ['express', 'professional', 'both'],
  },
  order: {
    type: Number,
    default: 0,
  },
});

mbtiQuestionSchema.index({ dimension: 1, version: 1 });
mbtiQuestionSchema.index({ scene: 1 });

module.exports = mongoose.model('MBTIQuestion', mbtiQuestionSchema);

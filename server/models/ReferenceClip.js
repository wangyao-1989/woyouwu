const mongoose = require('mongoose');

const referenceClipSchema = new mongoose.Schema({
  // 标题（用于快速识别）
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  // 参考内容正文（支持大量文本、HTML、CSS、JS等）
  content: {
    type: String,
    default: ''
  },
  // 附件文件（保存在服务端私有目录，通过管理员接口下载）
  attachments: [{
    originalName: {
      type: String,
      required: true,
      trim: true
    },
    storedName: {
      type: String,
      required: true
    },
    mimeType: {
      type: String,
      default: ''
    },
    size: {
      type: Number,
      default: 0
    }
  }],
  // 来源网址
  sourceUrl: {
    type: String,
    default: '',
    trim: true
  },
  // 备注/笔记
  note: {
    type: String,
    default: '',
    maxlength: 500
  },
  // 标签（方便分类和搜索）
  tags: [{
    type: String,
    trim: true
  }],
  // 类型
  type: {
    type: String,
    enum: ['webpage', 'code', 'design', 'other'],
    default: 'webpage'
  },
  // 创建者
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true // 自动管理 createdAt 和 updatedAt
});

// 全文搜索索引
referenceClipSchema.index(
  { title: 'text', content: 'text', note: 'text', tags: 'text', sourceUrl: 'text' },
  { name: 'reference_text_index' }
);

// 按创建时间倒序
referenceClipSchema.index({ createdAt: -1 });

// 按创建者索引
referenceClipSchema.index({ createdBy: 1, createdAt: -1 });

module.exports = mongoose.model('ReferenceClip', referenceClipSchema);

const mongoose = require('mongoose');

const attachmentSchema = new mongoose.Schema(
  {
    task: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task',
      required: true,
      index: true,
    },
    fileName: {
      type: String,
      required: true,
    },
    originalName: {
      type: String,
      required: true,
    },
    filePath: {
      type: String,
      required: true,
    },
    fileUrl: {
      type: String,
    },
    fileSize: {
      type: Number,
      required: true,
      max: [52428800, 'File size cannot exceed 50MB'],
    },
    mimeType: {
      type: String,
      required: true,
    },
    storageType: {
      type: String,
      enum: ['local', 's3'],
      default: 'local',
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: Date,
  },
  {
    timestamps: true,
  }
);

// Indexes
attachmentSchema.index({ task: 1, createdAt: -1 });
attachmentSchema.index({ uploadedBy: 1 });

// Method to soft delete attachment
attachmentSchema.methods.softDelete = function () {
  this.isDeleted = true;
  this.deletedAt = new Date();
  return this.save();
};

// Static method to check task attachment limit
attachmentSchema.statics.checkTaskLimit = async function (taskId) {
  const count = await this.countDocuments({ task: taskId, isDeleted: false });
  const maxFiles = parseInt(process.env.MAX_FILES_PER_TASK) || 10;

  if (count >= maxFiles) {
    throw new Error(`Maximum ${maxFiles} files per task allowed`);
  }

  return true;
};

// Static method to get total size for task
attachmentSchema.statics.getTaskTotalSize = async function (taskId) {
  const attachments = await this.find({ task: taskId, isDeleted: false });
  return attachments.reduce((total, att) => total + att.fileSize, 0);
};

// Virtual for file extension
attachmentSchema.virtual('extension').get(function () {
  return this.originalName.split('.').pop().toLowerCase();
});

// Virtual for formatted file size
attachmentSchema.virtual('fileSizeFormatted').get(function () {
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  if (this.fileSize === 0) return '0 Bytes';
  const i = parseInt(Math.floor(Math.log(this.fileSize) / Math.log(1024)));
  return Math.round((this.fileSize / Math.pow(1024, i)) * 100) / 100 + ' ' + sizes[i];
});

// Ensure virtuals are included when converting to JSON
attachmentSchema.set('toJSON', { virtuals: true });
attachmentSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Attachment', attachmentSchema);

const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema(
  {
    task: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task',
      required: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    content: {
      type: String,
      required: [true, 'Comment content is required'],
      maxlength: [5000, 'Comment cannot exceed 5000 characters'],
    },
    mentions: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    }],
    parentComment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Comment',
      default: null,
    },
    isEdited: {
      type: Boolean,
      default: false,
    },
    editedAt: Date,
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
commentSchema.index({ task: 1, createdAt: -1 });
commentSchema.index({ user: 1 });
commentSchema.index({ parentComment: 1 });
commentSchema.index({ mentions: 1 });

// Method to edit comment (within 5-minute window)
commentSchema.methods.edit = function (newContent) {
  const fiveMinutes = 5 * 60 * 1000;
  const timeSinceCreation = Date.now() - this.createdAt.getTime();

  if (timeSinceCreation > fiveMinutes && !this.isEdited) {
    throw new Error('Edit window has expired (5 minutes)');
  }

  this.content = newContent;
  this.isEdited = true;
  this.editedAt = new Date();
  return this.save();
};

// Method to soft delete comment
commentSchema.methods.softDelete = function () {
  this.isDeleted = true;
  this.deletedAt = new Date();
  this.content = '[deleted]';
  return this.save();
};

// Static method to extract mentions from content
commentSchema.statics.extractMentions = function (content) {
  const mentionRegex = /@\[([^\]]+)\]\(([a-f\d]{24})\)/g;
  const mentions = [];
  let match;

  while ((match = mentionRegex.exec(content)) !== null) {
    mentions.push(match[2]); // Extract user ID
  }

  return mentions;
};

module.exports = mongoose.model('Comment', commentSchema);

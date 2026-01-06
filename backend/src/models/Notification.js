const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: [
        'task_assigned',
        'task_due_soon',
        'task_completed',
        'comment_mention',
        'comment_added',
        'project_invite',
        'project_member_added',
        'task_dependency_updated',
        'task_updated',
        'deadline_reminder',
      ],
      required: true,
    },
    title: {
      type: String,
      required: true,
      maxlength: 200,
    },
    content: {
      type: String,
      required: true,
      maxlength: 1000,
    },
    relatedTask: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task',
    },
    relatedProject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
    },
    relatedComment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Comment',
    },
    actionUrl: {
      type: String,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    readAt: Date,
    actor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
notificationSchema.index({ user: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 2592000 }); // Auto-delete after 30 days

// Method to mark as read
notificationSchema.methods.markAsRead = function () {
  this.isRead = true;
  this.readAt = new Date();
  return this.save();
};

// Static method to create notification
notificationSchema.statics.createNotification = async function (data) {
  const notification = await this.create(data);

  // Emit socket event for real-time notification
  const io = require('../server').io;
  if (io) {
    io.to(data.user.toString()).emit('notification', notification);
  }

  return notification;
};

// Static method to mark all as read for a user
notificationSchema.statics.markAllAsRead = function (userId) {
  return this.updateMany(
    { user: userId, isRead: false },
    { $set: { isRead: true, readAt: new Date() } }
  );
};

// Static method to get unread count
notificationSchema.statics.getUnreadCount = function (userId) {
  return this.countDocuments({ user: userId, isRead: false });
};

module.exports = mongoose.model('Notification', notificationSchema);

const mongoose = require('mongoose');

const calendarSyncSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    provider: {
      type: String,
      enum: ['google', 'microsoft'],
      required: true,
    },
    calendarId: {
      type: String,
      required: true,
    },
    calendarName: {
      type: String,
    },
    accessToken: {
      type: String,
      required: true,
    },
    refreshToken: {
      type: String,
    },
    tokenExpiry: {
      type: Date,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    syncEnabled: {
      type: Boolean,
      default: true,
    },
    lastSyncAt: {
      type: Date,
    },
    syncErrors: [{
      message: String,
      occurredAt: {
        type: Date,
        default: Date.now,
      },
    }],
    preferences: {
      syncCompletedTasks: {
        type: Boolean,
        default: false,
      },
      reminderMinutes: {
        type: Number,
        default: 30,
      },
      colorId: {
        type: String,
        default: '1',
      },
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
calendarSyncSchema.index({ user: 1, provider: 1 });
calendarSyncSchema.index({ user: 1, isActive: 1 });

// Instance method to check if token needs refresh
calendarSyncSchema.methods.needsTokenRefresh = function () {
  if (!this.tokenExpiry) return true;
  // Refresh if expiring in next 5 minutes
  return new Date(this.tokenExpiry) < new Date(Date.now() + 5 * 60 * 1000);
};

// Instance method to record sync error
calendarSyncSchema.methods.recordSyncError = async function (errorMessage) {
  this.syncErrors.push({
    message: errorMessage,
    occurredAt: new Date(),
  });
  
  // Keep only last 10 errors
  if (this.syncErrors.length > 10) {
    this.syncErrors = this.syncErrors.slice(-10);
  }
  
  return await this.save();
};

// Instance method to update last sync time
calendarSyncSchema.methods.updateLastSync = async function () {
  this.lastSyncAt = new Date();
  return await this.save();
};

module.exports = mongoose.model('CalendarSync', calendarSyncSchema);

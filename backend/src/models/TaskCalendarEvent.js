const mongoose = require('mongoose');

const taskCalendarEventSchema = new mongoose.Schema(
  {
    task: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task',
      required: true,
    },
    calendarSync: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CalendarSync',
      required: true,
    },
    eventId: {
      type: String,
      required: true,
    },
    eventLink: {
      type: String,
    },
    lastSyncedAt: {
      type: Date,
      default: Date.now,
    },
    syncStatus: {
      type: String,
      enum: ['synced', 'pending', 'failed'],
      default: 'synced',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
taskCalendarEventSchema.index({ task: 1, calendarSync: 1 }, { unique: true });
taskCalendarEventSchema.index({ calendarSync: 1 });
taskCalendarEventSchema.index({ eventId: 1 });

module.exports = mongoose.model('TaskCalendarEvent', taskCalendarEventSchema);

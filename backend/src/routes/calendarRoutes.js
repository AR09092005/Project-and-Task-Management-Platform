const express = require('express');
const router = express.Router();
const {
  getGoogleAuthUrl,
  handleGoogleCallback,
  getUserCalendarSyncs,
  toggleSync,
  disconnectCalendar,
  syncTaskToCalendar,
  exportProjectIcal,
  exportUserIcal,
} = require('../controllers/calendarController');
const { protect } = require('../middleware/auth');

// Google Calendar OAuth
router.get('/google/auth-url', protect, getGoogleAuthUrl);
router.post('/google/callback', protect, handleGoogleCallback);

// Calendar sync management
router.get('/syncs', protect, getUserCalendarSyncs);
router.put('/syncs/:id/toggle', protect, toggleSync);
router.delete('/syncs/:id', protect, disconnectCalendar);

// Sync tasks
router.post('/tasks/:taskId/sync', protect, syncTaskToCalendar);

// iCal export
router.get('/export/project/:projectId', protect, exportProjectIcal);
router.get('/export/my-tasks', protect, exportUserIcal);

module.exports = router;

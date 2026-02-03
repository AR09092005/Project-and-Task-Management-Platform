const CalendarSync = require('../models/CalendarSync');
const TaskCalendarEvent = require('../models/TaskCalendarEvent');
const Task = require('../models/Task');
const Project = require('../models/Project');
const googleCalendarService = require('../services/googleCalendarService');
const icalService = require('../services/icalService');

// Get Google Calendar authorization URL
exports.getGoogleAuthUrl = (req, res) => {
  try {
    const url = googleCalendarService.getAuthUrl(req.user._id.toString());
    res.json({
      success: true,
      data: { url },
    });
  } catch (error) {
    console.error('Get Google auth URL error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate authorization URL',
      error: error.message,
    });
  }
};

// Handle Google Calendar OAuth callback
exports.handleGoogleCallback = async (req, res) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({
        success: false,
        message: 'Authorization code is required',
      });
    }

    // Exchange code for tokens
    const tokens = await googleCalendarService.getTokens(code);

    // Get calendar list
    const tempSync = {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      tokenExpiry: new Date(tokens.expiry_date),
      needsTokenRefresh: () => false,
    };

    const calendars = await googleCalendarService.listCalendars(tempSync);
    const primaryCalendar = calendars.find((cal) => cal.primary) || calendars[0];

    // Create or update calendar sync
    let calendarSync = await CalendarSync.findOne({
      user: req.user._id,
      provider: 'google',
    });

    if (calendarSync) {
      calendarSync.accessToken = tokens.access_token;
      calendarSync.refreshToken = tokens.refresh_token || calendarSync.refreshToken;
      calendarSync.tokenExpiry = new Date(tokens.expiry_date);
      calendarSync.calendarId = primaryCalendar.id;
      calendarSync.calendarName = primaryCalendar.summary;
      calendarSync.isActive = true;
      await calendarSync.save();
    } else {
      calendarSync = await CalendarSync.create({
        user: req.user._id,
        provider: 'google',
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        tokenExpiry: new Date(tokens.expiry_date),
        calendarId: primaryCalendar.id,
        calendarName: primaryCalendar.summary,
        isActive: true,
      });
    }

    res.json({
      success: true,
      message: 'Google Calendar connected successfully',
      data: {
        provider: 'google',
        calendarName: calendarSync.calendarName,
        isActive: calendarSync.isActive,
      },
    });
  } catch (error) {
    console.error('Google callback error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to connect Google Calendar',
      error: error.message,
    });
  }
};

// Get user's calendar syncs
exports.getUserCalendarSyncs = async (req, res) => {
  try {
    const syncs = await CalendarSync.find({
      user: req.user._id,
      isActive: true,
    }).select('-accessToken -refreshToken');

    res.json({
      success: true,
      count: syncs.length,
      data: syncs,
    });
  } catch (error) {
    console.error('Get calendar syncs error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch calendar syncs',
      error: error.message,
    });
  }
};

// Toggle calendar sync
exports.toggleSync = async (req, res) => {
  try {
    const { id } = req.params;
    const { syncEnabled } = req.body;

    const calendarSync = await CalendarSync.findOne({
      _id: id,
      user: req.user._id,
    });

    if (!calendarSync) {
      return res.status(404).json({
        success: false,
        message: 'Calendar sync not found',
      });
    }

    calendarSync.syncEnabled = syncEnabled;
    await calendarSync.save();

    res.json({
      success: true,
      message: `Sync ${syncEnabled ? 'enabled' : 'disabled'}`,
      data: calendarSync,
    });
  } catch (error) {
    console.error('Toggle sync error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to toggle sync',
      error: error.message,
    });
  }
};

// Disconnect calendar
exports.disconnectCalendar = async (req, res) => {
  try {
    const { id } = req.params;

    const calendarSync = await CalendarSync.findOne({
      _id: id,
      user: req.user._id,
    });

    if (!calendarSync) {
      return res.status(404).json({
        success: false,
        message: 'Calendar sync not found',
      });
    }

    // Delete all event mappings
    await TaskCalendarEvent.deleteMany({ calendarSync: calendarSync._id });

    // Deactivate sync
    calendarSync.isActive = false;
    await calendarSync.save();

    res.json({
      success: true,
      message: 'Calendar disconnected successfully',
    });
  } catch (error) {
    console.error('Disconnect calendar error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to disconnect calendar',
      error: error.message,
    });
  }
};

// Sync task to calendar
exports.syncTaskToCalendar = async (req, res) => {
  try {
    const { taskId } = req.params;

    const task = await Task.findById(taskId).populate('assignees', 'name email');
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found',
      });
    }

    // Get active calendar syncs for user
    const calendarSyncs = await CalendarSync.find({
      user: req.user._id,
      isActive: true,
      syncEnabled: true,
    });

    if (calendarSyncs.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No active calendar syncs found',
      });
    }

    const results = [];
    for (const sync of calendarSyncs) {
      try {
        if (sync.provider === 'google') {
          const event = await googleCalendarService.syncTask(task, sync);
          results.push({ provider: 'google', success: true, event });
        }
      } catch (error) {
        results.push({ provider: sync.provider, success: false, error: error.message });
      }
    }

    res.json({
      success: true,
      message: 'Task synced to calendars',
      data: results,
    });
  } catch (error) {
    console.error('Sync task error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to sync task',
      error: error.message,
    });
  }
};

// Export project tasks as iCal
exports.exportProjectIcal = async (req, res) => {
  try {
    const { projectId } = req.params;
    console.log(`[Export Project iCal] Request for project: ${projectId}, User: ${req.user._id}`);

    const project = await Project.findById(projectId);
    if (!project) {
      console.log(`[Export Project iCal] Project not found: ${projectId}`);
      return res.status(404).json({
        success: false,
        message: 'Project not found',
      });
    }
    console.log(`[Export Project iCal] Found project: ${project.name}`);

    // Check if user has access
    const isMember = project.members.some(
      (member) => member.user.toString() === req.user._id.toString()
    );
    if (!isMember && project.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to export this project',
      });
    }

    const tasks = await Task.find({
      project: projectId,
      isDeleted: false,
    }).populate('assignees', 'name email');

    console.log(`[Export Project iCal] Found ${tasks.length} tasks for project`);

    const icalData = icalService.generateProjectCalendar(project, tasks);
    console.log(`[Export Project iCal] Generated iCal data (${icalData.length} bytes)`);

    // Sanitize filename for Content-Disposition header
    const sanitizedName = project.name
      .replace(/[^a-z0-9]/gi, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '') || 'project';

    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${sanitizedName}.ics"`);
    res.send(icalData);
    console.log(`[Export Project iCal] Successfully sent iCal file: ${sanitizedName}.ics`);
  } catch (error) {
    console.error('[Export Project iCal] Error:', error.message);
    console.error('[Export Project iCal] Stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Failed to export calendar',
      error: error.message,
    });
  }
};

// Export user's tasks as iCal
exports.exportUserIcal = async (req, res) => {
  try {
    console.log(`[Export User iCal] Request from user: ${req.user._id} (${req.user.name})`);

    const tasks = await Task.find({
      assignees: req.user._id,
      isDeleted: false,
    }).populate('assignees', 'name email').populate('project', 'name _id');

    console.log(`[Export User iCal] Found ${tasks.length} tasks for user`);

    const icalData = icalService.generateUserCalendar(req.user, tasks);
    console.log(`[Export User iCal] Generated iCal data (${icalData.length} bytes)`);

    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="my-tasks.ics"');
    res.send(icalData);
    console.log(`[Export User iCal] Successfully sent iCal file: my-tasks.ics`);
  } catch (error) {
    console.error('[Export User iCal] Error:', error.message);
    console.error('[Export User iCal] Stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Failed to export calendar',
      error: error.message,
    });
  }
};

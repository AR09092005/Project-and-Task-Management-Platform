const { google } = require('googleapis');
const CalendarSync = require('../models/CalendarSync');
const TaskCalendarEvent = require('../models/TaskCalendarEvent');

class GoogleCalendarService {
  constructor() {
    this.oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      `${process.env.CLIENT_URL}/calendar/callback/google`
    );
  }

  // Get authorization URL
  getAuthUrl(userId) {
    const scopes = [
      'https://www.googleapis.com/auth/calendar.events',
      'https://www.googleapis.com/auth/calendar.readonly',
    ];

    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      state: userId,
      prompt: 'consent',
    });
  }

  // Exchange authorization code for tokens
  async getTokens(code) {
    const { tokens } = await this.oauth2Client.getToken(code);
    return tokens;
  }

  // Refresh access token
  async refreshAccessToken(calendarSync) {
    if (!calendarSync.refreshToken) {
      throw new Error('No refresh token available');
    }

    this.oauth2Client.setCredentials({
      refresh_token: calendarSync.refreshToken,
    });

    const { credentials } = await this.oauth2Client.refreshAccessToken();
    
    // Update calendar sync with new token
    calendarSync.accessToken = credentials.access_token;
    calendarSync.tokenExpiry = new Date(credentials.expiry_date);
    await calendarSync.save();

    return credentials.access_token;
  }

  // Get calendar client with valid token
  async getCalendarClient(calendarSync) {
    // Check if token needs refresh
    if (calendarSync.needsTokenRefresh()) {
      await this.refreshAccessToken(calendarSync);
    }

    this.oauth2Client.setCredentials({
      access_token: calendarSync.accessToken,
      refresh_token: calendarSync.refreshToken,
    });

    return google.calendar({ version: 'v3', auth: this.oauth2Client });
  }

  // List user's calendars
  async listCalendars(calendarSync) {
    const calendar = await this.getCalendarClient(calendarSync);
    
    const response = await calendar.calendarList.list();
    return response.data.items;
  }

  // Create calendar event from task
  async createEventFromTask(task, calendarSync) {
    const calendar = await this.getCalendarClient(calendarSync);

    const event = {
      summary: task.title,
      description: task.description || '',
      start: {
        dateTime: task.dueDate || new Date(),
        timeZone: 'UTC',
      },
      end: {
        dateTime: task.dueDate ? new Date(new Date(task.dueDate).getTime() + 60 * 60 * 1000) : new Date(Date.now() + 60 * 60 * 1000),
        timeZone: 'UTC',
      },
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'popup', minutes: calendarSync.preferences.reminderMinutes },
        ],
      },
      colorId: calendarSync.preferences.colorId,
    };

    const response = await calendar.events.insert({
      calendarId: calendarSync.calendarId,
      resource: event,
    });

    // Save mapping
    await TaskCalendarEvent.create({
      task: task._id,
      calendarSync: calendarSync._id,
      eventId: response.data.id,
      eventLink: response.data.htmlLink,
      lastSyncedAt: new Date(),
      syncStatus: 'synced',
    });

    return response.data;
  }

  // Update calendar event from task
  async updateEventFromTask(task, calendarSync) {
    const calendar = await this.getCalendarClient(calendarSync);

    // Find existing event mapping
    const mapping = await TaskCalendarEvent.findOne({
      task: task._id,
      calendarSync: calendarSync._id,
    });

    if (!mapping) {
      // Create new event if mapping doesn't exist
      return await this.createEventFromTask(task, calendarSync);
    }

    const event = {
      summary: task.title,
      description: task.description || '',
      start: {
        dateTime: task.dueDate || new Date(),
        timeZone: 'UTC',
      },
      end: {
        dateTime: task.dueDate ? new Date(new Date(task.dueDate).getTime() + 60 * 60 * 1000) : new Date(Date.now() + 60 * 60 * 1000),
        timeZone: 'UTC',
      },
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'popup', minutes: calendarSync.preferences.reminderMinutes },
        ],
      },
      colorId: calendarSync.preferences.colorId,
    };

    const response = await calendar.events.update({
      calendarId: calendarSync.calendarId,
      eventId: mapping.eventId,
      resource: event,
    });

    // Update mapping
    mapping.lastSyncedAt = new Date();
    mapping.syncStatus = 'synced';
    await mapping.save();

    return response.data;
  }

  // Delete calendar event
  async deleteEvent(task, calendarSync) {
    const calendar = await this.getCalendarClient(calendarSync);

    const mapping = await TaskCalendarEvent.findOne({
      task: task._id,
      calendarSync: calendarSync._id,
    });

    if (!mapping) {
      return null;
    }

    await calendar.events.delete({
      calendarId: calendarSync.calendarId,
      eventId: mapping.eventId,
    });

    await mapping.deleteOne();
    return true;
  }

  // Sync task to calendar (create or update)
  async syncTask(task, calendarSync) {
    try {
      const mapping = await TaskCalendarEvent.findOne({
        task: task._id,
        calendarSync: calendarSync._id,
      });

      if (mapping) {
        return await this.updateEventFromTask(task, calendarSync);
      } else {
        return await this.createEventFromTask(task, calendarSync);
      }
    } catch (error) {
      console.error('Google Calendar sync error:', error);
      await calendarSync.recordSyncError(error.message);
      throw error;
    }
  }
}

module.exports = new GoogleCalendarService();

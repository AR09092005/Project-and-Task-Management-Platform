import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Switch,
  FormControlLabel,
  Grid,
  Divider,
  Alert,
  Button,
} from '@mui/material';
import {
  Email as EmailIcon,
  Notifications as BellIcon,
  PhoneAndroid as PushIcon,
  Save as SaveIcon,
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';

const NotificationSettings = () => {
  const { user, updateUser } = useAuth();
  const { enqueueSnackbar } = useSnackbar();
  const [loading, setLoading] = useState(false);
  const [preferences, setPreferences] = useState({
    email: {
      taskAssigned: true,
      taskDueSoon: true,
      taskCompleted: true,
      commentMentioned: true,
      projectInvite: true,
      dailyDigest: false,
      weeklyDigest: true,
    },
    inApp: {
      taskAssigned: true,
      taskDueSoon: true,
      taskCompleted: true,
      commentMentioned: true,
      projectInvite: true,
    },
    push: {
      taskAssigned: false,
      taskDueSoon: false,
      taskCompleted: false,
      commentMentioned: false,
      projectInvite: false,
    },
  });

  useEffect(() => {
    if (user?.notificationPreferences) {
      setPreferences(user.notificationPreferences);
    }
  }, [user]);

  const handleToggle = (category, setting) => {
    setPreferences((prev) => ({
      ...prev,
      [category]: {
        ...prev[category],
        [setting]: !prev[category][setting],
      },
    }));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const response = await authAPI.updateNotificationPreferences(preferences);
      updateUser({ ...user, notificationPreferences: preferences });
      enqueueSnackbar('Notification preferences updated successfully', { variant: 'success' });
    } catch (error) {
      enqueueSnackbar(error.response?.data?.message || 'Failed to update preferences', {
        variant: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const notificationTypes = [
    { key: 'taskAssigned', label: 'Task Assigned to You', description: 'When someone assigns you a task' },
    { key: 'taskDueSoon', label: 'Task Due Soon', description: 'Reminders for upcoming task deadlines' },
    { key: 'taskCompleted', label: 'Task Completed', description: 'When a task you created is marked as done' },
    { key: 'commentMentioned', label: 'Mentioned in Comments', description: 'When someone mentions you in a comment' },
    { key: 'projectInvite', label: 'Project Invitations', description: 'When you\'re invited to join a project' },
  ];

  const digestTypes = [
    { key: 'dailyDigest', label: 'Daily Digest', description: 'Receive a daily summary of your tasks' },
    { key: 'weeklyDigest', label: 'Weekly Digest', description: 'Receive a weekly summary of your activities' },
  ];

  return (
    <Box>
      <Alert severity="info" sx={{ mb: 3 }}>
        Manage how you receive notifications about tasks, projects, and team activities.
      </Alert>

      {/* Email Notifications */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <EmailIcon sx={{ mr: 1, color: 'primary.main' }} />
          <Typography variant="h6">Email Notifications</Typography>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Get notified via email at {user?.email}
        </Typography>

        <Grid container spacing={2}>
          {notificationTypes.map((type) => (
            <Grid item xs={12} key={type.key}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="body1">{type.label}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {type.description}
                  </Typography>
                </Box>
                <FormControlLabel
                  control={
                    <Switch
                      checked={preferences.email[type.key]}
                      onChange={() => handleToggle('email', type.key)}
                    />
                  }
                  label=""
                />
              </Box>
              {type.key !== notificationTypes[notificationTypes.length - 1].key && (
                <Divider sx={{ mt: 2 }} />
              )}
            </Grid>
          ))}
        </Grid>

        <Divider sx={{ my: 3 }} />

        <Typography variant="subtitle1" gutterBottom>
          Email Digests
        </Typography>
        <Grid container spacing={2}>
          {digestTypes.map((type) => (
            <Grid item xs={12} key={type.key}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="body1">{type.label}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {type.description}
                  </Typography>
                </Box>
                <FormControlLabel
                  control={
                    <Switch
                      checked={preferences.email[type.key]}
                      onChange={() => handleToggle('email', type.key)}
                    />
                  }
                  label=""
                />
              </Box>
            </Grid>
          ))}
        </Grid>
      </Paper>

      {/* In-App Notifications */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <BellIcon sx={{ mr: 1, color: 'primary.main' }} />
          <Typography variant="h6">In-App Notifications</Typography>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Show notifications in the app when you're online
        </Typography>

        <Grid container spacing={2}>
          {notificationTypes.map((type) => (
            <Grid item xs={12} key={type.key}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="body1">{type.label}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {type.description}
                  </Typography>
                </Box>
                <FormControlLabel
                  control={
                    <Switch
                      checked={preferences.inApp[type.key]}
                      onChange={() => handleToggle('inApp', type.key)}
                    />
                  }
                  label=""
                />
              </Box>
              {type.key !== notificationTypes[notificationTypes.length - 1].key && (
                <Divider sx={{ mt: 2 }} />
              )}
            </Grid>
          ))}
        </Grid>
      </Paper>

      {/* Push Notifications */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <PushIcon sx={{ mr: 1, color: 'primary.main' }} />
          <Typography variant="h6">Push Notifications</Typography>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Receive push notifications on your devices (Coming soon)
        </Typography>

        <Grid container spacing={2}>
          {notificationTypes.map((type) => (
            <Grid item xs={12} key={type.key}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="body1" color="text.secondary">
                    {type.label}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {type.description}
                  </Typography>
                </Box>
                <FormControlLabel
                  control={
                    <Switch
                      checked={preferences.push[type.key]}
                      onChange={() => handleToggle('push', type.key)}
                      disabled
                    />
                  }
                  label=""
                />
              </Box>
              {type.key !== notificationTypes[notificationTypes.length - 1].key && (
                <Divider sx={{ mt: 2 }} />
              )}
            </Grid>
          ))}
        </Grid>
      </Paper>

      {/* Save Button */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          variant="contained"
          size="large"
          startIcon={<SaveIcon />}
          onClick={handleSave}
          disabled={loading}
        >
          {loading ? 'Saving...' : 'Save Preferences'}
        </Button>
      </Box>
    </Box>
  );
};

export default NotificationSettings;

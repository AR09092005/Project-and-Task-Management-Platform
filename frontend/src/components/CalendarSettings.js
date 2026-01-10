import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Switch,
  FormControlLabel,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Chip,
  Alert,
  CircularProgress,
  Divider,
} from '@mui/material';
import {
  CalendarMonth,
  Delete,
  Download,
  Check,
  Sync,
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { calendarAPI } from '../services/api';

const CalendarSettings = () => {
  const { enqueueSnackbar } = useSnackbar();
  const [syncs, setSyncs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    fetchSyncs();
  }, []);

  const fetchSyncs = async () => {
    try {
      setLoading(true);
      const response = await calendarAPI.getSyncs();
      setSyncs(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch calendar syncs:', error);
      enqueueSnackbar('Failed to load calendar syncs', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleConnectGoogle = async () => {
    try {
      setConnecting(true);
      const response = await calendarAPI.getGoogleAuthUrl();

      // Redirect to Google OAuth
      window.location.href = response.data.data.url;
    } catch (error) {
      console.error('Connect Google error:', error);
      enqueueSnackbar('Failed to connect Google Calendar', { variant: 'error' });
      setConnecting(false);
    }
  };

  const handleToggleSync = async (syncId, currentState) => {
    try {
      const newState = !currentState;
      await calendarAPI.toggleSync(syncId, newState);
      enqueueSnackbar(
        newState ? 'Auto-sync enabled' : 'Auto-sync disabled',
        { variant: 'success' }
      );
      fetchSyncs();
    } catch (error) {
      console.error('Toggle sync error:', error);
      enqueueSnackbar('Failed to toggle sync', { variant: 'error' });
    }
  };

  const handleDisconnect = async (syncId) => {
    const confirmed = window.confirm(
      'Are you sure you want to disconnect this calendar? Your tasks will remain in the calendar, but new changes will not sync.'
    );
    if (!confirmed) return;

    try {
      await calendarAPI.disconnect(syncId);
      enqueueSnackbar('Calendar disconnected', { variant: 'success' });
      fetchSyncs();
    } catch (error) {
      console.error('Disconnect error:', error);
      enqueueSnackbar('Failed to disconnect calendar', { variant: 'error' });
    }
  };

  const handleExportMyTasks = async () => {
    try {
      const response = await calendarAPI.exportMyTasks();

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'my-tasks.ics');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      enqueueSnackbar('Calendar exported successfully', { variant: 'success' });
    } catch (error) {
      console.error('Export error:', error);
      enqueueSnackbar('Failed to export calendar', { variant: 'error' });
    }
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
        Calendar Integration
      </Typography>

      {/* Info Alert */}
      <Alert severity="info" sx={{ mb: 3 }}>
        Connect your calendar to automatically sync tasks with due dates, or export tasks as an iCal file (.ics) for any calendar app.
      </Alert>

      {/* Quick Actions */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Quick Actions
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Button
              variant="outlined"
              startIcon={<Download />}
              onClick={handleExportMyTasks}
            >
              Export My Tasks as iCal
            </Button>
          </Box>
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
            Export your tasks as an .ics file to import into Apple Calendar, Google Calendar, Outlook, or any other calendar app.
          </Typography>
        </CardContent>
      </Card>

      {/* Connect Calendar */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Connect a Calendar
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Connect Google Calendar to automatically sync your tasks. Tasks with due dates will appear as calendar events.
          </Typography>
          <Button
            variant="contained"
            onClick={handleConnectGoogle}
            disabled={connecting || syncs.some((s) => s.provider === 'google' && s.isActive)}
            startIcon={connecting ? <CircularProgress size={20} /> : <CalendarMonth />}
          >
            {syncs.some((s) => s.provider === 'google' && s.isActive)
              ? 'Google Calendar Connected'
              : 'Connect Google Calendar'}
          </Button>
        </CardContent>
      </Card>

      {/* Connected Calendars */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Connected Calendars
          </Typography>

          {loading ? (
            <Box sx={{ textAlign: 'center', py: 3 }}>
              <CircularProgress />
            </Box>
          ) : syncs.length === 0 ? (
            <Box sx={{ py: 3, textAlign: 'center' }}>
              <CalendarMonth sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
              <Typography variant="body2" color="text.secondary">
                No calendars connected yet. Connect a calendar above to start syncing tasks.
              </Typography>
            </Box>
          ) : (
            <List>
              {syncs.map((sync) => (
                <React.Fragment key={sync._id}>
                  <ListItem
                    sx={{
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 1,
                      mb: 1,
                      flexDirection: { xs: 'column', sm: 'row' },
                      alignItems: { xs: 'flex-start', sm: 'center' },
                      gap: 1,
                    }}
                  >
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                          <Typography variant="body1">
                            {sync.calendarName || 'Primary Calendar'}
                          </Typography>
                          <Chip
                            label={sync.provider}
                            size="small"
                            color="primary"
                            variant="outlined"
                          />
                          {sync.syncEnabled && (
                            <Chip
                              icon={<Check fontSize="small" />}
                              label="Auto-sync enabled"
                              size="small"
                              color="success"
                            />
                          )}
                        </Box>
                      }
                      secondary={
                        sync.lastSyncAt
                          ? `Last synced: ${new Date(sync.lastSyncAt).toLocaleString()}`
                          : 'Never synced'
                      }
                    />
                    <ListItemSecondaryAction>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={sync.syncEnabled}
                              onChange={() => handleToggleSync(sync._id, sync.syncEnabled)}
                              size="small"
                            />
                          }
                          label="Auto-sync"
                          labelPlacement="start"
                        />
                        <IconButton
                          edge="end"
                          onClick={() => handleDisconnect(sync._id)}
                          size="small"
                          color="error"
                        >
                          <Delete fontSize="small" />
                        </IconButton>
                      </Box>
                    </ListItemSecondaryAction>
                  </ListItem>
                </React.Fragment>
              ))}
            </List>
          )}
        </CardContent>
      </Card>

      {/* How it Works */}
      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            How It Works
          </Typography>
          <List dense>
            <ListItem>
              <ListItemText
                primary="1. Connect Your Calendar"
                secondary="Click 'Connect Google Calendar' and authorize the app"
              />
            </ListItem>
            <ListItem>
              <ListItemText
                primary="2. Automatic Sync"
                secondary="Tasks with due dates are automatically synced to your calendar"
              />
            </ListItem>
            <ListItem>
              <ListItemText
                primary="3. Real-time Updates"
                secondary="When you update a task, it updates in your calendar too"
              />
            </ListItem>
            <ListItem>
              <ListItemText
                primary="4. Export Anytime"
                secondary="Export tasks as iCal files to use with any calendar app"
              />
            </ListItem>
          </List>
        </CardContent>
      </Card>
    </Box>
  );
};

export default CalendarSettings;

import React, { useState, useMemo, useCallback } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import enUS from 'date-fns/locale/en-US';
import { Box, Paper, Dialog, DialogTitle, DialogContent, DialogActions, Button, Chip, Typography, Avatar, AvatarGroup } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import './CalendarView.css';

const locales = {
  'en-US': enUS,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

const CalendarView = ({ tasks, projectId }) => {
  const navigate = useNavigate();
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const events = useMemo(() => {
    return tasks
      .filter((task) => task.dueDate)
      .map((task) => {
        const dueDate = new Date(task.dueDate);
        return {
          id: task._id,
          title: task.title,
          start: dueDate,
          end: dueDate,
          resource: task,
          allDay: true,
        };
      });
  }, [tasks]);

  const eventStyleGetter = useCallback((event) => {
    const task = event.resource;
    const priorityColors = {
      Low: '#64b5f6',
      Medium: '#ffa726',
      High: '#ef5350',
      Urgent: '#d32f2f',
    };

    const statusColors = {
      'To Do': '#9e9e9e',
      'In Progress': '#2196f3',
      'In Review': '#ff9800',
      Done: '#4caf50',
    };

    const backgroundColor = task.status === 'Done' ? statusColors[task.status] : priorityColors[task.priority] || '#2196f3';

    return {
      style: {
        backgroundColor,
        borderRadius: '5px',
        opacity: task.status === 'Done' ? 0.7 : 1,
        color: 'white',
        border: '0px',
        display: 'block',
        fontWeight: 500,
      },
    };
  }, []);

  const handleSelectEvent = useCallback((event) => {
    setSelectedEvent(event.resource);
    setDialogOpen(true);
  }, []);

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedEvent(null);
  };

  const handleViewTask = () => {
    if (selectedEvent) {
      navigate(`/projects/${projectId}/tasks/${selectedEvent._id}`);
      handleCloseDialog();
    }
  };

  const getPriorityColor = (priority) => {
    const colors = { Low: 'info', Medium: 'default', High: 'warning', Urgent: 'error' };
    return colors[priority] || 'default';
  };

  const getStatusColor = (status) => {
    const colors = {
      'To Do': 'default',
      'In Progress': 'info',
      'In Review': 'warning',
      Done: 'success',
    };
    return colors[status] || 'default';
  };

  return (
    <Paper sx={{ p: 2 }}>
      <Box sx={{ height: '70vh' }}>
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          style={{ height: '100%' }}
          eventPropGetter={eventStyleGetter}
          onSelectEvent={handleSelectEvent}
          views={['month', 'week', 'day', 'agenda']}
          defaultView="month"
          popup
          tooltipAccessor={(event) => `${event.title} - ${event.resource.status}`}
        />
      </Box>

      {/* Task Details Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        {selectedEvent && (
          <>
            <DialogTitle>{selectedEvent.title}</DialogTitle>
            <DialogContent>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Status
                </Typography>
                <Chip
                  label={selectedEvent.status}
                  color={getStatusColor(selectedEvent.status)}
                  size="small"
                />
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Priority
                </Typography>
                <Chip
                  label={selectedEvent.priority}
                  color={getPriorityColor(selectedEvent.priority)}
                  size="small"
                />
              </Box>

              {selectedEvent.description && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Description
                  </Typography>
                  <Typography variant="body2">{selectedEvent.description}</Typography>
                </Box>
              )}

              {selectedEvent.dueDate && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Due Date
                  </Typography>
                  <Typography variant="body2">
                    {new Date(selectedEvent.dueDate).toLocaleDateString()}
                  </Typography>
                </Box>
              )}

              {selectedEvent.assignees && selectedEvent.assignees.length > 0 && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Assignees
                  </Typography>
                  <AvatarGroup max={4}>
                    {selectedEvent.assignees.map((assignee) => (
                      <Avatar
                        key={assignee._id}
                        alt={assignee.name}
                        src={assignee.profilePicture}
                        sx={{ width: 32, height: 32 }}
                      />
                    ))}
                  </AvatarGroup>
                </Box>
              )}

              {selectedEvent.tags && selectedEvent.tags.length > 0 && (
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Tags
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                    {selectedEvent.tags.map((tag, idx) => (
                      <Chip key={idx} label={tag} size="small" variant="outlined" />
                    ))}
                  </Box>
                </Box>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseDialog}>Close</Button>
              <Button onClick={handleViewTask} variant="contained">
                View Details
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Paper>
  );
};

export default CalendarView;

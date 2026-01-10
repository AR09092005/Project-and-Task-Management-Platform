import React, { useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Avatar,
  AvatarGroup,
} from '@mui/material';
import {
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  TimelineOppositeContent,
} from '@mui/lab';
import {
  CheckCircle,
  RadioButtonUnchecked,
  AccessTime,
  Warning,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const TimelineView = ({ tasks, projectId }) => {
  const navigate = useNavigate();

  // Sort tasks by due date and created date
  const sortedTasks = useMemo(() => {
    return [...tasks].sort((a, b) => {
      const dateA = a.dueDate ? new Date(a.dueDate) : new Date(a.createdAt);
      const dateB = b.dueDate ? new Date(b.dueDate) : new Date(b.createdAt);
      return dateA - dateB;
    });
  }, [tasks]);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Done':
        return <CheckCircle />;
      case 'In Review':
        return <Warning />;
      case 'In Progress':
        return <AccessTime />;
      default:
        return <RadioButtonUnchecked />;
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'To Do': 'grey',
      'In Progress': 'primary',
      'In Review': 'warning',
      Done: 'success',
    };
    return colors[status] || 'grey';
  };

  const getPriorityColor = (priority) => {
    const colors = { Low: 'info', Medium: 'default', High: 'warning', Urgent: 'error' };
    return colors[priority] || 'default';
  };

  const isOverdue = (dueDate, status) => {
    if (!dueDate || status === 'Done') return false;
    return new Date(dueDate) < new Date();
  };

  return (
    <Box sx={{ py: 2 }}>
      {sortedTasks.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 6 }}>
          <Typography color="text.secondary">No tasks to display</Typography>
        </Box>
      ) : (
        <Timeline position="right">
          {sortedTasks.map((task, index) => {
            const overdue = isOverdue(task.dueDate, task.status);

            return (
              <TimelineItem key={task._id}>
                <TimelineOppositeContent
                  sx={{ m: 'auto 0', minWidth: 120 }}
                  align="right"
                  variant="body2"
                  color="text.secondary"
                >
                  {task.dueDate ? (
                    <Box>
                      <Typography variant="body2" fontWeight={overdue ? 600 : 400} color={overdue ? 'error' : 'text.secondary'}>
                        {new Date(task.dueDate).toLocaleDateString()}
                      </Typography>
                      {overdue && (
                        <Chip label="Overdue" color="error" size="small" sx={{ mt: 0.5 }} />
                      )}
                    </Box>
                  ) : (
                    <Typography variant="body2" color="text.disabled">
                      No due date
                    </Typography>
                  )}
                </TimelineOppositeContent>

                <TimelineSeparator>
                  <TimelineDot color={getStatusColor(task.status)} variant={task.status === 'Done' ? 'filled' : 'outlined'}>
                    {getStatusIcon(task.status)}
                  </TimelineDot>
                  {index < sortedTasks.length - 1 && <TimelineConnector />}
                </TimelineSeparator>

                <TimelineContent sx={{ py: 2, px: 2 }}>
                  <Card
                    sx={{
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      '&:hover': {
                        boxShadow: 3,
                        transform: 'translateY(-2px)',
                      },
                    }}
                    onClick={() => navigate(`/projects/${projectId}/tasks/${task._id}`)}
                  >
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 1 }}>
                        <Typography variant="h6" component="span" sx={{ fontWeight: 600 }}>
                          {task.title}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                          <Chip
                            label={task.status}
                            color={getStatusColor(task.status)}
                            size="small"
                          />
                          <Chip
                            label={task.priority}
                            color={getPriorityColor(task.priority)}
                            size="small"
                          />
                        </Box>
                      </Box>

                      {task.description && (
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{
                            mb: 1.5,
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                          }}
                        >
                          {task.description}
                        </Typography>
                      )}

                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                          {task.estimatedHours && (
                            <Chip label={`${task.estimatedHours}h`} size="small" variant="outlined" />
                          )}
                          {task.tags?.slice(0, 2).map((tag, idx) => (
                            <Chip key={idx} label={tag} size="small" variant="outlined" />
                          ))}
                          {task.tags && task.tags.length > 2 && (
                            <Chip label={`+${task.tags.length - 2}`} size="small" variant="outlined" />
                          )}
                        </Box>

                        {task.assignees && task.assignees.length > 0 && (
                          <AvatarGroup max={3}>
                            {task.assignees.map((assignee) => (
                              <Avatar
                                key={assignee._id}
                                alt={assignee.name}
                                src={assignee.profilePicture}
                                sx={{ width: 28, height: 28 }}
                              />
                            ))}
                          </AvatarGroup>
                        )}
                      </Box>
                    </CardContent>
                  </Card>
                </TimelineContent>
              </TimelineItem>
            );
          })}
        </Timeline>
      )}
    </Box>
  );
};

export default TimelineView;

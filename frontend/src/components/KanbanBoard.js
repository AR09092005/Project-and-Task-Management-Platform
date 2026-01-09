import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Avatar,
  AvatarGroup,
  Paper,
} from '@mui/material';
import { Link as LinkIcon, Checklist } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { taskAPI } from '../services/api';
import { useSnackbar } from 'notistack';

const KanbanBoard = ({ tasks, projectId, onTaskUpdate }) => {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();

  const columns = {
    'To Do': { title: 'To Do', color: '#6b7280' },
    'In Progress': { title: 'In Progress', color: '#3b82f6' },
    'In Review': { title: 'In Review', color: '#f59e0b' },
    Done: { title: 'Done', color: '#10b981' },
  };

  const [tasksByStatus, setTasksByStatus] = useState({});

  useEffect(() => {
    const grouped = {};
    Object.keys(columns).forEach((status) => {
      grouped[status] = tasks.filter((task) => task.status === status);
    });
    setTasksByStatus(grouped);
  }, [tasks]);

  const onDragEnd = async (result) => {
    const { source, destination, draggableId } = result;

    // Dropped outside the list
    if (!destination) return;

    // Dropped in the same position
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) {
      return;
    }

    const sourceStatus = source.droppableId;
    const destStatus = destination.droppableId;

    // Create new task lists
    const newTasksByStatus = { ...tasksByStatus };
    const sourceTasks = Array.from(newTasksByStatus[sourceStatus]);
    const [movedTask] = sourceTasks.splice(source.index, 1);

    // If moving to different column, update status
    if (sourceStatus !== destStatus) {
      const destTasks = Array.from(newTasksByStatus[destStatus]);
      movedTask.status = destStatus;
      destTasks.splice(destination.index, 0, movedTask);
      newTasksByStatus[sourceStatus] = sourceTasks;
      newTasksByStatus[destStatus] = destTasks;
    } else {
      sourceTasks.splice(destination.index, 0, movedTask);
      newTasksByStatus[sourceStatus] = sourceTasks;
    }

    // Optimistic update
    setTasksByStatus(newTasksByStatus);

    // Update backend
    try {
      await taskAPI.update(draggableId, { status: destStatus });
      if (onTaskUpdate) onTaskUpdate();
      enqueueSnackbar('Task status updated', { variant: 'success' });
    } catch (error) {
      enqueueSnackbar('Failed to update task status', { variant: 'error' });
      // Revert on error
      const grouped = {};
      Object.keys(columns).forEach((status) => {
        grouped[status] = tasks.filter((task) => task.status === status);
      });
      setTasksByStatus(grouped);
    }
  };

  const getPriorityColor = (priority) => {
    const colors = { Low: 'info', Medium: 'default', High: 'warning', Urgent: 'error' };
    return colors[priority] || 'default';
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <Box
        sx={{
          display: 'flex',
          gap: 2,
          overflowX: 'auto',
          pb: 2,
          minHeight: '70vh',
        }}
      >
        {Object.entries(columns).map(([status, { title, color }]) => (
          <Droppable key={status} droppableId={status}>
            {(provided, snapshot) => (
              <Paper
                sx={{
                  minWidth: 300,
                  maxWidth: 350,
                  bgcolor: snapshot.isDraggingOver ? 'action.hover' : 'background.paper',
                  borderRadius: 2,
                  p: 2,
                  transition: 'all 0.2s',
                }}
                elevation={snapshot.isDraggingOver ? 4 : 1}
              >
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    mb: 2,
                    pb: 1,
                    borderBottom: 2,
                    borderColor: color,
                  }}
                >
                  <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 600 }}>
                    {title}
                  </Typography>
                  <Chip
                    label={tasksByStatus[status]?.length || 0}
                    size="small"
                    sx={{ bgcolor: color, color: 'white' }}
                  />
                </Box>

                <Box
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  sx={{ minHeight: 100 }}
                >
                  {tasksByStatus[status]?.map((task, index) => (
                    <Draggable key={task._id} draggableId={task._id} index={index}>
                      {(provided, snapshot) => (
                        <Card
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          sx={{
                            mb: 1.5,
                            cursor: 'grab',
                            bgcolor: snapshot.isDragging ? 'action.selected' : 'background.paper',
                            '&:hover': {
                              boxShadow: 3,
                              transform: 'translateY(-2px)',
                            },
                            transition: 'all 0.2s',
                          }}
                          onClick={() => navigate(`/projects/${projectId}/tasks/${task._id}`)}
                        >
                          <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                              {task.title}
                            </Typography>
                            {task.description && (
                              <Typography
                                variant="caption"
                                color="text.secondary"
                                sx={{
                                  display: '-webkit-box',
                                  WebkitLineClamp: 2,
                                  WebkitBoxOrient: 'vertical',
                                  overflow: 'hidden',
                                  mb: 1,
                                }}
                              >
                                {task.description}
                              </Typography>
                            )}
                            <Box
                              sx={{
                                display: 'flex',
                                flexWrap: 'wrap',
                                gap: 0.5,
                                alignItems: 'center',
                                mb: 1,
                              }}
                            >
                              <Chip
                                label={task.priority}
                                color={getPriorityColor(task.priority)}
                                size="small"
                                sx={{ height: 20, fontSize: '0.7rem' }}
                              />
                              {task.dueDate && (
                                <Chip
                                  label={`Due: ${new Date(task.dueDate).toLocaleDateString()}`}
                                  size="small"
                                  variant="outlined"
                                  sx={{ height: 20, fontSize: '0.7rem' }}
                                />
                              )}
                              {task.dependencies && task.dependencies.length > 0 && (
                                <Chip
                                  icon={<LinkIcon fontSize="small" />}
                                  label={task.dependencies.length}
                                  size="small"
                                  color="info"
                                  variant="outlined"
                                  sx={{ height: 20, fontSize: '0.7rem' }}
                                />
                              )}
                              {task.subtasks && task.subtasks.length > 0 && (
                                <Chip
                                  icon={<Checklist fontSize="small" />}
                                  label={`${task.subtasks.filter((st) => st && st.status === 'Done').length}/${task.subtasks.length}`}
                                  size="small"
                                  color="primary"
                                  variant="outlined"
                                  sx={{ height: 20, fontSize: '0.7rem' }}
                                />
                              )}
                            </Box>
                            {task.assignees && task.assignees.length > 0 && (
                              <AvatarGroup max={3} sx={{ justifyContent: 'flex-start' }}>
                                {task.assignees.map((assignee) => (
                                  <Avatar
                                    key={assignee._id}
                                    alt={assignee.name}
                                    src={assignee.profilePicture}
                                    sx={{ width: 24, height: 24 }}
                                  />
                                ))}
                              </AvatarGroup>
                            )}
                          </CardContent>
                        </Card>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </Box>
              </Paper>
            )}
          </Droppable>
        ))}
      </Box>
    </DragDropContext>
  );
};

export default KanbanBoard;

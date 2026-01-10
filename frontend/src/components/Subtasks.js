import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Checkbox,
  LinearProgress,
  Box,
  TextField,
  Button,
  Chip,
  Menu,
  MenuItem,
} from '@mui/material';
import {
  Add,
  MoreVert,
  Delete,
  CheckCircle,
  RadioButtonUnchecked,
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { taskAPI } from '../services/api';

const Subtasks = ({ task, onUpdate }) => {
  const { enqueueSnackbar } = useSnackbar();
  const [showAddSubtask, setShowAddSubtask] = useState(false);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedSubtask, setSelectedSubtask] = useState(null);

  const subtasks = task.subtasks || [];
  const completedCount = subtasks.filter((st) => st && st.status === 'Done').length;
  const progress = subtasks.length > 0 ? (completedCount / subtasks.length) * 100 : 0;

  const handleAddSubtask = async () => {
    if (!newSubtaskTitle.trim()) return;

    try {
      await taskAPI.create(task.project, {
        title: newSubtaskTitle,
        parentTask: task._id,
        status: 'To Do',
        priority: 'Medium',
      });
      setNewSubtaskTitle('');
      setShowAddSubtask(false);
      enqueueSnackbar('Subtask created successfully', { variant: 'success' });
      onUpdate();
    } catch (error) {
      enqueueSnackbar('Failed to create subtask', { variant: 'error' });
    }
  };

  const handleToggleSubtask = async (subtask) => {
    try {
      const newStatus = subtask.status === 'Done' ? 'To Do' : 'Done';
      await taskAPI.update(subtask._id, { status: newStatus });
      enqueueSnackbar(`Subtask marked as ${newStatus}`, { variant: 'success' });
      onUpdate();
    } catch (error) {
      enqueueSnackbar('Failed to update subtask', { variant: 'error' });
    }
  };

  const handleDeleteSubtask = async () => {
    if (window.confirm('Delete this subtask?')) {
      try {
        await taskAPI.delete(selectedSubtask._id);
        enqueueSnackbar('Subtask deleted', { variant: 'success' });
        onUpdate();
      } catch (error) {
        enqueueSnackbar('Failed to delete subtask', { variant: 'error' });
      }
    }
    handleCloseMenu();
  };

  const handleOpenMenu = (event, subtask) => {
    setAnchorEl(event.currentTarget);
    setSelectedSubtask(subtask);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
    setSelectedSubtask(null);
  };

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">
            Subtasks ({completedCount}/{subtasks.length})
          </Typography>
          <IconButton size="small" color="primary" onClick={() => setShowAddSubtask(!showAddSubtask)}>
            <Add />
          </IconButton>
        </Box>

        {subtasks.length > 0 && (
          <Box sx={{ mb: 2 }}>
            <LinearProgress variant="determinate" value={progress} sx={{ height: 8, borderRadius: 4 }} />
            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
              {Math.round(progress)}% Complete
            </Typography>
          </Box>
        )}

        {showAddSubtask && (
          <Box sx={{ mb: 2, display: 'flex', gap: 1 }}>
            <TextField
              size="small"
              fullWidth
              placeholder="Subtask title"
              value={newSubtaskTitle}
              onChange={(e) => setNewSubtaskTitle(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleAddSubtask();
                }
              }}
              autoFocus
            />
            <Button size="small" variant="contained" onClick={handleAddSubtask}>
              Add
            </Button>
            <Button size="small" onClick={() => setShowAddSubtask(false)}>
              Cancel
            </Button>
          </Box>
        )}

        {subtasks.length === 0 && !showAddSubtask ? (
          <Typography color="text.secondary" variant="body2" sx={{ textAlign: 'center', py: 2 }}>
            No subtasks yet. Click + to add one.
          </Typography>
        ) : (
          <List sx={{ p: 0 }}>
            {subtasks.map((subtask) => {
              if (!subtask || !subtask._id) return null;

              return (
                <ListItem
                  key={subtask._id}
                  sx={{
                    px: 0,
                    '&:hover': { bgcolor: 'action.hover' },
                  }}
                  secondaryAction={
                    <IconButton edge="end" size="small" onClick={(e) => handleOpenMenu(e, subtask)}>
                      <MoreVert fontSize="small" />
                    </IconButton>
                  }
                >
                  <ListItemIcon>
                    <Checkbox
                      edge="start"
                      checked={subtask.status === 'Done'}
                      onChange={() => handleToggleSubtask(subtask)}
                      icon={<RadioButtonUnchecked />}
                      checkedIcon={<CheckCircle />}
                    />
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography
                          sx={{
                            textDecoration: subtask.status === 'Done' ? 'line-through' : 'none',
                            color: subtask.status === 'Done' ? 'text.secondary' : 'text.primary',
                          }}
                        >
                          {subtask.title}
                        </Typography>
                        {subtask.priority && subtask.priority !== 'Medium' && (
                          <Chip
                            label={subtask.priority}
                            size="small"
                            color={
                              subtask.priority === 'Urgent'
                                ? 'error'
                                : subtask.priority === 'High'
                                ? 'warning'
                                : 'default'
                            }
                          />
                        )}
                      </Box>
                    }
                  />
                </ListItem>
              );
            })}
          </List>
        )}
      </CardContent>

      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleCloseMenu}>
        <MenuItem onClick={handleDeleteSubtask} sx={{ color: 'error.main' }}>
          <Delete sx={{ mr: 1 }} fontSize="small" />
          Delete Subtask
        </MenuItem>
      </Menu>
    </Card>
  );
};

export default Subtasks;

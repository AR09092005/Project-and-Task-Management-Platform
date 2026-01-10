import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Autocomplete,
  TextField,
} from '@mui/material';
import {
  Add,
  Delete,
  ArrowForward,
  ArrowBack,
  Link as LinkIcon,
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { taskAPI } from '../services/api';

const TaskDependencies = ({ task, projectTasks, onUpdate }) => {
  const { enqueueSnackbar } = useSnackbar();
  const [openDialog, setOpenDialog] = useState(false);
  const [dependencyData, setDependencyData] = useState({
    taskId: '',
    type: 'blocks',
  });

  const dependencies = task.dependencies || [];
  const blockedBy = projectTasks?.filter((t) =>
    t && t.dependencies?.some((d) => d && d.task && (d.task._id === task._id || d.task === task._id) && d.dependencyType === 'blocks')
  ) || [];

  const handleAddDependency = async () => {
    if (!dependencyData.taskId) return;

    try {
      await taskAPI.addDependency(task._id, {
        taskId: dependencyData.taskId,
        dependencyType: dependencyData.type,
      });
      setOpenDialog(false);
      setDependencyData({ taskId: '', type: 'blocks' });
      enqueueSnackbar('Dependency added successfully', { variant: 'success' });
      onUpdate();
    } catch (error) {
      enqueueSnackbar(
        error.response?.data?.message || 'Failed to add dependency',
        { variant: 'error' }
      );
    }
  };

  const handleRemoveDependency = async (dependencyId) => {
    try {
      await taskAPI.removeDependency(task._id, dependencyId);
      enqueueSnackbar('Dependency removed', { variant: 'success' });
      onUpdate();
    } catch (error) {
      enqueueSnackbar('Failed to remove dependency', { variant: 'error' });
    }
  };

  const getAvailableTasks = () => {
    return projectTasks?.filter(
      (t) =>
        t && t._id &&
        t._id !== task._id &&
        !dependencies.some((d) => d && d.task && (d.task._id === t._id || d.task === t._id)) &&
        (!t.parentTask || t.parentTask.toString() !== task._id.toString())
    ) || [];
  };

  const getDependencyIcon = (type) => {
    return type === 'blocks' ? <ArrowForward fontSize="small" /> : <LinkIcon fontSize="small" />;
  };

  const getDependencyLabel = (type) => {
    return type === 'blocks' ? 'Blocks' : 'Related to';
  };

  return (
    <>
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Dependencies</Typography>
            <IconButton size="small" color="primary" onClick={() => setOpenDialog(true)}>
              <Add />
            </IconButton>
          </Box>

          {/* Tasks this task blocks */}
          {dependencies.length > 0 && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                This task:
              </Typography>
              <List dense sx={{ p: 0 }}>
                {dependencies.map((dep) => {
                  if (!dep || !dep._id) return null;

                  return (
                    <ListItem
                      key={dep._id}
                      sx={{ px: 1 }}
                      secondaryAction={
                        <IconButton
                          edge="end"
                          size="small"
                          onClick={() => handleRemoveDependency(dep._id)}
                        >
                          <Delete fontSize="small" />
                        </IconButton>
                      }
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mr: 2 }}>
                        {getDependencyIcon(dep.dependencyType)}
                        <Chip
                          label={getDependencyLabel(dep.dependencyType)}
                          size="small"
                          variant="outlined"
                        />
                      </Box>
                      <ListItemText
                        primary={dep.task?.title || 'Unknown task'}
                        secondary={
                          <Chip
                            label={dep.task?.status || 'Unknown'}
                            size="small"
                            color={dep.task?.status === 'Done' ? 'success' : 'default'}
                          />
                        }
                      />
                    </ListItem>
                  );
                })}
              </List>
            </Box>
          )}

          {/* Tasks blocking this task */}
          {blockedBy.length > 0 && (
            <Box>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Blocked by:
              </Typography>
              <List dense sx={{ p: 0 }}>
                {blockedBy.map((blockingTask) => {
                  if (!blockingTask || !blockingTask._id) return null;

                  return (
                    <ListItem key={blockingTask._id} sx={{ px: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mr: 2 }}>
                        <ArrowBack fontSize="small" />
                      </Box>
                      <ListItemText
                        primary={blockingTask.title}
                        secondary={
                          <Chip
                            label={blockingTask.status}
                            size="small"
                            color={blockingTask.status === 'Done' ? 'success' : 'warning'}
                          />
                        }
                      />
                    </ListItem>
                  );
                })}
              </List>
            </Box>
          )}

          {dependencies.length === 0 && blockedBy.length === 0 && (
            <Typography color="text.secondary" variant="body2" sx={{ textAlign: 'center', py: 2 }}>
              No dependencies. Click + to add one.
            </Typography>
          )}
        </CardContent>
      </Card>

      {/* Add Dependency Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Task Dependency</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 2, mb: 2 }}>
            <InputLabel>Dependency Type</InputLabel>
            <Select
              value={dependencyData.type}
              label="Dependency Type"
              onChange={(e) => setDependencyData({ ...dependencyData, type: e.target.value })}
            >
              <MenuItem value="blocks">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <ArrowForward fontSize="small" />
                  This task blocks...
                </Box>
              </MenuItem>
              <MenuItem value="relates_to">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <LinkIcon fontSize="small" />
                  Related to...
                </Box>
              </MenuItem>
            </Select>
          </FormControl>

          <Autocomplete
            options={getAvailableTasks()}
            getOptionLabel={(option) => option.title}
            renderInput={(params) => <TextField {...params} label="Select Task" />}
            onChange={(e, value) =>
              setDependencyData({ ...dependencyData, taskId: value?._id || '' })
            }
            renderOption={(props, option) => (
              <li {...props}>
                <Box>
                  <Typography variant="body2">{option.title}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {option.status} • {option.priority}
                  </Typography>
                </Box>
              </li>
            )}
          />

          <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
            {dependencyData.type === 'blocks'
              ? 'This task must be completed before the selected task can start.'
              : 'This task is related to the selected task.'}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button
            onClick={handleAddDependency}
            variant="contained"
            disabled={!dependencyData.taskId}
          >
            Add Dependency
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default TaskDependencies;

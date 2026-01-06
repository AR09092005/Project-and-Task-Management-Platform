import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  IconButton,
  Avatar,
  AvatarGroup,
} from '@mui/material';
import { Add as AddIcon, ArrowBack, Settings } from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { projectAPI, taskAPI } from '../services/api';

const ProjectView = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    priority: 'Medium',
    status: 'To Do',
  });

  useEffect(() => {
    fetchProject();
    fetchTasks();
  }, [projectId]);

  const fetchProject = async () => {
    try {
      const response = await projectAPI.getById(projectId);
      setProject(response.data.data);
    } catch (error) {
      enqueueSnackbar('Failed to load project', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const fetchTasks = async () => {
    try {
      const response = await taskAPI.getAll(projectId);
      setTasks(response.data.data);
    } catch (error) {
      enqueueSnackbar('Failed to load tasks', { variant: 'error' });
    }
  };

  const handleCreateTask = async () => {
    try {
      const response = await taskAPI.create(projectId, newTask);
      setTasks([response.data.data, ...tasks]);
      setOpenDialog(false);
      setNewTask({ title: '', description: '', priority: 'Medium', status: 'To Do' });
      enqueueSnackbar('Task created successfully', { variant: 'success' });
    } catch (error) {
      enqueueSnackbar(error.response?.data?.message || 'Failed to create task', { variant: 'error' });
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
      'Done': 'success',
    };
    return colors[status] || 'default';
  };

  if (loading) return <Typography>Loading...</Typography>;
  if (!project) return <Typography>Project not found</Typography>;

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton onClick={() => navigate('/dashboard')} sx={{ mr: 2 }}>
          <ArrowBack />
        </IconButton>
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="h4">{project.name}</Typography>
          <Typography color="text.secondary">{project.description}</Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpenDialog(true)}>
          New Task
        </Button>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Project Info</Typography>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">Status</Typography>
                <Chip label={project.status} size="small" sx={{ mt: 0.5 }} />
              </Box>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">Workspace</Typography>
                <Typography>{project.workspace}</Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Members
                </Typography>
                <AvatarGroup max={4}>
                  {project.members?.map((member) => (
                    <Avatar
                      key={member._id}
                      alt={member.user?.name}
                      src={member.user?.profilePicture}
                    />
                  ))}
                </AvatarGroup>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={9}>
          <Typography variant="h6" gutterBottom>Tasks ({tasks.length})</Typography>
          {tasks.length === 0 ? (
            <Card sx={{ textAlign: 'center', py: 6 }}>
              <Typography color="text.secondary">No tasks yet</Typography>
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={() => setOpenDialog(true)}
                sx={{ mt: 2 }}
              >
                Create First Task
              </Button>
            </Card>
          ) : (
            <Grid container spacing={2}>
              {tasks.map((task) => (
                <Grid item xs={12} key={task._id}>
                  <Card
                    sx={{ cursor: 'pointer', '&:hover': { boxShadow: 2 } }}
                    onClick={() => navigate(`/projects/${projectId}/tasks/${task._id}`)}
                  >
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="h6">{task.title}</Typography>
                        <Box>
                          <Chip label={task.status} color={getStatusColor(task.status)} size="small" sx={{ mr: 1 }} />
                          <Chip label={task.priority} color={getPriorityColor(task.priority)} size="small" />
                        </Box>
                      </Box>
                      {task.description && (
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          {task.description.substring(0, 150)}...
                        </Typography>
                      )}
                      {task.assignees && task.assignees.length > 0 && (
                        <AvatarGroup max={3} sx={{ justifyContent: 'flex-end' }}>
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
                </Grid>
              ))}
            </Grid>
          )}
        </Grid>
      </Grid>

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Task</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Task Title"
            fullWidth
            required
            value={newTask.title}
            onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
          />
          <TextField
            margin="dense"
            label="Description"
            fullWidth
            multiline
            rows={3}
            value={newTask.description}
            onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
          />
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <TextField
                margin="dense"
                label="Priority"
                fullWidth
                select
                value={newTask.priority}
                onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
              >
                <MenuItem value="Low">Low</MenuItem>
                <MenuItem value="Medium">Medium</MenuItem>
                <MenuItem value="High">High</MenuItem>
                <MenuItem value="Urgent">Urgent</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={6}>
              <TextField
                margin="dense"
                label="Status"
                fullWidth
                select
                value={newTask.status}
                onChange={(e) => setNewTask({ ...newTask, status: e.target.value })}
              >
                <MenuItem value="To Do">To Do</MenuItem>
                <MenuItem value="In Progress">In Progress</MenuItem>
                <MenuItem value="In Review">In Review</MenuItem>
                <MenuItem value="Done">Done</MenuItem>
              </TextField>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button onClick={handleCreateTask} variant="contained" disabled={!newTask.title}>
            Create
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ProjectView;

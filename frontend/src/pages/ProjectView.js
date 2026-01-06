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
  Menu,
  Autocomplete,
  FormControl,
  InputLabel,
  Select,
  OutlinedInput,
} from '@mui/material';
import {
  Add as AddIcon,
  ArrowBack,
  MoreVert,
  Edit,
  Delete,
  Archive,
  FilterList,
  Link as LinkIcon,
  Checklist,
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { projectAPI, taskAPI } from '../services/api';
import TeamMembers from '../components/TeamMembers';

const ProjectView = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openTaskDialog, setOpenTaskDialog] = useState(false);
  const [openEditProjectDialog, setOpenEditProjectDialog] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    search: '',
  });
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    priority: 'Medium',
    status: 'To Do',
    dueDate: '',
    tags: [],
    estimatedHours: '',
  });
  const [editProjectData, setEditProjectData] = useState({
    name: '',
    description: '',
    workspace: '',
    status: '',
  });

  useEffect(() => {
    fetchProject();
    fetchTasks();
  }, [projectId]);

  useEffect(() => {
    applyFilters();
  }, [tasks, filters]);

  const fetchProject = async () => {
    try {
      const response = await projectAPI.getById(projectId);
      setProject(response.data.data);
      setEditProjectData({
        name: response.data.data.name,
        description: response.data.data.description || '',
        workspace: response.data.data.workspace,
        status: response.data.data.status,
      });
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

  const applyFilters = () => {
    let filtered = [...tasks];

    if (filters.status) {
      filtered = filtered.filter((task) => task.status === filters.status);
    }

    if (filters.priority) {
      filtered = filtered.filter((task) => task.priority === filters.priority);
    }

    if (filters.search) {
      filtered = filtered.filter(
        (task) =>
          task.title.toLowerCase().includes(filters.search.toLowerCase()) ||
          task.description?.toLowerCase().includes(filters.search.toLowerCase())
      );
    }

    setFilteredTasks(filtered);
  };

  const handleCreateTask = async () => {
    try {
      const taskData = { ...newTask };

      // Remove empty fields to avoid validation errors
      if (!taskData.dueDate) {
        delete taskData.dueDate;
      }
      if (!taskData.estimatedHours) {
        delete taskData.estimatedHours;
      } else {
        taskData.estimatedHours = parseFloat(taskData.estimatedHours);
      }
      if (!taskData.description) {
        delete taskData.description;
      }
      if (taskData.tags.length === 0) {
        delete taskData.tags;
      }

      const response = await taskAPI.create(projectId, taskData);
      setTasks([response.data.data, ...tasks]);
      setOpenTaskDialog(false);
      setNewTask({
        title: '',
        description: '',
        priority: 'Medium',
        status: 'To Do',
        dueDate: '',
        tags: [],
        estimatedHours: '',
      });
      enqueueSnackbar('Task created successfully', { variant: 'success' });
    } catch (error) {
      enqueueSnackbar(error.response?.data?.message || 'Failed to create task', {
        variant: 'error',
      });
    }
  };

  const handleUpdateProject = async () => {
    try {
      await projectAPI.update(projectId, editProjectData);
      setOpenEditProjectDialog(false);
      fetchProject();
      enqueueSnackbar('Project updated successfully', { variant: 'success' });
    } catch (error) {
      enqueueSnackbar('Failed to update project', { variant: 'error' });
    }
  };

  const handleDeleteProject = async () => {
    if (window.confirm('Are you sure you want to delete this project? It will be moved to trash.')) {
      try {
        await projectAPI.delete(projectId);
        enqueueSnackbar('Project deleted successfully', { variant: 'success' });
        navigate('/dashboard');
      } catch (error) {
        enqueueSnackbar('Failed to delete project', { variant: 'error' });
      }
    }
    setAnchorEl(null);
  };

  const handleArchiveProject = async () => {
    try {
      await projectAPI.archive(projectId);
      fetchProject();
      enqueueSnackbar('Project archived successfully', { variant: 'success' });
    } catch (error) {
      enqueueSnackbar('Failed to archive project', { variant: 'error' });
    }
    setAnchorEl(null);
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
        <IconButton onClick={(e) => setAnchorEl(e.currentTarget)} sx={{ mr: 1 }}>
          <MoreVert />
        </IconButton>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpenTaskDialog(true)}>
          New Task
        </Button>
      </Box>

      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}>
        <MenuItem
          onClick={() => {
            setOpenEditProjectDialog(true);
            setAnchorEl(null);
          }}
        >
          <Edit sx={{ mr: 1 }} fontSize="small" />
          Edit Project
        </MenuItem>
        <MenuItem onClick={handleArchiveProject}>
          <Archive sx={{ mr: 1 }} fontSize="small" />
          Archive Project
        </MenuItem>
        <MenuItem onClick={handleDeleteProject} sx={{ color: 'error.main' }}>
          <Delete sx={{ mr: 1 }} fontSize="small" />
          Delete Project
        </MenuItem>
      </Menu>

      <Grid container spacing={3}>
        <Grid item xs={12} md={3}>
          <Card sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Project Info
              </Typography>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Status
                </Typography>
                <Chip label={project.status} size="small" sx={{ mt: 0.5 }} />
              </Box>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Workspace
                </Typography>
                <Typography>{project.workspace}</Typography>
              </Box>
            </CardContent>
          </Card>

          <TeamMembers project={project} onUpdate={fetchProject} />

          <Card sx={{ mt: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <FilterList sx={{ mr: 1 }} />
                Filters
              </Typography>
              <TextField
                fullWidth
                size="small"
                label="Search tasks"
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                sx={{ mb: 2 }}
              />
              <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                <InputLabel>Status</InputLabel>
                <Select
                  value={filters.status}
                  label="Status"
                  onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="To Do">To Do</MenuItem>
                  <MenuItem value="In Progress">In Progress</MenuItem>
                  <MenuItem value="In Review">In Review</MenuItem>
                  <MenuItem value="Done">Done</MenuItem>
                </Select>
              </FormControl>
              <FormControl fullWidth size="small">
                <InputLabel>Priority</InputLabel>
                <Select
                  value={filters.priority}
                  label="Priority"
                  onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="Low">Low</MenuItem>
                  <MenuItem value="Medium">Medium</MenuItem>
                  <MenuItem value="High">High</MenuItem>
                  <MenuItem value="Urgent">Urgent</MenuItem>
                </Select>
              </FormControl>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={9}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">
              Tasks ({filteredTasks.length} of {tasks.length})
            </Typography>
          </Box>

          {filteredTasks.length === 0 ? (
            <Card sx={{ textAlign: 'center', py: 6 }}>
              <Typography color="text.secondary">
                {tasks.length === 0 ? 'No tasks yet' : 'No tasks match your filters'}
              </Typography>
              {tasks.length === 0 && (
                <Button
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={() => setOpenTaskDialog(true)}
                  sx={{ mt: 2 }}
                >
                  Create First Task
                </Button>
              )}
            </Card>
          ) : (
            <Grid container spacing={2}>
              {filteredTasks.map((task) => (
                <Grid item xs={12} key={task._id}>
                  <Card
                    sx={{ cursor: 'pointer', '&:hover': { boxShadow: 2 } }}
                    onClick={() => navigate(`/projects/${projectId}/tasks/${task._id}`)}
                  >
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="h6">{task.title}</Typography>
                        <Box>
                          <Chip
                            label={task.status}
                            color={getStatusColor(task.status)}
                            size="small"
                            sx={{ mr: 1 }}
                          />
                          <Chip
                            label={task.priority}
                            color={getPriorityColor(task.priority)}
                            size="small"
                          />
                        </Box>
                      </Box>
                      {task.description && (
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          {task.description.substring(0, 150)}
                          {task.description.length > 150 && '...'}
                        </Typography>
                      )}
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                          {task.dueDate && (
                            <Chip
                              label={`Due: ${new Date(task.dueDate).toLocaleDateString()}`}
                              size="small"
                              variant="outlined"
                            />
                          )}
                          {task.tags?.map((tag, idx) => (
                            <Chip key={idx} label={tag} size="small" variant="outlined" />
                          ))}
                          {task.dependencies && task.dependencies.length > 0 && (
                            <Chip
                              icon={<LinkIcon fontSize="small" />}
                              label={`${task.dependencies.length} dep`}
                              size="small"
                              color="info"
                              variant="outlined"
                            />
                          )}
                          {task.subtasks && task.subtasks.length > 0 && (
                            <Chip
                              icon={<Checklist fontSize="small" />}
                              label={`${task.subtasks.filter(st => st.status === 'Done').length}/${task.subtasks.length}`}
                              size="small"
                              color="primary"
                              variant="outlined"
                            />
                          )}
                        </Box>
                        {task.assignees && task.assignees.length > 0 && (
                          <AvatarGroup max={3}>
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
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </Grid>
      </Grid>

      {/* Create Task Dialog */}
      <Dialog open={openTaskDialog} onClose={() => setOpenTaskDialog(false)} maxWidth="sm" fullWidth>
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
            <Grid item xs={6}>
              <TextField
                margin="dense"
                label="Due Date"
                type="date"
                fullWidth
                InputLabelProps={{ shrink: true }}
                value={newTask.dueDate}
                onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                margin="dense"
                label="Estimated Hours"
                type="number"
                fullWidth
                value={newTask.estimatedHours}
                onChange={(e) => setNewTask({ ...newTask, estimatedHours: e.target.value })}
              />
            </Grid>
          </Grid>
          <Autocomplete
            multiple
            freeSolo
            options={[]}
            value={newTask.tags}
            onChange={(e, newValue) => setNewTask({ ...newTask, tags: newValue })}
            renderInput={(params) => (
              <TextField {...params} margin="dense" label="Tags" placeholder="Add tags" />
            )}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenTaskDialog(false)}>Cancel</Button>
          <Button onClick={handleCreateTask} variant="contained" disabled={!newTask.title}>
            Create
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Project Dialog */}
      <Dialog
        open={openEditProjectDialog}
        onClose={() => setOpenEditProjectDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Edit Project</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Project Name"
            fullWidth
            required
            value={editProjectData.name}
            onChange={(e) => setEditProjectData({ ...editProjectData, name: e.target.value })}
          />
          <TextField
            margin="dense"
            label="Description"
            fullWidth
            multiline
            rows={3}
            value={editProjectData.description}
            onChange={(e) => setEditProjectData({ ...editProjectData, description: e.target.value })}
          />
          <TextField
            margin="dense"
            label="Workspace"
            fullWidth
            select
            value={editProjectData.workspace}
            onChange={(e) => setEditProjectData({ ...editProjectData, workspace: e.target.value })}
          >
            <MenuItem value="Personal">Personal</MenuItem>
            <MenuItem value="Academic">Academic</MenuItem>
            <MenuItem value="Work">Work</MenuItem>
            <MenuItem value="Clubs">Clubs</MenuItem>
          </TextField>
          <TextField
            margin="dense"
            label="Status"
            fullWidth
            select
            value={editProjectData.status}
            onChange={(e) => setEditProjectData({ ...editProjectData, status: e.target.value })}
          >
            <MenuItem value="Planning">Planning</MenuItem>
            <MenuItem value="Active">Active</MenuItem>
            <MenuItem value="On Hold">On Hold</MenuItem>
            <MenuItem value="Completed">Completed</MenuItem>
            <MenuItem value="Archived">Archived</MenuItem>
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenEditProjectDialog(false)}>Cancel</Button>
          <Button
            onClick={handleUpdateProject}
            variant="contained"
            disabled={!editProjectData.name}
          >
            Update
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ProjectView;

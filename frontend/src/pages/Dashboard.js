import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Chip,
  IconButton,
} from '@mui/material';
import {
  Add as AddIcon,
  FolderOpen as FolderIcon,
  People as PeopleIcon,
  Assignment as AssignmentIcon,
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { projectAPI } from '../services/api';

const Dashboard = () => {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [newProject, setNewProject] = useState({
    name: '',
    description: '',
    workspace: 'Personal',
  });

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await projectAPI.getAll();
      setProjects(response?.data?.data || []);
    } catch (error) {
      enqueueSnackbar('Failed to load projects', { variant: 'error' });
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async () => {
    try {
      const projectData = { ...newProject };

      // Remove empty description to avoid validation issues
      if (!projectData.description) {
        delete projectData.description;
      }

      const response = await projectAPI.create(projectData);
      setProjects([response.data.data, ...projects]);
      setOpenDialog(false);
      setNewProject({ name: '', description: '', workspace: 'Personal' });
      enqueueSnackbar('Project created successfully', { variant: 'success' });
    } catch (error) {
      enqueueSnackbar(error.response?.data?.message || 'Failed to create project', { variant: 'error' });
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      Active: 'success',
      Planning: 'info',
      'On Hold': 'warning',
      Completed: 'default',
      Archived: 'default',
    };
    return colors[status] || 'default';
  };

  return (
    <Box sx={{ pb: 4 }}>
      {/* Header Section */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderRadius: 4,
          p: 4,
          mb: 4,
          color: 'white',
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h3" fontWeight="bold" gutterBottom>
              My Projects
            </Typography>
            <Typography variant="body1" sx={{ opacity: 0.9 }}>
              Manage and track all your projects in one place
            </Typography>
          </Box>
          <Button
            variant="contained"
            size="large"
            startIcon={<AddIcon />}
            onClick={() => setOpenDialog(true)}
            sx={{
              bgcolor: 'white',
              color: 'primary.main',
              '&:hover': {
                bgcolor: 'rgba(255,255,255,0.9)',
              },
            }}
          >
            New Project
          </Button>
        </Box>

        {/* Stats Cards */}
        <Grid container spacing={2} sx={{ mt: 2 }}>
          <Grid item xs={12} sm={4}>
            <Box
              sx={{
                bgcolor: 'rgba(255,255,255,0.15)',
                backdropFilter: 'blur(10px)',
                borderRadius: 2,
                p: 2,
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <AssignmentIcon sx={{ fontSize: 32 }} />
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {projects.length}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Total Projects
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Box
              sx={{
                bgcolor: 'rgba(255,255,255,0.15)',
                backdropFilter: 'blur(10px)',
                borderRadius: 2,
                p: 2,
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <PeopleIcon sx={{ fontSize: 32 }} />
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {projects.reduce((sum, p) => sum + (p.members?.length || 0), 0)}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Team Members
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Box
              sx={{
                bgcolor: 'rgba(255,255,255,0.15)',
                backdropFilter: 'blur(10px)',
                borderRadius: 2,
                p: 2,
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <FolderIcon sx={{ fontSize: 32 }} />
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {projects.filter((p) => p.status === 'Active').length}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Active Projects
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Box>

      {loading ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h6" color="text.secondary">
            Loading projects...
          </Typography>
        </Box>
      ) : projects.length === 0 ? (
        <Card
          sx={{
            textAlign: 'center',
            py: 10,
            background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%)',
            border: '2px dashed',
            borderColor: 'divider',
          }}
        >
          <FolderIcon sx={{ fontSize: 100, color: 'primary.light', mb: 3, opacity: 0.5 }} />
          <Typography variant="h5" fontWeight="600" gutterBottom>
            No projects yet
          </Typography>
          <Typography color="text.secondary" gutterBottom sx={{ mb: 3 }}>
            Create your first project to get started with task management
          </Typography>
          <Button
            variant="contained"
            size="large"
            startIcon={<AddIcon />}
            onClick={() => setOpenDialog(true)}
          >
            Create Your First Project
          </Button>
        </Card>
      ) : (
        <Grid container spacing={3}>
          {projects.map((project) => (
            <Grid item xs={12} sm={6} md={4} key={project._id}>
              <Card
                sx={{
                  cursor: 'pointer',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  position: 'relative',
                  overflow: 'hidden',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: 4,
                    background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
                  },
                }}
                onClick={() => navigate(`/projects/${project._id}`)}
              >
                <CardContent sx={{ flexGrow: 1, pt: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="h6" fontWeight="600" noWrap sx={{ flex: 1, pr: 1 }}>
                      {project.name}
                    </Typography>
                    <Chip
                      label={project.status}
                      color={getStatusColor(project.status)}
                      size="small"
                      sx={{ fontWeight: 500 }}
                    />
                  </Box>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{
                      mb: 3,
                      minHeight: 40,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                    }}
                  >
                    {project.description || 'No description provided'}
                  </Typography>
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      pt: 2,
                      borderTop: '1px solid',
                      borderColor: 'divider',
                    }}
                  >
                    <Chip
                      label={project.workspace}
                      size="small"
                      variant="outlined"
                      sx={{ fontWeight: 500 }}
                    />
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <PeopleIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                      <Typography variant="body2" color="text.secondary" fontWeight="500">
                        {project.members?.length || 0}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Project</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Project Name"
            fullWidth
            required
            value={newProject.name}
            onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
          />
          <TextField
            margin="dense"
            label="Description"
            fullWidth
            multiline
            rows={3}
            value={newProject.description}
            onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
          />
          <TextField
            margin="dense"
            label="Workspace"
            fullWidth
            select
            value={newProject.workspace}
            onChange={(e) => setNewProject({ ...newProject, workspace: e.target.value })}
          >
            <MenuItem value="Personal">Personal</MenuItem>
            <MenuItem value="Academic">Academic</MenuItem>
            <MenuItem value="Work">Work</MenuItem>
            <MenuItem value="Clubs">Clubs</MenuItem>
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button onClick={handleCreateProject} variant="contained" disabled={!newProject.name}>
            Create
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Dashboard;

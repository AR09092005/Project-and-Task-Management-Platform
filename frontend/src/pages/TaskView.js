import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Chip,
  Button,
  TextField,
  Card,
  CardContent,
  Avatar,
  Divider,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  Menu,
  Autocomplete,
} from '@mui/material';
import {
  ArrowBack,
  Edit,
  Delete,
  CheckCircle,
  MoreVert,
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { taskAPI, commentAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Subtasks from '../components/Subtasks';
import TaskDependencies from '../components/TaskDependencies';

const TaskView = () => {
  const { projectId, taskId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { enqueueSnackbar } = useSnackbar();
  const [task, setTask] = useState(null);
  const [projectTasks, setProjectTasks] = useState([]);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [editCommentId, setEditCommentId] = useState(null);
  const [editCommentContent, setEditCommentContent] = useState('');
  const [commentAnchorEl, setCommentAnchorEl] = useState(null);
  const [selectedComment, setSelectedComment] = useState(null);
  const [editTaskData, setEditTaskData] = useState({
    title: '',
    description: '',
    priority: '',
    status: '',
    dueDate: '',
    tags: [],
    estimatedHours: '',
  });

  useEffect(() => {
    fetchTask();
    fetchComments();
    if (projectId) {
      fetchProjectTasks();
    }
  }, [taskId, projectId]);

  const fetchTask = async () => {
    try {
      const response = await taskAPI.getById(taskId);
      setTask(response.data.data);
      setEditTaskData({
        title: response.data.data.title,
        description: response.data.data.description || '',
        priority: response.data.data.priority,
        status: response.data.data.status,
        dueDate: response.data.data.dueDate
          ? new Date(response.data.data.dueDate).toISOString().split('T')[0]
          : '',
        tags: response.data.data.tags || [],
        estimatedHours: response.data.data.estimatedHours || '',
      });
    } catch (error) {
      enqueueSnackbar('Failed to load task', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async () => {
    try {
      const response = await commentAPI.getAll(taskId);
      setComments(response.data.data);
    } catch (error) {
      console.error('Failed to load comments');
    }
  };

  const fetchProjectTasks = async () => {
    try {
      const response = await taskAPI.getAll(projectId);
      setProjectTasks(response.data.data);
    } catch (error) {
      console.error('Failed to load project tasks');
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    try {
      const response = await commentAPI.create(taskId, { content: newComment });
      setComments([response.data.data, ...comments]);
      setNewComment('');
      enqueueSnackbar('Comment added', { variant: 'success' });
    } catch (error) {
      enqueueSnackbar('Failed to add comment', { variant: 'error' });
    }
  };

  const handleCompleteTask = async () => {
    try {
      await taskAPI.complete(taskId);
      fetchTask();
      enqueueSnackbar('Task marked as complete', { variant: 'success' });
    } catch (error) {
      enqueueSnackbar('Failed to complete task', { variant: 'error' });
    }
  };

  const handleUpdateTask = async () => {
    try {
      const updateData = { ...editTaskData };
      if (updateData.estimatedHours) {
        updateData.estimatedHours = parseFloat(updateData.estimatedHours);
      }
      await taskAPI.update(taskId, updateData);
      setOpenEditDialog(false);
      fetchTask();
      enqueueSnackbar('Task updated successfully', { variant: 'success' });
    } catch (error) {
      enqueueSnackbar('Failed to update task', { variant: 'error' });
    }
  };

  const handleDeleteTask = async () => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        await taskAPI.delete(taskId);
        enqueueSnackbar('Task deleted successfully', { variant: 'success' });
        navigate(`/projects/${projectId}`);
      } catch (error) {
        enqueueSnackbar('Failed to delete task', { variant: 'error' });
      }
    }
  };

  const handleEditComment = (comment) => {
    setEditCommentId(comment._id);
    setEditCommentContent(comment.content);
    setCommentAnchorEl(null);
  };

  const handleUpdateComment = async (commentId) => {
    try {
      await commentAPI.update(commentId, { content: editCommentContent });
      fetchComments();
      setEditCommentId(null);
      setEditCommentContent('');
      enqueueSnackbar('Comment updated', { variant: 'success' });
    } catch (error) {
      enqueueSnackbar(error.response?.data?.message || 'Failed to update comment', {
        variant: 'error',
      });
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (window.confirm('Are you sure you want to delete this comment?')) {
      try {
        await commentAPI.delete(commentId);
        fetchComments();
        enqueueSnackbar('Comment deleted', { variant: 'success' });
      } catch (error) {
        enqueueSnackbar('Failed to delete comment', { variant: 'error' });
      }
    }
    setCommentAnchorEl(null);
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

  if (loading) return <Typography>Loading...</Typography>;
  if (!task) return <Typography>Task not found</Typography>;

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton onClick={() => navigate(`/projects/${projectId}`)} sx={{ mr: 2 }}>
          <ArrowBack />
        </IconButton>
        <Typography variant="h4" sx={{ flexGrow: 1 }}>
          {task.title}
        </Typography>
        <IconButton onClick={() => setOpenEditDialog(true)} sx={{ mr: 1 }}>
          <Edit />
        </IconButton>
        <IconButton onClick={handleDeleteTask} color="error" sx={{ mr: 1 }}>
          <Delete />
        </IconButton>
        {task.status !== 'Done' && (
          <Button
            variant="contained"
            color="success"
            startIcon={<CheckCircle />}
            onClick={handleCompleteTask}
          >
            Mark Complete
          </Button>
        )}
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Description
            </Typography>
            <Typography color="text.secondary">
              {task.description || 'No description provided'}
            </Typography>
          </Paper>

          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Comments ({comments.length})
            </Typography>
            <Box sx={{ mb: 3 }}>
              <TextField
                fullWidth
                multiline
                rows={3}
                placeholder="Add a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
              />
              <Button
                variant="contained"
                onClick={handleAddComment}
                disabled={!newComment.trim()}
                sx={{ mt: 1 }}
              >
                Add Comment
              </Button>
            </Box>

            <Divider sx={{ my: 2 }} />

            {comments.length === 0 ? (
              <Typography color="text.secondary" align="center" sx={{ py: 2 }}>
                No comments yet
              </Typography>
            ) : (
              comments.map((comment) => (
                <Card key={comment._id} sx={{ mb: 2 }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Avatar
                        src={comment.user?.profilePicture}
                        alt={comment.user?.name}
                        sx={{ mr: 1, width: 32, height: 32 }}
                      />
                      <Typography variant="subtitle2">{comment.user?.name}</Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ ml: 'auto' }}>
                        {new Date(comment.createdAt).toLocaleDateString()}{' '}
                        {new Date(comment.createdAt).toLocaleTimeString()}
                      </Typography>
                      {comment.user?._id === user._id && (
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            setSelectedComment(comment);
                            setCommentAnchorEl(e.currentTarget);
                          }}
                        >
                          <MoreVert fontSize="small" />
                        </IconButton>
                      )}
                    </Box>

                    {editCommentId === comment._id ? (
                      <Box>
                        <TextField
                          fullWidth
                          multiline
                          rows={2}
                          value={editCommentContent}
                          onChange={(e) => setEditCommentContent(e.target.value)}
                          sx={{ mb: 1 }}
                        />
                        <Button
                          size="small"
                          variant="contained"
                          onClick={() => handleUpdateComment(comment._id)}
                          sx={{ mr: 1 }}
                        >
                          Save
                        </Button>
                        <Button
                          size="small"
                          onClick={() => {
                            setEditCommentId(null);
                            setEditCommentContent('');
                          }}
                        >
                          Cancel
                        </Button>
                      </Box>
                    ) : (
                      <Typography variant="body2">
                        {comment.content}
                        {comment.isEdited && (
                          <Typography
                            component="span"
                            variant="caption"
                            color="text.secondary"
                            sx={{ ml: 1 }}
                          >
                            (edited)
                          </Typography>
                        )}
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Details
            </Typography>

            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Status
              </Typography>
              <Chip label={task.status} color={getStatusColor(task.status)} size="small" sx={{ mt: 0.5 }} />
            </Box>

            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Priority
              </Typography>
              <Chip label={task.priority} color={getPriorityColor(task.priority)} size="small" sx={{ mt: 0.5 }} />
            </Box>

            {task.dueDate && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Due Date
                </Typography>
                <Typography>{new Date(task.dueDate).toLocaleDateString()}</Typography>
              </Box>
            )}

            {task.estimatedHours && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Estimated Hours
                </Typography>
                <Typography>{task.estimatedHours}h</Typography>
              </Box>
            )}

            {task.tags && task.tags.length > 0 && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Tags
                </Typography>
                <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                  {task.tags.map((tag, idx) => (
                    <Chip key={idx} label={tag} size="small" variant="outlined" />
                  ))}
                </Box>
              </Box>
            )}

            {task.assignees && task.assignees.length > 0 && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Assignees
                </Typography>
                {task.assignees.map((assignee) => (
                  <Box key={assignee._id} sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                    <Avatar
                      src={assignee.profilePicture}
                      alt={assignee.name}
                      sx={{ width: 24, height: 24, mr: 1 }}
                    />
                    <Typography variant="body2">{assignee.name}</Typography>
                  </Box>
                ))}
              </Box>
            )}

            <Box>
              <Typography variant="body2" color="text.secondary">
                Created By
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                <Avatar
                  src={task.createdBy?.profilePicture}
                  alt={task.createdBy?.name}
                  sx={{ width: 24, height: 24, mr: 1 }}
                />
                <Typography variant="body2">{task.createdBy?.name}</Typography>
              </Box>
            </Box>
          </Paper>

          <Box sx={{ mt: 2 }}>
            <Subtasks task={task} onUpdate={fetchTask} />
          </Box>

          <Box sx={{ mt: 2 }}>
            <TaskDependencies task={task} projectTasks={projectTasks} onUpdate={fetchTask} />
          </Box>
        </Grid>
      </Grid>

      {/* Comment Menu */}
      <Menu
        anchorEl={commentAnchorEl}
        open={Boolean(commentAnchorEl)}
        onClose={() => setCommentAnchorEl(null)}
      >
        <MenuItem onClick={() => handleEditComment(selectedComment)}>
          <Edit fontSize="small" sx={{ mr: 1 }} />
          Edit
        </MenuItem>
        <MenuItem
          onClick={() => handleDeleteComment(selectedComment?._id)}
          sx={{ color: 'error.main' }}
        >
          <Delete fontSize="small" sx={{ mr: 1 }} />
          Delete
        </MenuItem>
      </Menu>

      {/* Edit Task Dialog */}
      <Dialog open={openEditDialog} onClose={() => setOpenEditDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Task</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Task Title"
            fullWidth
            required
            value={editTaskData.title}
            onChange={(e) => setEditTaskData({ ...editTaskData, title: e.target.value })}
          />
          <TextField
            margin="dense"
            label="Description"
            fullWidth
            multiline
            rows={3}
            value={editTaskData.description}
            onChange={(e) => setEditTaskData({ ...editTaskData, description: e.target.value })}
          />
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <TextField
                margin="dense"
                label="Priority"
                fullWidth
                select
                value={editTaskData.priority}
                onChange={(e) => setEditTaskData({ ...editTaskData, priority: e.target.value })}
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
                value={editTaskData.status}
                onChange={(e) => setEditTaskData({ ...editTaskData, status: e.target.value })}
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
                value={editTaskData.dueDate}
                onChange={(e) => setEditTaskData({ ...editTaskData, dueDate: e.target.value })}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                margin="dense"
                label="Estimated Hours"
                type="number"
                fullWidth
                value={editTaskData.estimatedHours}
                onChange={(e) => setEditTaskData({ ...editTaskData, estimatedHours: e.target.value })}
              />
            </Grid>
          </Grid>
          <Autocomplete
            multiple
            freeSolo
            options={[]}
            value={editTaskData.tags}
            onChange={(e, newValue) => setEditTaskData({ ...editTaskData, tags: newValue })}
            renderInput={(params) => (
              <TextField {...params} margin="dense" label="Tags" placeholder="Add tags" />
            )}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenEditDialog(false)}>Cancel</Button>
          <Button
            onClick={handleUpdateTask}
            variant="contained"
            disabled={!editTaskData.title}
          >
            Update
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TaskView;

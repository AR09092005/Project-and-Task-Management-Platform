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
} from '@mui/material';
import { ArrowBack, Edit, Delete, CheckCircle } from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { taskAPI, commentAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const TaskView = () => {
  const { projectId, taskId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { enqueueSnackbar } = useSnackbar();
  const [task, setTask] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTask();
    fetchComments();
  }, [taskId]);

  const fetchTask = async () => {
    try {
      const response = await taskAPI.getById(taskId);
      setTask(response.data.data);
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
            <Typography variant="h6" gutterBottom>Description</Typography>
            <Typography color="text.secondary">
              {task.description || 'No description provided'}
            </Typography>
          </Paper>

          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>Comments ({comments.length})</Typography>
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

            {comments.map((comment) => (
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
                      {new Date(comment.createdAt).toLocaleDateString()}
                    </Typography>
                  </Box>
                  <Typography variant="body2">{comment.content}</Typography>
                </CardContent>
              </Card>
            ))}
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>Details</Typography>

            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">Status</Typography>
              <Chip label={task.status} color="primary" size="small" sx={{ mt: 0.5 }} />
            </Box>

            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">Priority</Typography>
              <Chip label={task.priority} size="small" sx={{ mt: 0.5 }} />
            </Box>

            {task.dueDate && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">Due Date</Typography>
                <Typography>{new Date(task.dueDate).toLocaleDateString()}</Typography>
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
              <Typography variant="body2" color="text.secondary">Created By</Typography>
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
        </Grid>
      </Grid>
    </Box>
  );
};

export default TaskView;

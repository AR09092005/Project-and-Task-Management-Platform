import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Box,
  Typography,
  Button,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Divider,
} from '@mui/material';
import {
  CheckCircle as CheckIcon,
  Cancel as CancelIcon,
  Group as GroupIcon,
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { useAuth } from '../context/AuthContext';
import { inviteAPI } from '../services/api';

function AcceptInvite() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [invite, setInvite] = useState(null);
  const [error, setError] = useState(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    const fetchInvite = async () => {
      try {
        const response = await inviteAPI.getByToken(token);
        setInvite(response.data.data);
        setError(null);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load invite');
      } finally {
        setLoading(false);
      }
    };

    fetchInvite();
  }, [token]);

  const handleAccept = async () => {
    setProcessing(true);
    try {
      await inviteAPI.accept(token);
      enqueueSnackbar('Invitation accepted successfully!', { variant: 'success' });
      // Navigate to dashboard to see the new project
      // Using window.location for a full page reload to ensure fresh data
      window.location.href = '/dashboard';
    } catch (err) {
      enqueueSnackbar(
        err.response?.data?.message || 'Failed to accept invitation',
        { variant: 'error' }
      );
      setProcessing(false);
    }
  };

  const handleDecline = async () => {
    setProcessing(true);
    try {
      await inviteAPI.decline(token);
      enqueueSnackbar('Invitation declined', { variant: 'info' });
      navigate('/dashboard');
    } catch (err) {
      enqueueSnackbar(
        err.response?.data?.message || 'Failed to decline invitation',
        { variant: 'error' }
      );
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="sm">
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="sm">
        <Box sx={{ mt: 8 }}>
          <Paper sx={{ p: 4 }}>
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
            <Button
              fullWidth
              variant="contained"
              onClick={() => navigate('/dashboard')}
            >
              Go to Dashboard
            </Button>
          </Paper>
        </Box>
      </Container>
    );
  }

  if (!user) {
    return (
      <Container maxWidth="sm">
        <Box sx={{ mt: 8 }}>
          <Paper sx={{ p: 4 }}>
            <Typography variant="h5" gutterBottom>
              Project Invitation
            </Typography>
            <Alert severity="info" sx={{ mb: 3 }}>
              Please log in to accept this invitation
            </Alert>
            <Button
              fullWidth
              variant="contained"
              onClick={() => navigate(`/login?redirect=/invites/${token}`)}
            >
              Log In
            </Button>
            <Button
              fullWidth
              variant="outlined"
              sx={{ mt: 2 }}
              onClick={() => navigate('/register')}
            >
              Create Account
            </Button>
          </Paper>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 8 }}>
        <Paper sx={{ p: 4 }}>
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <GroupIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
            <Typography variant="h4" gutterBottom>
              Project Invitation
            </Typography>
          </Box>

          <Card variant="outlined" sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                You've been invited by
              </Typography>
              <Typography variant="h6" gutterBottom>
                {invite.invitedBy?.name}
              </Typography>

              <Divider sx={{ my: 2 }} />

              <Typography variant="body2" color="text.secondary" gutterBottom>
                To join the project
              </Typography>
              <Typography variant="h5" gutterBottom>
                {invite.project?.name}
              </Typography>

              {invite.project?.description && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Description
                  </Typography>
                  <Typography variant="body1">
                    {invite.project.description}
                  </Typography>
                </>
              )}

              <Divider sx={{ my: 2 }} />

              <Typography variant="body2" color="text.secondary" gutterBottom>
                Your role
              </Typography>
              <Typography variant="h6" color="primary">
                {invite.role}
              </Typography>
            </CardContent>
          </Card>

          {invite.email !== user.email && (
            <Alert severity="warning" sx={{ mb: 3 }}>
              This invitation was sent to {invite.email}, but you're logged in as {user.email}.
              You won't be able to accept this invitation.
            </Alert>
          )}

          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              fullWidth
              variant="contained"
              color="primary"
              startIcon={<CheckIcon />}
              onClick={handleAccept}
              disabled={processing || invite.email !== user.email}
            >
              {processing ? <CircularProgress size={24} /> : 'Accept Invitation'}
            </Button>
            <Button
              fullWidth
              variant="outlined"
              color="error"
              startIcon={<CancelIcon />}
              onClick={handleDecline}
              disabled={processing || invite.email !== user.email}
            >
              Decline
            </Button>
          </Box>

          <Button
            fullWidth
            variant="text"
            sx={{ mt: 2 }}
            onClick={() => navigate('/dashboard')}
            disabled={processing}
          >
            Back to Dashboard
          </Button>
        </Paper>
      </Box>
    </Container>
  );
}

export default AcceptInvite;

import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Box, CircularProgress, Typography, Container } from '@mui/material';
import { CheckCircle, Error as ErrorIcon } from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { calendarAPI } from '../services/api';

const CalendarCallback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { enqueueSnackbar } = useSnackbar();
  const [status, setStatus] = useState('processing'); // processing, success, error

  useEffect(() => {
    handleCallback();
  }, []);

  const handleCallback = async () => {
    try {
      const code = searchParams.get('code');
      const error = searchParams.get('error');

      if (error) {
        setStatus('error');
        enqueueSnackbar(`Authorization failed: ${error}`, { variant: 'error' });
        setTimeout(() => navigate('/settings'), 3000);
        return;
      }

      if (!code) {
        setStatus('error');
        enqueueSnackbar('No authorization code received', { variant: 'error' });
        setTimeout(() => navigate('/settings'), 3000);
        return;
      }

      // Exchange code for tokens
      await calendarAPI.handleGoogleCallback(code);

      setStatus('success');
      enqueueSnackbar('Google Calendar connected successfully!', { variant: 'success' });
      setTimeout(() => navigate('/settings'), 2000);
    } catch (error) {
      console.error('Calendar callback error:', error);
      setStatus('error');
      enqueueSnackbar(
        error.response?.data?.message || 'Failed to connect calendar',
        { variant: 'error' }
      );
      setTimeout(() => navigate('/settings'), 3000);
    }
  };

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          textAlign: 'center',
        }}
      >
        {status === 'processing' && (
          <>
            <CircularProgress size={60} sx={{ mb: 3 }} />
            <Typography variant="h5" gutterBottom>
              Connecting to Google Calendar...
            </Typography>
            <Typography color="text.secondary">
              Please wait while we set up your calendar connection.
            </Typography>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle sx={{ fontSize: 80, color: 'success.main', mb: 3 }} />
            <Typography variant="h5" gutterBottom>
              Successfully Connected!
            </Typography>
            <Typography color="text.secondary">
              Your Google Calendar is now connected. Redirecting to settings...
            </Typography>
          </>
        )}

        {status === 'error' && (
          <>
            <ErrorIcon sx={{ fontSize: 80, color: 'error.main', mb: 3 }} />
            <Typography variant="h5" gutterBottom>
              Connection Failed
            </Typography>
            <Typography color="text.secondary">
              Unable to connect to Google Calendar. Redirecting to settings...
            </Typography>
          </>
        )}
      </Box>
    </Container>
  );
};

export default CalendarCallback;

import React, { useState, useEffect } from 'react';
import {
  Popover,
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  IconButton,
  Divider,
  Button,
  Badge,
  Chip,
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  Check,
  Delete,
  PersonAdd,
  TaskAlt,
  Comment as CommentIcon,
} from '@mui/icons-material';
import { notificationAPI } from '../services/api';
import { useSnackbar } from 'notistack';
import { formatDistanceToNow } from 'date-fns';
import { useSocket } from '../context/SocketContext';

const Notifications = () => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const { enqueueSnackbar } = useSnackbar();
  const { socket } = useSocket();

  useEffect(() => {
    fetchUnreadCount();
  }, []);

  // Socket.io real-time notification listener
  useEffect(() => {
    if (socket) {
      socket.on('new_notification', (notification) => {
        setNotifications((prev) => [notification, ...prev]);
        fetchUnreadCount();
        enqueueSnackbar(notification.message, { variant: 'info' });
      });

      socket.on('notification_read', (notificationId) => {
        setNotifications((prev) =>
          prev.map((n) => (n._id === notificationId ? { ...n, isRead: true } : n))
        );
        fetchUnreadCount();
      });
    }

    return () => {
      if (socket) {
        socket.off('new_notification');
        socket.off('notification_read');
      }
    };
  }, [socket]);

  useEffect(() => {
    if (anchorEl) {
      fetchNotifications();
    }
  }, [anchorEl]);

  const fetchNotifications = async () => {
    try {
      const response = await notificationAPI.getAll({ limit: 20 });
      setNotifications(response.data.data);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const response = await notificationAPI.getUnreadCount();
      setUnreadCount(response.data.data.count);
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
    }
  };

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      await notificationAPI.markAsRead(notificationId);
      setNotifications(
        notifications.map((n) =>
          n._id === notificationId ? { ...n, isRead: true } : n
        )
      );
      fetchUnreadCount();
    } catch (error) {
      enqueueSnackbar('Failed to mark notification as read', { variant: 'error' });
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationAPI.markAllAsRead();
      setNotifications(notifications.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
      enqueueSnackbar('All notifications marked as read', { variant: 'success' });
    } catch (error) {
      enqueueSnackbar('Failed to mark all as read', { variant: 'error' });
    }
  };

  const handleDelete = async (notificationId) => {
    try {
      await notificationAPI.delete(notificationId);
      setNotifications(notifications.filter((n) => n._id !== notificationId));
      fetchUnreadCount();
      enqueueSnackbar('Notification deleted', { variant: 'success' });
    } catch (error) {
      enqueueSnackbar('Failed to delete notification', { variant: 'error' });
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'invite':
        return <PersonAdd color="primary" />;
      case 'task_assigned':
        return <TaskAlt color="success" />;
      case 'task_completed':
        return <TaskAlt color="success" />;
      case 'comment':
        return <CommentIcon color="info" />;
      default:
        return <NotificationsIcon />;
    }
  };

  const open = Boolean(anchorEl);

  return (
    <>
      <IconButton size="large" color="inherit" onClick={handleClick}>
        <Badge badgeContent={unreadCount} color="error">
          <NotificationsIcon />
        </Badge>
      </IconButton>

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <Box sx={{ width: 400, maxHeight: 600 }}>
          <Box
            sx={{
              p: 2,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderBottom: 1,
              borderColor: 'divider',
            }}
          >
            <Typography variant="h6">Notifications</Typography>
            {notifications.some((n) => !n.isRead) && (
              <Button size="small" onClick={handleMarkAllAsRead}>
                Mark all read
              </Button>
            )}
          </Box>

          {notifications.length === 0 ? (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Typography color="text.secondary">No notifications</Typography>
            </Box>
          ) : (
            <List sx={{ p: 0, maxHeight: 500, overflow: 'auto' }}>
              {notifications.map((notification) => (
                <React.Fragment key={notification._id}>
                  <ListItem
                    sx={{
                      bgcolor: notification.isRead ? 'transparent' : 'action.hover',
                      '&:hover': { bgcolor: 'action.selected' },
                    }}
                    secondaryAction={
                      <Box>
                        {!notification.isRead && (
                          <IconButton
                            edge="end"
                            size="small"
                            onClick={() => handleMarkAsRead(notification._id)}
                            sx={{ mr: 1 }}
                          >
                            <Check fontSize="small" />
                          </IconButton>
                        )}
                        <IconButton
                          edge="end"
                          size="small"
                          onClick={() => handleDelete(notification._id)}
                        >
                          <Delete fontSize="small" />
                        </IconButton>
                      </Box>
                    }
                  >
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: 'background.paper' }}>
                        {getNotificationIcon(notification.type)}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body2">{notification.message}</Typography>
                          {!notification.isRead && (
                            <Chip label="New" size="small" color="primary" />
                          )}
                        </Box>
                      }
                      secondary={formatDistanceToNow(new Date(notification.createdAt), {
                        addSuffix: true,
                      })}
                    />
                  </ListItem>
                  <Divider component="li" />
                </React.Fragment>
              ))}
            </List>
          )}
        </Box>
      </Popover>
    </>
  );
};

export default Notifications;

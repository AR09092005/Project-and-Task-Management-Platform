require('dotenv').config();
const express = require('express');
const http = require('http');
const socketio = require('socket.io');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const passport = require('./config/passport');
const connectDB = require('./config/database');
const { errorHandler } = require('./middleware/errorHandler');
const { apiLimiter } = require('./middleware/rateLimiter');

// Initialize express app
const app = express();
const server = http.createServer(app);

// Initialize Socket.io
const io = socketio(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true,
  },
});

// Make io accessible to our router
app.set('io', io);
exports.io = io;

// Connect to database (skip in test mode - tests use in-memory DB)
if (process.env.NODE_ENV !== 'test') {
  connectDB();
}

// Middleware
app.use(helmet()); // Security headers
app.use(compression()); // Compress responses
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(passport.initialize());

// Logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Rate limiting disabled per user request
// app.use('/api/', apiLimiter);

// Serve uploaded files
const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes
const authRoutes = require('./routes/authRoutes');
const projectRoutes = require('./routes/projectRoutes');
const taskRoutes = require('./routes/taskRoutes');
const commentRoutes = require('./routes/commentRoutes');
const inviteRoutes = require('./routes/inviteRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const attachmentRoutes = require('./routes/attachmentRoutes');
const calendarRoutes = require('./routes/calendarRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/invites', inviteRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/calendar', calendarRoutes);

// Nested routes
app.use('/api/projects/:projectId/tasks', taskRoutes);
app.use('/api/tasks/:taskId/comments', commentRoutes);
app.use('/api/tasks/:taskId/attachments', attachmentRoutes);

// For invites endpoint on projects
const { createInvite, getProjectInvites } = require('./controllers/inviteController');
const { protect } = require('./middleware/auth');
const { createInviteValidation, validate } = require('./middleware/validation');

app.post('/api/projects/:projectId/invites', protect, createInviteValidation, validate, createInvite);
app.get('/api/projects/:projectId/invites', protect, getProjectInvites);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

// Error handler middleware (must be last)
app.use(errorHandler);

// Socket.io connection handling
const jwt = require('jsonwebtoken');
const User = require('./models/User');

io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token || socket.handshake.headers.cookie?.split('jwt=')[1]?.split(';')[0];

    if (!token) {
      return next(new Error('Authentication error'));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-passwordHash');

    if (!user || !user.isActive || user.isDeleted) {
      return next(new Error('Authentication error'));
    }

    socket.user = user;
    next();
  } catch (error) {
    next(new Error('Authentication error'));
  }
});

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.user.name} (${socket.user._id})`);

  // Join user to their personal room for notifications
  socket.join(socket.user._id.toString());

  // Join project rooms
  socket.on('join-project', (projectId) => {
    socket.join(`project-${projectId}`);
    console.log(`User ${socket.user.name} joined project ${projectId}`);
  });

  // Leave project rooms
  socket.on('leave-project', (projectId) => {
    socket.leave(`project-${projectId}`);
    console.log(`User ${socket.user.name} left project ${projectId}`);
  });

  // Typing indicator
  socket.on('typing', ({ taskId, isTyping }) => {
    socket.to(`task-${taskId}`).emit('user-typing', {
      userId: socket.user._id,
      userName: socket.user.name,
      isTyping,
    });
  });

  // Join task room
  socket.on('join-task', (taskId) => {
    socket.join(`task-${taskId}`);
  });

  // Leave task room
  socket.on('leave-task', (taskId) => {
    socket.leave(`task-${taskId}`);
  });

  // Disconnect
  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.user.name}`);
  });
});

// Start server only if not in test mode
const PORT = process.env.PORT || 5000;

if (process.env.NODE_ENV !== 'test') {
  server.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  });
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.log('UNHANDLED REJECTION! Shutting down...');
  console.error(err);
  server.close(() => {
    process.exit(1);
  });
});

// Handle SIGTERM
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
  });
});

// Export app for testing
module.exports = app;

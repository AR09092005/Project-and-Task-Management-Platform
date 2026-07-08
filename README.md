# Project and Task Management Platform

A comprehensive web-based collaborative task management system designed for college students and young professionals. This platform combines team collaboration, automated deadline tracking, timeline visualization, and task dependencies.

## 🚀 Features

### MVP Features (Implemented)
- ✅ **User Authentication**
  - Email/password registration and login
  - OAuth 2.0 social login (Google, Microsoft, GitHub)
  - JWT session management with HTTP-only cookies
  - Email verification and password reset
  - Rate limiting and account lockout protection

- ✅ **Project Management**
  - Create, read, update, and delete projects
  - Multiple project workspaces (Personal, Academic, Work, Clubs)
  - Project dashboard with task statistics
  - Role-based access control (Owner, Admin, Member, Viewer)
  - Project archiving and soft delete

- ✅ **Task Management**
  - Create tasks with title, description, priority, status, assignees
  - Task status tracking (To Do, In Progress, In Review, Done)
  - Priority levels (Low, Medium, High, Urgent)
  - Task dependencies with circular dependency validation
  - Hierarchical subtasks
  - Mark tasks as complete
  - Soft delete with recovery period

- ✅ **Team Collaboration**
  - Invite team members via email
  - Role assignment and permission management
  - Threaded comments on tasks
  - @mention functionality
  - Comment editing (5-minute window) and deletion

- ✅ **Real-time Features**
  - Socket.io integration for live updates
  - Real-time notifications
  - Online/offline status indicators

- ✅ **Notifications**
  - In-app notification system
  - Email notifications for key events
  - Configurable notification preferences
  - Unread notification count

## 🛠️ Tech Stack

### Backend
- **Runtime:** Node.js (v18+)
- **Framework:** Express.js
- **Database:** MongoDB with Mongoose ODM
- **Authentication:** JWT tokens (HTTP-only cookies) + OAuth 2.0
- **Real-time:** Socket.io
- **Email:** Nodemailer
- **Security:** bcrypt (10 salt rounds), Helmet, CORS, Rate limiting
- **File Upload:** Multer + AWS S3

### Frontend
- **Library:** React 18+
- **UI Framework:** Material-UI (MUI)
- **Routing:** React Router v6
- **State Management:** React Query + Context API
- **Form Handling:** Formik + Yup
- **Real-time:** Socket.io-client
- **Notifications:** Notistack

## 📋 Prerequisites

- Node.js (v18 or higher)
- MongoDB (v6 or higher)
- npm or yarn
- Git

## 🔧 Installation & Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd Project-and-Task-Management-Platform
```

### 2. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Edit .env file with your configuration
# Update MongoDB URI, JWT secret, email credentials, OAuth keys, etc.
```

**Backend Environment Variables (.env):**

```env
NODE_ENV=development
PORT=5000
CLIENT_URL=http://localhost:3000

# Database
MONGODB_URI=mongodb://localhost:27017/task-management

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRE=24h
JWT_COOKIE_EXPIRE=1

# OAuth 2.0 (Optional - configure if using social login)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback

GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
GITHUB_CALLBACK_URL=http://localhost:5000/api/auth/github/callback

MICROSOFT_CLIENT_ID=your-microsoft-client-id
MICROSOFT_CLIENT_SECRET=your-microsoft-client-secret
MICROSOFT_CALLBACK_URL=http://localhost:5000/api/auth/microsoft/callback

# Email Configuration (for notifications)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
EMAIL_FROM=noreply@taskmanagement.com

# AWS S3 (Optional - for file uploads)
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_REGION=us-east-1
AWS_S3_BUCKET=task-management-files

# Security
BCRYPT_SALT_ROUNDS=10
MAX_LOGIN_ATTEMPTS=5
LOCKOUT_DURATION=1800000
```

### 3. Frontend Setup

```bash
cd ../frontend

# Install dependencies
npm install

# Create .env file (optional - defaults to localhost:5000)
echo "REACT_APP_API_URL=http://localhost:5000/api" > .env
```

### 4. Database Setup

Make sure MongoDB is running on your system:

```bash
# On macOS with Homebrew
brew services start mongodb-community

# On Ubuntu/Debian
sudo systemctl start mongod

# On Windows
# MongoDB should start automatically, or use MongoDB Compass
```

## 🚀 Running the Application

### Development Mode

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```
The backend will run on http://localhost:5000

**Terminal 2 - Frontend:**
```bash
cd frontend
npm start
```
The frontend will run on http://localhost:3000

### Production Mode

**Backend:**
```bash
cd backend
npm start
```

**Frontend:**
```bash
cd frontend
npm run build
# Serve the build folder using a static server
```

## 📁 Project Structure

```
Project-and-Task-Management-Platform/
├── backend/
│   ├── src/
│   │   ├── config/         # Database, Passport configuration
│   │   ├── controllers/    # Route controllers
│   │   ├── middleware/     # Auth, validation, error handling
│   │   ├── models/         # Mongoose models
│   │   ├── routes/         # API routes
│   │   ├── services/       # Business logic
│   │   ├── utils/          # Helper functions
│   │   └── server.js       # Express app entry point
│   ├── tests/              # Test files
│   ├── .env.example        # Environment variables template
│   └── package.json
│
├── frontend/
│   ├── public/             # Static files
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── context/        # React Context (Auth, etc.)
│   │   ├── pages/          # Page components
│   │   ├── services/       # API calls
│   │   ├── utils/          # Helper functions
│   │   ├── App.js          # Main app component
│   │   ├── index.js        # Entry point
│   │   └── theme.js        # MUI theme configuration
│   └── package.json
│
├── .gitignore
└── README.md
```

## 🔐 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current user
- `GET /api/auth/verify-email/:token` - Verify email
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password/:token` - Reset password
- `PUT /api/auth/profile` - Update profile
- `PUT /api/auth/update-password` - Update password
- `GET /api/auth/google` - Google OAuth
- `GET /api/auth/github` - GitHub OAuth
- `GET /api/auth/microsoft` - Microsoft OAuth

### Projects
- `GET /api/projects` - Get all projects
- `POST /api/projects` - Create project
- `GET /api/projects/:id` - Get project by ID
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project
- `PUT /api/projects/:id/archive` - Archive project
- `GET /api/projects/:id/dashboard` - Get project statistics
- `POST /api/projects/:id/members` - Add member
- `DELETE /api/projects/:id/members/:userId` - Remove member
- `PUT /api/projects/:id/members/:userId` - Update member role

### Tasks
- `GET /api/projects/:projectId/tasks` - Get all tasks
- `POST /api/projects/:projectId/tasks` - Create task
- `GET /api/tasks/:id` - Get task by ID
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task
- `PUT /api/tasks/:id/complete` - Mark task complete
- `PUT /api/tasks/:id/position` - Update task position
- `POST /api/tasks/:id/dependencies` - Add dependency
- `DELETE /api/tasks/:id/dependencies/:depId` - Remove dependency

### Comments
- `GET /api/tasks/:taskId/comments` - Get comments
- `POST /api/tasks/:taskId/comments` - Create comment
- `PUT /api/comments/:id` - Update comment
- `DELETE /api/comments/:id` - Delete comment

### Invites
- `POST /api/projects/:projectId/invites` - Create invite
- `GET /api/projects/:projectId/invites` - Get project invites
- `GET /api/invites/:token` - Get invite by token
- `POST /api/invites/:token/accept` - Accept invite
- `POST /api/invites/:token/decline` - Decline invite

### Notifications
- `GET /api/notifications` - Get notifications
- `GET /api/notifications/unread-count` - Get unread count
- `PUT /api/notifications/:id/read` - Mark as read
- `PUT /api/notifications/read-all` - Mark all as read
- `DELETE /api/notifications/:id` - Delete notification

## 🔒 Security Features

- **Password Security:** bcrypt hashing with 10 salt rounds
- **JWT Tokens:** HTTP-only cookies for secure session management
- **Rate Limiting:** Prevents brute force attacks
- **Account Lockout:** 5 failed login attempts = 30-minute lockout
- **Input Validation:** Express-validator for all inputs
- **CORS:** Configured for specific origins
- **Helmet:** Security headers
- **XSS Protection:** Output encoding
- **SQL Injection Prevention:** MongoDB parameterized queries

## 📊 Database Schema

### Collections
- **Users:** User accounts and authentication
- **Projects:** Project information and settings
- **Tasks:** Task details and tracking
- **Comments:** Task comments and mentions
- **Invites:** Project invitations
- **Notifications:** User notifications
- **Attachments:** File attachments

## 🧪 Testing

```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test
```

## 🐛 Troubleshooting

### MongoDB Connection Issues
- Ensure MongoDB is running
- Check connection string in .env
- Verify network connectivity

### OAuth Login Not Working
- Verify OAuth credentials in .env
- Check callback URLs match your OAuth app settings
- Ensure CLIENT_URL is correctly set

### Email Notifications Not Sending
- Verify SMTP credentials
- For Gmail, use an App Password instead of your regular password
- Check spam folder

## 📝 License

MIT License

## 👥 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📞 Support

For issues and questions, please create an issue in the GitHub repository.

---

**Built with ❤️ for students and professionals**

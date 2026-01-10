import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Token is sent via HTTP-only cookie, no need to add it manually
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get('/auth/me'),
  verifyEmail: (token) => api.get(`/auth/verify-email/${token}`),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token, password) => api.post(`/auth/reset-password/${token}`, { password }),
  updateProfile: (data) => api.put('/auth/profile', data),
  updatePassword: (data) => api.put('/auth/update-password', data),
  updateNotificationPreferences: (data) => api.put('/auth/notification-preferences', data),
};

// Project API
export const projectAPI = {
  getAll: (params) => api.get('/projects', { params }),
  getById: (id) => api.get(`/projects/${id}`),
  create: (data) => api.post('/projects', data),
  update: (id, data) => api.put(`/projects/${id}`, data),
  delete: (id) => api.delete(`/projects/${id}`),
  archive: (id) => api.put(`/projects/${id}/archive`),
  getDashboard: (id) => api.get(`/projects/${id}/dashboard`),
  addMember: (id, data) => api.post(`/projects/${id}/members`, data),
  removeMember: (id, userId) => api.delete(`/projects/${id}/members/${userId}`),
  updateMemberRole: (id, userId, role) => api.put(`/projects/${id}/members/${userId}`, { role }),
};

// Task API
export const taskAPI = {
  getAll: (projectId, params) => api.get(`/projects/${projectId}/tasks`, { params }),
  getById: (id) => api.get(`/tasks/${id}`),
  create: (projectId, data) => api.post(`/projects/${projectId}/tasks`, data),
  update: (id, data) => api.put(`/tasks/${id}`, data),
  delete: (id) => api.delete(`/tasks/${id}`),
  complete: (id) => api.put(`/tasks/${id}/complete`),
  updatePosition: (id, position) => api.put(`/tasks/${id}/position`, { position }),
  addDependency: (id, data) => api.post(`/tasks/${id}/dependencies`, data),
  removeDependency: (id, depId) => api.delete(`/tasks/${id}/dependencies/${depId}`),
};

// Comment API
export const commentAPI = {
  getAll: (taskId) => api.get(`/tasks/${taskId}/comments`),
  create: (taskId, data) => api.post(`/tasks/${taskId}/comments`, data),
  update: (taskId, id, data) => api.put(`/tasks/${taskId}/comments/${id}`, data),
  delete: (taskId, id) => api.delete(`/tasks/${taskId}/comments/${id}`),
};

// Invite API
export const inviteAPI = {
  create: (projectId, data) => api.post(`/projects/${projectId}/invites`, data),
  getByToken: (token) => api.get(`/invites/${token}`),
  accept: (token) => api.post(`/invites/${token}/accept`),
  decline: (token) => api.post(`/invites/${token}/decline`),
  getProjectInvites: (projectId) => api.get(`/projects/${projectId}/invites`),
};

// Notification API
export const notificationAPI = {
  getAll: (params) => api.get('/notifications', { params }),
  getUnreadCount: () => api.get('/notifications/unread-count'),
  markAsRead: (id) => api.put(`/notifications/${id}/read`),
  markAllAsRead: () => api.put('/notifications/read-all'),
  delete: (id) => api.delete(`/notifications/${id}`),
};

// Attachment API
export const attachmentAPI = {
  getAll: (taskId) => api.get(`/tasks/${taskId}/attachments`),
  upload: (taskId, formData) =>
    api.post(`/tasks/${taskId}/attachments`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }),
  download: (taskId, filename) =>
    api.get(`/tasks/${taskId}/attachments/files/${filename}`, {
      responseType: 'blob',
    }),
  delete: (taskId, id) => api.delete(`/tasks/${taskId}/attachments/${id}`),
};

// Calendar API
export const calendarAPI = {
  // Google Calendar
  getGoogleAuthUrl: () => api.get('/calendar/google/auth-url'),
  handleGoogleCallback: (code) => api.post('/calendar/google/callback', { code }),

  // Calendar syncs
  getSyncs: () => api.get('/calendar/syncs'),
  toggleSync: (id, syncEnabled) => api.put(`/calendar/syncs/${id}/toggle`, { syncEnabled }),
  disconnect: (id) => api.delete(`/calendar/syncs/${id}`),

  // Sync tasks
  syncTask: (taskId) => api.post(`/calendar/tasks/${taskId}/sync`),

  // iCal export
  exportProject: (projectId) =>
    api.get(`/calendar/export/project/${projectId}`, { responseType: 'blob' }),
  exportMyTasks: () => api.get('/calendar/export/my-tasks', { responseType: 'blob' }),
};

export default api;

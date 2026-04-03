const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const User = require('../models/User');
const Project = require('../models/Project');
const jwt = require('jsonwebtoken');

let mongoServer;

// Setup before all tests
const setupTestDB = async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();

  await mongoose.connect(mongoUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
};

// Cleanup after all tests
const teardownTestDB = async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
};

// Clear all collections
const clearDatabase = async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
};

// Create test user
const createTestUser = async (userData = {}) => {
  const defaultUser = {
    name: 'Test User',
    email: 'testuser@example.com',
    password: 'Password123!',
    isEmailVerified: true,
  };

  const user = await User.create({ ...defaultUser, ...userData });
  return user;
};

// Create test project
const createTestProject = async (owner, projectData = {}) => {
  const defaultProject = {
    name: 'Test Project',
    description: 'A test project for testing',
    category: 'Personal',
    owner: owner._id,
    members: [
      {
        user: owner._id,
        role: 'Owner',
        permissions: {
          canEdit: true,
          canDelete: true,
          canManageMembers: true,
        },
      },
    ],
  };

  const project = await Project.create({ ...defaultProject, ...projectData });
  return project;
};

// Generate JWT token for testing
const generateAuthToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET || 'test-secret', {
    expiresIn: '1h',
  });
};

// Create authenticated request
const getAuthHeader = (token) => {
  return { Authorization: `Bearer ${token}` };
};

module.exports = {
  setupTestDB,
  teardownTestDB,
  clearDatabase,
  createTestUser,
  createTestProject,
  generateAuthToken,
  getAuthHeader,
};

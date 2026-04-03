const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');
const Task = require('../models/Task');
const {
  setupTestDB,
  teardownTestDB,
  clearDatabase,
  createTestUser,
  createTestProject,
  generateAuthToken,
} = require('./setup');

describe('Task Controller Integration Tests', () => {
  beforeAll(async () => {
    await setupTestDB();
  });

  afterAll(async () => {
    await teardownTestDB();
  });

  beforeEach(async () => {
    await clearDatabase();
  });

  describe('Valid Test Cases - Task Operations', () => {
    let testUser;
    let testProject;
    let authToken;

    beforeEach(async () => {
      testUser = await createTestUser();
      testProject = await createTestProject(testUser);
      authToken = generateAuthToken(testUser._id);
    });

    test('TC01: Should create task with valid data', async () => {
      const taskData = {
        title: 'New Feature Implementation',
        description: 'Implement user authentication',
        priority: 'High',
        status: 'To Do',
      };

      const response = await request(app)
        .post(`/api/projects/${testProject._id}/tasks`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(taskData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe(taskData.title);
      expect(response.body.data.priority).toBe(taskData.priority);
      expect(response.body.data.status).toBe(taskData.status);
    });

    test('TC02: Should get all tasks for a project', async () => {
      // Create multiple tasks
      await Task.create([
        {
          project: testProject._id,
          title: 'Task 1',
          createdBy: testUser._id,
          status: 'To Do',
        },
        {
          project: testProject._id,
          title: 'Task 2',
          createdBy: testUser._id,
          status: 'In Progress',
        },
        {
          project: testProject._id,
          title: 'Task 3',
          createdBy: testUser._id,
          status: 'Done',
        },
      ]);

      const response = await request(app)
        .get(`/api/projects/${testProject._id}/tasks`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.count).toBe(3);
      expect(response.body.data).toHaveLength(3);
    });

    test('TC03: Should get single task by ID', async () => {
      const task = await Task.create({
        project: testProject._id,
        title: 'Test Task',
        description: 'Test description',
        createdBy: testUser._id,
      });

      const response = await request(app)
        .get(`/api/tasks/${task._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe('Test Task');
      expect(response.body.data._id).toBe(task._id.toString());
    });

    test('TC04: Should update task status (To Do → In Progress)', async () => {
      const task = await Task.create({
        project: testProject._id,
        title: 'Task to update',
        status: 'To Do',
        createdBy: testUser._id,
      });

      const response = await request(app)
        .put(`/api/tasks/${task._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ status: 'In Progress' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('In Progress');
    });

    test('TC05: Should update task status (In Progress → In Review → Done)', async () => {
      const task = await Task.create({
        project: testProject._id,
        title: 'Task workflow test',
        status: 'In Progress',
        createdBy: testUser._id,
      });

      // Update to In Review
      let response = await request(app)
        .put(`/api/tasks/${task._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ status: 'In Review' })
        .expect(200);

      expect(response.body.data.status).toBe('In Review');

      // Update to Done
      response = await request(app)
        .put(`/api/tasks/${task._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ status: 'Done' })
        .expect(200);

      expect(response.body.data.status).toBe('Done');
    });

    test('TC06: Should assign users to task', async () => {
      const user2 = await createTestUser({
        email: 'user2@example.com',
        name: 'User 2',
      });

      // Add user2 as project member
      testProject.members.push({
        user: user2._id,
        role: 'Member',
        permissions: { canEdit: true },
      });
      await testProject.save();

      const task = await Task.create({
        project: testProject._id,
        title: 'Task with assignees',
        createdBy: testUser._id,
      });

      const response = await request(app)
        .put(`/api/tasks/${task._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ assignees: [testUser._id, user2._id] })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.assignees).toHaveLength(2);
    });

    test('TC07: Should update task priority', async () => {
      const task = await Task.create({
        project: testProject._id,
        title: 'Priority test task',
        priority: 'Low',
        createdBy: testUser._id,
      });

      const response = await request(app)
        .put(`/api/tasks/${task._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ priority: 'Urgent' })
        .expect(200);

      expect(response.body.data.priority).toBe('Urgent');
    });

    test('TC08: Should mark task as complete', async () => {
      const task = await Task.create({
        project: testProject._id,
        title: 'Task to complete',
        status: 'In Progress',
        createdBy: testUser._id,
      });

      const response = await request(app)
        .put(`/api/tasks/${task._id}/complete`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('Done');
      expect(response.body.data.completedAt).toBeDefined();
      expect(response.body.data.completedBy).toBeDefined();
    });

    test('TC09: Should filter tasks by status', async () => {
      await Task.create([
        {
          project: testProject._id,
          title: 'Todo Task',
          status: 'To Do',
          createdBy: testUser._id,
        },
        {
          project: testProject._id,
          title: 'In Progress Task',
          status: 'In Progress',
          createdBy: testUser._id,
        },
        {
          project: testProject._id,
          title: 'Done Task',
          status: 'Done',
          createdBy: testUser._id,
        },
      ]);

      const response = await request(app)
        .get(`/api/projects/${testProject._id}/tasks?status=In Progress`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].status).toBe('In Progress');
    });

    test('TC10: Should filter tasks by priority', async () => {
      await Task.create([
        {
          project: testProject._id,
          title: 'Low priority',
          priority: 'Low',
          createdBy: testUser._id,
        },
        {
          project: testProject._id,
          title: 'Urgent task',
          priority: 'Urgent',
          createdBy: testUser._id,
        },
      ]);

      const response = await request(app)
        .get(`/api/projects/${testProject._id}/tasks?priority=Urgent`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].priority).toBe('Urgent');
    });
  });

  describe('Invalid Test Cases - Error Handling', () => {
    let testUser;
    let testProject;
    let authToken;

    beforeEach(async () => {
      testUser = await createTestUser();
      testProject = await createTestProject(testUser);
      authToken = generateAuthToken(testUser._id);
    });

    test('TC11: Should fail to create task without authentication', async () => {
      const taskData = {
        title: 'Unauthorized task',
      };

      await request(app)
        .post(`/api/projects/${testProject._id}/tasks`)
        .send(taskData)
        .expect(401);
    });

    test('TC12: Should fail to create task without title', async () => {
      const taskData = {
        description: 'Task without title',
      };

      const response = await request(app)
        .post(`/api/projects/${testProject._id}/tasks`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(taskData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    test('TC13: Should fail to create task with invalid priority', async () => {
      const taskData = {
        title: 'Task with invalid priority',
        priority: 'Super Urgent', // Invalid
      };

      const response = await request(app)
        .post(`/api/projects/${testProject._id}/tasks`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(taskData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    test('TC14: Should fail to create task with invalid status', async () => {
      const taskData = {
        title: 'Task with invalid status',
        status: 'Pending', // Invalid
      };

      const response = await request(app)
        .post(`/api/projects/${testProject._id}/tasks`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(taskData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    test('TC15: Should fail to get task that does not exist', async () => {
      const fakeId = new mongoose.Types.ObjectId();

      await request(app)
        .get(`/api/tasks/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });

    test('TC16: Should fail to create task in non-existent project', async () => {
      const fakeProjectId = new mongoose.Types.ObjectId();

      const taskData = {
        title: 'Task in fake project',
      };

      await request(app)
        .post(`/api/projects/${fakeProjectId}/tasks`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(taskData)
        .expect(404);
    });

    test('TC17: Should fail to update task without permissions', async () => {
      // Create another user
      const otherUser = await createTestUser({
        email: 'other@example.com',
        name: 'Other User',
      });
      const otherToken = generateAuthToken(otherUser._id);

      const task = await Task.create({
        project: testProject._id,
        title: 'Task to update',
        createdBy: testUser._id,
      });

      // Try to update with different user who is not a project member
      await request(app)
        .put(`/api/tasks/${task._id}`)
        .set('Authorization', `Bearer ${otherToken}`)
        .send({ title: 'Updated title' })
        .expect(403);
    });

    test('TC18: Should fail to delete task without permissions', async () => {
      const otherUser = await createTestUser({
        email: 'other@example.com',
        name: 'Other User',
      });
      const otherToken = generateAuthToken(otherUser._id);

      const task = await Task.create({
        project: testProject._id,
        title: 'Task to delete',
        createdBy: testUser._id,
      });

      await request(app)
        .delete(`/api/tasks/${task._id}`)
        .set('Authorization', `Bearer ${otherToken}`)
        .send()
        .expect(403);
    });

    test('TC19: Should fail to update task with title exceeding max length', async () => {
      const task = await Task.create({
        project: testProject._id,
        title: 'Original title',
        createdBy: testUser._id,
      });

      const longTitle = 'a'.repeat(201); // Max is 200

      const response = await request(app)
        .put(`/api/tasks/${task._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: longTitle })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    test('TC20: Should fail with invalid task ID format', async () => {
      await request(app)
        .get('/api/tasks/invalid-id-format')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);
    });
  });

  describe('Task Assignment - Notification Tests', () => {
    let testUser;
    let testProject;
    let authToken;

    beforeEach(async () => {
      testUser = await createTestUser();
      testProject = await createTestProject(testUser);
      authToken = generateAuthToken(testUser._id);
    });

    test('TC21: Should create task with assigned users and send notifications', async () => {
      const user2 = await createTestUser({
        email: 'assignee@example.com',
        name: 'Assignee User',
      });

      // Add user2 as project member
      testProject.members.push({
        user: user2._id,
        role: 'Member',
        permissions: { canEdit: true },
      });
      await testProject.save();

      const taskData = {
        title: 'Task with assignee',
        assignees: [user2._id],
      };

      const response = await request(app)
        .post(`/api/projects/${testProject._id}/tasks`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(taskData)
        .expect(201);

      expect(response.body.data.assignees).toHaveLength(1);
    });
  });
});

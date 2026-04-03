const mongoose = require('mongoose');
const Task = require('../models/Task');
const {
  setupTestDB,
  teardownTestDB,
  clearDatabase,
  createTestUser,
  createTestProject,
} = require('./setup');

describe('Task Model Unit Tests', () => {
  beforeAll(async () => {
    await setupTestDB();
  });

  afterAll(async () => {
    await teardownTestDB();
  });

  beforeEach(async () => {
    await clearDatabase();
  });

  describe('Valid Test Cases - Model Validation', () => {
    let testUser;
    let testProject;

    beforeEach(async () => {
      testUser = await createTestUser();
      testProject = await createTestProject(testUser);
    });

    test('TC01: Should create task with valid required fields', async () => {
      const taskData = {
        project: testProject._id,
        title: 'Test Task',
        createdBy: testUser._id,
      };

      const task = await Task.create(taskData);

      expect(task).toBeDefined();
      expect(task.title).toBe('Test Task');
      expect(task.project.toString()).toBe(testProject._id.toString());
      expect(task.createdBy.toString()).toBe(testUser._id.toString());
    });

    test('TC02: Should set default values correctly', async () => {
      const task = await Task.create({
        project: testProject._id,
        title: 'Task with defaults',
        createdBy: testUser._id,
      });

      expect(task.status).toBe('To Do');
      expect(task.priority).toBe('Medium');
      expect(task.isDeleted).toBe(false);
      expect(task.actualHours).toBe(0);
      expect(task.position).toBe(0);
    });

    test('TC03: Should accept all valid status values', async () => {
      const statuses = ['To Do', 'In Progress', 'In Review', 'Done'];

      for (const status of statuses) {
        const task = await Task.create({
          project: testProject._id,
          title: `Task with ${status}`,
          status,
          createdBy: testUser._id,
        });

        expect(task.status).toBe(status);
      }
    });

    test('TC04: Should accept all valid priority values', async () => {
      const priorities = ['Low', 'Medium', 'High', 'Urgent'];

      for (const priority of priorities) {
        const task = await Task.create({
          project: testProject._id,
          title: `Task with ${priority} priority`,
          priority,
          createdBy: testUser._id,
        });

        expect(task.priority).toBe(priority);
      }
    });

    test('TC05: Should accept assignees array', async () => {
      const user2 = await createTestUser({ email: 'user2@example.com' });

      const task = await Task.create({
        project: testProject._id,
        title: 'Task with assignees',
        createdBy: testUser._id,
        assignees: [testUser._id, user2._id],
      });

      expect(task.assignees).toHaveLength(2);
      expect(task.assignees[0].toString()).toBe(testUser._id.toString());
      expect(task.assignees[1].toString()).toBe(user2._id.toString());
    });

    test('TC06: Should accept optional fields', async () => {
      const dueDate = new Date('2026-12-31');

      const task = await Task.create({
        project: testProject._id,
        title: 'Task with optional fields',
        createdBy: testUser._id,
        description: 'Detailed description',
        dueDate,
        estimatedHours: 8,
        tags: ['frontend', 'urgent'],
      });

      expect(task.description).toBe('Detailed description');
      expect(task.dueDate).toEqual(dueDate);
      expect(task.estimatedHours).toBe(8);
      expect(task.tags).toEqual(['frontend', 'urgent']);
    });

    test('TC07: Should create task with parent task (subtask)', async () => {
      const parentTask = await Task.create({
        project: testProject._id,
        title: 'Parent Task',
        createdBy: testUser._id,
      });

      const subtask = await Task.create({
        project: testProject._id,
        title: 'Subtask',
        createdBy: testUser._id,
        parentTask: parentTask._id,
      });

      expect(subtask.parentTask.toString()).toBe(parentTask._id.toString());
    });

    test('TC08: Should add dependencies to task', async () => {
      const task1 = await Task.create({
        project: testProject._id,
        title: 'Task 1',
        createdBy: testUser._id,
      });

      const task2 = await Task.create({
        project: testProject._id,
        title: 'Task 2',
        createdBy: testUser._id,
      });

      task1.dependencies.push({
        task: task2._id,
        dependencyType: 'blocks',
      });
      await task1.save();

      expect(task1.dependencies).toHaveLength(1);
      expect(task1.dependencies[0].task.toString()).toBe(task2._id.toString());
      expect(task1.dependencies[0].dependencyType).toBe('blocks');
    });
  });

  describe('Invalid Test Cases - Validation Errors', () => {
    let testUser;
    let testProject;

    beforeEach(async () => {
      testUser = await createTestUser();
      testProject = await createTestProject(testUser);
    });

    test('TC09: Should fail when title is missing', async () => {
      const taskData = {
        project: testProject._id,
        createdBy: testUser._id,
        // title is missing
      };

      await expect(Task.create(taskData)).rejects.toThrow();
    });

    test('TC10: Should fail when title exceeds max length', async () => {
      const longTitle = 'a'.repeat(201); // Max is 200

      const taskData = {
        project: testProject._id,
        title: longTitle,
        createdBy: testUser._id,
      };

      await expect(Task.create(taskData)).rejects.toThrow();
    });

    test('TC11: Should fail when project is missing', async () => {
      const taskData = {
        title: 'Task without project',
        createdBy: testUser._id,
        // project is missing
      };

      await expect(Task.create(taskData)).rejects.toThrow();
    });

    test('TC12: Should fail when createdBy is missing', async () => {
      const taskData = {
        project: testProject._id,
        title: 'Task without creator',
        // createdBy is missing
      };

      await expect(Task.create(taskData)).rejects.toThrow();
    });

    test('TC13: Should fail with invalid status value', async () => {
      const taskData = {
        project: testProject._id,
        title: 'Task with invalid status',
        status: 'Invalid Status',
        createdBy: testUser._id,
      };

      await expect(Task.create(taskData)).rejects.toThrow();
    });

    test('TC14: Should fail with invalid priority value', async () => {
      const taskData = {
        project: testProject._id,
        title: 'Task with invalid priority',
        priority: 'Invalid Priority',
        createdBy: testUser._id,
      };

      await expect(Task.create(taskData)).rejects.toThrow();
    });

    test('TC15: Should fail when estimatedHours is negative', async () => {
      const taskData = {
        project: testProject._id,
        title: 'Task with negative hours',
        estimatedHours: -5,
        createdBy: testUser._id,
      };

      await expect(Task.create(taskData)).rejects.toThrow();
    });

    test('TC16: Should fail when actualHours is negative', async () => {
      const taskData = {
        project: testProject._id,
        title: 'Task with negative actual hours',
        actualHours: -3,
        createdBy: testUser._id,
      };

      await expect(Task.create(taskData)).rejects.toThrow();
    });
  });

  describe('Task Methods - Circular Dependency Detection', () => {
    let testUser;
    let testProject;

    beforeEach(async () => {
      testUser = await createTestUser();
      testProject = await createTestProject(testUser);
    });

    test('TC17: Should detect circular dependency (direct)', async () => {
      const task1 = await Task.create({
        project: testProject._id,
        title: 'Task 1',
        createdBy: testUser._id,
      });

      const task2 = await Task.create({
        project: testProject._id,
        title: 'Task 2',
        createdBy: testUser._id,
      });

      // Add task2 as dependency of task1
      await task1.addDependency(task2._id);

      // Try to add task1 as dependency of task2 (circular!)
      await expect(task2.addDependency(task1._id)).rejects.toThrow('Circular dependency detected');
    });

    test('TC18: Should prevent adding duplicate dependency', async () => {
      const task1 = await Task.create({
        project: testProject._id,
        title: 'Task 1',
        createdBy: testUser._id,
      });

      const task2 = await Task.create({
        project: testProject._id,
        title: 'Task 2',
        createdBy: testUser._id,
      });

      await task1.addDependency(task2._id);

      // Try to add the same dependency again
      await expect(task1.addDependency(task2._id)).rejects.toThrow('Dependency already exists');
    });
  });
});

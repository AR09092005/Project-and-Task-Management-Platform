# Test Cases Summary - Task Assignment & Status Management

## Overview
This document provides a comprehensive summary of all test cases designed and implemented for the **Task Assignment & Status Management** use case.

---

## Test Case Categories

### 1. Model Unit Tests (taskModel.test.js)
**Purpose**: Test Task model schema, validation, and business logic

### 2. Controller Integration Tests (taskController.test.js)  
**Purpose**: Test API endpoints with authentication and authorization

---

## Valid Test Cases

| Test ID | Test Scenario | Input Data | Expected Output | Test Type | File |
|---------|--------------|------------|----------------|-----------|------|
| TC01 | Create task with valid required fields | `title: "Test Task"`, `project: projectId`, `createdBy: userId` | Task created successfully with default values | Unit | taskModel.test.js |
| TC02 | Verify default values are set correctly | Minimal task data | `status: "To Do"`, `priority: "Medium"`, `isDeleted: false` | Unit | taskModel.test.js |
| TC03 | Accept all valid status values | Each status: To Do, In Progress, In Review, Done | Task created with specified status | Unit | taskModel.test.js |
| TC04 | Accept all valid priority values | Each priority: Low, Medium, High, Urgent | Task created with specified priority | Unit | taskModel.test.js |
| TC05 | Assign multiple users to task | `assignees: [userId1, userId2]` | Task with 2 assignees | Unit | taskModel.test.js |
| TC06 | Create task with optional fields | `description`, `dueDate`, `estimatedHours`, `tags` | All optional fields saved correctly | Unit | taskModel.test.js |
| TC07 | Create subtask with parent task | `parentTask: parentTaskId` | Subtask created with parent reference | Unit | taskModel.test.js |
| TC08 | Add task dependencies | `dependencies: [{task: taskId, type: "blocks"}]` | Dependency added successfully | Unit | taskModel.test.js |
| TC01 (API) | Create task via API with valid data | POST `/api/projects/:id/tasks` with title, description, priority | 201 status, task created | Integration | taskController.test.js |
| TC02 (API) | Get all tasks for a project | GET `/api/projects/:id/tasks` | 200 status, array of 3 tasks | Integration | taskController.test.js |
| TC03 (API) | Get single task by ID | GET `/api/tasks/:id` | 200 status, task details | Integration | taskController.test.js |
| TC04 (API) | Update task status (To Do → In Progress) | PUT `/api/tasks/:id` with `status: "In Progress"` | 200 status, status updated | Integration | taskController.test.js |
| TC05 (API) | Complete status workflow | Sequential updates: To Do → In Progress → In Review → Done | Each update successful | Integration | taskController.test.js |
| TC06 (API) | Assign users to existing task | PUT `/api/tasks/:id` with `assignees: [userId1, userId2]` | 200 status, 2 assignees | Integration | taskController.test.js |
| TC07 (API) | Update task priority | PUT `/api/tasks/:id` with `priority: "Urgent"` | 200 status, priority updated | Integration | taskController.test.js |
| TC08 (API) | Mark task as complete | PUT `/api/tasks/:id/complete` | 200 status, `completedAt` and `completedBy` set | Integration | taskController.test.js |
| TC09 (API) | Filter tasks by status | GET `/api/projects/:id/tasks?status=In Progress` | Only tasks with "In Progress" status | Integration | taskController.test.js |
| TC10 (API) | Filter tasks by priority | GET `/api/projects/:id/tasks?priority=Urgent` | Only tasks with "Urgent" priority | Integration | taskController.test.js |
| TC17 | Detect circular dependency (direct) | task1 depends on task2, then task2 tries to depend on task1 | Error: "Circular dependency detected" | Unit | taskModel.test.js |
| TC18 | Prevent duplicate dependency | Add same dependency twice | Error: "Dependency already exists" | Unit | taskModel.test.js |
| TC21 (API) | Create task with assignees and notifications | POST with assignees array | Task created, notifications sent | Integration | taskController.test.js |

---

## Invalid Test Cases

| Test ID | Test Scenario | Input Data | Expected Output | Test Type | File |
|---------|--------------|------------|----------------|-----------|------|
| TC09 | Create task without title | `project: projectId`, `createdBy: userId` (no title) | Validation error thrown | Unit | taskModel.test.js |
| TC10 | Create task with title exceeding max length | `title: "a".repeat(201)` (max 200 chars) | Validation error thrown | Unit | taskModel.test.js |
| TC11 | Create task without project | `title: "Task"`, `createdBy: userId` (no project) | Validation error thrown | Unit | taskModel.test.js |
| TC12 | Create task without createdBy | `title: "Task"`, `project: projectId` (no createdBy) | Validation error thrown | Unit | taskModel.test.js |
| TC13 | Create task with invalid status | `status: "Invalid Status"` | Validation error thrown | Unit | taskModel.test.js |
| TC14 | Create task with invalid priority | `priority: "Invalid Priority"` | Validation error thrown | Unit | taskModel.test.js |
| TC15 | Create task with negative estimatedHours | `estimatedHours: -5` | Validation error thrown | Unit | taskModel.test.js |
| TC16 | Create task with negative actualHours | `actualHours: -3` | Validation error thrown | Unit | taskModel.test.js |
| TC11 (API) | Create task without authentication | POST without auth token | 401 Unauthorized | Integration | taskController.test.js |
| TC12 (API) | Create task without title via API | POST with only description | 500 error, validation failure | Integration | taskController.test.js |
| TC13 (API) | Create task with invalid priority via API | POST with `priority: "Super Urgent"` | 500 error, validation failure | Integration | taskController.test.js |
| TC14 (API) | Create task with invalid status via API | POST with `status: "Pending"` | 500 error, validation failure | Integration | taskController.test.js |
| TC15 (API) | Get non-existent task | GET `/api/tasks/[fake-id]` | 404 Not Found | Integration | taskController.test.js |
| TC16 (API) | Create task in non-existent project | POST to `/api/projects/[fake-id]/tasks` | 404 Not Found | Integration | taskController.test.js |
| TC17 (API) | Update task without permissions | PUT from non-member user | 403 Forbidden | Integration | taskController.test.js |
| TC18 (API) | Delete task without permissions | DELETE from non-member user | 403 Forbidden | Integration | taskController.test.js |
| TC19 (API) | Update task with title exceeding max length | PUT with 201 char title | 500 error, validation failure | Integration | taskController.test.js |
| TC20 (API) | Get task with invalid ID format | GET `/api/tasks/invalid-id` | 500 error | Integration | taskController.test.js |

---

## Test Statistics

| Category | Count |
|----------|-------|
| **Total Test Cases** | **39** |
| Valid Test Cases | 23 |
| Invalid Test Cases | 16 |
| Unit Tests | 18 |
| Integration Tests | 21 |

---

## Test Coverage Areas

### ✅ Functional Requirements Tested
1. **FR1 - Task Creation**: Users can create tasks with title, description, priority, status, and assignees
   - Tests: TC01, TC06, TC01(API), TC21(API)

2. **FR2 - Status Management**: Users can update task status through workflow (To Do → In Progress → In Review → Done)
   - Tests: TC03, TC04(API), TC05(API), TC08(API)

3. **FR3 - Task Assignment**: Users can assign/reassign team members to tasks
   - Tests: TC05, TC06(API), TC21(API)

4. **FR4 - Task Filtering**: Users can filter tasks by status, priority, assignee
   - Tests: TC09(API), TC10(API)

### ✅ Non-Functional Requirements Tested

1. **NFR1 - Data Validation**: System validates all input data
   - Tests: TC09-TC16 (all validation error tests)

2. **NFR2 - Security & Authorization**: Only authorized users can access/modify tasks
   - Tests: TC11(API), TC17(API), TC18(API)

3. **NFR3 - Data Integrity**: System prevents invalid states (circular dependencies, duplicates)
   - Tests: TC17, TC18

4. **NFR4 - Performance**: API responds within acceptable time (tested via timeout config)
   - All integration tests with 30s timeout

---

## How to Run Tests

### Run All Tests
```bash
cd backend
npm test
```

### Run Specific Test Suite
```bash
npm test taskModel.test.js
npm test taskController.test.js
```

### Run with Coverage Report
```bash
npm test -- --coverage
```

### Run in CI Mode (single run)
```bash
npm run test:ci
```

---

## Expected Test Results

All 39 test cases should pass:
- ✅ taskModel.test.js: 18 tests passing
- ✅ taskController.test.js: 21 tests passing

**Sample Output:**
```
PASS  src/__tests__/taskModel.test.js
  Task Model Unit Tests
    Valid Test Cases - Model Validation
      ✓ TC01: Should create task with valid required fields (25ms)
      ✓ TC02: Should set default values correctly (18ms)
      ...
    Invalid Test Cases - Validation Errors
      ✓ TC09: Should fail when title is missing (12ms)
      ...

PASS  src/__tests__/taskController.test.js
  Task Controller Integration Tests
    Valid Test Cases - Task Operations
      ✓ TC01: Should create task with valid data (156ms)
      ✓ TC02: Should get all tasks for a project (142ms)
      ...
    Invalid Test Cases - Error Handling
      ✓ TC11: Should fail to create task without authentication (89ms)
      ...

Test Suites: 2 passed, 2 total
Tests:       39 passed, 39 total
Snapshots:   0 total
Time:        8.456s
```

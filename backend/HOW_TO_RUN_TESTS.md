# How to Run Tests - Task Assignment & Status Management

## Quick Start

```bash
cd backend
npm test -- --no-watch --runInBand
```

## Test Commands

### Run All Tests (Watch Mode)
```bash
npm test
```
*Runs tests in watch mode - automatically re-runs when files change*

### Run All Tests (Single Run)
```bash
npm test -- --no-watch --runInBand
```
*Runs all tests once and exits - perfect for CI/CD*

### Run Specific Test File
```bash
npm test taskModel.test.js --no-watch
npm test taskController.test.js --no-watch
```

### Run with Coverage Report
```bash
npm test -- --coverage --no-watch
```
*Generates code coverage report showing which lines are tested*

### Run in CI Mode
```bash
npm run test:ci
```

## Test Results

### Expected Output
```
PASS  src/__tests__/taskModel.test.js
  Task Model Unit Tests
    Valid Test Cases - Model Validation
      ✓ TC01: Should create task with valid required fields
      ✓ TC02: Should set default values correctly
      ... (18 tests total)

PASS  src/__tests__/taskController.test.js
  Task Controller Integration Tests
    Valid Test Cases - Task Operations
      ✓ TC01: Should create task with valid data
      ✓ TC02: Should get all tasks for a project
      ... (21 tests total)

Test Suites: 2 passed, 2 total
Tests:       39 passed, 39 total
Snapshots:   0 total
Time:        3.224 s
```

## Test Breakdown

| Test File | Type | Test Count | Purpose |
|-----------|------|------------|---------|
| `taskModel.test.js` | Unit Tests | 18 | Test Task model schema, validation, and methods |
| `taskController.test.js` | Integration Tests | 21 | Test API endpoints with authentication |
| **Total** | - | **39** | Complete test coverage for Task Management |

## Test Categories

### Valid Test Cases (23 tests)
- Task creation with various data
- Status updates (To Do → In Progress → In Review → Done)
- Task assignment
- Filtering and querying
- Dependencies and subtasks

### Invalid Test Cases (16 tests)
- Missing required fields
- Invalid enum values
- Permission/authorization errors
- Validation errors
- Circular dependencies

## Troubleshooting

### Tests fail with "Cannot find module"
```bash
npm install
```

### Tests timeout
The timeout is set to 30 seconds. If tests still timeout, check MongoDB memory server installation:
```bash
npm install --save-dev mongodb-memory-server
```

### Port already in use
Tests use an in-memory database and don't start the actual server, so port conflicts shouldn't occur. If they do, make sure no other Jest process is running:
```bash
pkill -f jest
```

## Files Created

```
backend/
├── src/__tests__/
│   ├── setup.js                    # Test utilities and helpers
│   ├── jest.setup.js              # Jest configuration
│   ├── taskModel.test.js          # Task model unit tests (18 tests)
│   └── taskController.test.js     # Task API integration tests (21 tests)
├── jest.config.js                  # Jest configuration
└── TEST_CASES_SUMMARY.md          # Detailed test case documentation
```

## For Your Lab Report

1. **Test Case Documentation**: See `TEST_CASES_SUMMARY.md` for detailed test case tables
2. **Source Code**: Test files are in `src/__tests__/`
3. **Test Results**: Run tests and screenshot the output
4. **Coverage Report**: Run with `--coverage` flag to show code coverage

## Notes

- All tests use an in-memory MongoDB database (no need to start MongoDB)
- Tests run in isolation - each test has its own clean database
- Authentication is tested using JWT tokens
- Both valid and invalid scenarios are covered
- Tests verify functional and non-functional requirements

const { body, param, query, validationResult } = require('express-validator');

// Middleware to check validation results
exports.validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map((err) => ({
        field: err.param,
        message: err.msg,
      })),
    });
  }
  next();
};

// User validation rules
exports.registerValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ max: 100 })
    .withMessage('Name cannot exceed 100 characters'),
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least 1 uppercase letter, 1 lowercase letter, and 1 number'),
];

exports.loginValidation = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
];

exports.emailValidation = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
];

exports.passwordValidation = [
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least 1 uppercase letter, 1 lowercase letter, and 1 number'),
];

// Project validation rules
exports.createProjectValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Project name is required')
    .isLength({ max: 200 })
    .withMessage('Project name cannot exceed 200 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 5000 })
    .withMessage('Description cannot exceed 5000 characters'),
  body('workspace')
    .optional()
    .isIn(['Personal', 'Academic', 'Work', 'Clubs'])
    .withMessage('Invalid workspace type'),
  body('startDate').optional().isISO8601().withMessage('Invalid start date format'),
  body('endDate').optional().isISO8601().withMessage('Invalid end date format'),
  body('colorTag')
    .optional()
    .matches(/^#[0-9A-F]{6}$/i)
    .withMessage('Color tag must be a valid hex color'),
];

exports.updateProjectValidation = [
  body('name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Project name cannot be empty')
    .isLength({ max: 200 })
    .withMessage('Project name cannot exceed 200 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 5000 })
    .withMessage('Description cannot exceed 5000 characters'),
  body('workspace')
    .optional()
    .isIn(['Personal', 'Academic', 'Work', 'Clubs'])
    .withMessage('Invalid workspace type'),
  body('status')
    .optional()
    .isIn(['Planning', 'Active', 'On Hold', 'Completed', 'Archived'])
    .withMessage('Invalid status'),
  body('startDate').optional().isISO8601().withMessage('Invalid start date format'),
  body('endDate').optional().isISO8601().withMessage('Invalid end date format'),
  body('colorTag')
    .optional()
    .matches(/^#[0-9A-F]{6}$/i)
    .withMessage('Color tag must be a valid hex color'),
];

// Task validation rules
exports.createTaskValidation = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Task title is required')
    .isLength({ max: 200 })
    .withMessage('Title cannot exceed 200 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 10000 })
    .withMessage('Description cannot exceed 10000 characters'),
  body('priority')
    .optional()
    .isIn(['Low', 'Medium', 'High', 'Urgent'])
    .withMessage('Invalid priority level'),
  body('status')
    .optional()
    .isIn(['To Do', 'In Progress', 'In Review', 'Done'])
    .withMessage('Invalid status'),
  body('dueDate').optional().isISO8601().withMessage('Invalid due date format'),
  body('estimatedHours')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Estimated hours must be a positive number'),
  body('assignees').optional().isArray().withMessage('Assignees must be an array'),
  body('tags').optional().isArray().withMessage('Tags must be an array'),
];

exports.updateTaskValidation = [
  body('title')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Task title cannot be empty')
    .isLength({ max: 200 })
    .withMessage('Title cannot exceed 200 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 10000 })
    .withMessage('Description cannot exceed 10000 characters'),
  body('priority')
    .optional()
    .isIn(['Low', 'Medium', 'High', 'Urgent'])
    .withMessage('Invalid priority level'),
  body('status')
    .optional()
    .isIn(['To Do', 'In Progress', 'In Review', 'Done'])
    .withMessage('Invalid status'),
  body('dueDate').optional().isISO8601().withMessage('Invalid due date format'),
  body('estimatedHours')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Estimated hours must be a positive number'),
  body('assignees').optional().isArray().withMessage('Assignees must be an array'),
  body('tags').optional().isArray().withMessage('Tags must be an array'),
];

// Comment validation rules
exports.createCommentValidation = [
  body('content')
    .trim()
    .notEmpty()
    .withMessage('Comment content is required')
    .isLength({ max: 5000 })
    .withMessage('Comment cannot exceed 5000 characters'),
];

// Invite validation rules
exports.createInviteValidation = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('role')
    .optional()
    .isIn(['Admin', 'Member', 'Viewer'])
    .withMessage('Invalid role'),
];

// ID parameter validation
exports.idValidation = [param('id').isMongoId().withMessage('Invalid ID format')];

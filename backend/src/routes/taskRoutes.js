const express = require('express');
const router = express.Router({ mergeParams: true });
const {
  getTasks,
  getTask,
  createTask,
  updateTask,
  deleteTask,
  addDependency,
  removeDependency,
  completeTask,
  updateTaskPosition,
} = require('../controllers/taskController');
const { protect } = require('../middleware/auth');
const {
  createTaskValidation,
  updateTaskValidation,
  idValidation,
  validate,
} = require('../middleware/validation');

// Task routes
router.route('/')
  .get(protect, getTasks)
  .post(protect, createTaskValidation, validate, createTask);

router.route('/:id')
  .get(protect, idValidation, validate, getTask)
  .put(protect, idValidation, updateTaskValidation, validate, updateTask)
  .delete(protect, idValidation, validate, deleteTask);

router.put('/:id/complete', protect, idValidation, validate, completeTask);
router.put('/:id/position', protect, idValidation, validate, updateTaskPosition);

// Task dependencies
router.post('/:id/dependencies', protect, idValidation, validate, addDependency);
router.delete('/:id/dependencies/:depId', protect, idValidation, validate, removeDependency);

module.exports = router;

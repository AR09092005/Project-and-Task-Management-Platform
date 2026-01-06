const express = require('express');
const router = express.Router();
const {
  getProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
  archiveProject,
  getProjectDashboard,
  addMember,
  removeMember,
  updateMemberRole,
} = require('../controllers/projectController');
const { protect } = require('../middleware/auth');
const {
  createProjectValidation,
  updateProjectValidation,
  idValidation,
  validate,
} = require('../middleware/validation');

// Project routes
router.route('/')
  .get(protect, getProjects)
  .post(protect, createProjectValidation, validate, createProject);

router.route('/:id')
  .get(protect, idValidation, validate, getProject)
  .put(protect, idValidation, updateProjectValidation, validate, updateProject)
  .delete(protect, idValidation, validate, deleteProject);

router.put('/:id/archive', protect, idValidation, validate, archiveProject);
router.get('/:id/dashboard', protect, idValidation, validate, getProjectDashboard);

// Member management
router.post('/:id/members', protect, idValidation, validate, addMember);
router.delete('/:id/members/:userId', protect, idValidation, validate, removeMember);
router.put('/:id/members/:userId', protect, idValidation, validate, updateMemberRole);

module.exports = router;

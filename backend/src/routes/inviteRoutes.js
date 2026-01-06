const express = require('express');
const router = express.Router();
const {
  createInvite,
  getInvite,
  acceptInvite,
  declineInvite,
  getProjectInvites,
} = require('../controllers/inviteController');
const { protect, optionalAuth } = require('../middleware/auth');
const {
  createInviteValidation,
  validate,
} = require('../middleware/validation');

// Public routes (with optional auth for logged-in users)
router.get('/:token', optionalAuth, getInvite);

// Protected routes
router.post('/:token/accept', protect, acceptInvite);
router.post('/:token/decline', protect, declineInvite);

module.exports = router;

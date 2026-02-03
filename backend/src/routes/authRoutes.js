const express = require('express');
const passport = require('passport');
const router = express.Router();
const {
  register,
  login,
  logout,
  getMe,
  verifyEmail,
  forgotPassword,
  resetPassword,
  updateProfile,
  uploadProfilePicture,
  updatePassword,
  updateNotificationPreferences,
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { upload, handleMulterError } = require('../middleware/upload');
const {
  registerValidation,
  loginValidation,
  emailValidation,
  passwordValidation,
  validate,
} = require('../middleware/validation');
// Rate limiters removed per user request
// const { authLimiter, passwordResetLimiter } = require('../middleware/rateLimiter');

// Public routes
router.post('/register', registerValidation, validate, register);
router.post('/login', loginValidation, validate, login);
router.get('/verify-email/:token', verifyEmail);
router.post('/forgot-password', emailValidation, validate, forgotPassword);
router.post('/reset-password/:token', passwordValidation, validate, resetPassword);

// OAuth routes - Google
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get('/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: `${process.env.CLIENT_URL}/login?error=auth_failed` }),
  (req, res) => {
    const { sendTokenResponse } = require('../utils/jwt');
    // Set cookie and redirect to dashboard
    sendTokenResponse(req.user, 200, res, `${process.env.CLIENT_URL}/dashboard`);
  }
);

// OAuth routes - GitHub
router.get('/github', passport.authenticate('github', { scope: ['user:email'] }));
router.get('/github/callback',
  passport.authenticate('github', { session: false, failureRedirect: `${process.env.CLIENT_URL}/login?error=auth_failed` }),
  (req, res) => {
    const { sendTokenResponse } = require('../utils/jwt');
    // Set cookie and redirect to dashboard
    sendTokenResponse(req.user, 200, res, `${process.env.CLIENT_URL}/dashboard`);
  }
);

// OAuth routes - Microsoft
router.get('/microsoft', passport.authenticate('microsoft', { scope: ['user.read'] }));
router.get('/microsoft/callback',
  passport.authenticate('microsoft', { session: false, failureRedirect: `${process.env.CLIENT_URL}/login?error=auth_failed` }),
  (req, res) => {
    const { sendTokenResponse } = require('../utils/jwt');
    // Set cookie and redirect to dashboard
    sendTokenResponse(req.user, 200, res, `${process.env.CLIENT_URL}/dashboard`);
  }
);

// Protected routes
router.post('/logout', protect, logout);
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.post('/profile/picture', protect, upload.single('profilePicture'), handleMulterError, uploadProfilePicture);
router.put('/update-password', protect, passwordValidation, validate, updatePassword);
router.put('/notification-preferences', protect, updateNotificationPreferences);

module.exports = router;

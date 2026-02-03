const crypto = require('crypto');
const User = require('../models/User');
const { ErrorResponse } = require('../middleware/errorHandler');
const { generateToken, sendTokenResponse, clearTokenCookie } = require('../utils/jwt');
const { sendEmail, emailTemplates } = require('../utils/email');

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return next(new ErrorResponse('User with this email already exists', 400));
    }

    // Generate email verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');

    // Create user
    const user = await User.create({
      name,
      email,
      passwordHash: password, // Will be hashed by pre-save middleware
      emailVerificationToken: verificationToken,
      emailVerificationExpires: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
    });

    // Create verification URL
    const verificationUrl = `${process.env.CLIENT_URL}/verify-email/${verificationToken}`;

    // Send verification email
    try {
      await sendEmail({
        email: user.email,
        subject: 'Email Verification - Task Management Platform',
        html: emailTemplates.verification(user.name, verificationUrl),
      });
    } catch (error) {
      console.error('Email sending failed:', error);
      // Continue with registration even if email fails
    }

    sendTokenResponse(user, 201, res);
  } catch (error) {
    next(error);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Find user and include password
    const user = await User.findOne({ email }).select('+passwordHash');

    if (!user) {
      return next(new ErrorResponse('Invalid credentials', 401));
    }

    // Check if user is active
    if (!user.isActive || user.isDeleted) {
      return next(new ErrorResponse('Account is deactivated', 401));
    }

    // Check if user has a password (OAuth users might not)
    if (!user.passwordHash) {
      return next(
        new ErrorResponse('Please login using your social account provider', 401)
      );
    }

    // Check password
    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      return next(new ErrorResponse('Invalid credentials', 401));
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    sendTokenResponse(user, 200, res);
  } catch (error) {
    next(error);
  }
};

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
exports.logout = async (req, res, next) => {
  try {
    clearTokenCookie(res);
    res.status(200).json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return next(new ErrorResponse('User not found', 404));
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify email
// @route   GET /api/auth/verify-email/:token
// @access  Public
exports.verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.params;

    const user = await User.findOne({
      emailVerificationToken: token,
      emailVerificationExpires: { $gt: Date.now() },
    });

    if (!user) {
      return next(new ErrorResponse('Invalid or expired verification token', 400));
    }

    // Mark email as verified
    user.emailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Email verified successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Forgot password
// @route   POST /api/auth/forgot-password
// @access  Public
exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      // Don't reveal that user doesn't exist
      return res.status(200).json({
        success: true,
        message: 'If an account with that email exists, a password reset link has been sent',
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');

    user.passwordResetToken = resetToken;
    user.passwordResetExpires = Date.now() + 60 * 60 * 1000; // 1 hour
    await user.save();

    // Create reset URL
    const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;

    // Send email
    try {
      await sendEmail({
        email: user.email,
        subject: 'Password Reset Request - Task Management Platform',
        html: emailTemplates.passwordReset(user.name, resetUrl),
      });
    } catch (error) {
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save();
      return next(new ErrorResponse('Email could not be sent', 500));
    }

    res.status(200).json({
      success: true,
      message: 'If an account with that email exists, a password reset link has been sent',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Reset password
// @route   POST /api/auth/reset-password/:token
// @access  Public
exports.resetPassword = async (req, res, next) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    const user = await User.findOne({
      passwordResetToken: token,
      passwordResetExpires: { $gt: Date.now() },
    }).select('+passwordHash');

    if (!user) {
      return next(new ErrorResponse('Invalid or expired reset token', 400));
    }

    // Set new password
    user.passwordHash = password; // Will be hashed by pre-save middleware
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    sendTokenResponse(user, 200, res);
  } catch (error) {
    next(error);
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
exports.updateProfile = async (req, res, next) => {
  try {
    const fieldsToUpdate = {
      name: req.body.name,
      timezone: req.body.timezone,
      profilePicture: req.body.profilePicture,
      bio: req.body.bio,
      phone: req.body.phone,
      location: req.body.location,
      jobTitle: req.body.jobTitle,
      company: req.body.company,
    };

    // Handle nested objects
    if (req.body.socialLinks) {
      fieldsToUpdate.socialLinks = req.body.socialLinks;
    }

    if (req.body.privacySettings) {
      fieldsToUpdate.privacySettings = req.body.privacySettings;
    }

    // Remove undefined fields
    Object.keys(fieldsToUpdate).forEach(
      (key) => fieldsToUpdate[key] === undefined && delete fieldsToUpdate[key]
    );

    const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
      new: true,
      runValidators: true,
    });

    if (!user) {
      return next(new ErrorResponse('User not found', 404));
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Upload profile picture
// @route   POST /api/auth/profile/picture
// @access  Private
exports.uploadProfilePicture = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload an image file',
      });
    }

    // Get file URL (relative path)
    const profilePictureUrl = `/uploads/${req.file.filename}`;

    // Update user profile picture
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { profilePicture: profilePictureUrl },
      { new: true, runValidators: true }
    );

    if (!user) {
      return next(new ErrorResponse('User not found', 404));
    }

    res.status(200).json({
      success: true,
      data: {
        profilePicture: profilePictureUrl,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update password
// @route   PUT /api/auth/update-password
// @access  Private
exports.updatePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user.id).select('+passwordHash');

    if (!user) {
      return next(new ErrorResponse('User not found', 404));
    }

    if (!user.passwordHash) {
      return next(new ErrorResponse('Cannot update password for OAuth accounts', 400));
    }

    // Check current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return next(new ErrorResponse('Current password is incorrect', 401));
    }

    // Update password
    user.passwordHash = newPassword; // Will be hashed by pre-save middleware
    await user.save();

    sendTokenResponse(user, 200, res);
  } catch (error) {
    next(error);
  }
};

// @desc    Update notification preferences
// @route   PUT /api/auth/notification-preferences
// @access  Private
exports.updateNotificationPreferences = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return next(new ErrorResponse('User not found', 404));
    }

    if (req.body.email) {
      user.notificationPreferences.email = {
        ...user.notificationPreferences.email,
        ...req.body.email,
      };
    }

    if (req.body.inApp) {
      user.notificationPreferences.inApp = {
        ...user.notificationPreferences.inApp,
        ...req.body.inApp,
      };
    }

    if (req.body.push) {
      user.notificationPreferences.push = {
        ...user.notificationPreferences.push,
        ...req.body.push,
      };
    }

    await user.save();

    res.status(200).json({
      success: true,
      data: user.notificationPreferences,
    });
  } catch (error) {
    next(error);
  }
};

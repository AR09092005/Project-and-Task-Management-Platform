const jwt = require('jsonwebtoken');

// Generate JWT token
exports.generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '24h',
  });
};

// Send token response
exports.sendTokenResponse = (user, statusCode, res, redirectUrl = null) => {
  // Create token
  const token = this.generateToken(user._id);

  const cookieExpire = parseInt(process.env.JWT_COOKIE_EXPIRE) || 1;
  const options = {
    expires: new Date(Date.now() + cookieExpire * 24 * 60 * 60 * 1000),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', // 'none' for cross-origin in production
  };

  // Remove sensitive data
  const userObj = user.toObject();
  delete userObj.passwordHash;
  delete userObj.emailVerificationToken;
  delete userObj.passwordResetToken;
  delete userObj.loginAttempts;
  delete userObj.lockUntil;

  // Set the cookie
  res.status(statusCode).cookie('jwt', token, options);

  // If redirect URL is provided, redirect instead of sending JSON (for OAuth)
  if (redirectUrl) {
    return res.redirect(redirectUrl);
  }

  // Otherwise send JSON response (for regular login)
  res.json({
    success: true,
    token,
    user: userObj,
  });
};

// Clear token cookie
exports.clearTokenCookie = (res) => {
  res.cookie('jwt', 'none', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  });
};

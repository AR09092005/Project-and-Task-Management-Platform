const jwt = require('jsonwebtoken');

// Generate JWT token
exports.generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '24h',
  });
};

// Send token response
exports.sendTokenResponse = (user, statusCode, res) => {
  // Create token
  const token = this.generateToken(user._id);

  const cookieExpire = parseInt(process.env.JWT_COOKIE_EXPIRE) || 1;
  const options = {
    expires: new Date(Date.now() + cookieExpire * 24 * 60 * 60 * 1000),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  };

  // Remove sensitive data
  const userObj = user.toObject();
  delete userObj.passwordHash;
  delete userObj.emailVerificationToken;
  delete userObj.passwordResetToken;
  delete userObj.loginAttempts;
  delete userObj.lockUntil;

  res.status(statusCode).cookie('jwt', token, options).json({
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
  });
};

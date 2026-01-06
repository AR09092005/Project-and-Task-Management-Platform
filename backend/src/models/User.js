const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide a name'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Please provide an email'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid email',
      ],
    },
    passwordHash: {
      type: String,
      select: false,
    },
    profilePicture: {
      type: String,
      default: null,
    },
    timezone: {
      type: String,
      default: 'UTC',
    },
    role: {
      type: String,
      enum: ['System Admin', 'Project Owner', 'Project Admin', 'Team Member', 'Viewer'],
      default: 'Team Member',
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
    emailVerificationToken: String,
    emailVerificationExpires: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
    oauthProviders: [{
      type: String,
      enum: ['google', 'microsoft', 'github'],
    }],
    loginAttempts: {
      type: Number,
      default: 0,
    },
    lockUntil: Date,
    lastLogin: Date,
    isActive: {
      type: Boolean,
      default: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: Date,
    notificationPreferences: {
      email: {
        taskAssigned: { type: Boolean, default: true },
        taskDueSoon: { type: Boolean, default: true },
        taskCompleted: { type: Boolean, default: true },
        commentMentioned: { type: Boolean, default: true },
        projectInvite: { type: Boolean, default: true },
        dailyDigest: { type: Boolean, default: false },
        weeklyDigest: { type: Boolean, default: true },
      },
      inApp: {
        taskAssigned: { type: Boolean, default: true },
        taskDueSoon: { type: Boolean, default: true },
        taskCompleted: { type: Boolean, default: true },
        commentMentioned: { type: Boolean, default: true },
        projectInvite: { type: Boolean, default: true },
      },
      push: {
        taskAssigned: { type: Boolean, default: false },
        taskDueSoon: { type: Boolean, default: false },
        taskCompleted: { type: Boolean, default: false },
        commentMentioned: { type: Boolean, default: false },
        projectInvite: { type: Boolean, default: false },
      },
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
userSchema.index({ email: 1 });
userSchema.index({ isDeleted: 1, isActive: 1 });

// Virtual for checking if account is locked
userSchema.virtual('isLocked').get(function () {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

// Pre-save middleware to hash password
userSchema.pre('save', async function (next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('passwordHash')) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(parseInt(process.env.BCRYPT_SALT_ROUNDS) || 10);
    this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.passwordHash);
};

// Method to increment login attempts
userSchema.methods.incLoginAttempts = function () {
  // If we have a previous lock that has expired, restart at 1
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $set: { loginAttempts: 1 },
      $unset: { lockUntil: 1 },
    });
  }

  const updates = { $inc: { loginAttempts: 1 } };
  const maxAttempts = parseInt(process.env.MAX_LOGIN_ATTEMPTS) || 5;

  // Lock the account if we've reached max attempts
  if (this.loginAttempts + 1 >= maxAttempts && !this.isLocked) {
    updates.$set = {
      lockUntil: Date.now() + (parseInt(process.env.LOCKOUT_DURATION) || 1800000)
    };
  }

  return this.updateOne(updates);
};

// Method to reset login attempts
userSchema.methods.resetLoginAttempts = function () {
  return this.updateOne({
    $set: { loginAttempts: 0 },
    $unset: { lockUntil: 1 },
  });
};

// Method to soft delete user
userSchema.methods.softDelete = function () {
  this.isDeleted = true;
  this.deletedAt = new Date();
  this.isActive = false;
  return this.save();
};

module.exports = mongoose.model('User', userSchema);

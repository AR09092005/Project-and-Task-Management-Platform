const mongoose = require('mongoose');
const crypto = require('crypto');

const inviteSchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    role: {
      type: String,
      enum: ['Admin', 'Member', 'Viewer'],
      default: 'Member',
    },
    invitedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    token: {
      type: String,
      required: true,
      unique: true,
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'declined', 'expired'],
      default: 'pending',
    },
    expiresAt: {
      type: Date,
      required: true,
      default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    },
    acceptedAt: Date,
    acceptedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
inviteSchema.index({ project: 1, email: 1, status: 1 });
inviteSchema.index({ token: 1 });
inviteSchema.index({ expiresAt: 1 });

// Pre-save middleware to generate token
inviteSchema.pre('save', function (next) {
  if (!this.token) {
    this.token = crypto.randomBytes(32).toString('hex');
  }
  next();
});

// Method to check if invite is expired
inviteSchema.methods.isExpired = function () {
  return this.expiresAt < new Date() || this.status === 'expired';
};

// Method to accept invite
inviteSchema.methods.accept = function (userId) {
  if (this.isExpired()) {
    throw new Error('Invite has expired');
  }

  if (this.status !== 'pending') {
    throw new Error('Invite has already been processed');
  }

  this.status = 'accepted';
  this.acceptedAt = new Date();
  this.acceptedBy = userId;
  return this.save();
};

// Method to decline invite
inviteSchema.methods.decline = function () {
  if (this.status !== 'pending') {
    throw new Error('Invite has already been processed');
  }

  this.status = 'declined';
  return this.save();
};

// Static method to clean up expired invites
inviteSchema.statics.cleanupExpired = function () {
  return this.updateMany(
    { status: 'pending', expiresAt: { $lt: new Date() } },
    { $set: { status: 'expired' } }
  );
};

module.exports = mongoose.model('Invite', inviteSchema);

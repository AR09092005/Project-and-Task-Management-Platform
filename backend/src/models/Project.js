const mongoose = require('mongoose');

const projectMemberSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  role: {
    type: String,
    enum: ['Owner', 'Admin', 'Member', 'Viewer'],
    default: 'Member',
  },
  joinedAt: {
    type: Date,
    default: Date.now,
  },
});

const projectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide a project name'],
      trim: true,
      maxlength: [200, 'Project name cannot exceed 200 characters'],
    },
    description: {
      type: String,
      maxlength: [5000, 'Description cannot exceed 5000 characters'],
    },
    workspace: {
      type: String,
      enum: ['Personal', 'Academic', 'Work', 'Clubs'],
      default: 'Personal',
    },
    startDate: {
      type: Date,
      default: Date.now,
    },
    endDate: {
      type: Date,
    },
    status: {
      type: String,
      enum: ['Planning', 'Active', 'On Hold', 'Completed', 'Archived'],
      default: 'Active',
    },
    colorTag: {
      type: String,
      default: '#1976d2',
      match: [/^#[0-9A-F]{6}$/i, 'Please provide a valid hex color'],
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    members: [projectMemberSchema],
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: Date,
    archivedAt: Date,
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
projectSchema.index({ owner: 1, status: 1 });
projectSchema.index({ 'members.user': 1 });
projectSchema.index({ workspace: 1, status: 1 });
projectSchema.index({ isDeleted: 1 });

// Virtual for tasks
projectSchema.virtual('tasks', {
  ref: 'Task',
  localField: '_id',
  foreignField: 'project',
});

// Method to add member
projectSchema.methods.addMember = function (userId, role = 'Member') {
  const existingMember = this.members.find((m) => {
    // Handle both populated and unpopulated user field
    const memberId = m.user._id ? m.user._id.toString() : m.user.toString();
    return memberId === userId.toString();
  });

  if (existingMember) {
    throw new Error('User is already a member of this project');
  }

  this.members.push({ user: userId, role });
  return this.save();
};

// Method to remove member
projectSchema.methods.removeMember = function (userId) {
  this.members = this.members.filter((m) => {
    // Handle both populated and unpopulated user field
    const memberId = m.user._id ? m.user._id.toString() : m.user.toString();
    return memberId !== userId.toString();
  });
  return this.save();
};

// Method to update member role
projectSchema.methods.updateMemberRole = function (userId, newRole) {
  const member = this.members.find((m) => {
    // Handle both populated and unpopulated user field
    const memberId = m.user._id ? m.user._id.toString() : m.user.toString();
    return memberId === userId.toString();
  });

  if (!member) {
    throw new Error('User is not a member of this project');
  }

  member.role = newRole;
  return this.save();
};

// Method to check if user is a member
projectSchema.methods.isMember = function (userId) {
  return this.members.some((m) => {
    // Handle both populated and unpopulated user field
    const memberId = m.user._id ? m.user._id.toString() : m.user.toString();
    return memberId === userId.toString();
  });
};

// Method to get member role
projectSchema.methods.getMemberRole = function (userId) {
  const member = this.members.find((m) => {
    // Handle both populated and unpopulated user field
    const memberId = m.user._id ? m.user._id.toString() : m.user.toString();
    return memberId === userId.toString();
  });
  return member ? member.role : null;
};

// Method to check if user has permission
projectSchema.methods.hasPermission = function (userId, requiredRole) {
  const roleHierarchy = { Owner: 4, Admin: 3, Member: 2, Viewer: 1 };
  const memberRole = this.getMemberRole(userId);

  if (!memberRole) return false;

  return roleHierarchy[memberRole] >= roleHierarchy[requiredRole];
};

// Method to soft delete project
projectSchema.methods.softDelete = function () {
  this.isDeleted = true;
  this.deletedAt = new Date();
  return this.save();
};

// Method to archive project
projectSchema.methods.archive = function () {
  this.status = 'Archived';
  this.archivedAt = new Date();
  return this.save();
};

module.exports = mongoose.model('Project', projectSchema);

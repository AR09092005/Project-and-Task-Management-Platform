const mongoose = require('mongoose');

const taskDependencySchema = new mongoose.Schema({
  task: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task',
    required: true,
  },
  dependencyType: {
    type: String,
    enum: ['blocks', 'is_blocked_by', 'relates_to'],
    default: 'blocks',
  },
});

const taskSchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Please provide a task title'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    description: {
      type: String,
      maxlength: [10000, 'Description cannot exceed 10000 characters'],
    },
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Urgent'],
      default: 'Medium',
    },
    status: {
      type: String,
      enum: ['To Do', 'In Progress', 'In Review', 'Done'],
      default: 'To Do',
    },
    dueDate: {
      type: Date,
    },
    estimatedHours: {
      type: Number,
      min: 0,
    },
    actualHours: {
      type: Number,
      min: 0,
      default: 0,
    },
    assignees: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    }],
    tags: [{
      type: String,
      trim: true,
    }],
    parentTask: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task',
      default: null,
    },
    dependencies: [taskDependencySchema],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    completedAt: Date,
    completedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: Date,
    position: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
taskSchema.index({ project: 1, status: 1 });
taskSchema.index({ assignees: 1, status: 1 });
taskSchema.index({ dueDate: 1 });
taskSchema.index({ parentTask: 1 });
taskSchema.index({ isDeleted: 1 });
taskSchema.index({ project: 1, position: 1 });

// Virtual for subtasks
taskSchema.virtual('subtasks', {
  ref: 'Task',
  localField: '_id',
  foreignField: 'parentTask',
});

// Virtual for comments
taskSchema.virtual('comments', {
  ref: 'Comment',
  localField: '_id',
  foreignField: 'task',
});

// Virtual for attachments
taskSchema.virtual('attachments', {
  ref: 'Attachment',
  localField: '_id',
  foreignField: 'task',
});

// Method to add dependency with circular dependency check
taskSchema.methods.addDependency = async function (taskId, dependencyType = 'blocks') {
  // Check if dependency already exists
  const exists = this.dependencies.some(
    (dep) => dep.task.toString() === taskId.toString()
  );

  if (exists) {
    throw new Error('Dependency already exists');
  }

  // Check for circular dependencies
  const hasCircularDependency = await this.checkCircularDependency(taskId);
  if (hasCircularDependency) {
    throw new Error('Circular dependency detected');
  }

  this.dependencies.push({ task: taskId, dependencyType });
  return this.save();
};

// Method to check for circular dependencies
taskSchema.methods.checkCircularDependency = async function (taskId, visited = new Set()) {
  if (visited.has(this._id.toString())) {
    return true;
  }

  visited.add(this._id.toString());

  const Task = mongoose.model('Task');
  const dependentTask = await Task.findById(taskId).populate('dependencies.task');

  if (!dependentTask) {
    return false;
  }

  for (const dep of dependentTask.dependencies) {
    if (dep.task._id.toString() === this._id.toString()) {
      return true;
    }

    const hasCircular = await this.checkCircularDependency(dep.task._id, visited);
    if (hasCircular) {
      return true;
    }
  }

  return false;
};

// Method to remove dependency
taskSchema.methods.removeDependency = function (taskId) {
  this.dependencies = this.dependencies.filter(
    (dep) => dep.task.toString() !== taskId.toString()
  );
  return this.save();
};

// Method to mark task as complete
taskSchema.methods.markComplete = function (userId) {
  this.status = 'Done';
  this.completedAt = new Date();
  this.completedBy = userId;
  return this.save();
};

// Method to soft delete task
taskSchema.methods.softDelete = function () {
  this.isDeleted = true;
  this.deletedAt = new Date();
  return this.save();
};

// Method to check if task is overdue
taskSchema.methods.isOverdue = function () {
  return this.dueDate && this.dueDate < new Date() && this.status !== 'Done';
};

// Static method to get tasks with filters
taskSchema.statics.getFilteredTasks = function (projectId, filters = {}) {
  const query = { project: projectId, isDeleted: false };

  if (filters.status) {
    query.status = filters.status;
  }

  if (filters.priority) {
    query.priority = filters.priority;
  }

  if (filters.assignee) {
    query.assignees = filters.assignee;
  }

  if (filters.tags && filters.tags.length > 0) {
    query.tags = { $in: filters.tags };
  }

  if (filters.dueDateFrom || filters.dueDateTo) {
    query.dueDate = {};
    if (filters.dueDateFrom) query.dueDate.$gte = new Date(filters.dueDateFrom);
    if (filters.dueDateTo) query.dueDate.$lte = new Date(filters.dueDateTo);
  }

  return this.find(query)
    .populate('assignees', 'name email profilePicture')
    .populate('createdBy', 'name email')
    .sort({ position: 1, createdAt: -1 });
};

module.exports = mongoose.model('Task', taskSchema);

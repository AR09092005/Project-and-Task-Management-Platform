const Task = require('../models/Task');
const Project = require('../models/Project');
const Notification = require('../models/Notification');
const { ErrorResponse } = require('../middleware/errorHandler');

// @desc    Get all tasks for a project
// @route   GET /api/projects/:projectId/tasks
// @access  Private
exports.getTasks = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { status, priority, assignee, tags, dueDateFrom, dueDateTo, search } = req.query;

    // Check if user has access to project
    const project = await Project.findById(projectId);
    if (!project) {
      return next(new ErrorResponse('Project not found', 404));
    }

    if (
      project.owner.toString() !== req.user.id &&
      !project.isMember(req.user.id)
    ) {
      return next(new ErrorResponse('Not authorized to access this project', 403));
    }

    // Build filter object
    const filters = {};
    if (status) filters.status = status;
    if (priority) filters.priority = priority;
    if (assignee) filters.assignee = assignee;
    if (tags) filters.tags = Array.isArray(tags) ? tags : tags.split(',');
    if (dueDateFrom) filters.dueDateFrom = dueDateFrom;
    if (dueDateTo) filters.dueDateTo = dueDateTo;

    let query = Task.getFilteredTasks(projectId, filters);

    // Add search functionality
    if (search) {
      query = query.where({
        $or: [
          { title: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
        ],
      });
    }

    const tasks = await query;

    res.status(200).json({
      success: true,
      count: tasks.length,
      data: tasks,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single task
// @route   GET /api/tasks/:id
// @access  Private
exports.getTask = async (req, res, next) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, isDeleted: false })
      .populate('assignees', 'name email profilePicture')
      .populate('createdBy', 'name email profilePicture')
      .populate('completedBy', 'name email profilePicture')
      .populate('parentTask', 'title status')
      .populate('dependencies.task', 'title status')
      .populate({
        path: 'subtasks',
        match: { isDeleted: false },
        populate: { path: 'assignees', select: 'name email profilePicture' },
      })
      .populate({
        path: 'comments',
        match: { isDeleted: false },
        populate: { path: 'user', select: 'name email profilePicture' },
        options: { sort: { createdAt: -1 } },
      });

    if (!task) {
      return next(new ErrorResponse('Task not found', 404));
    }

    // Check if user has access to task's project
    const project = await Project.findById(task.project);
    if (!project) {
      return next(new ErrorResponse('Project not found', 404));
    }
    if (
      project.owner.toString() !== req.user.id &&
      !project.isMember(req.user.id)
    ) {
      return next(new ErrorResponse('Not authorized to access this task', 403));
    }

    res.status(200).json({
      success: true,
      data: task,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create task
// @route   POST /api/projects/:projectId/tasks
// @access  Private
exports.createTask = async (req, res, next) => {
  try {
    const { projectId } = req.params;

    // Check if user has access to project
    const project = await Project.findById(projectId);
    if (!project) {
      return next(new ErrorResponse('Project not found', 404));
    }

    if (!project.hasPermission(req.user.id, 'Member')) {
      return next(new ErrorResponse('Not authorized to create tasks in this project', 403));
    }

    // Add project and creator to request body
    req.body.project = projectId;
    req.body.createdBy = req.user.id;

    const task = await Task.create(req.body);

    await task.populate('assignees', 'name email profilePicture');
    await task.populate('createdBy', 'name email profilePicture');

    // Create notifications for assignees
    if (task.assignees && task.assignees.length > 0) {
      for (const assignee of task.assignees) {
        if (assignee._id.toString() !== req.user.id) {
          await Notification.createNotification({
            user: assignee._id,
            type: 'task_assigned',
            title: 'New Task Assigned',
            content: `You have been assigned to task: ${task.title}`,
            relatedTask: task._id,
            relatedProject: projectId,
            actionUrl: `/projects/${projectId}/tasks/${task._id}`,
            actor: req.user.id,
          });
        }
      }
    }

    res.status(201).json({
      success: true,
      data: task,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update task
// @route   PUT /api/tasks/:id
// @access  Private
exports.updateTask = async (req, res, next) => {
  try {
    let task = await Task.findById(req.params.id);

    if (!task) {
      return next(new ErrorResponse('Task not found', 404));
    }

    // Check if user has access to task's project
    const project = await Project.findById(task.project);
    if (!project) {
      return next(new ErrorResponse('Project not found', 404));
    }
    if (!project.hasPermission(req.user.id, 'Member')) {
      return next(new ErrorResponse('Not authorized to update this task', 403));
    }

    // Track if assignees changed for notifications
    const oldAssignees = (task.assignees || []).map((a) => a.toString());
    const newAssignees = req.body.assignees || oldAssignees;
    const addedAssignees = newAssignees.filter((a) => !oldAssignees.includes(a));

    // Don't allow changing project or creator
    delete req.body.project;
    delete req.body.createdBy;

    task = await Task.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    })
      .populate('assignees', 'name email profilePicture')
      .populate('createdBy', 'name email profilePicture')
      .populate('completedBy', 'name email profilePicture');

    // Create notifications for newly added assignees
    if (addedAssignees.length > 0) {
      for (const assigneeId of addedAssignees) {
        if (assigneeId !== req.user.id) {
          await Notification.createNotification({
            user: assigneeId,
            type: 'task_assigned',
            title: 'New Task Assigned',
            content: `You have been assigned to task: ${task.title}`,
            relatedTask: task._id,
            relatedProject: task.project,
            actionUrl: `/projects/${task.project}/tasks/${task._id}`,
            actor: req.user.id,
          });
        }
      }
    }

    res.status(200).json({
      success: true,
      data: task,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete task (soft delete)
// @route   DELETE /api/tasks/:id
// @access  Private
exports.deleteTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return next(new ErrorResponse('Task not found', 404));
    }

    // Check if user has access to task's project
    const project = await Project.findById(task.project);
    if (!project) {
      return next(new ErrorResponse('Project not found', 404));
    }
    if (!project.hasPermission(req.user.id, 'Admin')) {
      return next(new ErrorResponse('Not authorized to delete this task', 403));
    }

    await task.softDelete();

    res.status(200).json({
      success: true,
      message: 'Task deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add task dependency
// @route   POST /api/tasks/:id/dependencies
// @access  Private
exports.addDependency = async (req, res, next) => {
  try {
    const { taskId, dependencyType } = req.body;

    const task = await Task.findById(req.params.id);

    if (!task) {
      return next(new ErrorResponse('Task not found', 404));
    }

    // Check if user has access to task's project
    const project = await Project.findById(task.project);
    if (!project) {
      return next(new ErrorResponse('Project not found', 404));
    }
    if (!project.hasPermission(req.user.id, 'Member')) {
      return next(new ErrorResponse('Not authorized to update this task', 403));
    }

    // Check if dependent task exists and is in the same project
    const dependentTask = await Task.findById(taskId);
    if (!dependentTask) {
      return next(new ErrorResponse('Dependent task not found', 404));
    }

    if (dependentTask.project.toString() !== task.project.toString()) {
      return next(new ErrorResponse('Tasks must be in the same project', 400));
    }

    await task.addDependency(taskId, dependencyType);
    await task.populate('dependencies.task', 'title status');

    res.status(200).json({
      success: true,
      data: task,
    });
  } catch (error) {
    if (error.message === 'Circular dependency detected') {
      return next(new ErrorResponse(error.message, 400));
    }
    next(error);
  }
};

// @desc    Remove task dependency
// @route   DELETE /api/tasks/:id/dependencies/:depId
// @access  Private
exports.removeDependency = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return next(new ErrorResponse('Task not found', 404));
    }

    // Check if user has access to task's project
    const project = await Project.findById(task.project);
    if (!project) {
      return next(new ErrorResponse('Project not found', 404));
    }
    if (!project.hasPermission(req.user.id, 'Member')) {
      return next(new ErrorResponse('Not authorized to update this task', 403));
    }

    await task.removeDependency(req.params.depId);

    res.status(200).json({
      success: true,
      data: task,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark task as complete
// @route   PUT /api/tasks/:id/complete
// @access  Private
exports.completeTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return next(new ErrorResponse('Task not found', 404));
    }

    // Check if user has access to task's project
    const project = await Project.findById(task.project);
    if (!project) {
      return next(new ErrorResponse('Project not found', 404));
    }
    if (!project.hasPermission(req.user.id, 'Member')) {
      return next(new ErrorResponse('Not authorized to update this task', 403));
    }

    await task.markComplete(req.user.id);
    await task.populate('completedBy', 'name email profilePicture');

    // Notify task creator and assignees
    const notificationRecipients = new Set([
      task.createdBy.toString(),
      ...task.assignees.map((a) => a.toString()),
    ]);

    notificationRecipients.delete(req.user.id); // Don't notify the user who completed it

    for (const userId of notificationRecipients) {
      await Notification.createNotification({
        user: userId,
        type: 'task_completed',
        title: 'Task Completed',
        content: `Task "${task.title}" has been marked as complete`,
        relatedTask: task._id,
        relatedProject: task.project,
        actionUrl: `/projects/${task.project}/tasks/${task._id}`,
        actor: req.user.id,
      });
    }

    res.status(200).json({
      success: true,
      data: task,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update task position (for drag and drop)
// @route   PUT /api/tasks/:id/position
// @access  Private
exports.updateTaskPosition = async (req, res, next) => {
  try {
    const { position } = req.body;

    const task = await Task.findById(req.params.id);

    if (!task) {
      return next(new ErrorResponse('Task not found', 404));
    }

    // Check if user has access to task's project
    const project = await Project.findById(task.project);
    if (!project) {
      return next(new ErrorResponse('Project not found', 404));
    }
    if (!project.hasPermission(req.user.id, 'Member')) {
      return next(new ErrorResponse('Not authorized to update this task', 403));
    }

    task.position = position;
    await task.save();

    res.status(200).json({
      success: true,
      data: task,
    });
  } catch (error) {
    next(error);
  }
};

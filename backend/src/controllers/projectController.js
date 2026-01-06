const Project = require('../models/Project');
const Task = require('../models/Task');
const { ErrorResponse } = require('../middleware/errorHandler');

// @desc    Get all projects for current user
// @route   GET /api/projects
// @access  Private
exports.getProjects = async (req, res, next) => {
  try {
    const { workspace, status, search } = req.query;

    // Build query
    const query = {
      $or: [
        { owner: req.user.id },
        { 'members.user': req.user.id }
      ],
      isDeleted: false,
    };

    if (workspace) {
      query.workspace = workspace;
    }

    if (status) {
      query.status = status;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const projects = await Project.find(query)
      .populate('owner', 'name email profilePicture')
      .populate('members.user', 'name email profilePicture')
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      count: projects.length,
      data: projects,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single project
// @route   GET /api/projects/:id
// @access  Private
exports.getProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('owner', 'name email profilePicture')
      .populate('members.user', 'name email profilePicture');

    if (!project) {
      return next(new ErrorResponse('Project not found', 404));
    }

    // Check if user is a member or owner
    if (
      project.owner._id.toString() !== req.user.id &&
      !project.isMember(req.user.id)
    ) {
      return next(new ErrorResponse('Not authorized to access this project', 403));
    }

    res.status(200).json({
      success: true,
      data: project,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create project
// @route   POST /api/projects
// @access  Private
exports.createProject = async (req, res, next) => {
  try {
    // Add owner to request body
    req.body.owner = req.user.id;

    // Initialize members array with owner as Owner role
    req.body.members = [
      {
        user: req.user.id,
        role: 'Owner',
      },
    ];

    const project = await Project.create(req.body);

    await project.populate('owner', 'name email profilePicture');
    await project.populate('members.user', 'name email profilePicture');

    res.status(201).json({
      success: true,
      data: project,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update project
// @route   PUT /api/projects/:id
// @access  Private
exports.updateProject = async (req, res, next) => {
  try {
    let project = await Project.findById(req.params.id);

    if (!project) {
      return next(new ErrorResponse('Project not found', 404));
    }

    // Check if user has permission to update
    if (!project.hasPermission(req.user.id, 'Admin')) {
      return next(new ErrorResponse('Not authorized to update this project', 403));
    }

    // Don't allow changing owner through this endpoint
    delete req.body.owner;
    delete req.body.members;

    project = await Project.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    })
      .populate('owner', 'name email profilePicture')
      .populate('members.user', 'name email profilePicture');

    res.status(200).json({
      success: true,
      data: project,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete project (soft delete)
// @route   DELETE /api/projects/:id
// @access  Private
exports.deleteProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return next(new ErrorResponse('Project not found', 404));
    }

    // Only owner can delete project
    if (project.owner.toString() !== req.user.id) {
      return next(new ErrorResponse('Only project owner can delete this project', 403));
    }

    await project.softDelete();

    res.status(200).json({
      success: true,
      message: 'Project deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Archive project
// @route   PUT /api/projects/:id/archive
// @access  Private
exports.archiveProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return next(new ErrorResponse('Project not found', 404));
    }

    // Check if user has permission
    if (!project.hasPermission(req.user.id, 'Admin')) {
      return next(new ErrorResponse('Not authorized to archive this project', 403));
    }

    await project.archive();

    res.status(200).json({
      success: true,
      data: project,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get project dashboard/statistics
// @route   GET /api/projects/:id/dashboard
// @access  Private
exports.getProjectDashboard = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return next(new ErrorResponse('Project not found', 404));
    }

    // Check if user is a member
    if (
      project.owner.toString() !== req.user.id &&
      !project.isMember(req.user.id)
    ) {
      return next(new ErrorResponse('Not authorized to access this project', 403));
    }

    // Get task statistics
    const tasks = await Task.find({ project: req.params.id, isDeleted: false });

    const stats = {
      totalTasks: tasks.length,
      todoTasks: tasks.filter((t) => t.status === 'To Do').length,
      inProgressTasks: tasks.filter((t) => t.status === 'In Progress').length,
      inReviewTasks: tasks.filter((t) => t.status === 'In Review').length,
      completedTasks: tasks.filter((t) => t.status === 'Done').length,
      overdueTasks: tasks.filter((t) => t.isOverdue()).length,
      highPriorityTasks: tasks.filter((t) => t.priority === 'Urgent' || t.priority === 'High').length,
      completionPercentage: tasks.length > 0
        ? Math.round((tasks.filter((t) => t.status === 'Done').length / tasks.length) * 100)
        : 0,
    };

    res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add member to project
// @route   POST /api/projects/:id/members
// @access  Private
exports.addMember = async (req, res, next) => {
  try {
    const { userId, role } = req.body;

    const project = await Project.findById(req.params.id);

    if (!project) {
      return next(new ErrorResponse('Project not found', 404));
    }

    // Check if user has permission to add members
    if (!project.hasPermission(req.user.id, 'Admin')) {
      return next(new ErrorResponse('Not authorized to add members to this project', 403));
    }

    await project.addMember(userId, role);
    await project.populate('members.user', 'name email profilePicture');

    res.status(200).json({
      success: true,
      data: project,
    });
  } catch (error) {
    if (error.message === 'User is already a member of this project') {
      return next(new ErrorResponse(error.message, 400));
    }
    next(error);
  }
};

// @desc    Remove member from project
// @route   DELETE /api/projects/:id/members/:userId
// @access  Private
exports.removeMember = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return next(new ErrorResponse('Project not found', 404));
    }

    // Check if user has permission to remove members
    if (!project.hasPermission(req.user.id, 'Admin')) {
      return next(new ErrorResponse('Not authorized to remove members from this project', 403));
    }

    // Can't remove the owner
    if (project.owner.toString() === req.params.userId) {
      return next(new ErrorResponse('Cannot remove project owner', 400));
    }

    await project.removeMember(req.params.userId);

    res.status(200).json({
      success: true,
      data: project,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update member role
// @route   PUT /api/projects/:id/members/:userId
// @access  Private
exports.updateMemberRole = async (req, res, next) => {
  try {
    const { role } = req.body;

    const project = await Project.findById(req.params.id);

    if (!project) {
      return next(new ErrorResponse('Project not found', 404));
    }

    // Only owner can update roles
    if (project.owner.toString() !== req.user.id) {
      return next(new ErrorResponse('Only project owner can update member roles', 403));
    }

    // Can't change owner's role
    if (project.owner.toString() === req.params.userId) {
      return next(new ErrorResponse('Cannot change owner role', 400));
    }

    await project.updateMemberRole(req.params.userId, role);
    await project.populate('members.user', 'name email profilePicture');

    res.status(200).json({
      success: true,
      data: project,
    });
  } catch (error) {
    if (error.message === 'User is not a member of this project') {
      return next(new ErrorResponse(error.message, 400));
    }
    next(error);
  }
};

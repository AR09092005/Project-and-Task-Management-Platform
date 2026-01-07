const Invite = require('../models/Invite');
const Project = require('../models/Project');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { ErrorResponse } = require('../middleware/errorHandler');
const { sendEmail, emailTemplates } = require('../utils/email');

// @desc    Create project invite
// @route   POST /api/projects/:projectId/invites
// @access  Private
exports.createInvite = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { email, role } = req.body;

    // Check if project exists and user has permission
    const project = await Project.findById(projectId);
    if (!project) {
      return next(new ErrorResponse('Project not found', 404));
    }

    if (!project.hasPermission(req.user.id, 'Admin')) {
      return next(new ErrorResponse('Not authorized to invite members to this project', 403));
    }

    // Check if user is already a member
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser && project.isMember(existingUser._id)) {
      return next(new ErrorResponse('User is already a member of this project', 400));
    }

    // Create invite (allow multiple invites to same email)
    const invite = await Invite.create({
      project: projectId,
      email: email.toLowerCase(),
      role: role || 'Member',
      invitedBy: req.user.id,
    });

    // Create invite URL
    const inviteUrl = `${process.env.CLIENT_URL}/invites/${invite.token}`;

    // Send invite email
    let emailSent = false;
    let emailError = null;
    try {
      await sendEmail({
        email: invite.email,
        subject: `Project Invitation - ${project.name}`,
        html: emailTemplates.projectInvite(req.user.name, project.name, inviteUrl),
      });
      emailSent = true;
    } catch (error) {
      console.error('Failed to send invite email:', error.message);
      emailError = error.message;
      // Continue even if email fails - user can still accept invite through notification or direct link
    }

    // If user exists, create in-app notification
    if (existingUser) {
      await Notification.createNotification({
        user: existingUser._id,
        type: 'project_invite',
        title: 'Project Invitation',
        content: `${req.user.name} invited you to join "${project.name}"`,
        relatedProject: projectId,
        actionUrl: `/invites/${invite.token}`,
        actor: req.user.id,
      });
    }

    res.status(201).json({
      success: true,
      data: invite,
      emailSent,
      ...(emailError && { emailError }),
      message: emailSent
        ? 'Invite created and email sent successfully'
        : existingUser
          ? 'Invite created with in-app notification (email failed to send)'
          : `Invite created but email failed to send: ${emailError}`,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get invite by token
// @route   GET /api/invites/:token
// @access  Public
exports.getInvite = async (req, res, next) => {
  try {
    const invite = await Invite.findOne({ token: req.params.token })
      .populate('project', 'name description workspace')
      .populate('invitedBy', 'name email profilePicture');

    if (!invite) {
      return next(new ErrorResponse('Invite not found', 404));
    }

    if (invite.isExpired()) {
      return next(new ErrorResponse('Invite has expired', 400));
    }

    if (invite.status !== 'pending') {
      return next(new ErrorResponse('Invite has already been processed', 400));
    }

    res.status(200).json({
      success: true,
      data: invite,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Accept invite
// @route   POST /api/invites/:token/accept
// @access  Private
exports.acceptInvite = async (req, res, next) => {
  try {
    const invite = await Invite.findOne({ token: req.params.token });

    if (!invite) {
      return next(new ErrorResponse('Invite not found', 404));
    }

    // Check if invite email matches user email
    if (invite.email !== req.user.email) {
      return next(new ErrorResponse('This invite is for a different email address', 403));
    }

    // Accept the invite
    await invite.accept(req.user.id);

    // Add user to project
    const project = await Project.findById(invite.project);
    await project.addMember(req.user.id, invite.role);

    res.status(200).json({
      success: true,
      message: 'Invite accepted successfully',
      data: project,
    });
  } catch (error) {
    if (error.message.includes('Invite has')) {
      return next(new ErrorResponse(error.message, 400));
    }
    if (error.message === 'User is already a member of this project') {
      return next(new ErrorResponse(error.message, 400));
    }
    next(error);
  }
};

// @desc    Decline invite
// @route   POST /api/invites/:token/decline
// @access  Private
exports.declineInvite = async (req, res, next) => {
  try {
    const invite = await Invite.findOne({ token: req.params.token });

    if (!invite) {
      return next(new ErrorResponse('Invite not found', 404));
    }

    // Check if invite email matches user email
    if (invite.email !== req.user.email) {
      return next(new ErrorResponse('This invite is for a different email address', 403));
    }

    await invite.decline();

    res.status(200).json({
      success: true,
      message: 'Invite declined successfully',
    });
  } catch (error) {
    if (error.message === 'Invite has already been processed') {
      return next(new ErrorResponse(error.message, 400));
    }
    next(error);
  }
};

// @desc    Get project invites (for project admins)
// @route   GET /api/projects/:projectId/invites
// @access  Private
exports.getProjectInvites = async (req, res, next) => {
  try {
    const { projectId } = req.params;

    const project = await Project.findById(projectId);
    if (!project) {
      return next(new ErrorResponse('Project not found', 404));
    }

    if (!project.hasPermission(req.user.id, 'Admin')) {
      return next(new ErrorResponse('Not authorized to view project invites', 403));
    }

    const invites = await Invite.find({ project: projectId })
      .populate('invitedBy', 'name email')
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      count: invites.length,
      data: invites,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = exports;

const Comment = require('../models/Comment');
const Task = require('../models/Task');
const Project = require('../models/Project');
const Notification = require('../models/Notification');
const { ErrorResponse } = require('../middleware/errorHandler');

// @desc    Get comments for a task
// @route   GET /api/tasks/:taskId/comments
// @access  Private
exports.getComments = async (req, res, next) => {
  try {
    const { taskId } = req.params;

    // Check if task exists and user has access
    const task = await Task.findById(taskId);
    if (!task) {
      return next(new ErrorResponse('Task not found', 404));
    }

    const project = await Project.findById(task.project);
    if (
      project.owner.toString() !== req.user.id &&
      !project.isMember(req.user.id)
    ) {
      return next(new ErrorResponse('Not authorized to access this task', 403));
    }

    const comments = await Comment.find({
      task: taskId,
      isDeleted: false,
    })
      .populate('user', 'name email profilePicture')
      .populate('mentions', 'name email')
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      count: comments.length,
      data: comments,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create comment
// @route   POST /api/tasks/:taskId/comments
// @access  Private
exports.createComment = async (req, res, next) => {
  try {
    const { taskId } = req.params;
    const { content, parentComment } = req.body;

    // Check if task exists and user has access
    const task = await Task.findById(taskId);
    if (!task) {
      return next(new ErrorResponse('Task not found', 404));
    }

    const project = await Project.findById(task.project);
    if (!project.hasPermission(req.user.id, 'Member')) {
      return next(new ErrorResponse('Not authorized to comment on this task', 403));
    }

    // Extract mentions from content
    const mentions = Comment.extractMentions(content);

    const comment = await Comment.create({
      task: taskId,
      user: req.user.id,
      content,
      mentions,
      parentComment,
    });

    await comment.populate('user', 'name email profilePicture');
    await comment.populate('mentions', 'name email');

    // Create notifications for mentioned users
    for (const mentionedUserId of mentions) {
      if (mentionedUserId !== req.user.id) {
        await Notification.createNotification({
          user: mentionedUserId,
          type: 'comment_mention',
          title: 'Mentioned in Comment',
          content: `${req.user.name || 'Someone'} mentioned you in a comment`,
          relatedTask: taskId,
          relatedProject: task.project,
          relatedComment: comment._id,
          actionUrl: `/projects/${task.project}/tasks/${taskId}`,
          actor: req.user.id,
        });
      }
    }

    res.status(201).json({
      success: true,
      data: comment,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update comment
// @route   PUT /api/comments/:id
// @access  Private
exports.updateComment = async (req, res, next) => {
  try {
    const comment = await Comment.findById(req.params.id);

    if (!comment) {
      return next(new ErrorResponse('Comment not found', 404));
    }

    // Only comment owner can edit
    if (comment.user.toString() !== req.user.id) {
      return next(new ErrorResponse('Not authorized to edit this comment', 403));
    }

    const updatedComment = await comment.edit(req.body.content);
    await updatedComment.populate('user', 'name email profilePicture');

    res.status(200).json({
      success: true,
      data: updatedComment,
    });
  } catch (error) {
    if (error.message === 'Edit window has expired (5 minutes)') {
      return next(new ErrorResponse(error.message, 400));
    }
    next(error);
  }
};

// @desc    Delete comment
// @route   DELETE /api/comments/:id
// @access  Private
exports.deleteComment = async (req, res, next) => {
  try {
    const comment = await Comment.findById(req.params.id);

    if (!comment) {
      return next(new ErrorResponse('Comment not found', 404));
    }

    // Only comment owner can delete
    if (comment.user.toString() !== req.user.id) {
      return next(new ErrorResponse('Not authorized to delete this comment', 403));
    }

    await comment.softDelete();

    res.status(200).json({
      success: true,
      message: 'Comment deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = exports;

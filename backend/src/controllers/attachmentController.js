const Attachment = require('../models/Attachment');
const Task = require('../models/Task');
const path = require('path');
const fs = require('fs').promises;

// Upload attachment to task
exports.uploadAttachment = async (req, res) => {
  try {
    const { taskId } = req.params;

    // Verify task exists and user has access
    const task = await Task.findById(taskId).populate('project');
    if (!task) {
      // Clean up uploaded file
      if (req.file) {
        await fs.unlink(req.file.path).catch(() => {});
      }
      return res.status(404).json({
        success: false,
        message: 'Task not found',
      });
    }

    // Check if user has access to the project
    const isMember = task.project.team.some(
      (member) => member.user.toString() === req.user._id.toString()
    );
    if (!isMember && task.project.owner.toString() !== req.user._id.toString()) {
      // Clean up uploaded file
      if (req.file) {
        await fs.unlink(req.file.path).catch(() => {});
      }
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to add attachments to this task',
      });
    }

    // Check file was uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded',
      });
    }

    // Check task attachment limit
    try {
      await Attachment.checkTaskLimit(taskId);
    } catch (error) {
      // Clean up uploaded file
      await fs.unlink(req.file.path).catch(() => {});
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    // Create attachment record
    const attachment = await Attachment.create({
      task: taskId,
      fileName: req.file.filename,
      originalName: req.file.originalname,
      filePath: req.file.path,
      fileUrl: `/api/attachments/${taskId}/files/${req.file.filename}`,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      storageType: 'local',
      uploadedBy: req.user._id,
    });

    // Populate uploadedBy for response
    await attachment.populate('uploadedBy', 'name email profilePicture');

    // Emit socket event for real-time update
    const io = req.app.get('io');
    if (io) {
      io.to(`task-${taskId}`).emit('attachment-added', {
        taskId,
        attachment,
      });
    }

    res.status(201).json({
      success: true,
      message: 'File uploaded successfully',
      data: attachment,
    });
  } catch (error) {
    // Clean up uploaded file on error
    if (req.file) {
      await fs.unlink(req.file.path).catch(() => {});
    }
    console.error('Upload attachment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload file',
      error: error.message,
    });
  }
};

// Get all attachments for a task
exports.getTaskAttachments = async (req, res) => {
  try {
    const { taskId } = req.params;

    // Verify task exists and user has access
    const task = await Task.findById(taskId).populate('project');
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found',
      });
    }

    // Check if user has access to the project
    const isMember = task.project.team.some(
      (member) => member.user.toString() === req.user._id.toString()
    );
    if (!isMember && task.project.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to view attachments for this task',
      });
    }

    // Get attachments
    const attachments = await Attachment.find({
      task: taskId,
      isDeleted: false,
    })
      .populate('uploadedBy', 'name email profilePicture')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: attachments.length,
      data: attachments,
    });
  } catch (error) {
    console.error('Get attachments error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch attachments',
      error: error.message,
    });
  }
};

// Download attachment
exports.downloadAttachment = async (req, res) => {
  try {
    const { taskId, filename } = req.params;

    // Find attachment
    const attachment = await Attachment.findOne({
      task: taskId,
      fileName: filename,
      isDeleted: false,
    }).populate({
      path: 'task',
      populate: { path: 'project' },
    });

    if (!attachment) {
      return res.status(404).json({
        success: false,
        message: 'File not found',
      });
    }

    // Check if user has access to the project
    const task = attachment.task;
    const isMember = task.project.team.some(
      (member) => member.user.toString() === req.user._id.toString()
    );
    if (!isMember && task.project.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to download this file',
      });
    }

    // Check if file exists
    try {
      await fs.access(attachment.filePath);
    } catch (error) {
      return res.status(404).json({
        success: false,
        message: 'File not found on server',
      });
    }

    // Set headers and send file
    res.setHeader('Content-Type', attachment.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${attachment.originalName}"`);
    res.sendFile(path.resolve(attachment.filePath));
  } catch (error) {
    console.error('Download attachment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to download file',
      error: error.message,
    });
  }
};

// Delete attachment
exports.deleteAttachment = async (req, res) => {
  try {
    const { id } = req.params;

    // Find attachment
    const attachment = await Attachment.findById(id).populate({
      path: 'task',
      populate: { path: 'project' },
    });

    if (!attachment) {
      return res.status(404).json({
        success: false,
        message: 'Attachment not found',
      });
    }

    // Check permissions - must be uploader, project owner, or admin
    const task = attachment.task;
    const isUploader = attachment.uploadedBy.toString() === req.user._id.toString();
    const isProjectOwner = task.project.owner.toString() === req.user._id.toString();
    const isAdmin = task.project.team.some(
      (member) =>
        member.user.toString() === req.user._id.toString() &&
        member.role === 'Admin'
    );

    if (!isUploader && !isProjectOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to delete this attachment',
      });
    }

    // Soft delete attachment
    await attachment.softDelete();

    // Optionally delete the actual file (uncomment if you want hard delete)
    // await fs.unlink(attachment.filePath).catch(() => {});

    // Emit socket event for real-time update
    const io = req.app.get('io');
    if (io) {
      io.to(`task-${attachment.task._id}`).emit('attachment-deleted', {
        taskId: attachment.task._id,
        attachmentId: id,
      });
    }

    res.json({
      success: true,
      message: 'Attachment deleted successfully',
    });
  } catch (error) {
    console.error('Delete attachment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete attachment',
      error: error.message,
    });
  }
};

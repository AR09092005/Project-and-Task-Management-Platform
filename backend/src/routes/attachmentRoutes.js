const express = require('express');
const router = express.Router({ mergeParams: true });
const {
  uploadAttachment,
  getTaskAttachments,
  downloadAttachment,
  deleteAttachment,
} = require('../controllers/attachmentController');
const { protect } = require('../middleware/auth');
const { upload, handleMulterError } = require('../middleware/upload');

// Routes for /api/tasks/:taskId/attachments
router.route('/')
  .get(protect, getTaskAttachments)
  .post(protect, upload.single('file'), handleMulterError, uploadAttachment);

// Route for downloading file
router.get('/files/:filename', protect, downloadAttachment);

// Route for deleting attachment (by attachment ID)
router.delete('/:id', protect, deleteAttachment);

module.exports = router;

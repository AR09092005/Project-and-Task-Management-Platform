const express = require('express');
const router = express.Router({ mergeParams: true });
const {
  getComments,
  createComment,
  updateComment,
  deleteComment,
} = require('../controllers/commentController');
const { protect } = require('../middleware/auth');
const {
  createCommentValidation,
  idValidation,
  validate,
} = require('../middleware/validation');

router.route('/')
  .get(protect, getComments)
  .post(protect, createCommentValidation, validate, createComment);

router.route('/:id')
  .put(protect, idValidation, validate, updateComment)
  .delete(protect, idValidation, validate, deleteComment);

module.exports = router;

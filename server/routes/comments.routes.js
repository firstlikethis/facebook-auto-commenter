// server/routes/comments.routes.js
const express = require('express');
const router = express.Router();
const commentController = require('../controllers/comment.controller');
const { protect } = require('../middlewares/auth.middleware');

router.use(protect); // Require authentication for all routes

// Special routes must come BEFORE routes with parameters
router.get('/stats', commentController.getCommentStats);
router.post('/cleanup', commentController.cleanupOldComments);
router.get('/search', commentController.searchComments);
router.get('/export', commentController.exportComments);

// Standard CRUD routes
router.get('/', commentController.getComments);
router.get('/:id', commentController.getComment);
router.delete('/:id', commentController.deleteComment);

module.exports = router;
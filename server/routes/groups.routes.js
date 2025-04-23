// server/routes/groups.routes.js
const express = require('express');
const router = express.Router();
const groupController = require('../controllers/group.controller');
const { protect } = require('../middlewares/auth.middleware');

router.use(protect); // Require authentication for all routes

router.get('/', groupController.getGroups);
router.post('/', groupController.createGroup);
router.get('/:id', groupController.getGroup);
router.put('/:id', groupController.updateGroup);
router.delete('/:id', groupController.deleteGroup);
router.post('/detect', groupController.detectGroups);
router.get('/:id/stats', groupController.getGroupStats);
router.post('/:id/toggle-status', groupController.toggleGroupStatus);
router.post('/:id/scan', groupController.scanSingleGroup);
router.get('/:id/comments', groupController.getGroupComments);

module.exports = router;
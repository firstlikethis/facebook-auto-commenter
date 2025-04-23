
// server/routes/dashboard.routes.js
const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboard.controller');
const { protect } = require('../middlewares/auth.middleware');

router.use(protect); // Require authentication for all routes

router.get('/overview', dashboardController.getOverview);
router.get('/recent-activity', dashboardController.getRecentActivity);
router.get('/stats/comments', dashboardController.getCommentStats);
router.get('/stats/groups', dashboardController.getGroupStats);
router.get('/stats/keywords', dashboardController.getKeywordStats);
router.get('/stats/scan-tasks', dashboardController.getScanTaskStats);
router.get('/active-scans', dashboardController.getActiveScans);

module.exports = router;
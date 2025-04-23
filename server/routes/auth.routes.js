// server/routes/auth.routes.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { protect } = require('../middlewares/auth.middleware');

// สำหรับการสมัครและเข้าสู่ระบบ
router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/me', protect, authController.getMe);
router.post('/logout', protect, authController.logout);
router.put('/change-password', protect, authController.changePassword);

module.exports = router;

// server/routes/facebook-accounts.routes.js
const express = require('express');
const router = express.Router();
const fbAccountController = require('../controllers/facebook-account.controller');
const { protect, authorize } = require('../middlewares/auth.middleware');

router.use(protect); // Require authentication for all routes

router.get('/', fbAccountController.getAccounts);
router.post('/', fbAccountController.createAccount);
router.get('/:id', fbAccountController.getAccount);
router.put('/:id', fbAccountController.updateAccount);
router.delete('/:id', fbAccountController.deleteAccount);
router.post('/:id/test-login', fbAccountController.testLogin);
router.post('/:id/logout', fbAccountController.logoutAccount);
router.post('/:id/save-cookies', fbAccountController.saveCookies);

module.exports = router;

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

// server/routes/keywords.routes.js
const express = require('express');
const router = express.Router();
const keywordController = require('../controllers/keyword.controller');
const { protect } = require('../middlewares/auth.middleware');
const upload = require('../middlewares/upload.middleware');

router.use(protect); // Require authentication for all routes

router.get('/', keywordController.getKeywords);
router.post('/', keywordController.createKeyword);
router.get('/:id', keywordController.getKeyword);
router.put('/:id', keywordController.updateKeyword);
router.delete('/:id', keywordController.deleteKeyword);
router.post('/:id/toggle-status', keywordController.toggleKeywordStatus);
router.post('/:id/upload-image', upload.single('image'), keywordController.uploadImage);
router.delete('/:id/image/:imageId', keywordController.deleteImage);
router.get('/categories', keywordController.getCategories);
router.get('/stats', keywordController.getKeywordStats);

module.exports = router;

// server/routes/comments.routes.js
const express = require('express');
const router = express.Router();
const commentController = require('../controllers/comment.controller');
const { protect } = require('../middlewares/auth.middleware');

router.use(protect); // Require authentication for all routes

router.get('/', commentController.getComments);
router.get('/:id', commentController.getComment);
router.delete('/:id', commentController.deleteComment);
router.get('/stats', commentController.getCommentStats);
router.post('/cleanup', commentController.cleanupOldComments);
router.get('/search', commentController.searchComments);
router.get('/export', commentController.exportComments);

module.exports = router;

// server/routes/scan-tasks.routes.js
const express = require('express');
const router = express.Router();
const scanTaskController = require('../controllers/scan-task.controller');
const { protect } = require('../middlewares/auth.middleware');

router.use(protect); // Require authentication for all routes

router.get('/', scanTaskController.getTasks);
router.post('/', scanTaskController.createTask);
router.get('/:id', scanTaskController.getTask);
router.put('/:id', scanTaskController.updateTask);
router.delete('/:id', scanTaskController.deleteTask);
router.post('/:id/start', scanTaskController.startTask);
router.post('/:id/stop', scanTaskController.stopTask);
router.get('/:id/logs', scanTaskController.getTaskLogs);
router.get('/stats', scanTaskController.getTaskStats);
router.get('/active', scanTaskController.getActiveTasks);

module.exports = router;

// server/routes/settings.routes.js
const express = require('express');
const router = express.Router();
const settingController = require('../controllers/setting.controller');
const { protect } = require('../middlewares/auth.middleware');

router.use(protect); // Require authentication for all routes

router.get('/', settingController.getSettings);
router.put('/', settingController.updateSettings);
router.get('/browser', settingController.getBrowserSettings);
router.put('/browser', settingController.updateBrowserSettings);
router.get('/scan', settingController.getScanSettings);
router.put('/scan', settingController.updateScanSettings);
router.get('/delay', settingController.getDelaySettings);
router.put('/delay', settingController.updateDelaySettings);
router.get('/human-behavior', settingController.getHumanBehaviorSettings);
router.put('/human-behavior', settingController.updateHumanBehaviorSettings);
router.get('/notification', settingController.getNotificationSettings);
router.put('/notification', settingController.updateNotificationSettings);
router.post('/reset', settingController.resetSettings);

module.exports = router;

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

// server/routes/index.js
const express = require('express');
const router = express.Router();

// Import route modules
const authRoutes = require('./auth.routes');
const fbAccountRoutes = require('./facebook-accounts.routes');
const groupRoutes = require('./groups.routes');
const keywordRoutes = require('./keywords.routes');
const commentRoutes = require('./comments.routes');
const scanTaskRoutes = require('./scan-tasks.routes');
const settingRoutes = require('./settings.routes');
const dashboardRoutes = require('./dashboard.routes');

// API routes
router.use('/api/auth', authRoutes);
router.use('/api/facebook-accounts', fbAccountRoutes);
router.use('/api/groups', groupRoutes);
router.use('/api/keywords', keywordRoutes);
router.use('/api/comments', commentRoutes);
router.use('/api/scan-tasks', scanTaskRoutes);
router.use('/api/settings', settingRoutes);
router.use('/api/dashboard', dashboardRoutes);

// Health check route
router.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Server is running' });
});

module.exports = router;
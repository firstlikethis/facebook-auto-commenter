
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
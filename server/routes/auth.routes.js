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
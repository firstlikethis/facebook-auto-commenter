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

// Health check route - must be first and without auth
router.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Server is running' });
});

// Debug route - must be without auth
router.get('/api/debug', (req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    env: process.env.NODE_ENV,
    time: new Date().toISOString()
  });
});

// API routes
router.use('/api/auth', authRoutes);
router.use('/api/facebook-accounts', fbAccountRoutes);
router.use('/api/groups', groupRoutes);
router.use('/api/keywords', keywordRoutes);
router.use('/api/comments', commentRoutes);
router.use('/api/scan-tasks', scanTaskRoutes);
router.use('/api/settings', settingRoutes);
router.use('/api/dashboard', dashboardRoutes);

module.exports = router;
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
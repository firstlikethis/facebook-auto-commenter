// server/controllers/scan-task.controller.js
const ScanTask = require('../models/ScanTask');
const asyncHandler = require('../middlewares/async.middleware');
const ErrorResponse = require('../utils/errorResponse');
const scannerService = require('../services/scannerService');

// @desc    Get all tasks
// @route   GET /api/scan-tasks
// @access  Private
exports.getTasks = asyncHandler(async (req, res, next) => {
  // Add pagination, filtering, and sorting
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  const sort = req.query.sort || '-createdAt';
  
  // Filter options
  const filter = { user: req.user.id };
  
  if (req.query.status) {
    filter.status = req.query.status;
  }
  
  if (req.query.type) {
    filter.type = req.query.type;
  }
  
  if (req.query.search) {
    filter.$or = [
      { 'logs.message': { $regex: req.query.search, $options: 'i' } }
    ];
  }
  
  // Get total count
  const total = await ScanTask.countDocuments(filter);
  
  // Execute query
  const tasks = await ScanTask.find(filter)
    .sort(sort)
    .skip(startIndex)
    .limit(limit)
    .populate('groups', 'name')
    .populate('facebookAccount', 'name email');
  
  // Pagination result
  const pagination = {};
  
  if (endIndex < total) {
    pagination.next = {
      page: page + 1,
      limit
    };
  }
  
  if (startIndex > 0) {
    pagination.prev = {
      page: page - 1,
      limit
    };
  }
  
  res.status(200).json({
    success: true,
    count: tasks.length,
    total,
    pagination,
    data: tasks
  });
});

// @desc    Create task
// @route   POST /api/scan-tasks
// @access  Private
exports.createTask = asyncHandler(async (req, res, next) => {
  // Add user to request body
  req.body.user = req.user.id;
  
  // Create task
  const task = await ScanTask.create(req.body);
  
  res.status(201).json({
    success: true,
    data: task
  });
});

// @desc    Get single task
// @route   GET /api/scan-tasks/:id
// @access  Private
exports.getTask = asyncHandler(async (req, res, next) => {
  const task = await ScanTask.findOne({
    _id: req.params.id,
    user: req.user.id
  })
    .populate('groups', 'name')
    .populate('facebookAccount', 'name email');
  
  if (!task) {
    return next(new ErrorResponse(`ไม่พบงานสแกนที่มี ID ${req.params.id}`, 404));
  }
  
  res.status(200).json({
    success: true,
    data: task
  });
});

// @desc    Update task
// @route   PUT /api/scan-tasks/:id
// @access  Private
exports.updateTask = asyncHandler(async (req, res, next) => {
  let task = await ScanTask.findOne({
    _id: req.params.id,
    user: req.user.id
  });
  
  if (!task) {
    return next(new ErrorResponse(`ไม่พบงานสแกนที่มี ID ${req.params.id}`, 404));
  }
  
  // Check if task is already running
  if (task.status === 'running') {
    return next(new ErrorResponse('ไม่สามารถแก้ไขงานที่กำลังทำงานได้', 400));
  }
  
  // Update task
  task = await ScanTask.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });
  
  res.status(200).json({
    success: true,
    data: task
  });
});

// @desc    Delete task
// @route   DELETE /api/scan-tasks/:id
// @access  Private
exports.deleteTask = asyncHandler(async (req, res, next) => {
  const task = await ScanTask.findOne({
    _id: req.params.id,
    user: req.user.id
  });
  
  if (!task) {
    return next(new ErrorResponse(`ไม่พบงานสแกนที่มี ID ${req.params.id}`, 404));
  }
  
  // Check if task is already running
  if (task.status === 'running') {
    return next(new ErrorResponse('ไม่สามารถลบงานที่กำลังทำงานได้', 400));
  }
  
  await task.remove();
  
  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Start task
// @route   POST /api/scan-tasks/:id/start
// @access  Private
exports.startTask = asyncHandler(async (req, res, next) => {
  const task = await ScanTask.findOne({
    _id: req.params.id,
    user: req.user.id
  });
  
  if (!task) {
    return next(new ErrorResponse(`ไม่พบงานสแกนที่มี ID ${req.params.id}`, 404));
  }
  
  // Check if task is already running
  if (task.status !== 'pending') {
    return next(new ErrorResponse(`ไม่สามารถเริ่มงานที่มีสถานะ ${task.status}`, 400));
  }
  
  // Start task
  await scannerService.queueScanTask(task._id);
  
  res.status(200).json({
    success: true,
    message: 'เริ่มทำงานสแกนสำเร็จ'
  });
});

// @desc    Stop task
// @route   POST /api/scan-tasks/:id/stop
// @access  Private
exports.stopTask = asyncHandler(async (req, res, next) => {
  const task = await ScanTask.findOne({
    _id: req.params.id,
    user: req.user.id
  });
  
  if (!task) {
    return next(new ErrorResponse(`ไม่พบงานสแกนที่มี ID ${req.params.id}`, 404));
  }
  
  // Check if task is running
  if (task.status !== 'running' && task.status !== 'pending') {
    return next(new ErrorResponse(`ไม่สามารถหยุดงานที่มีสถานะ ${task.status}`, 400));
  }
  
  // Stop task
  const result = await scannerService.stopTask(task._id);
  
  res.status(200).json({
    success: true,
    message: result.message
  });
});

// @desc    Get task logs
// @route   GET /api/scan-tasks/:id/logs
// @access  Private
exports.getTaskLogs = asyncHandler(async (req, res, next) => {
  const task = await ScanTask.findOne({
    _id: req.params.id,
    user: req.user.id
  }).select('logs');
  
  if (!task) {
    return next(new ErrorResponse(`ไม่พบงานสแกนที่มี ID ${req.params.id}`, 404));
  }
  
  res.status(200).json({
    success: true,
    data: task.logs
  });
});

// @desc    Get task statistics
// @route   GET /api/scan-tasks/stats
// @access  Private
exports.getTaskStats = asyncHandler(async (req, res, next) => {
  const [
    total,
    pending,
    running,
    completed,
    failed,
    canceled
  ] = await Promise.all([
    ScanTask.countDocuments({ user: req.user.id }),
    ScanTask.countDocuments({ user: req.user.id, status: 'pending' }),
    ScanTask.countDocuments({ user: req.user.id, status: 'running' }),
    ScanTask.countDocuments({ user: req.user.id, status: 'completed' }),
    ScanTask.countDocuments({ user: req.user.id, status: 'failed' }),
    ScanTask.countDocuments({ user: req.user.id, status: 'canceled' })
  ]);
  
  res.status(200).json({
    success: true,
    data: {
      total,
      pending,
      running,
      completed,
      failed,
      canceled
    }
  });
});

// @desc    Get active tasks
// @route   GET /api/scan-tasks/active
// @access  Private
exports.getActiveTasks = asyncHandler(async (req, res, next) => {
  const tasks = await ScanTask.find({
    user: req.user.id,
    status: 'running'
  })
    .populate('groups', 'name')
    .populate('facebookAccount', 'name email')
    .sort('-startTime');
  
  res.status(200).json({
    success: true,
    count: tasks.length,
    data: tasks
  });
});
// server/controllers/group.controller.js
const Group = require('../models/Group');
const Comment = require('../models/Comment');
const FacebookAccount = require('../models/FacebookAccount');
const asyncHandler = require('../middlewares/async.middleware');
const ErrorResponse = require('../utils/errorResponse');
const FacebookService = require('../services/facebookService');
const logger = require('../utils/logger');

// @desc    Get all groups
// @route   GET /api/groups
// @access  Private
exports.getGroups = asyncHandler(async (req, res, next) => {
  // Add pagination, filtering, and sorting
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  const sort = req.query.sort || '-createdAt';
  
  // Filter options
  const filter = { user: req.user.id };
  
  if (req.query.isActive) {
    filter.isActive = req.query.isActive === 'true';
  }
  
  if (req.query.scanEnabled) {
    filter.scanEnabled = req.query.scanEnabled === 'true';
  }
  
  if (req.query.search) {
    filter.$or = [
      { name: { $regex: req.query.search, $options: 'i' } },
      { groupId: { $regex: req.query.search, $options: 'i' } }
    ];
  }
  
  // Get total count
  const total = await Group.countDocuments(filter);
  
  // Execute query
  const groups = await Group.find(filter)
    .sort(sort)
    .skip(startIndex)
    .limit(limit)
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
    count: groups.length,
    total,
    pagination,
    data: groups
  });
});

// @desc    Create new group
// @route   POST /api/groups
// @access  Private
exports.createGroup = asyncHandler(async (req, res, next) => {
  // Add user to request body
  req.body.user = req.user.id;
  
  // Check if group already exists
  const existingGroup = await Group.findOne({ 
    groupId: req.body.groupId,
    user: req.user.id
  });
  
  if (existingGroup) {
    return next(new ErrorResponse(`กลุ่มนี้มีอยู่ในระบบแล้ว`, 400));
  }
  
  // Create group
  const group = await Group.create(req.body);
  
  res.status(201).json({
    success: true,
    data: group
  });
});

// @desc    Get single group
// @route   GET /api/groups/:id
// @access  Private
exports.getGroup = asyncHandler(async (req, res, next) => {
  const group = await Group.findOne({
    _id: req.params.id,
    user: req.user.id
  }).populate('facebookAccount', 'name email');
  
  if (!group) {
    return next(new ErrorResponse(`ไม่พบกลุ่มที่มี ID ${req.params.id}`, 404));
  }
  
  res.status(200).json({
    success: true,
    data: group
  });
});

// @desc    Update group
// @route   PUT /api/groups/:id
// @access  Private
exports.updateGroup = asyncHandler(async (req, res, next) => {
  let group = await Group.findOne({
    _id: req.params.id,
    user: req.user.id
  });
  
  if (!group) {
    return next(new ErrorResponse(`ไม่พบกลุ่มที่มี ID ${req.params.id}`, 404));
  }
  
  // Update group
  group = await Group.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });
  
  res.status(200).json({
    success: true,
    data: group
  });
});

// @desc    Delete group
// @route   DELETE /api/groups/:id
// @access  Private
exports.deleteGroup = asyncHandler(async (req, res, next) => {
  const group = await Group.findOne({
    _id: req.params.id,
    user: req.user.id
  });
  
  if (!group) {
    return next(new ErrorResponse(`ไม่พบกลุ่มที่มี ID ${req.params.id}`, 404));
  }
  
  await group.remove();
  
  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Detect Facebook groups
// @route   POST /api/groups/detect
// @access  Private
exports.detectGroups = asyncHandler(async (req, res, next) => {
  const { facebookAccountId } = req.body;
  let fbService = null;
  
  try {
    if (!facebookAccountId) {
      return next(new ErrorResponse('กรุณาระบุบัญชี Facebook ที่ต้องการใช้', 400));
    }
    
    // Check if account exists and belongs to user
    const account = await FacebookAccount.findOne({
      _id: facebookAccountId,
      user: req.user.id
    });
    
    if (!account) {
      return next(new ErrorResponse(`ไม่พบบัญชี Facebook ที่มี ID ${facebookAccountId}`, 404));
    }
    
    logger.info(`Starting group detection for account: ${account.email}`);
    
    // Initialize Facebook service
    fbService = new FacebookService(account);
    await fbService.initialize();
    
    // Login to Facebook
    const loginSuccess = await fbService.login();
    
    if (!loginSuccess) {
      return next(new ErrorResponse('ไม่สามารถเข้าสู่ระบบ Facebook ได้', 400));
    }
    
    // Detect groups
    const groups = await fbService.detectGroups();
    logger.info(`Detected ${groups.length} groups for account: ${account.email}`);
    
    // Save detected groups to database
    const savedGroups = [];
    
    for (const groupData of groups) {
      // Check if group already exists
      let existingGroup = await Group.findOne({ 
        groupId: groupData.groupId,
        user: req.user.id
      });
      
      if (existingGroup) {
        // Update existing group
        existingGroup.name = groupData.name;
        existingGroup.url = groupData.url;
        existingGroup.facebookAccount = account._id;
        await existingGroup.save();
        savedGroups.push(existingGroup);
      } else {
        // Create new group
        const newGroup = await Group.create({
          groupId: groupData.groupId,
          name: groupData.name,
          url: groupData.url,
          facebookAccount: account._id,
          user: req.user.id
        });
        savedGroups.push(newGroup);
      }
    }
    
    res.status(200).json({
      success: true,
      count: savedGroups.length,
      data: savedGroups
    });
  } catch (error) {
    logger.error(`Error detecting groups: ${error.message}`);
    return next(new ErrorResponse(`เกิดข้อผิดพลาดในการค้นหากลุ่ม: ${error.message}`, 500));
  } finally {
    // Close browser and clean up resources
    if (fbService) {
      try {
        await fbService.close();
      } catch (error) {
        logger.error(`Error closing browser: ${error.message}`);
      }
    }
  }
});

// @desc    Get group statistics
// @route   GET /api/groups/:id/stats
// @access  Private
exports.getGroupStats = asyncHandler(async (req, res, next) => {
  const group = await Group.findOne({
    _id: req.params.id,
    user: req.user.id
  });
  
  if (!group) {
    return next(new ErrorResponse(`ไม่พบกลุ่มที่มี ID ${req.params.id}`, 404));
  }
  
  // Get comment stats for this group
  const today = new Date();
  const last24Hours = new Date(today.getTime() - (24 * 60 * 60 * 1000));
  const last7Days = new Date(today.getTime() - (7 * 24 * 60 * 60 * 1000));
  const last30Days = new Date(today.getTime() - (30 * 24 * 60 * 60 * 1000));
  
  const [
    totalComments,
    last24HoursComments,
    last7DaysComments,
    last30DaysComments,
    keywordStats
  ] = await Promise.all([
    Comment.countDocuments({ groupId: group.groupId, user: req.user.id }),
    Comment.countDocuments({ 
      groupId: group.groupId, 
      user: req.user.id,
      createdAt: { $gte: last24Hours }
    }),
    Comment.countDocuments({ 
      groupId: group.groupId, 
      user: req.user.id,
      createdAt: { $gte: last7Days }
    }),
    Comment.countDocuments({ 
      groupId: group.groupId, 
      user: req.user.id,
      createdAt: { $gte: last30Days }
    }),
    Comment.aggregate([
      { 
        $match: { 
          groupId: group.groupId, 
          user: req.user.id,
          keywordMatched: { $exists: true, $ne: '' }
        } 
      },
      { 
        $group: { 
          _id: '$keywordMatched', 
          count: { $sum: 1 } 
        } 
      },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ])
  ]);
  
  res.status(200).json({
    success: true,
    data: {
      group,
      commentStats: {
        total: totalComments,
        last24Hours: last24HoursComments,
        last7Days: last7DaysComments,
        last30Days: last30DaysComments,
        keywordStats
      }
    }
  });
});

// @desc    Toggle group status (active/inactive)
// @route   POST /api/groups/:id/toggle-status
// @access  Private
exports.toggleGroupStatus = asyncHandler(async (req, res, next) => {
  const group = await Group.findOne({
    _id: req.params.id,
    user: req.user.id
  });
  
  if (!group) {
    return next(new ErrorResponse(`ไม่พบกลุ่มที่มี ID ${req.params.id}`, 404));
  }
  
  // Toggle status
  group.isActive = !group.isActive;
  await group.save();
  
  res.status(200).json({
    success: true,
    data: group
  });
});

// @desc    Scan a single group
// @route   POST /api/groups/:id/scan
// @access  Private
exports.scanSingleGroup = asyncHandler(async (req, res, next) => {
  const group = await Group.findOne({
    _id: req.params.id,
    user: req.user.id
  }).populate('facebookAccount');
  
  if (!group) {
    return next(new ErrorResponse(`ไม่พบกลุ่มที่มี ID ${req.params.id}`, 404));
  }
  
  if (!group.facebookAccount) {
    return next(new ErrorResponse('กลุ่มนี้ไม่มีบัญชี Facebook ที่กำหนด กรุณาอัปเดตกลุ่มและระบุบัญชีที่ต้องการใช้', 400));
  }
  
  // Create a scan task for this group
  const ScanTask = require('../models/ScanTask');
  const scanTask = await ScanTask.create({
    type: 'one-time',
    status: 'pending',
    groups: [group._id],
    facebookAccount: group.facebookAccount._id,
    scheduledTime: new Date(),
    settings: {
      postScanLimit: req.body.postScanLimit || 20,
      headless: req.body.headless !== undefined ? req.body.headless : true
    },
    user: req.user.id
  });
  
  // Start the scan in the background
  const scanService = require('../services/scannerService');
  scanService.queueScanTask(scanTask._id);
  
  res.status(200).json({
    success: true,
    message: 'งานสแกนได้ถูกเพิ่มไปยังคิว',
    data: scanTask
  });
});

// @desc    Get comments for a group
// @route   GET /api/groups/:id/comments
// @access  Private
exports.getGroupComments = asyncHandler(async (req, res, next) => {
  const group = await Group.findOne({
    _id: req.params.id,
    user: req.user.id
  });
  
  if (!group) {
    return next(new ErrorResponse(`ไม่พบกลุ่มที่มี ID ${req.params.id}`, 404));
  }
  
  // Add pagination
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 20;
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  
  // Get total count
  const total = await Comment.countDocuments({ 
    groupId: group.groupId,
    user: req.user.id
  });
  
  // Execute query
  const comments = await Comment.find({ 
    groupId: group.groupId,
    user: req.user.id
  })
    .sort('-createdAt')
    .skip(startIndex)
    .limit(limit)
    .populate('keywordId', 'keyword');
  
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
    count: comments.length,
    total,
    pagination,
    data: comments
  });
});
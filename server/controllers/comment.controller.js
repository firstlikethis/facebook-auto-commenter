// server/controllers/comment.controller.js
const Comment = require('../models/Comment');
const asyncHandler = require('../middlewares/async.middleware');
const ErrorResponse = require('../utils/errorResponse');

// @desc    Get all comments
// @route   GET /api/comments
// @access  Private
exports.getComments = asyncHandler(async (req, res, next) => {
  // Check if req.user exists
  if (!req.user) {
    return next(new ErrorResponse('Authentication required', 401));
  }

  // Add pagination, filtering, and sorting
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 20;
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  const sort = req.query.sort || '-createdAt';
  
  // Filter options
  const filter = { user: req.user.id };
  
  if (req.query.groupId) {
    filter.groupId = req.query.groupId;
  }
  
  if (req.query.keywordMatched) {
    filter.keywordMatched = req.query.keywordMatched;
  }
  
  if (req.query.success) {
    filter.success = req.query.success === 'true';
  }
  
  if (req.query.search) {
    filter.$or = [
      { postContent: { $regex: req.query.search, $options: 'i' } },
      { messageUsed: { $regex: req.query.search, $options: 'i' } },
      { keywordMatched: { $regex: req.query.search, $options: 'i' } },
      { groupName: { $regex: req.query.search, $options: 'i' } }
    ];
  }
  
  // Get total count
  const total = await Comment.countDocuments(filter);
  
  // Execute query
  const comments = await Comment.find(filter)
    .sort(sort)
    .skip(startIndex)
    .limit(limit)
    .populate('keywordId', 'keyword')
    .populate('group', 'name')
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
    count: comments.length,
    total,
    pagination,
    data: comments
  });
});

// @desc    Get single comment
// @route   GET /api/comments/:id
// @access  Private
exports.getComment = asyncHandler(async (req, res, next) => {
  // Check if req.user exists
  if (!req.user) {
    return next(new ErrorResponse('Authentication required', 401));
  }

  const comment = await Comment.findOne({
    _id: req.params.id,
    user: req.user.id
  })
    .populate('keywordId', 'keyword')
    .populate('group', 'name')
    .populate('facebookAccount', 'name email');
  
  if (!comment) {
    return next(new ErrorResponse(`ไม่พบคอมเมนต์ที่มี ID ${req.params.id}`, 404));
  }
  
  res.status(200).json({
    success: true,
    data: comment
  });
});

// @desc    Delete comment
// @route   DELETE /api/comments/:id
// @access  Private
exports.deleteComment = asyncHandler(async (req, res, next) => {
  // Check if req.user exists
  if (!req.user) {
    return next(new ErrorResponse('Authentication required', 401));
  }

  const comment = await Comment.findOne({
    _id: req.params.id,
    user: req.user.id
  });
  
  if (!comment) {
    return next(new ErrorResponse(`ไม่พบคอมเมนต์ที่มี ID ${req.params.id}`, 404));
  }
  
  await comment.remove();
  
  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Get comment statistics
// @route   GET /api/comments/stats
// @access  Private
exports.getCommentStats = asyncHandler(async (req, res, next) => {
  // Check if req.user exists
  if (!req.user) {
    return next(new ErrorResponse('Authentication required', 401));
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  const last7Days = new Date(today);
  last7Days.setDate(last7Days.getDate() - 7);
  
  const last30Days = new Date(today);
  last30Days.setDate(last30Days.getDate() - 30);
  
  const [
    total,
    todayCount,
    yesterdayCount,
    last7DaysCount,
    last30DaysCount,
    successCount,
    failureCount
  ] = await Promise.all([
    Comment.countDocuments({ user: req.user.id }),
    Comment.countDocuments({ 
      user: req.user.id,
      createdAt: { $gte: today }
    }),
    Comment.countDocuments({ 
      user: req.user.id,
      createdAt: { $gte: yesterday, $lt: today }
    }),
    Comment.countDocuments({ 
      user: req.user.id,
      createdAt: { $gte: last7Days }
    }),
    Comment.countDocuments({ 
      user: req.user.id,
      createdAt: { $gte: last30Days }
    }),
    Comment.countDocuments({ 
      user: req.user.id,
      success: true
    }),
    Comment.countDocuments({ 
      user: req.user.id,
      success: false
    })
  ]);
  
  // Calculate success rate
  const successRate = total > 0 ? (successCount / total) * 100 : 0;
  
  res.status(200).json({
    success: true,
    data: {
      total,
      today: todayCount,
      yesterday: yesterdayCount,
      last7Days: last7DaysCount,
      last30Days: last30DaysCount,
      successCount,
      failureCount,
      successRate: parseFloat(successRate.toFixed(2))
    }
  });
});

// @desc    Cleanup old comments
// @route   POST /api/comments/cleanup
// @access  Private
exports.cleanupOldComments = asyncHandler(async (req, res, next) => {
  // Check if req.user exists
  if (!req.user) {
    return next(new ErrorResponse('Authentication required', 401));
  }

  const days = parseInt(req.body.days, 10) || 30;
  
  if (days < 1) {
    return next(new ErrorResponse('จำนวนวันต้องมากกว่าหรือเท่ากับ 1', 400));
  }
  
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  
  const result = await Comment.deleteMany({
    user: req.user.id,
    createdAt: { $lt: cutoffDate }
  });
  
  res.status(200).json({
    success: true,
    message: `ลบคอมเมนต์ที่เก่ากว่า ${days} วันจำนวน ${result.deletedCount} รายการ`
  });
});

// @desc    Search comments
// @route   GET /api/comments/search
// @access  Private
exports.searchComments = asyncHandler(async (req, res, next) => {
  // Check if req.user exists
  if (!req.user) {
    return next(new ErrorResponse('Authentication required', 401));
  }

  const { query, groupId, keywordMatched, success, fromDate, toDate } = req.query;
  
  const filter = { user: req.user.id };
  
  if (query) {
    filter.$or = [
      { postContent: { $regex: query, $options: 'i' } },
      { messageUsed: { $regex: query, $options: 'i' } },
      { keywordMatched: { $regex: query, $options: 'i' } },
      { groupName: { $regex: query, $options: 'i' } }
    ];
  }
  
  if (groupId) {
    filter.groupId = groupId;
  }
  
  if (keywordMatched) {
    filter.keywordMatched = keywordMatched;
  }
  
  if (success !== undefined) {
    filter.success = success === 'true';
  }
  
  // Date range
  if (fromDate || toDate) {
    filter.createdAt = {};
    
    if (fromDate) {
      filter.createdAt.$gte = new Date(fromDate);
    }
    
    if (toDate) {
      const toDateObj = new Date(toDate);
      toDateObj.setHours(23, 59, 59, 999);
      filter.createdAt.$lte = toDateObj;
    }
  }
  
  const comments = await Comment.find(filter)
    .sort('-createdAt')
    .limit(100)
    .populate('keywordId', 'keyword')
    .populate('group', 'name')
    .populate('facebookAccount', 'name email');
  
  res.status(200).json({
    success: true,
    count: comments.length,
    data: comments
  });
});

// @desc    Export comments
// @route   GET /api/comments/export
// @access  Private
exports.exportComments = asyncHandler(async (req, res, next) => {
  // Check if req.user exists
  if (!req.user) {
    return next(new ErrorResponse('Authentication required', 401));
  }

  const { format = 'csv', ...filterParams } = req.query;
  
  const filter = { user: req.user.id };
  
  // Apply filters similar to searchComments
  if (filterParams.groupId) {
    filter.groupId = filterParams.groupId;
  }
  
  if (filterParams.keywordMatched) {
    filter.keywordMatched = filterParams.keywordMatched;
  }
  
  if (filterParams.success !== undefined) {
    filter.success = filterParams.success === 'true';
  }
  
  if (filterParams.search) {
    filter.$or = [
      { postContent: { $regex: filterParams.search, $options: 'i' } },
      { messageUsed: { $regex: filterParams.search, $options: 'i' } },
      { keywordMatched: { $regex: filterParams.search, $options: 'i' } },
      { groupName: { $regex: filterParams.search, $options: 'i' } }
    ];
  }
  
  // Date range
  if (filterParams.fromDate || filterParams.toDate) {
    filter.createdAt = {};
    
    if (filterParams.fromDate) {
      filter.createdAt.$gte = new Date(filterParams.fromDate);
    }
    
    if (filterParams.toDate) {
      const toDateObj = new Date(filterParams.toDate);
      toDateObj.setHours(23, 59, 59, 999);
      filter.createdAt.$lte = toDateObj;
    }
  }
  
  const comments = await Comment.find(filter)
    .sort('-createdAt')
    .populate('keywordId', 'keyword')
    .populate('group', 'name')
    .populate('facebookAccount', 'name email');
  
  // Format data for export
  const exportData = comments.map(comment => ({
    id: comment._id,
    groupName: comment.groupName || (comment.group ? comment.group.name : ''),
    postContent: comment.postContent || '',
    keywordMatched: comment.keywordMatched || '',
    messageUsed: comment.messageUsed || '',
    success: comment.success ? 'Yes' : 'No',
    createdAt: comment.createdAt.toISOString()
  }));
  
  // CSV format is the default
  let output = '';
  
  if (exportData.length > 0) {
    const headers = Object.keys(exportData[0] || {}).join(',') + '\n';
    output = headers + exportData.map(item => {
      return Object.values(item).map(val => {
        // Escape commas and quotes in CSV
        if (typeof val === 'string') {
          val = val.replace(/"/g, '""');
          if (val.includes(',') || val.includes('"') || val.includes('\n')) {
            val = `"${val}"`;
          }
        }
        return val;
      }).join(',');
    }).join('\n');
  } else {
    // If no data, just return headers
    output = 'id,groupName,postContent,keywordMatched,messageUsed,success,createdAt\n';
  }
  
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=comments.csv');
  
  res.status(200).send(output);
});

// server/controllers/dashboard.controller.js
const mongoose = require('mongoose');
const Comment = require('../models/Comment');
const Group = require('../models/Group');
const Keyword = require('../models/Keyword');
const ScanTask = require('../models/ScanTask');
const asyncHandler = require('../middlewares/async.middleware');

// @desc    Get dashboard overview
// @route   GET /api/dashboard/overview
// @access  Private
exports.getOverview = asyncHandler(async (req, res, next) => {
  const userId = mongoose.Types.ObjectId(req.user.id);
  
  // Get current date for time calculations
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const last7Days = new Date(today);
  last7Days.setDate(last7Days.getDate() - 7);
  const last30Days = new Date(today);
  last30Days.setDate(last30Days.getDate() - 30);
  
  // Get counts
  const [
    totalGroups,
    activeGroups,
    totalKeywords,
    activeKeywords,
    totalComments,
    todayComments,
    yesterdayComments,
    last7DaysComments,
    last30DaysComments,
    totalTasks,
    pendingTasks,
    runningTasks,
    completedTasks,
    failedTasks
  ] = await Promise.all([
    Group.countDocuments({ user: userId }),
    Group.countDocuments({ user: userId, isActive: true }),
    Keyword.countDocuments({ user: userId }),
    Keyword.countDocuments({ user: userId, isActive: true }),
    Comment.countDocuments({ user: userId }),
    Comment.countDocuments({ 
      user: userId,
      createdAt: { $gte: today }
    }),
    Comment.countDocuments({ 
      user: userId,
      createdAt: { $gte: yesterday, $lt: today }
    }),
    Comment.countDocuments({ 
      user: userId,
      createdAt: { $gte: last7Days }
    }),
    Comment.countDocuments({ 
      user: userId,
      createdAt: { $gte: last30Days }
    }),
    ScanTask.countDocuments({ user: userId }),
    ScanTask.countDocuments({ user: userId, status: 'pending' }),
    ScanTask.countDocuments({ user: userId, status: 'running' }),
    ScanTask.countDocuments({ user: userId, status: 'completed' }),
    ScanTask.countDocuments({ user: userId, status: 'failed' })
  ]);
  
  // Get top groups by comment count
  const topGroups = await Comment.aggregate([
    { $match: { user: userId } },
    { 
      $group: { 
        _id: '$groupId', 
        count: { $sum: 1 },
        groupName: { $first: '$groupName' }
      } 
    },
    { $sort: { count: -1 } },
    { $limit: 5 }
  ]);
  
  // Get top keywords by usage
  const topKeywords = await Comment.aggregate([
    { 
      $match: { 
        user: userId,
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
  ]);
  
  // Get comment trend for last 14 days
  const last14Days = new Date(today);
  last14Days.setDate(last14Days.getDate() - 13);
  
  const commentTrend = await Comment.aggregate([
    { 
      $match: { 
        user: userId,
        createdAt: { $gte: last14Days }
      } 
    },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
          day: { $dayOfMonth: '$createdAt' }
        },
        count: { $sum: 1 }
      }
    },
    { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
  ]);
  
  // Format comment trend data
  const trendData = [];
  let currentDate = new Date(last14Days);
  
  for (let i = 0; i < 14; i++) {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth() + 1;
    const day = currentDate.getDate();
    
    // Find if there's data for this date
    const dataPoint = commentTrend.find(
      item => item._id.year === year && item._id.month === month && item._id.day === day
    );
    
    trendData.push({
      date: `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`,
      count: dataPoint ? dataPoint.count : 0
    });
    
    // Move to next day
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  res.status(200).json({
    success: true,
    data: {
      groups: {
        total: totalGroups,
        active: activeGroups
      },
      keywords: {
        total: totalKeywords,
        active: activeKeywords
      },
      comments: {
        total: totalComments,
        today: todayComments,
        yesterday: yesterdayComments,
        last7Days: last7DaysComments,
        last30Days: last30DaysComments,
        trend: trendData
      },
      tasks: {
        total: totalTasks,
        pending: pendingTasks,
        running: runningTasks,
        completed: completedTasks,
        failed: failedTasks
      },
      topGroups,
      topKeywords
    }
  });
});

// @desc    Get recent activity
// @route   GET /api/dashboard/recent-activity
// @access  Private
exports.getRecentActivity = asyncHandler(async (req, res, next) => {
  // Get recent comments
  const recentComments = await Comment.find({ user: req.user.id })
    .sort('-createdAt')
    .limit(10)
    .select('groupName postContent keywordMatched messageUsed createdAt success');
  
  // Get recent scan tasks
  const recentTasks = await ScanTask.find({ user: req.user.id })
    .sort('-createdAt')
    .limit(10)
    .select('type status scheduledTime startTime endTime results');
  
  res.status(200).json({
    success: true,
    data: {
      recentComments,
      recentTasks
    }
  });
});

// @desc    Get comment statistics
// @route   GET /api/dashboard/stats/comments
// @access  Private
exports.getCommentStats = asyncHandler(async (req, res, next) => {
  const userId = mongoose.Types.ObjectId(req.user.id);
  
  // Time periods
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const last30Days = new Date(today);
  last30Days.setDate(last30Days.getDate() - 30);
  
  // Daily comment counts for last 30 days
  const dailyComments = await Comment.aggregate([
    { 
      $match: { 
        user: userId,
        createdAt: { $gte: last30Days }
      } 
    },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
          day: { $dayOfMonth: '$createdAt' }
        },
        count: { $sum: 1 },
        successCount: { 
          $sum: { 
            $cond: [{ $eq: ['$success', true] }, 1, 0] 
          } 
        },
        failureCount: { 
          $sum: { 
            $cond: [{ $eq: ['$success', false] }, 1, 0] 
          } 
        }
      }
    },
    { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
  ]);
  
  // Format daily data
  const dailyData = [];
  let currentDate = new Date(last30Days);
  
  for (let i = 0; i < 30; i++) {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth() + 1;
    const day = currentDate.getDate();
    
    const dataPoint = dailyComments.find(
      item => item._id.year === year && item._id.month === month && item._id.day === day
    );
    
    dailyData.push({
      date: `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`,
      count: dataPoint ? dataPoint.count : 0,
      success: dataPoint ? dataPoint.successCount : 0,
      failure: dataPoint ? dataPoint.failureCount : 0
    });
    
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  // Hourly distribution of comments
  const hourlyDistribution = await Comment.aggregate([
    { $match: { user: userId } },
    {
      $group: {
        _id: { $hour: '$createdAt' },
        count: { $sum: 1 }
      }
    },
    { $sort: { '_id': 1 } }
  ]);
  
  // Format hourly data
  const hourlyData = Array(24).fill(0).map((_, index) => ({
    hour: index,
    count: 0
  }));
  
  hourlyDistribution.forEach(item => {
    hourlyData[item._id].count = item.count;
  });
  
  // Comment success rate
  const successRateData = await Comment.aggregate([
    { $match: { user: userId } },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        success: { 
          $sum: { 
            $cond: [{ $eq: ['$success', true] }, 1, 0] 
          } 
        }
      }
    }
  ]);
  
  const successRate = successRateData.length > 0 
    ? (successRateData[0].success / successRateData[0].total) * 100 
    : 0;
  
  res.status(200).json({
    success: true,
    data: {
      dailyComments: dailyData,
      hourlyDistribution: hourlyData,
      successRate: parseFloat(successRate.toFixed(2))
    }
  });
});

// @desc    Get group statistics
// @route   GET /api/dashboard/stats/groups
// @access  Private
exports.getGroupStats = asyncHandler(async (req, res, next) => {
  const userId = mongoose.Types.ObjectId(req.user.id);
  
  // Groups by activity
  const groupsByActivity = await Comment.aggregate([
    { $match: { user: userId } },
    {
      $group: {
        _id: '$groupId',
        groupName: { $first: '$groupName' },
        commentCount: { $sum: 1 }
      }
    },
    { $sort: { commentCount: -1 } },
    { $limit: 10 }
  ]);
  
  // Groups by status
  const groupStatus = await Group.aggregate([
    { $match: { user: userId } },
    {
      $group: {
        _id: '$isActive',
        count: { $sum: 1 }
      }
    }
  ]);
  
  const activeGroups = groupStatus.find(item => item._id === true)?.count || 0;
  const inactiveGroups = groupStatus.find(item => item._id === false)?.count || 0;
  
  // Recently added groups
  const recentGroups = await Group.find({ user: userId })
    .sort('-createdAt')
    .limit(5)
    .select('name groupId isActive totalScans totalCommentsPosted createdAt');
  
  res.status(200).json({
    success: true,
    data: {
      groupsByActivity,
      groupStatus: {
        active: activeGroups,
        inactive: inactiveGroups
      },
      recentGroups
    }
  });
});

// @desc    Get keyword statistics
// @route   GET /api/dashboard/stats/keywords
// @access  Private
exports.getKeywordStats = asyncHandler(async (req, res, next) => {
  const userId = mongoose.Types.ObjectId(req.user.id);
  
  // Keywords by usage
  const keywordsByUsage = await Comment.aggregate([
    { 
      $match: { 
        user: userId,
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
    { $limit: 10 }
  ]);
  
  // Keywords by category
  const keywordsByCategory = await Keyword.aggregate([
    { $match: { user: userId } },
    {
      $group: {
        _id: '$category',
        count: { $sum: 1 }
      }
    },
    { $sort: { count: -1 } }
  ]);
  
  // Format category data
  const categoryData = keywordsByCategory.map(item => ({
    category: item._id || 'ไม่มีหมวดหมู่',
    count: item.count
  }));
  
  // Keywords by status
  const keywordStatus = await Keyword.aggregate([
    { $match: { user: userId } },
    {
      $group: {
        _id: '$isActive',
        count: { $sum: 1 }
      }
    }
  ]);
  
  const activeKeywords = keywordStatus.find(item => item._id === true)?.count || 0;
  const inactiveKeywords = keywordStatus.find(item => item._id === false)?.count || 0;
  
  res.status(200).json({
    success: true,
    data: {
      keywordsByUsage,
      keywordsByCategory: categoryData,
      keywordStatus: {
        active: activeKeywords,
        inactive: inactiveKeywords
      }
    }
  });
});

// @desc    Get scan task statistics
// @route   GET /api/dashboard/stats/scan-tasks
// @access  Private
exports.getScanTaskStats = asyncHandler(async (req, res, next) => {
  const userId = mongoose.Types.ObjectId(req.user.id);
  
  // Tasks by status
  const tasksByStatus = await ScanTask.aggregate([
    { $match: { user: userId } },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);
  
  // Format status data
  const statusCounts = {
    pending: 0,
    running: 0,
    completed: 0,
    failed: 0,
    canceled: 0
  };
  
  tasksByStatus.forEach(item => {
    if (statusCounts.hasOwnProperty(item._id)) {
      statusCounts[item._id] = item.count;
    }
  });
  
  // Tasks by type
  const tasksByType = await ScanTask.aggregate([
    { $match: { user: userId } },
    {
      $group: {
        _id: '$type',
        count: { $sum: 1 }
      }
    }
  ]);
  
  const onetimeTasks = tasksByType.find(item => item._id === 'one-time')?.count || 0;
  const recurringTasks = tasksByType.find(item => item._id === 'recurring')?.count || 0;
  
  // Recent tasks with performance
  const recentTasks = await ScanTask.find({ 
    user: userId,
    status: 'completed'
  })
    .sort('-endTime')
    .limit(10)
    .select('startTime endTime results');
  
  // Calculate average duration and post/comment stats
  const taskPerformance = recentTasks.map(task => {
    const duration = task.endTime && task.startTime 
      ? Math.round((task.endTime - task.startTime) / 1000 / 60) // in minutes
      : 0;
    
    return {
      date: task.endTime,
      duration,
      postsScanned: task.results?.totalPostsScanned || 0,
      commentsPosted: task.results?.totalCommentsPosted || 0
    };
  });
  
  res.status(200).json({
    success: true,
    data: {
      tasksByStatus: statusCounts,
      tasksByType: {
        onetime: onetimeTasks,
        recurring: recurringTasks
      },
      taskPerformance
    }
  });
});

// @desc    Get active scans
// @route   GET /api/dashboard/active-scans
// @access  Private
exports.getActiveScans = asyncHandler(async (req, res, next) => {
  const activeTasks = await ScanTask.find({
    user: req.user.id,
    status: 'running'
  })
    .populate('groups', 'name')
    .populate('facebookAccount', 'name email')
    .sort('-startTime');
  
  res.status(200).json({
    success: true,
    count: activeTasks.length,
    data: activeTasks
  });
});
// server/controllers/setting.controller.js
const Setting = require('../models/Setting');
const asyncHandler = require('../middlewares/async.middleware');
const ErrorResponse = require('../utils/errorResponse');

// @desc    Get all settings
// @route   GET /api/settings
// @access  Private
exports.getSettings = asyncHandler(async (req, res, next) => {
  // Get settings for current user
  let settings = await Setting.findOne({ user: req.user.id });
  
  // If no settings found, create default settings
  if (!settings) {
    settings = await Setting.create({ user: req.user.id });
  }
  
  res.status(200).json({
    success: true,
    data: settings
  });
});

// @desc    Update settings
// @route   PUT /api/settings
// @access  Private
exports.updateSettings = asyncHandler(async (req, res, next) => {
  // Get settings for current user
  let settings = await Setting.findOne({ user: req.user.id });
  
  // If no settings found, create default settings
  if (!settings) {
    settings = await Setting.create({ user: req.user.id });
  }
  
  // Update settings
  settings = await Setting.findOneAndUpdate(
    { user: req.user.id },
    req.body,
    {
      new: true,
      runValidators: true
    }
  );
  
  res.status(200).json({
    success: true,
    data: settings
  });
});

// @desc    Get browser settings
// @route   GET /api/settings/browser
// @access  Private
exports.getBrowserSettings = asyncHandler(async (req, res, next) => {
  // Get settings for current user
  let settings = await Setting.findOne({ user: req.user.id });
  
  // If no settings found, create default settings
  if (!settings) {
    settings = await Setting.create({ user: req.user.id });
  }
  
  res.status(200).json({
    success: true,
    data: settings.browserSettings
  });
});

// @desc    Update browser settings
// @route   PUT /api/settings/browser
// @access  Private
exports.updateBrowserSettings = asyncHandler(async (req, res, next) => {
  // Get settings for current user
  let settings = await Setting.findOne({ user: req.user.id });
  
  // If no settings found, create default settings
  if (!settings) {
    settings = await Setting.create({ user: req.user.id });
  }
  
  // Update browser settings
  settings = await Setting.findOneAndUpdate(
    { user: req.user.id },
    { browserSettings: req.body },
    {
      new: true,
      runValidators: true
    }
  );
  
  res.status(200).json({
    success: true,
    data: settings.browserSettings
  });
});

// @desc    Get scan settings
// @route   GET /api/settings/scan
// @access  Private
exports.getScanSettings = asyncHandler(async (req, res, next) => {
  // Get settings for current user
  let settings = await Setting.findOne({ user: req.user.id });
  
  // If no settings found, create default settings
  if (!settings) {
    settings = await Setting.create({ user: req.user.id });
  }
  
  res.status(200).json({
    success: true,
    data: settings.scanSettings
  });
});

// @desc    Update scan settings
// @route   PUT /api/settings/scan
// @access  Private
exports.updateScanSettings = asyncHandler(async (req, res, next) => {
  // Get settings for current user
  let settings = await Setting.findOne({ user: req.user.id });
  
  // If no settings found, create default settings
  if (!settings) {
    settings = await Setting.create({ user: req.user.id });
  }
  
  // Update scan settings
  settings = await Setting.findOneAndUpdate(
    { user: req.user.id },
    { scanSettings: req.body },
    {
      new: true,
      runValidators: true
    }
  );
  
  res.status(200).json({
    success: true,
    data: settings.scanSettings
  });
});

// @desc    Get delay settings
// @route   GET /api/settings/delay
// @access  Private
exports.getDelaySettings = asyncHandler(async (req, res, next) => {
  // Get settings for current user
  let settings = await Setting.findOne({ user: req.user.id });
  
  // If no settings found, create default settings
  if (!settings) {
    settings = await Setting.create({ user: req.user.id });
  }
  
  res.status(200).json({
    success: true,
    data: settings.delaySettings
  });
});

// @desc    Update delay settings
// @route   PUT /api/settings/delay
// @access  Private
exports.updateDelaySettings = asyncHandler(async (req, res, next) => {
  // Get settings for current user
  let settings = await Setting.findOne({ user: req.user.id });
  
  // If no settings found, create default settings
  if (!settings) {
    settings = await Setting.create({ user: req.user.id });
  }
  
  // Update delay settings
  settings = await Setting.findOneAndUpdate(
    { user: req.user.id },
    { delaySettings: req.body },
    {
      new: true,
      runValidators: true
    }
  );
  
  res.status(200).json({
    success: true,
    data: settings.delaySettings
  });
});

// @desc    Get human behavior settings
// @route   GET /api/settings/human-behavior
// @access  Private
exports.getHumanBehaviorSettings = asyncHandler(async (req, res, next) => {
  // Get settings for current user
  let settings = await Setting.findOne({ user: req.user.id });
  
  // If no settings found, create default settings
  if (!settings) {
    settings = await Setting.create({ user: req.user.id });
  }
  
  res.status(200).json({
    success: true,
    data: settings.humanBehaviorSettings
  });
});

// @desc    Update human behavior settings
// @route   PUT /api/settings/human-behavior
// @access  Private
exports.updateHumanBehaviorSettings = asyncHandler(async (req, res, next) => {
  // Get settings for current user
  let settings = await Setting.findOne({ user: req.user.id });
  
  // If no settings found, create default settings
  if (!settings) {
    settings = await Setting.create({ user: req.user.id });
  }
  
  // Update human behavior settings
  settings = await Setting.findOneAndUpdate(
    { user: req.user.id },
    { humanBehaviorSettings: req.body },
    {
      new: true,
      runValidators: true
    }
  );
  
  res.status(200).json({
    success: true,
    data: settings.humanBehaviorSettings
  });
});

// @desc    Get notification settings
// @route   GET /api/settings/notification
// @access  Private
exports.getNotificationSettings = asyncHandler(async (req, res, next) => {
  // Get settings for current user
  let settings = await Setting.findOne({ user: req.user.id });
  
  // If no settings found, create default settings
  if (!settings) {
    settings = await Setting.create({ user: req.user.id });
  }
  
  res.status(200).json({
    success: true,
    data: settings.notificationSettings
  });
});

// @desc    Update notification settings
// @route   PUT /api/settings/notification
// @access  Private
exports.updateNotificationSettings = asyncHandler(async (req, res, next) => {
  // Get settings for current user
  let settings = await Setting.findOne({ user: req.user.id });
  
  // If no settings found, create default settings
  if (!settings) {
    settings = await Setting.create({ user: req.user.id });
  }
  
  // Update notification settings
  settings = await Setting.findOneAndUpdate(
    { user: req.user.id },
    { notificationSettings: req.body },
    {
      new: true,
      runValidators: true
    }
  );
  
  res.status(200).json({
    success: true,
    data: settings.notificationSettings
  });
});

// @desc    Reset settings to default
// @route   POST /api/settings/reset
// @access  Private
exports.resetSettings = asyncHandler(async (req, res, next) => {
  // Delete current settings
  await Setting.findOneAndDelete({ user: req.user.id });
  
  // Create new settings with defaults
  const settings = await Setting.create({ user: req.user.id });
  
  res.status(200).json({
    success: true,
    data: settings
  });
});
// server/controllers/facebook-account.controller.js
const FacebookAccount = require('../models/FacebookAccount');  // ใช้ model ที่ถูกกำหนดไว้ในโมเดล User
const asyncHandler = require('../middlewares/async.middleware');
const ErrorResponse = require('../utils/errorResponse');
const logger = require('../utils/logger');

// @desc    Get all Facebook accounts
// @route   GET /api/facebook-accounts
// @access  Private
exports.getAccounts = asyncHandler(async (req, res, next) => {
  const accounts = await FacebookAccount.find({ user: req.user.id });
  
  res.status(200).json({
    success: true,
    count: accounts.length,
    data: accounts
  });
});

// @desc    Create new Facebook account
// @route   POST /api/facebook-accounts
// @access  Private
exports.createAccount = asyncHandler(async (req, res, next) => {
  // Add user to request body
  req.body.user = req.user.id;
  
  // Create account
  const account = await FacebookAccount.create(req.body);
  
  res.status(201).json({
    success: true,
    data: account
  });
});

// @desc    Get single Facebook account
// @route   GET /api/facebook-accounts/:id
// @access  Private
exports.getAccount = asyncHandler(async (req, res, next) => {
  const account = await FacebookAccount.findOne({
    _id: req.params.id,
    user: req.user.id
  });
  
  if (!account) {
    return next(new ErrorResponse(`ไม่พบบัญชี Facebook ที่มี ID ${req.params.id}`, 404));
  }
  
  res.status(200).json({
    success: true,
    data: account
  });
});

// @desc    Update Facebook account
// @route   PUT /api/facebook-accounts/:id
// @access  Private
exports.updateAccount = asyncHandler(async (req, res, next) => {
  let account = await FacebookAccount.findOne({
    _id: req.params.id,
    user: req.user.id
  });
  
  if (!account) {
    return next(new ErrorResponse(`ไม่พบบัญชี Facebook ที่มี ID ${req.params.id}`, 404));
  }
  
  // Update account
  account = await FacebookAccount.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });
  
  res.status(200).json({
    success: true,
    data: account
  });
});

// @desc    Delete Facebook account
// @route   DELETE /api/facebook-accounts/:id
// @access  Private
exports.deleteAccount = asyncHandler(async (req, res, next) => {
  const account = await FacebookAccount.findOne({
    _id: req.params.id,
    user: req.user.id
  });
  
  if (!account) {
    return next(new ErrorResponse(`ไม่พบบัญชี Facebook ที่มี ID ${req.params.id}`, 404));
  }
  
  await account.remove();
  
  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Test login to Facebook
// @route   POST /api/facebook-accounts/:id/test-login
// @access  Private
exports.testLogin = asyncHandler(async (req, res, next) => {
  const account = await FacebookAccount.findOne({
    _id: req.params.id,
    user: req.user.id
  });
  
  if (!account) {
    return next(new ErrorResponse(`ไม่พบบัญชี Facebook ที่มี ID ${req.params.id}`, 404));
  }
  
  // ทดสอบล็อกอิน (ในสถานการณ์จริงจะใช้ FacebookService)
  // ตรงนี้เป็นเพียงโค้ดตัวอย่าง
  try {
    logger.info(`Testing login for account: ${account.email}`);
    
    // ในตัวอย่างนี้ จะทำเป็นสมมติว่าล็อกอินสำเร็จ
    account.loginStatus = 'success';
    account.lastLogin = new Date();
    await account.save();
    
    res.status(200).json({
      success: true,
      message: 'ทดสอบล็อกอินสำเร็จ'
    });
  } catch (error) {
    logger.error(`Test login failed: ${error.message}`);
    
    account.loginStatus = 'failed';
    await account.save();
    
    return next(new ErrorResponse(`ทดสอบล็อกอินล้มเหลว: ${error.message}`, 500));
  }
});

// @desc    Logout Facebook account
// @route   POST /api/facebook-accounts/:id/logout
// @access  Private
exports.logoutAccount = asyncHandler(async (req, res, next) => {
  const account = await FacebookAccount.findOne({
    _id: req.params.id,
    user: req.user.id
  });
  
  if (!account) {
    return next(new ErrorResponse(`ไม่พบบัญชี Facebook ที่มี ID ${req.params.id}`, 404));
  }
  
  // ทำการลบ cookies หรือข้อมูลเซสชัน
  // ตรงนี้เป็นเพียงโค้ดตัวอย่าง
  
  res.status(200).json({
    success: true,
    message: 'ล็อกเอาต์สำเร็จ'
  });
});

// @desc    Save cookies for Facebook account
// @route   POST /api/facebook-accounts/:id/save-cookies
// @access  Private
exports.saveCookies = asyncHandler(async (req, res, next) => {
  const account = await FacebookAccount.findOne({
    _id: req.params.id,
    user: req.user.id
  });
  
  if (!account) {
    return next(new ErrorResponse(`ไม่พบบัญชี Facebook ที่มี ID ${req.params.id}`, 404));
  }
  
  // บันทึก cookies
  // ตรงนี้เป็นเพียงโค้ดตัวอย่าง
  
  res.status(200).json({
    success: true,
    message: 'บันทึก cookies สำเร็จ'
  });
});
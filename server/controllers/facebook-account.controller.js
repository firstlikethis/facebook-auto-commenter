// server/controllers/facebook-account.controller.js
const FacebookAccount = require('../models/FacebookAccount');
const asyncHandler = require('../middlewares/async.middleware');
const ErrorResponse = require('../utils/errorResponse');
const logger = require('../utils/logger');
const FacebookService = require('../services/facebookService');

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
  
  // สร้างและเริ่มงานทดสอบล็อกอิน
  try {
    // อัปเดตสถานะล็อกอินเป็นกำลังดำเนินการ
    account.loginStatus = 'pending';
    account.error = null; // ล้างข้อผิดพลาดเดิมถ้ามี
    await account.save();
    
    // ส่งการแจ้งเตือนไปยังผู้ใช้ว่ากำลังดำเนินการ
    res.status(200).json({
      success: true,
      message: 'เริ่มทดสอบล็อกอิน กรุณารอสักครู่',
      status: 'pending'
    });
    
    // ทดสอบล็อกอินใน background (ไม่รอให้เสร็จ)
    testLoginInBackground(account, req.user.id);
  } catch (error) {
    logger.error(`Error starting login test: ${error.message}`);
    
    return next(new ErrorResponse(`เกิดข้อผิดพลาดในการเริ่มทดสอบล็อกอิน: ${error.message}`, 500));
  }
});

// ฟังก์ชัน helper สำหรับทดสอบล็อกอินใน background
async function testLoginInBackground(account, userId) {
  let fbService = null;
  
  try {
    logger.info(`Testing login for account: ${account.email}`);
    
    // สร้าง instance ของ FacebookService
    fbService = new FacebookService(account);
    
    // เริ่มต้น browser
    await fbService.initialize();
    
    // ทดสอบล็อกอิน
    const loginSuccess = await fbService.login();
    
    // อัปเดตสถานะล็อกอิน
    if (loginSuccess) {
      account.loginStatus = 'success';
      account.lastLogin = new Date();
      account.error = null; // ล้างข้อผิดพลาดเดิม
    } else {
      account.loginStatus = 'failed';
      account.error = 'เข้าสู่ระบบล้มเหลว';
    }
    
    await account.save();
    logger.info(`Login test for ${account.email} completed with status: ${account.loginStatus}`);
  } catch (error) {
    logger.error(`Test login failed for ${account.email}: ${error.message}`);
    
    // อัปเดตสถานะล็อกอินเป็นล้มเหลวพร้อมข้อความผิดพลาด
    account.loginStatus = 'failed';
    account.error = error.message || 'เข้าสู่ระบบล้มเหลว';
    await account.save();
  } finally {
    // ปิด browser ไม่ว่าจะสำเร็จหรือไม่ก็ตาม
    if (fbService) {
      await fbService.close();
    }
  }
}

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
  
  res.status(200).json({
    success: true,
    message: 'บันทึก cookies สำเร็จ'
  });
});
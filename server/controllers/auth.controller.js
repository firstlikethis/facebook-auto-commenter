// server/controllers/auth.controller.js
const User = require('../models/User');
const asyncHandler = require('../middlewares/async.middleware');
const ErrorResponse = require('../utils/errorResponse');
const logger = require('../utils/logger');

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
exports.register = asyncHandler(async (req, res, next) => {
  const { username, email, password } = req.body;

  // Create user
  const user = await User.create({
    username,
    email,
    password
  });

  // Create default settings for the user
  const Setting = require('../models/Setting');
  await Setting.create({ user: user._id });

  // Log successful registration
  logger.info(`New user registered: ${email}`);

  // Send token in response
  sendTokenResponse(user, 201, res);
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  // Validate email & password
  if (!email || !password) {
    return next(new ErrorResponse('กรุณาระบุอีเมลและรหัสผ่าน', 400));
  }

  // Check for user
  const user = await User.findOne({ email }).select('+password');

  if (!user) {
    logger.warn(`Login attempt with non-existent email: ${email}`);
    return next(new ErrorResponse('ข้อมูลไม่ถูกต้อง', 401));
  }

  // Check if user is active
  if (!user.isActive) {
    logger.warn(`Login attempt for suspended account: ${email}`);
    return next(new ErrorResponse('บัญชีผู้ใช้ถูกระงับ โปรดติดต่อผู้ดูแลระบบ', 401));
  }

  // Check if password matches
  const isMatch = await user.checkPassword(password);

  if (!isMatch) {
    logger.warn(`Failed login attempt (wrong password) for: ${email}`);
    return next(new ErrorResponse('ข้อมูลไม่ถูกต้อง', 401));
  }

  // Update last login
  user.lastLogin = Date.now();
  await user.save();

  logger.info(`User logged in successfully: ${email}`);

  // Send token in response
  sendTokenResponse(user, 200, res);
});

// @desc    Get current logged in user
// @route   GET /api/auth/me.
// @access  Private
exports.getMe = asyncHandler(async (req, res, next) => {
  if (!req.user || !req.user.id) {
    logger.error('getMe called without authenticated user');
    return next(new ErrorResponse('ไม่พบข้อมูลผู้ใช้', 401));
  }

  const user = await User.findById(req.user.id).select('-password');
  
  if (!user) {
    logger.error(`User not found for ID: ${req.user.id}`);
    return next(new ErrorResponse('ไม่พบข้อมูลผู้ใช้', 404));
  }

  res.status(200).json({
    success: true,
    data: user
  });
});

// @desc    Logout user / clear cookie
// @route   POST /api/auth/logout
// @access  Private
exports.logout = asyncHandler(async (req, res, next) => {
  // Clear token cookie if it exists
  if (req.cookies.token) {
    res.clearCookie('token');
  }

  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
exports.changePassword = asyncHandler(async (req, res, next) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return next(new ErrorResponse('กรุณาระบุรหัสผ่านปัจจุบันและรหัสผ่านใหม่', 400));
  }

  const user = await User.findById(req.user.id).select('+password');

  if (!user) {
    return next(new ErrorResponse('ไม่พบข้อมูลผู้ใช้', 404));
  }

  // Check current password
  const isMatch = await user.checkPassword(currentPassword);
  
  if (!isMatch) {
    return next(new ErrorResponse('รหัสผ่านปัจจุบันไม่ถูกต้อง', 401));
  }

  user.password = newPassword;
  await user.save();

  res.status(200).json({
    success: true,
    message: 'เปลี่ยนรหัสผ่านสำเร็จ'
  });
});

// Helper function to send token response
const sendTokenResponse = (user, statusCode, res) => {
  // Create token
  const token = user.generateAuthToken();

  // Create cookie options
  const cookieOptions = {
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 1 day
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'Lax'
  };

  // Remove password from output
  user.password = undefined;

  res
    .status(statusCode)
    .cookie('token', token, cookieOptions)
    .json({
      success: true,
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
};
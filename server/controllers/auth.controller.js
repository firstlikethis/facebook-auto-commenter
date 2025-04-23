// server/controllers/auth.controller.js
const User = require('../models/User');
const asyncHandler = require('../middlewares/async.middleware');
const ErrorResponse = require('../utils/errorResponse');

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
  const user = await User.findOne({ email });

  if (!user) {
    return next(new ErrorResponse('ข้อมูลไม่ถูกต้อง', 401));
  }

  // Check if user is active
  if (!user.isActive) {
    return next(new ErrorResponse('บัญชีผู้ใช้ถูกระงับ โปรดติดต่อผู้ดูแลระบบ', 401));
  }

  // Check if password matches
  const isMatch = await user.checkPassword(password);

  if (!isMatch) {
    return next(new ErrorResponse('ข้อมูลไม่ถูกต้อง', 401));
  }

  // Update last login
  user.lastLogin = Date.now();
  await user.save();

  // Send token in response
  sendTokenResponse(user, 200, res);
});

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id).select('-password');
  res.status(200).json({
    success: true,
    data: user
  });
});

// @desc    Logout user / clear cookie
// @route   POST /api/auth/logout
// @access  Private
exports.logout = asyncHandler(async (req, res, next) => {
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

  const user = await User.findById(req.user.id);

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

  res.status(statusCode).json({
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

const jwt = require('jsonwebtoken');
const asyncHandler = require('./async.middleware');
const ErrorResponse = require('../utils/errorResponse');
const User = require('../models/User');

// ป้องกันเส้นทางที่ต้องล็อกอิน
exports.protect = asyncHandler(async (req, res, next) => {
  let token;

  // ดึง token จาก header
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }
  // ถ้าไม่มี token
  else if (req.cookies?.token) {
    token = req.cookies.token;
  }

  // ตรวจสอบว่ามี token หรือไม่
  if (!token) {
    return next(new ErrorResponse('กรุณาเข้าสู่ระบบเพื่อเข้าถึงข้อมูลนี้', 401));
  }

  try {
    // ตรวจสอบ token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // ดึงข้อมูลผู้ใช้
    const user = await User.findById(decoded.id);

    if (!user) {
      return next(new ErrorResponse('ไม่พบผู้ใช้ที่มี ID นี้', 401));
    }

    // ตรวจสอบว่าบัญชีถูกระงับหรือไม่
    if (!user.isActive) {
      return next(new ErrorResponse('บัญชีของคุณถูกระงับ กรุณาติดต่อผู้ดูแลระบบ', 403));
    }

    // เพิ่มข้อมูลผู้ใช้ไปยัง request
    req.user = user;
    next();
  } catch (err) {
    return next(new ErrorResponse('ไม่มีสิทธิ์ในการเข้าถึงข้อมูลนี้', 401));
  }
});

// ตรวจสอบสิทธิ์ของผู้ใช้
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(new ErrorResponse(`บทบาท ${req.user.role} ไม่มีสิทธิ์ในการเข้าถึงข้อมูลนี้`, 403));
    }
    next();
  };
};
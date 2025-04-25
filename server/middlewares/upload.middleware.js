// server/middlewares/upload.middleware.js
const multer = require('multer');
const path = require('path');
const fs = require('fs-extra');
const ErrorResponse = require('../utils/errorResponse');

// ตั้งค่าที่เก็บไฟล์
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // สร้างโฟลเดอร์ตาม user ID
    const uploadPath = path.join(process.env.FILE_UPLOAD_PATH || './uploads', `user_${req.user.id}`);
    fs.ensureDirSync(uploadPath); // สร้างโฟลเดอร์ถ้ายังไม่มี
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // สร้างชื่อไฟล์ที่ไม่ซ้ำกัน
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    cb(null, 'keyword_image_' + uniqueSuffix + extension);
  }
});

// ตรวจสอบชนิดของไฟล์
const fileFilter = (req, file, cb) => {
  // อนุญาตเฉพาะไฟล์รูปภาพ
  const allowedTypes = /jpeg|jpg|png|gif/;
  const isValid = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimeTypeValid = allowedTypes.test(file.mimetype);
  
  if (isValid && mimeTypeValid) {
    cb(null, true);
  } else {
    cb(new ErrorResponse('กรุณาอัปโหลดไฟล์รูปภาพเท่านั้น (jpg, jpeg, png, gif)', 400), false);
  }
};

// ตั้งค่า multer
const upload = multer({
  storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10485760, // 10MB
    files: 1 // รับได้เพียง 1 ไฟล์
  },
  fileFilter
});

module.exports = upload;
// server/app.js
const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const helmet = require('helmet');
const xss = require('xss-clean');
const rateLimit = require('express-rate-limit');
const hpp = require('hpp');
const compression = require('compression');
const mongoSanitize = require('express-mongo-sanitize');
const path = require('path');
const dotenv = require('dotenv');
const fileUpload = require('express-fileupload');
const cookieParser = require('cookie-parser');
const errorHandler = require('./middlewares/error.middleware');
const routes = require('./routes');

// โหลดตัวแปรจาก .env
dotenv.config();

// สร้าง express app
const app = express();

// ตั้งค่า trust proxy สำหรับ rate limit (ต้องอยู่หลังการสร้าง app)
app.set('trust proxy', 1);

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Cookie parser
app.use(cookieParser());

// ใช้ morgan สำหรับ logging ในโหมด development
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// File upload
app.use(fileUpload({
  createParentPath: true,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
}));

// Security middleware
app.use(helmet()); // ตั้งค่า security headers
app.use(xss()); // ป้องกัน Cross-Site Scripting (XSS)
app.use(mongoSanitize()); // ป้องกัน NoSQL Injection
app.use(hpp()); // ป้องกัน HTTP Parameter Pollution

// Rate limiting - ป้องกันการโจมตีแบบ Brute Force
const limiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 นาที
  max: 1000, // จำกัด 1000 requests ต่อ IP ในแต่ละช่วงเวลา
  message: {
    status: 429,
    message: 'คำขอมากเกินไป กรุณาลองใหม่ภายหลัง'
  }
});
app.use(limiter);

// บีบอัดการตอบกลับ
app.use(compression());

// ตั้งค่า CORS - อนุญาต cross-origin requests
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));

// ใช้ routes
app.use(routes);

// ตั้งค่า static folder สำหรับไฟล์ที่อัปโหลด
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ถ้าอยู่ในโหมด production ให้เสิร์ฟไฟล์ static จาก build ของ React
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/build')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/build', 'index.html'));
  });
}

// Custom error handler
app.use(errorHandler);

module.exports = app;
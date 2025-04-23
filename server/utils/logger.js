// server/utils/logger.js
const winston = require('winston');
const path = require('path');
const fs = require('fs-extra');

// ตรวจสอบและสร้างโฟลเดอร์สำหรับเก็บไฟล์ล็อก
const logDir = path.join(process.cwd(), 'logs');
fs.ensureDirSync(logDir);

// กำหนดรูปแบบการแสดงผลล็อก
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(info => `${info.timestamp} ${info.level}: ${info.message}`)
);

const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.json()
);

// สร้าง logger
const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: fileFormat,
  transports: [
    // เก็บล็อกทุกระดับไว้ใน combined.log
    new winston.transports.File({ 
      filename: path.join(logDir, 'combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
    // เก็บล็อกระดับ error ไว้ใน error.log
    new winston.transports.File({ 
      filename: path.join(logDir, 'error.log'), 
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    })
  ]
});

// ในโหมด development แสดงล็อกในคอนโซลด้วย
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: consoleFormat
  }));
}

module.exports = logger;
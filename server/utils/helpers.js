// server/utils/helpers.js
const crypto = require('crypto');
const path = require('path');
const fs = require('fs-extra');

/**
 * สร้าง hash จากข้อความ input
 * @param {string} input - ข้อความที่ต้องการสร้าง hash
 * @returns {string} MD5 hash
 */
exports.generateHash = (input) => {
  return crypto.createHash('md5').update(input || '').digest('hex');
};

/**
 * สร้างความล่าช้าแบบสุ่มระหว่างค่า min และ max
 * @param {number} min - ค่าต่ำสุด (มิลลิวินาที)
 * @param {number} max - ค่าสูงสุด (มิลลิวินาที)
 * @returns {Promise<void>}
 */
exports.getRandomDelay = (min, max) => {
  const delay = Math.floor(Math.random() * (max - min + 1)) + min;
  return new Promise(resolve => setTimeout(resolve, delay));
};

/**
 * แปลงคำสำคัญให้เป็นรูปแบบมาตรฐาน
 * @param {string} keyword - คำสำคัญที่ต้องการแปลง
 * @returns {Array<string>} รายการคำสำคัญที่แปลงแล้ว
 */
exports.normalizeKeyword = (keyword) => {
  if (!keyword) return [];
  
  // แยกคำสำคัญที่คั่นด้วย |
  return keyword.split('|')
    .map(k => k.trim())
    .filter(k => k.length > 0);
};

/**
 * ลบไฟล์
 * @param {string} filePath - พาธของไฟล์ที่ต้องการลบ
 * @returns {Promise<boolean>} สถานะการลบ
 */
exports.removeFile = async (filePath) => {
  try {
    if (fs.existsSync(filePath)) {
      await fs.unlink(filePath);
      return true;
    }
    return false;
  } catch (error) {
    console.error(`Error removing file: ${error.message}`);
    return false;
  }
};

/**
 * สร้างชื่อไฟล์ที่ไม่ซ้ำกัน
 * @param {string} originalname - ชื่อไฟล์ต้นฉบับ
 * @returns {string} ชื่อไฟล์ที่ไม่ซ้ำกัน
 */
exports.generateUniqueFilename = (originalname) => {
  const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
  const extension = path.extname(originalname);
  return 'file-' + uniqueSuffix + extension;
};
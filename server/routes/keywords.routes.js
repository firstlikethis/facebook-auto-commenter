const express = require('express');
const router = express.Router();
const keywordController = require('../controllers/keyword.controller');
const { protect } = require('../middlewares/auth.middleware');
const multer = require('multer');
const path = require('path');
const fs = require('fs-extra');

router.use(protect); // Require authentication for all routes

// ย้ายเส้นทางพิเศษให้อยู่ข้างบนก่อนเส้นทางที่มี parameter ID
router.get('/categories', keywordController.getCategories);
router.get('/stats', keywordController.getKeywordStats);

// กำหนด multer storage ตรงนี้ (ไม่ใช้ multer middleware แยก)
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(process.env.FILE_UPLOAD_PATH || './uploads', `user_${req.user.id}`);
    fs.ensureDirSync(uploadDir);
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    cb(null, 'img_' + uniqueSuffix + extension);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: function (req, file, cb) {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const mimetype = allowedTypes.test(file.mimetype);
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('เฉพาะไฟล์ภาพเท่านั้น (jpg, jpeg, png, gif)'));
  }
});

// เส้นทางหลัก CRUD
router.get('/', keywordController.getKeywords);
router.post('/', keywordController.createKeyword);
router.get('/:id', keywordController.getKeyword);
router.put('/:id', keywordController.updateKeyword);
router.delete('/:id', keywordController.deleteKeyword);
router.post('/:id/toggle-status', keywordController.toggleKeywordStatus);

// ต้องใช้ upload.single และระบุชื่อฟิลด์ให้ตรงกับที่ front-end ส่งมา
router.post('/:id/upload-image', upload.single('image'), keywordController.uploadImage);
router.delete('/:id/image/:imageId', keywordController.deleteImage);

module.exports = router;
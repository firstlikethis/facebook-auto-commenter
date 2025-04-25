// server/routes/keywords.routes.js
const express = require('express');
const router = express.Router();
const keywordController = require('../controllers/keyword.controller');
const { protect } = require('../middlewares/auth.middleware');
const upload = require('../middlewares/upload.middleware');

router.use(protect); // Require authentication for all routes

// ย้ายเส้นทางพิเศษให้อยู่ข้างบนก่อนเส้นทางที่มี parameter ID
router.get('/categories', keywordController.getCategories);
router.get('/stats', keywordController.getKeywordStats);

// เส้นทางหลัก CRUD
router.get('/', keywordController.getKeywords);
router.post('/', keywordController.createKeyword);
router.get('/:id', keywordController.getKeyword);
router.put('/:id', keywordController.updateKeyword);
router.delete('/:id', keywordController.deleteKeyword);
router.post('/:id/toggle-status', keywordController.toggleKeywordStatus);
router.post('/:id/upload-image', upload.single('image'), keywordController.uploadImage);
router.delete('/:id/image/:imageId', keywordController.deleteImage);

module.exports = router;
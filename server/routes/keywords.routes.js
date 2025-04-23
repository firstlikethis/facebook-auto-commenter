// server/routes/keywords.routes.js
const express = require('express');
const router = express.Router();
const keywordController = require('../controllers/keyword.controller');
const { protect } = require('../middlewares/auth.middleware');
const upload = require('../middlewares/upload.middleware');

router.use(protect); // Require authentication for all routes

router.get('/', keywordController.getKeywords);
router.post('/', keywordController.createKeyword);
router.get('/:id', keywordController.getKeyword);
router.put('/:id', keywordController.updateKeyword);
router.delete('/:id', keywordController.deleteKeyword);
router.post('/:id/toggle-status', keywordController.toggleKeywordStatus);
router.post('/:id/upload-image', upload.single('image'), keywordController.uploadImage);
router.delete('/:id/image/:imageId', keywordController.deleteImage);
router.get('/categories', keywordController.getCategories);
router.get('/stats', keywordController.getKeywordStats);

module.exports = router;
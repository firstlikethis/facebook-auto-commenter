// server/controllers/keyword.controller.js
const Keyword = require('../models/Keyword');  // Fix: Changed from '../models/User' to '../models/Keyword'
const asyncHandler = require('../middlewares/async.middleware');
const ErrorResponse = require('../utils/errorResponse');
const path = require('path');
const fs = require('fs-extra');

// @desc    Get all keywords
// @route   GET /api/keywords
// @access  Private
exports.getKeywords = asyncHandler(async (req, res, next) => {
  // Add pagination, filtering, and sorting
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  const sort = req.query.sort || '-createdAt';
  
  // Filter options
  const filter = { user: req.user.id };
  
  if (req.query.isActive) {
    filter.isActive = req.query.isActive === 'true';
  }
  
  if (req.query.category) {
    filter.category = req.query.category;
  }
  
  if (req.query.search) {
    filter.$or = [
      { keyword: { $regex: req.query.search, $options: 'i' } },
      { variations: { $regex: req.query.search, $options: 'i' } },
      { category: { $regex: req.query.search, $options: 'i' } }
    ];
  }
  
  // Get total count
  const total = await Keyword.countDocuments(filter);
  
  // Execute query
  const keywords = await Keyword.find(filter)
    .sort(sort)
    .skip(startIndex)
    .limit(limit);
  
  // Pagination result
  const pagination = {};
  
  if (endIndex < total) {
    pagination.next = {
      page: page + 1,
      limit
    };
  }
  
  if (startIndex > 0) {
    pagination.prev = {
      page: page - 1,
      limit
    };
  }
  
  res.status(200).json({
    success: true,
    count: keywords.length,
    total,
    pagination,
    data: keywords
  });
});

// @desc    Create new keyword
// @route   POST /api/keywords
// @access  Private
exports.createKeyword = asyncHandler(async (req, res, next) => {
  // Add user to request body
  req.body.user = req.user.id;
  
  // Create keyword
  const keyword = await Keyword.create(req.body);
  
  res.status(201).json({
    success: true,
    data: keyword
  });
});

// @desc    Get single keyword
// @route   GET /api/keywords/:id
// @access  Private
exports.getKeyword = asyncHandler(async (req, res, next) => {
  const keyword = await Keyword.findOne({
    _id: req.params.id,
    user: req.user.id
  });
  
  if (!keyword) {
    return next(new ErrorResponse(`ไม่พบคำสำคัญที่มี ID ${req.params.id}`, 404));
  }
  
  res.status(200).json({
    success: true,
    data: keyword
  });
});

// @desc    Update keyword
// @route   PUT /api/keywords/:id
// @access  Private
exports.updateKeyword = asyncHandler(async (req, res, next) => {
  let keyword = await Keyword.findOne({
    _id: req.params.id,
    user: req.user.id
  });
  
  if (!keyword) {
    return next(new ErrorResponse(`ไม่พบคำสำคัญที่มี ID ${req.params.id}`, 404));
  }
  
  // Update keyword
  keyword = await Keyword.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });
  
  res.status(200).json({
    success: true,
    data: keyword
  });
});

// @desc    Delete keyword
// @route   DELETE /api/keywords/:id
// @access  Private
exports.deleteKeyword = asyncHandler(async (req, res, next) => {
  const keyword = await Keyword.findOne({
    _id: req.params.id,
    user: req.user.id
  });
  
  if (!keyword) {
    return next(new ErrorResponse(`ไม่พบคำสำคัญที่มี ID ${req.params.id}`, 404));
  }
  
  await keyword.remove();
  
  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Toggle keyword status
// @route   POST /api/keywords/:id/toggle-status
// @access  Private
exports.toggleKeywordStatus = asyncHandler(async (req, res, next) => {
  const keyword = await Keyword.findOne({
    _id: req.params.id,
    user: req.user.id
  });
  
  if (!keyword) {
    return next(new ErrorResponse(`ไม่พบคำสำคัญที่มี ID ${req.params.id}`, 404));
  }
  
  // Toggle status
  keyword.isActive = !keyword.isActive;
  await keyword.save();
  
  res.status(200).json({
    success: true,
    data: keyword
  });
});

// @desc    Upload image for keyword
// @route   POST /api/keywords/:id/upload-image
// @access  Private
exports.uploadImage = asyncHandler(async (req, res, next) => {
  const keyword = await Keyword.findOne({
    _id: req.params.id,
    user: req.user.id
  });
  
  if (!keyword) {
    return next(new ErrorResponse(`ไม่พบคำสำคัญที่มี ID ${req.params.id}`, 404));
  }
  
  // Check if image was uploaded
  if (!req.files || !req.files.image) {
    return next(new ErrorResponse('กรุณาอัปโหลดรูปภาพ', 400));
  }
  
  const image = req.files.image;
  
  // Check if image is actually an image
  if (!image.mimetype.startsWith('image')) {
    return next(new ErrorResponse('กรุณาอัปโหลดไฟล์รูปภาพเท่านั้น', 400));
  }
  
  // Check file size
  if (image.size > process.env.MAX_FILE_SIZE) {
    return next(new ErrorResponse(`ขนาดไฟล์เกินขนาดที่กำหนด (${process.env.MAX_FILE_SIZE / 1024 / 1024} MB)`, 400));
  }
  
  // Create custom filename
  const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
  const extension = path.extname(image.name);
  const filename = `keyword_image_${keyword._id}_${uniqueSuffix}${extension}`;
  
  // Create upload dir if not exists
  const uploadDir = path.join(process.env.FILE_UPLOAD_PATH || './uploads', `user_${req.user.id}`);
  fs.ensureDirSync(uploadDir);
  
  // Move file to upload dir
  const filePath = path.join(uploadDir, filename);
  await image.mv(filePath);
  
  // Get url for file
  const baseUrl = `${req.protocol}://${req.get('host')}`;
  const imageUrl = `${baseUrl}/uploads/user_${req.user.id}/${filename}`;
  
  // Add image to keyword
  keyword.images.push({
    path: filePath,
    url: imageUrl,
    weight: 1
  });
  
  await keyword.save();
  
  res.status(200).json({
    success: true,
    data: keyword
  });
});

// @desc    Delete image
// @route   DELETE /api/keywords/:id/image/:imageId
// @access  Private
exports.deleteImage = asyncHandler(async (req, res, next) => {
  const keyword = await Keyword.findOne({
    _id: req.params.id,
    user: req.user.id
  });
  
  if (!keyword) {
    return next(new ErrorResponse(`ไม่พบคำสำคัญที่มี ID ${req.params.id}`, 404));
  }
  
  // Find image
  const image = keyword.images.id(req.params.imageId);
  
  if (!image) {
    return next(new ErrorResponse(`ไม่พบรูปภาพที่มี ID ${req.params.imageId}`, 404));
  }
  
  // Remove file if exists
  if (image.path && fs.existsSync(image.path)) {
    fs.unlinkSync(image.path);
  }
  
  // Remove image from keyword
  keyword.images.pull(req.params.imageId);
  await keyword.save();
  
  res.status(200).json({
    success: true,
    data: keyword
  });
});

// @desc    Get keyword categories
// @route   GET /api/keywords/categories
// @access  Private
exports.getCategories = asyncHandler(async (req, res, next) => {
  const categories = await Keyword.distinct('category', { 
    user: req.user.id,
    category: { $ne: '' }
  });
  
  res.status(200).json({
    success: true,
    data: categories
  });
});

// @desc    Get keyword statistics
// @route   GET /api/keywords/stats
// @access  Private
exports.getKeywordStats = asyncHandler(async (req, res, next) => {
  const [total, active, withImages] = await Promise.all([
    Keyword.countDocuments({ user: req.user.id }),
    Keyword.countDocuments({ user: req.user.id, isActive: true }),
    Keyword.countDocuments({ 
      user: req.user.id,
      'images.0': { $exists: true }
    })
  ]);
  
  // Most used keywords
  const mostUsed = await Keyword.find({ user: req.user.id })
    .sort('-totalUses')
    .limit(10)
    .select('keyword totalUses lastUsedAt');
  
  res.status(200).json({
    success: true,
    data: {
      total,
      active,
      withImages,
      mostUsed
    }
  });
});
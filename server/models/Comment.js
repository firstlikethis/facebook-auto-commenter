// server/models/Comment.js
const mongoose = require('mongoose');

const CommentSchema = new mongoose.Schema({
  postHash: { 
    type: String, 
    required: true, 
    index: true 
  },
  postId: { 
    type: String,
    index: true
  },
  groupId: { 
    type: String, 
    required: true, 
    index: true 
  },
  group: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group'
  },
  postUrl: { 
    type: String 
  },
  postContent: { 
    type: String,
    maxlength: 1000 // จำกัดที่ 1000 ตัวอักษรแรก
  },
  contentHash: {
    type: String
  },
  authorName: {
    type: String
  },
  keywordMatched: { 
    type: String 
  },
  keywordId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Keyword'
  },
  messageUsed: { 
    type: String,
    required: true 
  },
  imageUsed: { 
    type: String 
  },
  timestamp: { 
    type: Date, 
    default: Date.now, 
    index: true 
  },
  success: {
    type: Boolean,
    default: true
  },
  facebookAccount: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FacebookAccount'
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// สร้าง compound indexes สำหรับการค้นหาที่มีประสิทธิภาพ
CommentSchema.index({ postHash: 1, groupId: 1 });
CommentSchema.index({ groupId: 1, timestamp: -1 });
CommentSchema.index({ keywordMatched: 1, timestamp: -1 });
CommentSchema.index({ user: 1, timestamp: -1 });

const Comment = mongoose.model('Comment', CommentSchema);
module.exports = Comment;
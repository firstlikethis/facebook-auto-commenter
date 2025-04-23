// server/services/commentService.js
const Comment = require('../models/Comment');
const Keyword = require('../models/Keyword');
const Group = require('../models/Group');
const logger = require('../utils/logger');
const { generateHash } = require('../utils/helpers');

/**
 * Service สำหรับจัดการข้อความคอมเมนต์
 */
class CommentService {
  /**
   * เพิ่มคอมเมนต์ใหม่
   */
  async addComment(commentData) {
    try {
      // สร้าง post hash
      const postHash = generateHash(commentData.postId || commentData.postUrl || commentData.postContent);
      
      // เตรียมข้อมูลคอมเมนต์
      const newComment = {
        postHash,
        postId: commentData.postId,
        groupId: commentData.groupId,
        group: commentData.group,
        postUrl: commentData.postUrl,
        postContent: commentData.postContent ? commentData.postContent.substring(0, 1000) : '',
        contentHash: commentData.contentHash || generateHash(commentData.postContent || ''),
        authorName: commentData.authorName,
        keywordMatched: commentData.keywordMatched,
        keywordId: commentData.keywordId,
        messageUsed: commentData.messageUsed,
        imageUsed: commentData.imageUsed,
        success: commentData.success,
        facebookAccount: commentData.facebookAccount,
        user: commentData.user
      };
      
      // บันทึกคอมเมนต์
      const comment = await Comment.create(newComment);
      
      // อัปเดตสถิติของคำสำคัญ
      if (comment.keywordId && comment.success) {
        await Keyword.findByIdAndUpdate(comment.keywordId, {
          $inc: { totalUses: 1 },
          lastUsedAt: new Date()
        });
      }
      
      // อัปเดตสถิติของกลุ่ม
      if (comment.group && comment.success) {
        await Group.findByIdAndUpdate(comment.group, {
          $inc: { totalCommentsPosted: 1 }
        });
      }
      
      return comment;
    } catch (error) {
      logger.error(`Error adding comment: ${error.message}`);
      throw error;
    }
  }

  /**
   * ตรวจสอบว่าเคยคอมเมนต์โพสต์นี้แล้วหรือไม่
   */
  async hasCommented(postIdentifier, userId) {
    try {
      const postHash = generateHash(postIdentifier);
      
      const comment = await Comment.findOne({
        postHash,
        user: userId
      });
      
      return !!comment;
    } catch (error) {
      logger.error(`Error checking comment: ${error.message}`);
      throw error;
    }
  }

  /**
   * ลบข้อมูลคอมเมนต์เก่า
   */
  async cleanupOldComments(days, userId) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - (days || 30));
      
      const query = {
        createdAt: { $lt: cutoffDate }
      };
      
      // เพิ่ม userId ถ้ามีการระบุ
      if (userId) {
        query.user = userId;
      }
      
      const result = await Comment.deleteMany(query);
      
      return {
        success: true,
        count: result.deletedCount
      };
    } catch (error) {
      logger.error(`Error cleaning up old comments: ${error.message}`);
      throw error;
    }
  }
}

// Export singleton instance
module.exports = new CommentService();
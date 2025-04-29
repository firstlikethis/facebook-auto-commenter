// client/src/services/commentService.js
import api from './api';

export const commentService = {
  // Get all comments with pagination
  async getComments(page = 1, limit = 20, filter = {}) {
    try {
      const params = { page, limit, ...filter };
      const response = await api.get('/comments', { params });
      return response.data;
    } catch (error) {
      console.error('Error getting comments:', error);
      // ส่งผลลัพธ์เริ่มต้นเมื่อเกิดข้อผิดพลาด เพื่อป้องกันการ crash ของ UI
      throw new Error(error.response?.data?.message || 'เกิดข้อผิดพลาดในการดึงข้อมูลคอมเมนต์');
    }
  },

  // Get single comment
  async getComment(id) {
    try {
      const response = await api.get(`/comments/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error getting comment ${id}:`, error);
      throw new Error(error.response?.data?.message || 'เกิดข้อผิดพลาดในการดึงข้อมูลคอมเมนต์');
    }
  },

  // Delete comment
  async deleteComment(id) {
    try {
      const response = await api.delete(`/comments/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting comment ${id}:`, error);
      throw new Error(error.response?.data?.message || 'เกิดข้อผิดพลาดในการลบคอมเมนต์');
    }
  },

  // Get comment statistics
  async getCommentStats() {
    try {
      const response = await api.get('/comments/stats');
      return response.data;
    } catch (error) {
      console.error('Error getting comment stats:', error);
      // ส่งคืนข้อมูลเริ่มต้นเพื่อให้ UI แสดงได้แม้จะเกิด error
      return { 
        success: true, 
        data: {
          total: 0,
          today: 0,
          yesterday: 0,
          last7Days: 0,
          last30Days: 0,
          successCount: 0,
          failureCount: 0,
          successRate: 0
        }
      };
    }
  },

  // Clean up old comments
  async cleanupOldComments(days = 30) {
    try {
      const response = await api.post('/comments/cleanup', { days });
      return response.data;
    } catch (error) {
      console.error('Error cleaning up old comments:', error);
      throw new Error(error.response?.data?.message || 'เกิดข้อผิดพลาดในการลบคอมเมนต์เก่า');
    }
  },

  // Search comments
  async searchComments(searchParams) {
    try {
      const response = await api.get('/comments/search', {
        params: searchParams
      });
      return response.data;
    } catch (error) {
      console.error('Error searching comments:', error);
      throw new Error(error.response?.data?.message || 'เกิดข้อผิดพลาดในการค้นหาคอมเมนต์');
    }
  },

  // Export comments
  async exportComments(format = 'csv', filterParams = {}) {
    try {
      const params = { format, ...filterParams };
      const response = await api.get('/comments/export', { 
        params,
        responseType: 'blob' 
      });
      
      return response.data;
    } catch (error) {
      console.error('Error exporting comments:', error);
      throw new Error('เกิดข้อผิดพลาดในการส่งออกข้อมูลคอมเมนต์');
    }
  }
};
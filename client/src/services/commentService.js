
// client/src/services/commentService.js
import api from './api';

export const commentService = {
  // Get all comments with pagination
  async getComments(page = 1, limit = 20, filter = {}) {
    const params = { page, limit, ...filter };
    const response = await api.get('/comments', { params });
    return response.data;
  },

  // Get single comment
  async getComment(id) {
    const response = await api.get(`/comments/${id}`);
    return response.data.data;
  },

  // Delete comment
  async deleteComment(id) {
    const response = await api.delete(`/comments/${id}`);
    return response.data;
  },

  // Get comment statistics
  async getCommentStats() {
    const response = await api.get('/comments/stats');
    return response.data.data;
  },

  // Cleanup old comments
  async cleanupOldComments(days) {
    const response = await api.post('/comments/cleanup', { days });
    return response.data;
  },

  // Search comments
  async searchComments(searchParams) {
    const response = await api.get('/comments/search', { params: searchParams });
    return response.data;
  },

  // Export comments
  async exportComments(format = 'csv', filter = {}) {
    const params = { format, ...filter };
    const response = await api.get('/comments/export', { 
      params,
      responseType: 'blob'
    });
    return response.data;
  }
};
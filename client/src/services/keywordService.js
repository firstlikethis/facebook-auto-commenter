
// client/src/services/keywordService.js
import api from './api';

export const keywordService = {
  // Get all keywords with pagination
  async getKeywords(page = 1, limit = 10, filter = {}) {
    const params = { page, limit, ...filter };
    const response = await api.get('/keywords', { params });
    return response.data;
  },

  // Get single keyword
  async getKeyword(id) {
    const response = await api.get(`/keywords/${id}`);
    return response.data.data;
  },

  // Create keyword
  async createKeyword(keywordData) {
    const response = await api.post('/keywords', keywordData);
    return response.data.data;
  },

  // Update keyword
  async updateKeyword(id, keywordData) {
    const response = await api.put(`/keywords/${id}`, keywordData);
    return response.data.data;
  },

  // Delete keyword
  async deleteKeyword(id) {
    const response = await api.delete(`/keywords/${id}`);
    return response.data;
  },

  // Toggle keyword status
  async toggleKeywordStatus(id) {
    const response = await api.post(`/keywords/${id}/toggle-status`);
    return response.data.data;
  },

  // Upload image for keyword
  async uploadImage(id, imageFile) {
    const formData = new FormData();
    formData.append('image', imageFile);
    
    const response = await api.post(`/keywords/${id}/upload-image`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data.data;
  },

  // Delete image
  async deleteImage(keywordId, imageId) {
    const response = await api.delete(`/keywords/${keywordId}/image/${imageId}`);
    return response.data;
  },

  // Get keyword categories
  async getCategories() {
    const response = await api.get('/keywords/categories');
    return response.data.data;
  },

  // Get keyword statistics
  async getKeywordStats() {
    const response = await api.get('/keywords/stats');
    return response.data.data;
  }
};
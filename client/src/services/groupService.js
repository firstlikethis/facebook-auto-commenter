// client/src/services/groupService.js
import api from './api';

export const groupService = {
  // Get all groups with pagination
  async getGroups(page = 1, limit = 10, filter = {}) {
    const params = { page, limit, ...filter };
    const response = await api.get('/groups', { params });
    return response.data;
  },

  // Get single group
  async getGroup(id) {
    const response = await api.get(`/groups/${id}`);
    return response.data;
  },

  // Create group
  async createGroup(groupData) {
    const response = await api.post('/groups', groupData);
    return response.data;
  },

  // Update group
  async updateGroup(id, groupData) {
    const response = await api.put(`/groups/${id}`, groupData);
    return response.data;
  },

  // Delete group
  async deleteGroup(id) {
    const response = await api.delete(`/groups/${id}`);
    return response.data;
  },

  // Detect Facebook groups
  async detectGroups(facebookAccountId) {
    const response = await api.post('/groups/detect', { facebookAccountId });
    return response.data;
  },

  // Get group statistics
  async getGroupStats(id) {
    const response = await api.get(`/groups/${id}/stats`);
    return response.data;
  },

  // Toggle group status
  async toggleGroupStatus(id) {
    const response = await api.post(`/groups/${id}/toggle-status`);
    return response.data;
  },

  // Scan single group
  async scanGroup(id, options = {}) {
    const response = await api.post(`/groups/${id}/scan`, options);
    return response.data;
  },

  // Get comments for a group
  async getGroupComments(id, page = 1, limit = 20) {
    const response = await api.get(`/groups/${id}/comments`, {
      params: { page, limit }
    });
    return response.data;
  }
};
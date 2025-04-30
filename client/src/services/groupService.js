// client/src/services/groupService.js
import api from './api';

export const groupService = {
  // Get all groups with pagination
  async getGroups(page = 1, limit = 10, filter = {}) {
    try {
      const params = { page, limit, ...filter };
      const response = await api.get('/groups', { params });
      return response.data;
    } catch (error) {
      console.error('Error getting groups:', error);
      // ส่งค่าเริ่มต้นกลับเพื่อไม่ให้แอปพลิเคชันพัง
      return { success: true, data: [], total: 0 };
    }
  },

  // Get single group
  async getGroup(id) {
    try {
      if (!id) {
        console.error('Group ID is undefined or null');
        return { success: false, data: null };
      }
      
      const response = await api.get(`/groups/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error getting group ${id}:`, error);
      return { success: false, data: null };
    }
  },

  // Create group
  async createGroup(groupData) {
    try {
      const response = await api.post('/groups', groupData);
      return response.data;
    } catch (error) {
      console.error('Error creating group:', error);
      throw error;
    }
  },

  // Update group
  async updateGroup(id, groupData) {
    try {
      const response = await api.put(`/groups/${id}`, groupData);
      return response.data;
    } catch (error) {
      console.error(`Error updating group ${id}:`, error);
      throw error;
    }
  },

  // Delete group
  async deleteGroup(id) {
    try {
      const response = await api.delete(`/groups/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting group ${id}:`, error);
      throw error;
    }
  },

  // Detect Facebook groups
  async detectGroups(facebookAccountId) {
    try {
      const response = await api.post('/groups/detect', { facebookAccountId });
      return response.data;
    } catch (error) {
      console.error('Error detecting groups:', error);
      throw error;
    }
  },

  // Get group statistics
  async getGroupStats(id) {
    try {
      const response = await api.get(`/groups/${id}/stats`);
      return response.data;
    } catch (error) {
      console.error(`Error getting stats for group ${id}:`, error);
      throw error;
    }
  },

  // Toggle group status
  async toggleGroupStatus(id) {
    try {
      const response = await api.post(`/groups/${id}/toggle-status`);
      return response.data;
    } catch (error) {
      console.error(`Error toggling status for group ${id}:`, error);
      throw error;
    }
  },

  // Scan single group
  async scanGroup(id, options = {}) {
    try {
      const response = await api.post(`/groups/${id}/scan`, options);
      return response.data;
    } catch (error) {
      console.error(`Error scanning group ${id}:`, error);
      throw error;
    }
  },

  // Get comments for a group
  async getGroupComments(id, page = 1, limit = 20) {
    try {
      const response = await api.get(`/groups/${id}/comments`, {
        params: { page, limit }
      });
      return response.data;
    } catch (error) {
      console.error(`Error getting comments for group ${id}:`, error);
      return { success: false, data: [], total: 0 };
    }
  }
};
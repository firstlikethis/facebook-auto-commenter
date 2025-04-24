// client/src/services/dashboardService.js
import api from './api';

export const dashboardService = {
  // Get dashboard overview
  async getOverview() {
    const response = await api.get('/dashboard/overview');
    return response.data;
  },

  // Get recent activity
  async getRecentActivity() {
    const response = await api.get('/dashboard/recent-activity');
    return response.data;
  },

  // Get comment statistics
  async getCommentStats() {
    const response = await api.get('/dashboard/stats/comments');
    return response.data;
  },

  // Get group statistics
  async getGroupStats() {
    const response = await api.get('/dashboard/stats/groups');
    return response.data;
  },

  // Get keyword statistics
  async getKeywordStats() {
    const response = await api.get('/dashboard/stats/keywords');
    return response.data;
  },

  // Get scan task statistics
  async getScanTaskStats() {
    const response = await api.get('/dashboard/stats/scan-tasks');
    return response.data;
  },

  // Get active scans
  async getActiveScans() {
    const response = await api.get('/dashboard/active-scans');
    return response.data;
  }
};
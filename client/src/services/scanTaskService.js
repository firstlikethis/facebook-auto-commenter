
// client/src/services/scanTaskService.js
import api from './api';

export const scanTaskService = {
  // Get all tasks with pagination
  async getTasks(page = 1, limit = 10, filter = {}) {
    const params = { page, limit, ...filter };
    const response = await api.get('/scan-tasks', { params });
    return response.data;
  },

  // Create task
  async createTask(taskData) {
    const response = await api.post('/scan-tasks', taskData);
    return response.data.data;
  },

  // Get single task
  async getTask(id) {
    const response = await api.get(`/scan-tasks/${id}`);
    return response.data.data;
  },

  // Update task
  async updateTask(id, taskData) {
    const response = await api.put(`/scan-tasks/${id}`, taskData);
    return response.data.data;
  },

  // Delete task
  async deleteTask(id) {
    const response = await api.delete(`/scan-tasks/${id}`);
    return response.data;
  },

  // Start task
  async startTask(id) {
    const response = await api.post(`/scan-tasks/${id}/start`);
    return response.data;
  },

  // Stop task
  async stopTask(id) {
    const response = await api.post(`/scan-tasks/${id}/stop`);
    return response.data;
  },

  // Get task logs
  async getTaskLogs(id) {
    const response = await api.get(`/scan-tasks/${id}/logs`);
    return response.data.data;
  },

  // Get task statistics
  async getTaskStats() {
    const response = await api.get('/scan-tasks/stats');
    return response.data.data;
  },

  // Get active tasks
  async getActiveTasks() {
    const response = await api.get('/scan-tasks/active');
    return response.data.data;
  }
};
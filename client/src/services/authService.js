
// client/src/services/authService.js
import api from './api';

export const authService = {
  // Login
  async login(email, password) {
    const response = await api.post('/auth/login', {
      email,
      password
    });
    return response.data;
  },

  // Register
  async register(username, email, password) {
    const response = await api.post('/auth/register', {
      username,
      email,
      password
    });
    return response.data;
  },

  // Get current user
  async getMe() {
    const response = await api.get('/auth/me');
    return response.data.data;
  },

  // Logout
  async logout() {
    return await api.post('/auth/logout');
  },

  // Change password
  async changePassword(currentPassword, newPassword) {
    const response = await api.put('/auth/change-password', {
      currentPassword,
      newPassword
    });
    return response.data;
  }
};
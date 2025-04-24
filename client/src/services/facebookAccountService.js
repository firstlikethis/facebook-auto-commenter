// client/src/services/facebookAccountService.js
import api from './api';

export const facebookAccountService = {
  // Get all accounts
  async getAccounts() {
    const response = await api.get('/facebook-accounts');
    return response.data;
  },

  // Get single account
  async getAccount(id) {
    const response = await api.get(`/facebook-accounts/${id}`);
    return response.data;
  },

  // Create account
  async createAccount(accountData) {
    const response = await api.post('/facebook-accounts', accountData);
    return response.data;
  },

  // Update account
  async updateAccount(id, accountData) {
    const response = await api.put(`/facebook-accounts/${id}`, accountData);
    return response.data;
  },

  // Delete account
  async deleteAccount(id) {
    const response = await api.delete(`/facebook-accounts/${id}`);
    return response.data;
  },

  // Test login
  async testLogin(id) {
    const response = await api.post(`/facebook-accounts/${id}/test-login`);
    return response.data;
  },

  // Logout account
  async logoutAccount(id) {
    const response = await api.post(`/facebook-accounts/${id}/logout`);
    return response.data;
  },

  // Save cookies
  async saveCookies(id, cookiesData) {
    const response = await api.post(`/facebook-accounts/${id}/save-cookies`, cookiesData);
    return response.data;
  }
};
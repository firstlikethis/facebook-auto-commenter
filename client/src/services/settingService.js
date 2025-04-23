
// client/src/services/settingService.js
import api from './api';

export const settingService = {
  // Get all settings
  async getSettings() {
    const response = await api.get('/settings');
    return response.data.data;
  },

  // Update settings
  async updateSettings(settingsData) {
    const response = await api.put('/settings', settingsData);
    return response.data.data;
  },

  // Get browser settings
  async getBrowserSettings() {
    const response = await api.get('/settings/browser');
    return response.data.data;
  },

  // Update browser settings
  async updateBrowserSettings(settings) {
    const response = await api.put('/settings/browser', settings);
    return response.data.data;
  },

  // Get scan settings
  async getScanSettings() {
    const response = await api.get('/settings/scan');
    return response.data.data;
  },

  // Update scan settings
  async updateScanSettings(settings) {
    const response = await api.put('/settings/scan', settings);
    return response.data.data;
  },

  // Get delay settings
  async getDelaySettings() {
    const response = await api.get('/settings/delay');
    return response.data.data;
  },

  // Update delay settings
  async updateDelaySettings(settings) {
    const response = await api.put('/settings/delay', settings);
    return response.data.data;
  },

  // Get human behavior settings
  async getHumanBehaviorSettings() {
    const response = await api.get('/settings/human-behavior');
    return response.data.data;
  },

  // Update human behavior settings
  async updateHumanBehaviorSettings(settings) {
    const response = await api.put('/settings/human-behavior', settings);
    return response.data.data;
  },

  // Get notification settings
  async getNotificationSettings() {
    const response = await api.get('/settings/notification');
    return response.data.data;
  },

  // Update notification settings
  async updateNotificationSettings(settings) {
    const response = await api.put('/settings/notification', settings);
    return response.data.data;
  },

  // Reset settings to default
  async resetSettings() {
    const response = await api.post('/settings/reset');
    return response.data;
  }
};
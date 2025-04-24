// client/src/services/settingService.js
import api from './api';

export const settingService = {
  // Get all settings
  async getSettings() {
    const response = await api.get('/settings');
    return response.data;
  },

  // Update settings
  async updateSettings(settingData) {
    const response = await api.put('/settings', settingData);
    return response.data;
  },

  // Get browser settings
  async getBrowserSettings() {
    const response = await api.get('/settings/browser');
    return response.data;
  },

  // Update browser settings
  async updateBrowserSettings(browserSettings) {
    const response = await api.put('/settings/browser', browserSettings);
    return response.data;
  },

  // Get scan settings
  async getScanSettings() {
    const response = await api.get('/settings/scan');
    return response.data;
  },

  // Update scan settings
  async updateScanSettings(scanSettings) {
    const response = await api.put('/settings/scan', scanSettings);
    return response.data;
  },

  // Get delay settings
  async getDelaySettings() {
    const response = await api.get('/settings/delay');
    return response.data;
  },

  // Update delay settings
  async updateDelaySettings(delaySettings) {
    const response = await api.put('/settings/delay', delaySettings);
    return response.data;
  },

  // Get human behavior settings
  async getHumanBehaviorSettings() {
    const response = await api.get('/settings/human-behavior');
    return response.data;
  },

  // Update human behavior settings
  async updateHumanBehaviorSettings(behaviorSettings) {
    const response = await api.put('/settings/human-behavior', behaviorSettings);
    return response.data;
  },

  // Get notification settings
  async getNotificationSettings() {
    const response = await api.get('/settings/notification');
    return response.data;
  },

  // Update notification settings
  async updateNotificationSettings(notificationSettings) {
    const response = await api.put('/settings/notification', notificationSettings);
    return response.data;
  },

  // Reset settings to default
  async resetSettings() {
    const response = await api.post('/settings/reset');
    return response.data;
  }
};
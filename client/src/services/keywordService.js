// client/src/services/keywordService.js
import api from './api';

export const keywordService = {
  // Get all keywords with pagination
  async getKeywords(page = 1, limit = 10, filter = {}) {
    try {
      const params = { page, limit, ...filter };
      const response = await api.get('/keywords', { params });
      return response.data;
    } catch (error) {
      console.error('Error getting keywords:', error);
      return { data: [], total: 0 };
    }
  },

  // Get single keyword
  async getKeyword(id) {
    // ตรวจสอบว่า id มีค่าหรือไม่
    if (!id || id === 'new' || id === 'undefined') {
      // ถ้าเป็น 'new' หรือไม่มีค่า ให้ส่งค่าเริ่มต้นกลับไป
      return {
        keyword: '',
        variations: [''],
        messages: [{ content: '', weight: 1 }],
        images: [],
        category: '',
        isActive: true,
        priority: 0,
        minTimeBetweenUses: 3600
      };
    }
    
    try {
      const response = await api.get(`/keywords/${id}`);
      return response.data.data;
    } catch (error) {
      console.error(`Error getting keyword ${id}:`, error);
      throw error;
    }
  },

  // Create keyword
  async createKeyword(keywordData) {
    try {
      const response = await api.post('/keywords', keywordData);
      return response.data.data;
    } catch (error) {
      console.error('Error creating keyword:', error);
      throw error;
    }
  },

  // Update keyword
  async updateKeyword(id, keywordData) {
    try {
      const response = await api.put(`/keywords/${id}`, keywordData);
      return response.data.data;
    } catch (error) {
      console.error(`Error updating keyword ${id}:`, error);
      throw error;
    }
  },

  // Delete keyword
  async deleteKeyword(id) {
    try {
      const response = await api.delete(`/keywords/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting keyword ${id}:`, error);
      throw error;
    }
  },

  // Toggle keyword status
  async toggleKeywordStatus(id) {
    try {
      const response = await api.post(`/keywords/${id}/toggle-status`);
      return response.data;
    } catch (error) {
      console.error(`Error toggling keyword status ${id}:`, error);
      throw error;
    }
  },

  // Upload image - แก้ไขฟังก์ชันนี้ใหม่
  async uploadImage(id, formData) {
    try {
      console.log("Uploading image for keyword:", id);
      
      if (!formData.has('image')) {
        throw new Error('ไม่พบไฟล์ภาพใน FormData');
      }
      
      // ตรวจสอบข้อมูลไฟล์ที่ส่ง
      const imageFile = formData.get('image');
      console.log("Image to upload:", {
        name: imageFile.name,
        type: imageFile.type,
        size: imageFile.size
      });
  
      // ใช้ fetch API แทน axios
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/keywords/${id}/upload-image`, {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'อัปโหลดล้มเหลว');
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`Error uploading image for keyword ${id}:`, error);
      throw error;
    }
  },

  // Delete image
  async deleteImage(keywordId, imageId) {
    try {
      const response = await api.delete(`/keywords/${keywordId}/image/${imageId}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting image ${imageId}:`, error);
      throw error;
    }
  },

  // Get categories
  async getCategories() {
    try {
      console.log('Getting keyword categories...');
      
      // แบบที่ 1: mock ข้อมูลแทน
      return {
        success: true,
        data: ['อสังหาริมทรัพย์', 'รถยนต์', 'สินค้า', 'บริการ', 'ทั่วไป']
      };
      
      // แบบที่ 2: ใช้ API จริง (แต่ต้องมั่นใจว่า endpoint นี้มีอยู่จริง)
      // const response = await api.get('/keywords/categories');
      // return response.data;
    } catch (error) {
      console.error('Error getting categories:', error);
      return { success: true, data: [] };
    }
  },

  // Get statistics
  async getKeywordStats() {
    try {
      const response = await api.get('/keywords/stats');
      return response.data;
    } catch (error) {
      console.error('Error getting keyword stats:', error);
      throw error;
    }
  }
};
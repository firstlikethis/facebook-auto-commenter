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
  async uploadImage(id, imageFile) {
    try {
      // สร้าง FormData ใหม่
      const formData = new FormData();
      
      // ตรวจสอบว่า imageFile เป็นไฟล์ที่ใช้งานได้หรือไม่ ด้วยวิธีที่ยืดหยุ่นกว่า
      if (imageFile && imageFile.name && imageFile.size > 0) {
        // เพิ่มไฟล์เข้าไปโดยใช้ชื่อฟิลด์ "image" ให้ตรงกับที่เซิร์ฟเวอร์คาดหวัง
        formData.append('image', imageFile);
        
        console.log('FormData created:', {
          imageName: imageFile.name,
          imageSize: imageFile.size,
          imageType: imageFile.type,
          hasImage: formData.has('image')
        });
        
        // ส่งข้อมูล
        const response = await api.post(`/keywords/${id}/upload-image`, formData);
        
        return response.data;
      } else {
        console.error('Invalid image file details:', {
          file: imageFile,
          hasName: Boolean(imageFile?.name),
          hasSize: Boolean(imageFile?.size),
          type: typeof imageFile
        });
        throw new Error('ไฟล์รูปภาพไม่ถูกต้อง กรุณาเลือกไฟล์ใหม่');
      }
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
// client/src/services/api.js
import axios from 'axios';
import toast from 'react-hot-toast';

// Create axios instance
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor for API calls
api.interceptors.request.use(
  (config) => {
    // ถ้าเป็น FormData ไม่ต้องกำหนด Content-Type เพื่อให้ axios จัดการเอง
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }
    
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for API calls
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    const message = 
      error.response?.data?.message || 
      error.message || 
      'เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์';
    
    // แสดงข้อมูลเพิ่มเติมสำหรับการ debug
    console.error('API Error Details:', {
      status: error.response?.status,
      message: message,
      data: error.response?.data,
      path: error.config?.url,
      method: error.config?.method,
      headers: error.config?.headers
    });
    
    // Handle unauthorized errors (401)
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      // Redirect to login page if we're not already there
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
        toast.error('กรุณาเข้าสู่ระบบใหม่');
      }
    } 
    // Handle other errors
    else if (error.response?.status !== 401) {
      toast.error(message);
    }
    
    return Promise.reject(error);
  }
);

export default api;
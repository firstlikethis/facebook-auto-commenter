
// client/src/contexts/AuthContext.js
import React, { createContext, useContext, useEffect, useReducer } from 'react';
import { authService } from '../services/authService';

// Initial state
const initialState = {
  isAuthenticated: false,
  isInitialized: false,
  user: null
};

// Create context
const AuthContext = createContext(initialState);

// Action types
const actionTypes = {
  INITIALIZE: 'INITIALIZE',
  LOGIN: 'LOGIN',
  LOGOUT: 'LOGOUT',
  REGISTER: 'REGISTER'
};

// Reducer
const reducer = (state, action) => {
  switch (action.type) {
    case actionTypes.INITIALIZE:
      return {
        ...state,
        isAuthenticated: !!action.payload.user,
        isInitialized: true,
        user: action.payload.user
      };
    case actionTypes.LOGIN:
      return {
        ...state,
        isAuthenticated: true,
        user: action.payload.user
      };
    case actionTypes.LOGOUT:
      return {
        ...state,
        isAuthenticated: false,
        user: null
      };
    case actionTypes.REGISTER:
      return {
        ...state,
        isAuthenticated: true,
        user: action.payload.user
      };
    default:
      return state;
  }
};

// Provider
export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    const initialize = async () => {
      try {
        const token = localStorage.getItem('token');

        if (token) {
          const user = await authService.getMe();
          
          dispatch({
            type: actionTypes.INITIALIZE,
            payload: {
              user
            }
          });
        } else {
          dispatch({
            type: actionTypes.INITIALIZE,
            payload: {
              user: null
            }
          });
        }
      } catch (error) {
        console.error(error);
        dispatch({
          type: actionTypes.INITIALIZE,
          payload: {
            user: null
          }
        });
      }
    };

    initialize();
  }, []);

  // Login
  const login = async (email, password) => {
    const { token, user } = await authService.login(email, password);
    localStorage.setItem('token', token);
    
    dispatch({
      type: actionTypes.LOGIN,
      payload: {
        user
      }
    });
  };

  // Register
  const register = async (username, email, password) => {
    const { token, user } = await authService.register(username, email, password);
    localStorage.setItem('token', token);
    
    dispatch({
      type: actionTypes.REGISTER,
      payload: {
        user
      }
    });
  };

  // Logout
  const logout = async () => {
    await authService.logout();
    localStorage.removeItem('token');
    
    dispatch({
      type: actionTypes.LOGOUT
    });
  };

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        logout,
        register
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// Hook for using the auth context
export const useAuth = () => useContext(AuthContext);

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
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
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
    
    // Handle unauthorized errors (401)
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      // Redirect to login page if we're not already there
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
        toast.error('กรุณาเข้าสู่ระบบใหม่');
      }
    } 
    // Handle forbidden errors (403)
    else if (error.response?.status === 403) {
      toast.error('คุณไม่มีสิทธิ์ในการเข้าถึงข้อมูลนี้');
    }
    // Handle server errors (500)
    else if (error.response?.status >= 500) {
      toast.error(`เกิดข้อผิดพลาดที่เซิร์ฟเวอร์: ${message}`);
    }
    // Handle other errors
    else if (error.response?.status !== 401) {
      toast.error(message);
    }
    
    return Promise.reject(error);
  }
);

export default api;
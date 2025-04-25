// client/src/contexts/AuthContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        setIsLoading(true);
        const token = localStorage.getItem('token');
        
        if (token) {
          try {
            // Check if token is valid by calling the me endpoint
            const res = await api.get('/auth/me');
            setUser(res.data.data);
            setIsAuthenticated(true);
          } catch (error) {
            console.error("Auth check failed:", error);
            // Clean up invalid token
            localStorage.removeItem('token');
            setUser(null);
            setIsAuthenticated(false);
          }
        } else {
          setUser(null);
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error("Error checking authentication:", error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (email, password) => {
    try {
      const res = await api.post('/auth/login', { email, password });
      
      // Ensure we have a token in the response
      if (!res.data.token) {
        throw new Error('No token received from server');
      }
      
      // Store token in localStorage
      localStorage.setItem('token', res.data.token);
      
      // Update state
      setUser(res.data.user);
      setIsAuthenticated(true);
      
      return {
        success: true,
        data: res.data
      };
    } catch (error) {
      console.error("Login error:", error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Login failed'
      };
    }
  };

  const register = async (username, email, password) => {
    try {
      const res = await api.post('/auth/register', { username, email, password });
      
      // Ensure we have a token in the response
      if (!res.data.token) {
        throw new Error('No token received from server');
      }
      
      // Store token in localStorage
      localStorage.setItem('token', res.data.token);
      
      // Update state
      setUser(res.data.user);
      setIsAuthenticated(true);
      
      return {
        success: true,
        data: res.data
      };
    } catch (error) {
      console.error("Registration error:", error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Registration failed'
      };
    }
  };

  const logout = () => {
    // Always remove the token from localStorage
    localStorage.removeItem('token');
    
    // Reset auth state
    setUser(null);
    setIsAuthenticated(false);
    
    // Call the backend logout endpoint (but don't wait for it)
    api.post('/auth/logout').catch(error => {
      console.error("Logout API error:", error);
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoading,
        login,
        register,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
// client/src/contexts/SettingsContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const SettingsContext = createContext();

export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await api.get('/settings');
        setSettings(res.data.data);
      } catch (error) {
        console.error('Failed to fetch settings:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (localStorage.getItem('token')) {
      fetchSettings();
    } else {
      setIsLoading(false);
    }
  }, []);

  const updateSettings = async (newSettings) => {
    try {
      const res = await api.put('/settings', newSettings);
      setSettings(res.data.data);
      return res.data.data;
    } catch (error) {
      console.error('Failed to update settings:', error);
      throw error;
    }
  };

  return (
    <SettingsContext.Provider value={{ settings, isLoading, updateSettings }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => useContext(SettingsContext);
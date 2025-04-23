// client/src/layouts/DashboardLayout.js
import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Box, CssBaseline, Toolbar } from '@mui/material';
import Sidebar from '../components/layout/Sidebar';
import Navbar from '../components/layout/Navbar';
import { useTheme } from '../contexts/ThemeContext';

const DashboardLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();
  const { darkMode } = useTheme();

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Map routes to page titles
  const getPageTitle = () => {
    const pathMap = {
      '/': 'แดชบอร์ด',
      '/facebook-accounts': 'บัญชี Facebook',
      '/groups': 'กลุ่ม Facebook',
      '/keywords': 'คำสำคัญ',
      '/tasks': 'งานสแกน',
      '/comments': 'ประวัติคอมเมนต์',
      '/stats': 'สถิติและรายงาน',
      '/settings': 'ตั้งค่า',
    };

    return pathMap[location.pathname] || 'Facebook Auto Commenter';
  };

  return (
    <Box 
      sx={{ 
        display: 'flex',
        backgroundColor: darkMode ? 'secondary.800' : 'secondary.50',
        minHeight: '100vh'
      }}
    >
      <CssBaseline />
      <Navbar title={getPageTitle()} />
      <Sidebar open={sidebarOpen} toggleSidebar={toggleSidebar} />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { xs: '100%', sm: `calc(100% - ${sidebarOpen ? 240 : 72}px)` },
          ml: { xs: 0, sm: `${sidebarOpen ? 240 : 72}px` },
          transition: 'margin-left 0.2s ease-in-out, width 0.2s ease-in-out',
        }}
      >
        <Toolbar />
        <Outlet />
      </Box>
    </Box>
  );
};

export default DashboardLayout;
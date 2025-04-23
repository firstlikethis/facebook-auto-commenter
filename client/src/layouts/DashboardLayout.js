// client/src/layouts/DashboardLayout.js
import React from 'react';
import { Outlet } from 'react-router-dom';
import { Box, CssBaseline } from '@mui/material';

const DashboardLayout = () => {
  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      {/* Simplified layout without sidebar and navbar */}
      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        <Outlet />
      </Box>
    </Box>
  );
};

export default DashboardLayout;
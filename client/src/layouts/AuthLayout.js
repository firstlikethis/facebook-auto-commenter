// client/src/layouts/AuthLayout.js
import React from 'react';
import { Outlet } from 'react-router-dom';
import { Box, Container, Paper } from '@mui/material';

const AuthLayout = () => {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        py: 3,
        bgcolor: 'background.default'
      }}
    >
      <Container maxWidth="sm">
        <Paper 
          elevation={3} 
          sx={{
            p: 4,
            borderRadius: 2
          }}
        >
          <Outlet />
        </Paper>
      </Container>
    </Box>
  );
};

export default AuthLayout;
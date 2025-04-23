// client/src/pages/NotFound.js
import React from 'react';
import { Box, Button, Typography } from '@mui/material';
import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <Box
      display="flex"
      flexDirection="column"
      justifyContent="center"
      alignItems="center"
      minHeight="100vh"
      textAlign="center"
      p={3}
    >
      <Typography variant="h1" component="h1" gutterBottom>
        404
      </Typography>
      <Typography variant="h4" component="h2" gutterBottom>
        ไม่พบหน้าที่คุณกำลังค้นหา
      </Typography>
      <Typography variant="body1" color="textSecondary" paragraph>
        หน้าที่คุณพยายามเข้าถึงไม่มีอยู่หรืออาจถูกย้ายไปแล้ว
      </Typography>
      <Button component={Link} to="/" variant="contained" color="primary">
        กลับสู่หน้าหลัก
      </Button>
    </Box>
  );
};

export default NotFound;
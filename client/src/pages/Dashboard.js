// client/src/pages/Dashboard.js
import React from 'react';
import { Box, Typography, Paper, Grid } from '@mui/material';
import PageHeader from '../components/common/PageHeader';

const Dashboard = () => {
  return (
    <Box>
      <PageHeader title="แผงควบคุม" />
      
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              ยินดีต้อนรับสู่ Facebook Auto Commenter
            </Typography>
            <Typography paragraph>
              ระบบอัตโนมัติสำหรับการคอมเมนต์ในกลุ่ม Facebook โดยตรวจจับคำสำคัญและตอบกลับตามที่กำหนดไว้
            </Typography>
            <Typography variant="body2" color="textSecondary">
              เริ่มต้นใช้งานได้โดยการตั้งค่าบัญชี Facebook, สร้างคำสำคัญ, และเริ่มงานสแกน
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
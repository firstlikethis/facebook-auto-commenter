// client/src/pages/Dashboard.js
import React from 'react';
import { useQuery } from 'react-query';
import { useNavigate } from 'react-router-dom';
import { Box, Grid, Typography, Card, CardContent, Button, CircularProgress } from '@mui/material';
import { 
  Group as GroupIcon, 
  Comment as CommentIcon, 
  Key as KeyIcon, 
  Facebook as FacebookIcon,
  Add as AddIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

import StatCard from '../components/dashboard/StatCard';
import ChartCard from '../components/dashboard/ChartCard';
import RecentActivityCard from '../components/dashboard/RecentActivityCard';
import ActiveTasksCard from '../components/dashboard/ActiveTasksCard';
import TopGroupsCard from '../components/dashboard/TopGroupsCard';
import TopKeywordsCard from '../components/dashboard/TopKeywordsCard';
import api from '../services/api';

const Dashboard = () => {
  const navigate = useNavigate();
  
  // ดึงข้อมูล dashboard overview จาก API
  const { data, isLoading, error, refetch } = useQuery(
    'dashboardData',
    async () => {
      const response = await api.get('/dashboard/overview');
      return response.data.data;
    },
    {
      refetchInterval: 300000, // รีเฟรชทุก 5 นาที
      staleTime: 120000 // ข้อมูลจะเก่าหลังจาก 2 นาที
    }
  );

  // ดึงข้อมูลกิจกรรมล่าสุด
  const { data: activityData, isLoading: isLoadingActivity } = useQuery(
    'recentActivity',
    async () => {
      const response = await api.get('/dashboard/recent-activity');
      return response.data.data;
    },
    {
      refetchInterval: 60000, // รีเฟรชทุก 1 นาที
      staleTime: 30000 // ข้อมูลจะเก่าหลังจาก 30 วินาที
    }
  );

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3}>
        <Typography color="error">
          เกิดข้อผิดพลาดในการโหลดข้อมูล: {error.message}
        </Typography>
        <Button 
          variant="contained" 
          startIcon={<RefreshIcon />} 
          onClick={() => refetch()}
          sx={{ mt: 2 }}
        >
          ลองใหม่
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      {/* Stats Overview */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="กลุ่มทั้งหมด"
            value={data?.groups?.total || 0}
            subtitle={`เปิดใช้งาน ${data?.groups?.active || 0} กลุ่ม`}
            icon={<GroupIcon />}
            color="#3f51b5"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="คำสำคัญ"
            value={data?.keywords?.total || 0}
            subtitle={`เปิดใช้งาน ${data?.keywords?.active || 0} คำ`}
            icon={<KeyIcon />}
            color="#f44336"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="คอมเมนต์ทั้งหมด"
            value={data?.comments?.total || 0}
            subtitle={`วันนี้ ${data?.comments?.today || 0} คอมเมนต์`}
            icon={<CommentIcon />}
            color="#4caf50"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="บัญชี Facebook"
            value={data?.tasks?.running || 0}
            subtitle="กำลังทำงาน"
            icon={<FacebookIcon />}
            color="#ff9800"
          />
        </Grid>
      </Grid>

      {/* Main Content */}
      <Grid container spacing={3}>
        {/* Left Column */}
        <Grid item xs={12} md={8}>
          {/* Chart: Comments Trend */}
          <Grid item xs={12} mb={3}>
            <ChartCard title="แนวโน้มการคอมเมนต์">
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={data?.comments?.trend || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="count" 
                    name="จำนวนคอมเมนต์"
                    stroke="#8884d8" 
                    activeDot={{ r: 8 }} 
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>
          </Grid>

          {/* Chart: Comments by Category (เรากำหนดให้แสดงคอมเมนต์ตามหมวดหมู่ของคำสำคัญ) */}
          <Grid item xs={12} mb={3}>
            <ChartCard title="คอมเมนต์ตามหมวดหมู่">
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={activityData?.commentsByCategory || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar 
                    dataKey="value" 
                    name="จำนวนคอมเมนต์"
                    fill="#82ca9d" 
                  />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </Grid>

          {/* Active Tasks */}
          <Grid item xs={12} mb={3}>
            <ActiveTasksCard />
          </Grid>
        </Grid>

        {/* Right Column */}
        <Grid item xs={12} md={4}>
          {/* Quick Actions */}
          <Card sx={{ mb: 3, boxShadow: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                การดำเนินการด่วน
              </Typography>
              <Grid container spacing={2} mt={1}>
                <Grid item xs={6}>
                  <Button 
                    fullWidth 
                    variant="contained" 
                    color="primary"
                    startIcon={<AddIcon />}
                    onClick={() => navigate('/tasks/new')}
                  >
                    สร้างงานใหม่
                  </Button>
                </Grid>
                <Grid item xs={6}>
                  <Button 
                    fullWidth 
                    variant="outlined" 
                    color="primary"
                    startIcon={<AddIcon />}
                    onClick={() => navigate('/keywords/new')}
                  >
                    เพิ่มคำสำคัญ
                  </Button>
                </Grid>
                <Grid item xs={6}>
                  <Button 
                    fullWidth 
                    variant="outlined" 
                    color="primary"
                    startIcon={<AddIcon />}
                    onClick={() => navigate('/groups')}
                  >
                    จัดการกลุ่ม
                  </Button>
                </Grid>
                <Grid item xs={6}>
                  <Button 
                    fullWidth 
                    variant="outlined" 
                    color="primary"
                    startIcon={<RefreshIcon />}
                    onClick={() => navigate('/facebook-accounts')}
                  >
                    จัดการบัญชี
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Top Groups */}
          <Box mb={3}>
            <TopGroupsCard topGroups={data?.topGroups || []} />
          </Box>

          {/* Top Keywords */}
          <Box mb={3}>
            <TopKeywordsCard topKeywords={data?.topKeywords || []} />
          </Box>

          {/* Recent Activity */}
          <RecentActivityCard 
            title="กิจกรรมล่าสุด" 
            activities={activityData?.recentActivity || []} 
            loading={isLoadingActivity}
          />
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
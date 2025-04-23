// client/src/pages/Dashboard.js
import React, { useState, useEffect } from 'react';
import { useQuery } from 'react-query';
import { useNavigate } from 'react-router-dom';
import { Box, Grid, Paper, Typography, Card, CardContent, Button, Avatar, CircularProgress, Divider } from '@mui/material';
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

// Placeholder API calls - these should be replaced with actual API calls
const fetchDashboardData = async () => {
  // Simulating API delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  return {
    stats: {
      groups: { total: 25, active: 18 },
      keywords: { total: 42, active: 36 },
      comments: { 
        total: 1248, 
        today: 76, 
        last7Days: 342, 
        last30Days: 982
      },
      tasks: {
        total: 64,
        active: 2,
        completed: 56,
        failed: 6
      }
    },
    topGroups: [
      { _id: '1', groupName: 'รถยนต์มือสอง', count: 145 },
      { _id: '2', groupName: 'ขายบ้านและคอนโด', count: 112 },
      { _id: '3', groupName: 'อสังหาริมทรัพย์', count: 98 },
      { _id: '4', groupName: 'โปรโมชั่นบัตรเครดิต', count: 87 },
      { _id: '5', groupName: 'ประกันชีวิต', count: 64 }
    ],
    topKeywords: [
      { _id: 'รถยนต์มือสอง', count: 126 },
      { _id: 'ขายบ้าน', count: 98 },
      { _id: 'คอนโด', count: 87 },
      { _id: 'สินเชื่อ', count: 65 },
      { _id: 'ประกัน', count: 54 }
    ],
    recentActivity: [
      { 
        id: 1, 
        title: 'คอมเมนต์สำเร็จ', 
        description: 'คอมเมนต์ในโพสต์ "ขายรถยนต์ Honda Civic ปี 2018"', 
        time: new Date(Date.now() - 30 * 60000), 
        status: 'success'
      },
      { 
        id: 2, 
        title: 'พบคำสำคัญใหม่', 
        description: 'พบคำสำคัญ "สินเชื่อบ้าน" ในกลุ่ม "ขายบ้านและคอนโด"', 
        time: new Date(Date.now() - 120 * 60000), 
        status: 'success' 
      },
      { 
        id: 3, 
        title: 'งานสแกนเสร็จสิ้น', 
        description: 'สแกน 5 กลุ่ม คอมเมนต์ 17 โพสต์', 
        time: new Date(Date.now() - 240 * 60000), 
        status: 'success' 
      },
      { 
        id: 4, 
        title: 'คอมเมนต์ล้มเหลว', 
        description: 'ไม่สามารถคอมเมนต์ในโพสต์ระบบตรวจพบการใช้งานผิดปกติ', 
        time: new Date(Date.now() - 360 * 60000), 
        status: 'error' 
      },
      { 
        id: 5, 
        title: 'บัญชี Facebook ล็อกอินล้มเหลว', 
        description: 'บัญชี example@gmail.com ล็อกอินล้มเหลว', 
        time: new Date(Date.now() - 720 * 60000), 
        status: 'error' 
      }
    ],
    commentsTrend: [
      { date: '17/04', count: 28 },
      { date: '18/04', count: 35 },
      { date: '19/04', count: 42 },
      { date: '20/04', count: 38 },
      { date: '21/04', count: 54 },
      { date: '22/04', count: 67 },
      { date: '23/04', count: 76 }
    ],
    commentsByCategory: [
      { name: 'รถยนต์', value: 235 },
      { name: 'อสังหาริมทรัพย์', value: 187 },
      { name: 'การเงิน', value: 126 },
      { name: 'ท่องเที่ยว', value: 98 },
      { name: 'ประกัน', value: 76 }
    ]
  };
};

const Dashboard = () => {
  const navigate = useNavigate();
  const { data, isLoading, error, refetch } = useQuery('dashboardData', fetchDashboardData);

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
            value={data.stats.groups.total}
            subtitle={`เปิดใช้งาน ${data.stats.groups.active} กลุ่ม`}
            icon={<GroupIcon />}
            color="#3f51b5"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="คำสำคัญ"
            value={data.stats.keywords.total}
            subtitle={`เปิดใช้งาน ${data.stats.keywords.active} คำ`}
            icon={<KeyIcon />}
            color="#f44336"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="คอมเมนต์ทั้งหมด"
            value={data.stats.comments.total}
            subtitle={`วันนี้ ${data.stats.comments.today} คอมเมนต์`}
            icon={<CommentIcon />}
            color="#4caf50"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="บัญชี Facebook"
            value={data.stats.tasks.active}
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
                <LineChart data={data.commentsTrend}>
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

          {/* Chart: Comments by Category */}
          <Grid item xs={12} mb={3}>
            <ChartCard title="คอมเมนต์ตามหมวดหมู่">
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={data.commentsByCategory}>
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
            <TopGroupsCard topGroups={data.topGroups} />
          </Box>

          {/* Top Keywords */}
          <Box mb={3}>
            <TopKeywordsCard topKeywords={data.topKeywords} />
          </Box>

          {/* Recent Activity */}
          <RecentActivityCard 
            title="กิจกรรมล่าสุด" 
            activities={data.recentActivity} 
          />
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
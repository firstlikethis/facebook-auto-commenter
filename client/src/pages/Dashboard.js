// client/src/pages/Dashboard.js
import React from 'react';
import { useQuery } from 'react-query';
import { Card, CardContent, Grid, Box, Typography, CircularProgress, Divider, LinearProgress } from '@mui/material';
import { 
  Timeline, TimelineItem, TimelineSeparator, TimelineConnector, 
  TimelineContent, TimelineDot 
} from '@mui/lab';
import { 
  Groups as GroupsIcon, 
  Message as MessageIcon, 
  Task as TaskIcon,
  KeyboardDoubleArrowUp as TrendUpIcon,
  KeyboardDoubleArrowDown as TrendDownIcon
} from '@mui/icons-material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

import { dashboardService } from '../services/dashboardService';
import StatCard from '../components/dashboard/StatCard';
import RecentActivityCard from '../components/dashboard/RecentActivityCard';
import ChartCard from '../components/dashboard/ChartCard';
import TopGroupsCard from '../components/dashboard/TopGroupsCard';
import TopKeywordsCard from '../components/dashboard/TopKeywordsCard';
import ActiveTasksCard from '../components/dashboard/ActiveTasksCard';

const Dashboard = () => {
  const { data, isLoading, error } = useQuery(
    'dashboardOverview', 
    () => dashboardService.getOverview()
  );
  
  const { data: recentActivity, isLoading: isLoadingActivity } = useQuery(
    'recentActivity', 
    () => dashboardService.getRecentActivity()
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
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <Typography color="error">
          เกิดข้อผิดพลาดในการโหลดข้อมูล: {error.message}
        </Typography>
      </Box>
    );
  }

  const {
    groups,
    keywords,
    comments,
    tasks,
    topGroups,
    topKeywords
  } = data.data;

  // คำนวณการเปลี่ยนแปลงจากเมื่อวาน
  const commentChange = comments.today - comments.yesterday;
  const commentChangePercent = comments.yesterday ? 
    Math.round((commentChange / comments.yesterday) * 100) : 100;

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom>
        แผงควบคุม
      </Typography>

      {/* แถวที่ 1: บัตรสถิติ */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard 
            title="กลุ่มทั้งหมด"
            value={groups.total}
            subtitle={`${groups.active} กลุ่มที่ใช้งานอยู่`}
            icon={<GroupsIcon fontSize="large" />}
            color="#3f51b5"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard 
            title="คำสำคัญทั้งหมด"
            value={keywords.total}
            subtitle={`${keywords.active} คำที่ใช้งานอยู่`}
            icon={<MessageIcon fontSize="large" />}
            color="#f44336"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard 
            title="คอมเมนต์วันนี้"
            value={comments.today}
            subtitle={
              <Box display="flex" alignItems="center">
                <Box mr={0.5}>
                  {commentChange >= 0 ? (
                    <TrendUpIcon color="success" fontSize="small" />
                  ) : (
                    <TrendDownIcon color="error" fontSize="small" />
                  )}
                </Box>
                <Typography variant="body2">
                  {commentChangePercent}% จากเมื่อวาน
                </Typography>
              </Box>
            }
            icon={<MessageIcon fontSize="large" />}
            color="#4caf50"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard 
            title="งานสแกน"
            value={tasks.running}
            subtitle={`${tasks.pending} งานรออยู่ / ${tasks.completed} งานเสร็จแล้ว`}
            icon={<TaskIcon fontSize="large" />}
            color="#ff9800"
          />
        </Grid>
      </Grid>

      {/* แถวที่ 2: แผนภูมิแนวโน้มและกิจกรรมล่าสุด */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} md={8}>
          <ChartCard title="แนวโน้มคอมเมนต์ 14 วันล่าสุด">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={comments.trend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(value) => {
                    const date = new Date(value);
                    return `${date.getDate()}/${date.getMonth() + 1}`;
                  }}
                />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#8884d8" name="จำนวนคอมเมนต์" />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </Grid>
        <Grid item xs={12} md={4}>
          <RecentActivityCard 
            title="กิจกรรมล่าสุด" 
            loading={isLoadingActivity}
            activities={recentActivity?.data?.recentComments.map(comment => ({
              id: comment._id,
              title: `คอมเมนต์ในกลุ่ม "${comment.groupName}"`,
              description: comment.messageUsed.length > 50 
                ? `${comment.messageUsed.substring(0, 50)}...` 
                : comment.messageUsed,
              time: new Date(comment.createdAt),
              status: comment.success ? 'success' : 'error'
            }))}
          />
        </Grid>
      </Grid>

      {/* แถวที่ 3: กลุ่มและคำสำคัญยอดนิยม, งานที่กำลังทำงาน */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <TopGroupsCard topGroups={topGroups} />
        </Grid>
        <Grid item xs={12} md={4}>
          <TopKeywordsCard topKeywords={topKeywords} />
        </Grid>
        <Grid item xs={12} md={4}>
          <ActiveTasksCard />
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
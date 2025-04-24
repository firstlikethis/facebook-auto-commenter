// client/src/pages/stats/Stats.js
import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Button, CircularProgress, Paper, Grid, Divider,
  Card, CardContent, FormControl, InputLabel, Select, MenuItem,
  Tab, Tabs
} from '@mui/material';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import {
  Refresh as RefreshIcon,
  TrendingUp as TrendingUpIcon,
  Message as MessageIcon,
  Group as GroupIcon,
  Today as TodayIcon,
  DateRange as DateRangeIcon,
  ChatBubble as ChatBubbleIcon
} from '@mui/icons-material';
import { format, subDays } from 'date-fns';

import api from '../../services/api';
import PageHeader from '../../components/common/PageHeader';

// สีสำหรับ chart
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

const Stats = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);
  const [timeRange, setTimeRange] = useState('last7days');

  // ดึงข้อมูลสถิติคอมเมนต์
  const { data: commentStats, isLoading: isLoadingComments, refetch: refetchComments } = useQuery(
    ['comment-stats', timeRange],
    async () => {
      const response = await api.get('/dashboard/stats/comments');
      return response.data.data;
    }
  );

  // ดึงข้อมูลสถิติกลุ่ม
  const { data: groupStats, isLoading: isLoadingGroups, refetch: refetchGroups } = useQuery(
    'group-stats',
    async () => {
      const response = await api.get('/dashboard/stats/groups');
      return response.data.data;
    }
  );

  // ดึงข้อมูลสถิติคำสำคัญ
  const { data: keywordStats, isLoading: isLoadingKeywords, refetch: refetchKeywords } = useQuery(
    'keyword-stats',
    async () => {
      const response = await api.get('/dashboard/stats/keywords');
      return response.data.data;
    }
  );

  // ดึงข้อมูลสถิติงานสแกน
  const { data: taskStats, isLoading: isLoadingTasks, refetch: refetchTasks } = useQuery(
    'task-stats',
    async () => {
      const response = await api.get('/dashboard/stats/scan-tasks');
      return response.data.data;
    }
  );

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleRefresh = () => {
    refetchComments();
    refetchGroups();
    refetchKeywords();
    refetchTasks();
  };

  const handleTimeRangeChange = (event) => {
    setTimeRange(event.target.value);
  };

  // กำหนดค่าช่วงเวลาสำหรับตัวเลือก
  const getTimeRangeText = () => {
    switch (timeRange) {
      case 'today':
        return 'วันนี้';
      case 'yesterday':
        return 'เมื่อวาน';
      case 'last7days':
        return '7 วันล่าสุด';
      case 'last30days':
        return '30 วันล่าสุด';
      case 'thisMonth':
        return 'เดือนนี้';
      case 'lastMonth':
        return 'เดือนที่แล้ว';
      default:
        return '7 วันล่าสุด';
    }
  };

  const isLoading = isLoadingComments || isLoadingGroups || isLoadingKeywords || isLoadingTasks;

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  // แปลงข้อมูลสำหรับงานสแกน
  const taskStatusData = [
    { name: 'รอดำเนินการ', value: taskStats?.tasksByStatus?.pending || 0 },
    { name: 'กำลังทำงาน', value: taskStats?.tasksByStatus?.running || 0 },
    { name: 'เสร็จสิ้น', value: taskStats?.tasksByStatus?.completed || 0 },
    { name: 'ล้มเหลว', value: taskStats?.tasksByStatus?.failed || 0 },
    { name: 'ยกเลิก', value: taskStats?.tasksByStatus?.canceled || 0 }
  ].filter(item => item.value > 0);

  // แปลงข้อมูลสำหรับกลุ่ม
  const groupActivityData = groupStats?.groupsByActivity || [];

  // แปลงข้อมูลสำหรับการใช้งานคำสำคัญ
  const keywordUsageData = keywordStats?.keywordsByUsage || [];

  return (
    <Box p={3}>
      <PageHeader 
        title="สถิติและรายงาน" 
        subtitle="ข้อมูลสถิติและรายงานสำหรับการติดตามการทำงานและประสิทธิภาพของระบบ"
        actionButton={
          <Button
            variant="contained"
            color="primary"
            startIcon={<RefreshIcon />}
            onClick={handleRefresh}
          >
            รีเฟรชข้อมูล
          </Button>
        }
      />

      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Tabs 
          value={activeTab} 
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          textColor="primary"
          indicatorColor="primary"
        >
          <Tab icon={<TrendingUpIcon />} label="ภาพรวม" />
          <Tab icon={<ChatBubbleIcon />} label="คอมเมนต์" />
          <Tab icon={<GroupIcon />} label="กลุ่ม" />
          <Tab icon={<MessageIcon />} label="คำสำคัญ" />
        </Tabs>

        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel>ช่วงเวลา</InputLabel>
          <Select
            value={timeRange}
            label="ช่วงเวลา"
            onChange={handleTimeRangeChange}
            size="small"
          >
            <MenuItem value="today">วันนี้</MenuItem>
            <MenuItem value="yesterday">เมื่อวาน</MenuItem>
            <MenuItem value="last7days">7 วันล่าสุด</MenuItem>
            <MenuItem value="last30days">30 วันล่าสุด</MenuItem>
            <MenuItem value="thisMonth">เดือนนี้</MenuItem>
            <MenuItem value="lastMonth">เดือนที่แล้ว</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* แท็บที่ 1: ภาพรวม */}
      {activeTab === 0 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={6} lg={3}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  คอมเมนต์ทั้งหมด
                </Typography>
                <Divider sx={{ mb: 2 }} />
                
                <Typography variant="h3" color="primary">
                  {commentStats?.total || 0}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  {getTimeRangeText()}: {
                    timeRange === 'today' ? commentStats?.today :
                    timeRange === 'yesterday' ? commentStats?.yesterday :
                    timeRange === 'last7days' ? commentStats?.last7Days :
                    commentStats?.last30Days || 0
                  }
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6} lg={3}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  กลุ่มทั้งหมด
                </Typography>
                <Divider sx={{ mb: 2 }} />
                
                <Typography variant="h3" color="primary">
                  {groupStats?.groupStatus?.active + groupStats?.groupStatus?.inactive || 0}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  เปิดใช้งาน: {groupStats?.groupStatus?.active || 0}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6} lg={3}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  คำสำคัญทั้งหมด
                </Typography>
                <Divider sx={{ mb: 2 }} />
                
                <Typography variant="h3" color="primary">
                  {keywordStats?.keywordStatus?.active + keywordStats?.keywordStatus?.inactive || 0}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  เปิดใช้งาน: {keywordStats?.keywordStatus?.active || 0}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6} lg={3}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  งานสแกนทั้งหมด
                </Typography>
                <Divider sx={{ mb: 2 }} />
                
                <Typography variant="h3" color="primary">
                  {Object.values(taskStats?.tasksByStatus || {}).reduce((a, b) => a + b, 0)}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  กำลังทำงาน: {taskStats?.tasksByStatus?.running || 0}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  สถานะงานสแกน
                </Typography>
                <Divider sx={{ mb: 2 }} />
                
                <Box height={300}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={taskStatusData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {taskStatusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`${value} งาน`, 'จำนวน']} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  แนวโน้มคอมเมนต์
                </Typography>
                <Divider sx={{ mb: 2 }} />
                
                <Box height={300}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={commentStats?.dailyComments || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip formatter={(value) => [`${value} คอมเมนต์`, 'จำนวน']} />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="count" 
                        name="จำนวนคอมเมนต์" 
                        stroke="#8884d8" 
                        activeDot={{ r: 8 }} 
                      />
                      <Line 
                        type="monotone" 
                        dataKey="success" 
                        name="สำเร็จ" 
                        stroke="#82ca9d" 
                      />
                      <Line 
                        type="monotone" 
                        dataKey="failure" 
                        name="ล้มเหลว" 
                        stroke="#ff8042" 
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  กลุ่มยอดนิยม
                </Typography>
                <Divider sx={{ mb: 2 }} />
                
                <Box height={350}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={groupActivityData.slice(0, 5)}
                      layout="vertical"
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis type="category" dataKey="groupName" width={100} />
                      <Tooltip formatter={(value) => [`${value} คอมเมนต์`, 'จำนวน']} />
                      <Legend />
                      <Bar dataKey="commentCount" name="จำนวนคอมเมนต์" fill="#82ca9d" />
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  คำสำคัญยอดนิยม
                </Typography>
                <Divider sx={{ mb: 2 }} />
                
                <Box height={350}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={keywordUsageData.slice(0, 5)}
                      layout="vertical"
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis type="category" dataKey="_id" width={100} />
                      <Tooltip formatter={(value) => [`${value} ครั้ง`, 'จำนวนการใช้']} />
                      <Legend />
                      <Bar dataKey="count" name="จำนวนการใช้" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* แท็บที่ 2: คอมเมนต์ */}
      {activeTab === 1 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  สถิติทั่วไป
                </Typography>
                <Divider sx={{ mb: 2 }} />
                
                <Typography variant="body1" gutterBottom>
                  <strong>คอมเมนต์ทั้งหมด:</strong> {commentStats?.total || 0}
                </Typography>
                <Typography variant="body1" gutterBottom>
                  <strong>วันนี้:</strong> {commentStats?.today || 0}
                </Typography>
                <Typography variant="body1" gutterBottom>
                  <strong>เมื่อวาน:</strong> {commentStats?.yesterday || 0}
                </Typography>
                <Typography variant="body1" gutterBottom>
                  <strong>7 วันล่าสุด:</strong> {commentStats?.last7Days || 0}
                </Typography>
                <Typography variant="body1" gutterBottom>
                  <strong>30 วันล่าสุด:</strong> {commentStats?.last30Days || 0}
                </Typography>
                <Typography variant="body1" gutterBottom>
                  <strong>อัตราความสำเร็จ:</strong> {commentStats?.successRate || 0}%
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  แนวโน้มคอมเมนต์
                </Typography>
                <Divider sx={{ mb: 2 }} />
                
                <Box height={300}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={commentStats?.dailyComments || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip formatter={(value) => [`${value} คอมเมนต์`, 'จำนวน']} />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="count" 
                        name="จำนวนคอมเมนต์" 
                        stroke="#8884d8" 
                        activeDot={{ r: 8 }} 
                      />
                      <Line 
                        type="monotone" 
                        dataKey="success" 
                        name="สำเร็จ" 
                        stroke="#82ca9d" 
                      />
                      <Line 
                        type="monotone" 
                        dataKey="failure" 
                        name="ล้มเหลว" 
                        stroke="#ff8042" 
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  การกระจายตามเวลา
                </Typography>
                <Divider sx={{ mb: 2 }} />
                
                <Box height={300}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={commentStats?.hourlyDistribution || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="hour" label={{ value: 'ชั่วโมง', position: 'insideBottom', offset: -5 }} />
                      <YAxis label={{ value: 'จำนวนคอมเมนต์', angle: -90, position: 'insideLeft' }} />
                      <Tooltip formatter={(value) => [`${value} คอมเมนต์`, 'จำนวน']} />
                      <Legend />
                      <Bar dataKey="count" name="จำนวนคอมเมนต์" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  สัดส่วนความสำเร็จ
                </Typography>
                <Divider sx={{ mb: 2 }} />
                
                <Box height={300}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'สำเร็จ', value: commentStats?.successCount || 0 },
                          { name: 'ล้มเหลว', value: commentStats?.failureCount || 0 }
                        ]}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        <Cell fill="#82ca9d" />
                        <Cell fill="#ff8042" />
                      </Pie>
                      <Tooltip formatter={(value) => [`${value} คอมเมนต์`, 'จำนวน']} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* แท็บที่ 3: กลุ่ม */}
      {activeTab === 2 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  สถิติกลุ่ม
                </Typography>
                <Divider sx={{ mb: 2 }} />
                
                <Typography variant="body1" gutterBottom>
                  <strong>กลุ่มทั้งหมด:</strong> {groupStats?.groupStatus?.active + groupStats?.groupStatus?.inactive || 0}
                </Typography>
                <Typography variant="body1" gutterBottom>
                  <strong>กลุ่มที่เปิดใช้งาน:</strong> {groupStats?.groupStatus?.active || 0}
                </Typography>
                <Typography variant="body1" gutterBottom>
                  <strong>กลุ่มที่ปิดใช้งาน:</strong> {groupStats?.groupStatus?.inactive || 0}
                </Typography>
                <Box mt={2}>
                  <Button 
                    variant="outlined" 
                    color="primary" 
                    fullWidth
                    onClick={() => navigate('/groups')}
                  >
                    ดูรายการกลุ่มทั้งหมด
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  กลุ่มที่มีกิจกรรมมากที่สุด
                </Typography>
                <Divider sx={{ mb: 2 }} />
                
                <Box height={300}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={groupActivityData.slice(0, 10)}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="groupName" />
                      <YAxis />
                      <Tooltip formatter={(value) => [`${value} คอมเมนต์`, 'จำนวน']} />
                      <Legend />
                      <Bar dataKey="commentCount" name="จำนวนคอมเมนต์" fill="#82ca9d" />
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  สัดส่วนสถานะกลุ่ม
                </Typography>
                <Divider sx={{ mb: 2 }} />
                
                <Box height={300}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'เปิดใช้งาน', value: groupStats?.groupStatus?.active || 0 },
                          { name: 'ปิดใช้งาน', value: groupStats?.groupStatus?.inactive || 0 }
                        ]}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        <Cell fill="#82ca9d" />
                        <Cell fill="#ff8042" />
                      </Pie>
                      <Tooltip formatter={(value) => [`${value} กลุ่ม`, 'จำนวน']} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  กลุ่มที่เพิ่มล่าสุด
                </Typography>
                <Divider sx={{ mb: 2 }} />
                
                {groupStats?.recentGroups && groupStats.recentGroups.length > 0 ? (
                  <Box>
                    {groupStats.recentGroups.map((group, index) => (
                      <Box key={index} mb={2} pb={1} borderBottom={index < groupStats.recentGroups.length - 1 ? 1 : 0} borderColor="divider">
                        <Typography variant="body1" fontWeight="medium">
                          {group.name}
                        </Typography>
                        <Box display="flex" justifyContent="space-between" alignItems="center">
                          <Typography variant="body2" color="textSecondary">
                            เพิ่มเมื่อ: {format(new Date(group.createdAt), 'dd/MM/yyyy')}
                          </Typography>
                          <Button 
                            size="small" 
                            onClick={() => navigate(`/groups/${group._id}`)}
                          >
                            ดูกลุ่ม
                          </Button>
                        </Box>
                      </Box>
                    ))}
                  </Box>
                ) : (
                  <Typography variant="body1" textAlign="center" py={3}>
                    ไม่มีข้อมูลกลุ่มล่าสุด
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* แท็บที่ 4: คำสำคัญ */}
      {activeTab === 3 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  สถิติคำสำคัญ
                </Typography>
                <Divider sx={{ mb: 2 }} />
                
                <Typography variant="body1" gutterBottom>
                  <strong>คำสำคัญทั้งหมด:</strong> {keywordStats?.keywordStatus?.active + keywordStats?.keywordStatus?.inactive || 0}
                </Typography>
                <Typography variant="body1" gutterBottom>
                  <strong>เปิดใช้งาน:</strong> {keywordStats?.keywordStatus?.active || 0}
                </Typography>
                <Typography variant="body1" gutterBottom>
                  <strong>ปิดใช้งาน:</strong> {keywordStats?.keywordStatus?.inactive || 0}
                </Typography>
                <Typography variant="body1" gutterBottom>
                  <strong>คำสำคัญที่มีรูปภาพ:</strong> {keywordStats?.withImages || 0}
                </Typography>
                <Box mt={2}>
                  <Button 
                    variant="outlined" 
                    color="primary" 
                    fullWidth
                    onClick={() => navigate('/keywords')}
                  >
                    ดูรายการคำสำคัญทั้งหมด
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  คำสำคัญที่ใช้มากที่สุด
                </Typography>
                <Divider sx={{ mb: 2 }} />
                
                <Box height={300}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={keywordUsageData.slice(0, 10)}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="_id" />
                      <YAxis />
                      <Tooltip formatter={(value) => [`${value} ครั้ง`, 'จำนวนการใช้']} />
                      <Legend />
                      <Bar dataKey="count" name="จำนวนการใช้" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  สัดส่วนสถานะคำสำคัญ
                </Typography>
                <Divider sx={{ mb: 2 }} />
                
                <Box height={300}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'เปิดใช้งาน', value: keywordStats?.keywordStatus?.active || 0 },
                          { name: 'ปิดใช้งาน', value: keywordStats?.keywordStatus?.inactive || 0 }
                        ]}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        <Cell fill="#82ca9d" />
                        <Cell fill="#ff8042" />
                      </Pie>
                      <Tooltip formatter={(value) => [`${value} คำสำคัญ`, 'จำนวน']} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  คำสำคัญตามหมวดหมู่
                </Typography>
                <Divider sx={{ mb: 2 }} />
                
                <Box height={300}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={keywordStats?.keywordsByCategory || []}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ category, percent }) => `${category}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        nameKey="category"
                        dataKey="count"
                      >
                        {(keywordStats?.keywordsByCategory || []).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`${value} คำสำคัญ`, 'จำนวน']} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
    </Box>
  );
};

export default Stats;
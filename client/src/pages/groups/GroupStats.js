// client/src/pages/groups/GroupStats.js
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from 'react-query';
import {
  Box, Typography, Button, CircularProgress, Paper, Grid, Divider,
  Card, CardContent, Tabs, Tab, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Chip
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  BarChart as ChartIcon,
  Edit as EditIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

import api from '../../services/api';
import PageHeader from '../../components/common/PageHeader';

// สีสำหรับ chart
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

const GroupStats = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);

  // ดึงข้อมูลสถิติกลุ่ม
  const { data, isLoading, error } = useQuery(
    ['group-stats', id],
    async () => {
      const response = await api.get(`/groups/${id}/stats`);
      return response.data.data;
    },
    { enabled: !!id }
  );

  // ดึงคอมเมนต์ในกลุ่ม
  const { data: commentsData, isLoading: isLoadingComments } = useQuery(
    ['group-comments', id],
    async () => {
      const response = await api.get(`/groups/${id}/comments`);
      return response.data;
    },
    { enabled: !!id }
  );

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  // แปลงข้อมูลสำหรับ keyword pie chart
  const prepareKeywordData = () => {
    if (!data?.commentStats?.keywordStats) return [];
    
    return data.commentStats.keywordStats.map((item, index) => ({
      name: item._id,
      value: item.count
    }));
  };

  // แปลงข้อมูลสำหรับ comments timeline
  const prepareTimelineData = () => {
    if (!commentsData?.data) return [];
    
    // จัดกลุ่มตามวันที่
    const groupedByDate = {};
    
    commentsData.data.forEach(comment => {
      const date = format(new Date(comment.createdAt), 'yyyy-MM-dd');
      if (!groupedByDate[date]) {
        groupedByDate[date] = 0;
      }
      groupedByDate[date]++;
    });
    
    // แปลงเป็นรูปแบบที่ใช้กับ chart
    return Object.keys(groupedByDate).map(date => ({
      date: format(new Date(date), 'dd/MM/yyyy'),
      count: groupedByDate[date]
    })).sort((a, b) => new Date(a.date) - new Date(b.date));
  };

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
          startIcon={<BackIcon />} 
          onClick={() => navigate(`/groups/${id}`)}
          sx={{ mt: 2 }}
        >
          กลับไปที่หน้ารายละเอียดกลุ่ม
        </Button>
      </Box>
    );
  }

  return (
    <Box p={3}>
      <PageHeader 
        title={`สถิติกลุ่ม: ${data?.group?.name || ''}`}
        subtitle={data?.group?.url || ''}
        actionButton={
          <Stack direction="row" spacing={2}>
            <Button
              variant="outlined"
              startIcon={<BackIcon />}
              onClick={() => navigate(`/groups/${id}`)}
            >
              กลับ
            </Button>
            <Button
              variant="outlined"
              color="primary"
              startIcon={<EditIcon />}
              onClick={() => navigate(`/groups/${id}`)}
            >
              แก้ไขกลุ่ม
            </Button>
          </Stack>
        }
      />

      <Paper sx={{ mb: 3 }}>
        <Tabs 
          value={activeTab} 
          onChange={handleTabChange}
          variant="fullWidth"
          textColor="primary"
          indicatorColor="primary"
        >
          <Tab label="ภาพรวม" icon={<ChartIcon />} />
          <Tab label="คอมเมนต์ทั้งหมด" />
          <Tab label="กราฟและแนวโน้ม" />
        </Tabs>
      </Paper>

      {/* แท็บที่ 1: ภาพรวม */}
      {activeTab === 0 && (
        <>
          <Grid container spacing={3} mb={3}>
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    สถิติทั่วไป
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  
                  <Box display="flex" flexDirection="column" gap={1}>
                    <Typography variant="body1">
                      <strong>จำนวนการสแกน:</strong> {data.group.totalScans || 0} ครั้ง
                    </Typography>
                    <Typography variant="body1">
                      <strong>โพสต์ที่สแกน:</strong> {data.group.totalPostsScanned || 0} โพสต์
                    </Typography>
                    <Typography variant="body1">
                      <strong>คอมเมนต์ทั้งหมด:</strong> {data.commentStats.total || 0} ข้อความ
                    </Typography>
                    <Typography variant="body1">
                      <strong>สแกนล่าสุด:</strong> {data.group.lastScanDate 
                        ? format(new Date(data.group.lastScanDate), 'dd/MM/yyyy HH:mm:ss') 
                        : 'ไม่เคยสแกน'}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    สถิติคอมเมนต์
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  
                  <Box display="flex" flexDirection="column" gap={1}>
                    <Typography variant="body1">
                      <strong>24 ชั่วโมงที่ผ่านมา:</strong> {data.commentStats.last24Hours || 0} คอมเมนต์
                    </Typography>
                    <Typography variant="body1">
                      <strong>7 วันที่ผ่านมา:</strong> {data.commentStats.last7Days || 0} คอมเมนต์
                    </Typography>
                    <Typography variant="body1">
                      <strong>30 วันที่ผ่านมา:</strong> {data.commentStats.last30Days || 0} คอมเมนต์
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    การตั้งค่ากลุ่ม
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  
                  <Box display="flex" flexDirection="column" gap={1}>
                    <Typography variant="body1">
                      <strong>สถานะ:</strong> {data.group.isActive ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}
                    </Typography>
                    <Typography variant="body1">
                      <strong>สถานะการสแกน:</strong> {data.group.scanEnabled ? 'เปิดสแกน' : 'ปิดสแกน'}
                    </Typography>
                    <Typography variant="body1">
                      <strong>ช่วงเวลาสแกน:</strong> ทุก {data.group.scanInterval || 24} ชั่วโมง
                    </Typography>
                    <Typography variant="body1">
                      <strong>จำนวนโพสต์ที่สแกน:</strong> {data.group.postScanLimit || 20} โพสต์
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    คำสำคัญยอดนิยม
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  
                  <Box height={300}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={prepareKeywordData()}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {prepareKeywordData().map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => [`${value} คอมเมนต์`, 'จำนวน']} />
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
                      <LineChart data={prepareTimelineData()}>
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
                      </LineChart>
                    </ResponsiveContainer>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </>
      )}

      {/* แท็บที่ 2: คอมเมนต์ทั้งหมด */}
      {activeTab === 1 && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            คอมเมนต์ทั้งหมดในกลุ่ม
          </Typography>
          <Divider sx={{ mb: 3 }} />

          {isLoadingComments ? (
            <Box display="flex" justifyContent="center" p={3}>
              <CircularProgress />
            </Box>
          ) : commentsData && commentsData.data && commentsData.data.length > 0 ? (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>วันที่</TableCell>
                    <TableCell>คำสำคัญ</TableCell>
                    <TableCell>ข้อความ</TableCell>
                    <TableCell>สถานะ</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {commentsData.data.map((comment) => (
                    <TableRow key={comment._id}>
                      <TableCell>
                        {format(new Date(comment.createdAt), 'dd/MM/yyyy HH:mm:ss')}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={comment.keywordMatched || 'ไม่ระบุ'}
                          size="small"
                          color="primary"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography noWrap sx={{ maxWidth: 250 }}>
                          {comment.messageUsed}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={comment.success ? 'สำเร็จ' : 'ล้มเหลว'}
                          size="small"
                          color={comment.success ? 'success' : 'error'}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Box textAlign="center" p={3}>
              <Typography variant="body1" color="textSecondary">
                ไม่พบข้อมูลคอมเมนต์ในกลุ่มนี้
              </Typography>
            </Box>
          )}
        </Paper>
      )}

      {/* แท็บที่ 3: กราฟและแนวโน้ม */}
      {activeTab === 2 && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  แนวโน้มคอมเมนต์รายวัน
                </Typography>
                <Divider sx={{ mb: 2 }} />
                
                <Box height={400}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={prepareTimelineData()}>
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
                        strokeWidth={2}
                        activeDot={{ r: 8 }} 
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
                  คำสำคัญที่พบ
                </Typography>
                <Divider sx={{ mb: 2 }} />
                
                <Box height={350}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={prepareKeywordData()}
                      layout="vertical"
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis type="category" dataKey="name" width={100} />
                      <Tooltip formatter={(value) => [`${value} ครั้ง`, 'จำนวนที่พบ']} />
                      <Legend />
                      <Bar dataKey="value" name="จำนวนที่พบ" fill="#82ca9d" />
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
                  สัดส่วนคำสำคัญ
                </Typography>
                <Divider sx={{ mb: 2 }} />
                
                <Box height={350}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={prepareKeywordData()}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        fill="#8884d8"
                        paddingAngle={5}
                        dataKey="value"
                        label={({ name, value }) => `${name}: ${value}`}
                      >
                        {prepareKeywordData().map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`${value} ครั้ง`, 'จำนวน']} />
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

export default GroupStats;
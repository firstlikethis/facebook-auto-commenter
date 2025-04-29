// client/src/pages/tasks/TaskDetail.js
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import {
  Box, Typography, Button, CircularProgress, Paper, Grid, Divider,
  Card, CardContent, Chip, List, ListItem, ListItemText, ListItemIcon,
  LinearProgress, Alert, AlertTitle, Stack, Tabs, Tab
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  PlayArrow as StartIcon,
  Stop as StopIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Info as InfoIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  CheckCircle as SuccessIcon,
  Pending as PendingIcon,
  Facebook as FacebookIcon,
  Group as GroupIcon
} from '@mui/icons-material';
import { format, formatDistanceToNow } from 'date-fns';
import { th } from 'date-fns/locale';
import toast from 'react-hot-toast';

import api from '../../services/api';
import PageHeader from '../../components/common/PageHeader';
import ConfirmDialog from '../../components/common/ConfirmDialog';

const TaskDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState(0);
  const [openConfirmDelete, setOpenConfirmDelete] = useState(false);
  const [openConfirmStop, setOpenConfirmStop] = useState(false);

  // ดึงข้อมูลงานสแกน
  const { data, isLoading, error } = useQuery(
    ['scan-task', id],
    async () => {
      const response = await api.get(`/scan-tasks/${id}`);
      return response.data.data;
    },
    {
      enabled: !!id,
      refetchInterval: (data) => data?.status === 'running' ? 5000 : false
    }
  );

  // ดึงบันทึกการทำงาน
  const { data: logsData, isLoading: isLoadingLogs } = useQuery(
    ['task-logs', id],
    async () => {
      const response = await api.get(`/scan-tasks/${id}/logs`);
      return response.data.data;
    },
    {
      enabled: !!id,
      refetchInterval: (data) => data?.status === 'running' ? 5000 : false
    }
  );

  // Mutation สำหรับลบงาน
  const deleteMutation = useMutation(
    () => api.delete(`/scan-tasks/${id}`),
    {
      onSuccess: () => {
        toast.success('ลบงานสแกนสำเร็จ');
        navigate('/tasks');
      },
      onError: (error) => {
        toast.error(`เกิดข้อผิดพลาด: ${error.response?.data?.message || error.message}`);
      }
    }
  );

  // Mutation สำหรับเริ่มงาน
  const startMutation = useMutation(
    () => api.post(`/scan-tasks/${id}/start`),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['scan-task', id]);
        toast.success('เริ่มงานสแกนสำเร็จ');
      },
      onError: (error) => {
        toast.error(`เกิดข้อผิดพลาด: ${error.response?.data?.message || error.message}`);
      }
    }
  );

  // Mutation สำหรับหยุดงาน
  const stopMutation = useMutation(
    () => api.post(`/scan-tasks/${id}/stop`),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['scan-task', id]);
        toast.success('หยุดงานสแกนสำเร็จ');
        setOpenConfirmStop(false);
      },
      onError: (error) => {
        toast.error(`เกิดข้อผิดพลาด: ${error.response?.data?.message || error.message}`);
      }
    }
  );

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  // คำนวณความก้าวหน้า
  const calculateProgress = () => {
    if (!data || !data.results) return 0;
    
    const totalGroups = data.groups?.length || 0;
    const totalScannedPosts = data.results.totalPostsScanned || 0;
    const targetPosts = totalGroups * (data.settings?.postScanLimit || 20);
    
    return Math.min(Math.round((totalScannedPosts / (targetPosts || 1)) * 100), 100);
  };

  // แสดงสถานะงาน
  const getStatusChip = (status) => {
    switch (status) {
      case 'pending':
        return (
          <Chip 
            icon={<PendingIcon />} 
            label="รอดำเนินการ" 
            color="warning" 
            variant="outlined" 
          />
        );
      case 'running':
        return (
          <Chip 
            icon={<StartIcon />} 
            label="กำลังทำงาน" 
            color="info" 
            variant="outlined" 
          />
        );
      case 'completed':
        return (
          <Chip 
            icon={<SuccessIcon />} 
            label="เสร็จสิ้น" 
            color="success" 
            variant="outlined" 
          />
        );
      case 'failed':
        return (
          <Chip 
            icon={<ErrorIcon />} 
            label="ล้มเหลว" 
            color="error" 
            variant="outlined" 
          />
        );
      case 'canceled':
        return (
          <Chip 
            icon={<StopIcon />} 
            label="ยกเลิก" 
            color="default" 
            variant="outlined" 
          />
        );
      default:
        return (
          <Chip 
            label="ไม่ทราบสถานะ" 
            color="default" 
            variant="outlined" 
          />
        );
    }
  };

  // จัดรูปแบบระยะเวลา
  const formatDuration = (startTime, endTime) => {
    if (!startTime) return '-';
    
    const start = new Date(startTime);
    const end = endTime ? new Date(endTime) : new Date();
    
    const durationMs = end - start;
    const seconds = Math.floor(durationMs / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours} ชั่วโมง ${minutes % 60} นาที ${seconds % 60} วินาที`;
    } else if (minutes > 0) {
      return `${minutes} นาที ${seconds % 60} วินาที`;
    } else {
      return `${seconds} วินาที`;
    }
  };

  // แสดงไอคอนระดับความสำคัญของบันทึก
  const getLogLevelIcon = (level) => {
    switch (level) {
      case 'info':
        return <InfoIcon color="info" />;
      case 'warning':
        return <WarningIcon color="warning" />;
      case 'error':
        return <ErrorIcon color="error" />;
      default:
        return <InfoIcon />;
    }
  };
  
  // แสดงชื่อกลุ่มอย่างปลอดภัย
  const renderGroupName = (group) => {
    if (!group) return 'ไม่ระบุชื่อกลุ่ม';
    
    if (typeof group === 'object') {
      return group.name || 'ไม่ระบุชื่อกลุ่ม';
    }
    
    return `ID: ${group}`;
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
          onClick={() => navigate('/tasks')}
          sx={{ mt: 2 }}
        >
          กลับไปที่รายการงาน
        </Button>
      </Box>
    );
  }

  return (
    <Box p={3}>
      <PageHeader 
        title={`รายละเอียดงานสแกน ${data?.type === 'recurring' ? '(ทำซ้ำ)' : '(ครั้งเดียว)'}`}
        actionButton={
          <Stack direction="row" spacing={2}>
            <Button
              variant="outlined"
              startIcon={<BackIcon />}
              onClick={() => navigate('/tasks')}
            >
              กลับ
            </Button>
            
            {data.status === 'pending' && (
              <Button
                variant="contained"
                color="success"
                startIcon={<StartIcon />}
                onClick={() => startMutation.mutate()}
                disabled={startMutation.isLoading}
              >
                {startMutation.isLoading ? <CircularProgress size={24} /> : 'เริ่มทำงาน'}
              </Button>
            )}
            
            {data.status === 'running' && (
              <Button
                variant="contained"
                color="error"
                startIcon={<StopIcon />}
                onClick={() => setOpenConfirmStop(true)}
                disabled={stopMutation.isLoading}
              >
                {stopMutation.isLoading ? <CircularProgress size={24} /> : 'หยุดทำงาน'}
              </Button>
            )}
            
            {(data.status === 'completed' || data.status === 'failed' || data.status === 'canceled') && (
              <Button
                variant="outlined"
                color="primary"
                startIcon={<AddIcon />}
                onClick={() => navigate('/tasks/new', { state: { cloneFrom: data } })}
              >
                สร้างงานจากต้นแบบนี้
              </Button>
            )}
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
          <Tab label="ภาพรวม" />
          <Tab label="บันทึกการทำงาน" />
          <Tab label="รายละเอียดข้อผิดพลาด" />
        </Tabs>
      </Paper>

      {/* แท็บที่ 1: ภาพรวม */}
      {activeTab === 0 && (
        <>
          <Grid container spacing={3} mb={3}>
            <Grid item xs={12} md={8}>
              <Card>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="h6">สถานะงาน</Typography>
                    {getStatusChip(data.status)}
                  </Box>
                  
                  <Divider sx={{ mb: 2 }} />
                  
                  {data.status === 'running' && (
                    <Box mb={3}>
                      <Box display="flex" justifyContent="space-between" mb={1}>
                        <Typography variant="body2">ความคืบหน้า:</Typography>
                        <Typography variant="body2">{calculateProgress()}%</Typography>
                      </Box>
                      <LinearProgress 
                        variant="determinate" 
                        value={calculateProgress()} 
                        sx={{ height: 10, borderRadius: 5 }}
                      />
                    </Box>
                  )}
                  
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <Typography variant="body2">
                        <strong>ตั้งเวลาไว้:</strong> {format(new Date(data.scheduledTime), 'dd/MM/yyyy HH:mm:ss')}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Typography variant="body2">
                        <strong>เริ่มทำงาน:</strong> {data.startTime 
                          ? format(new Date(data.startTime), 'dd/MM/yyyy HH:mm:ss')
                          : '-'}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Typography variant="body2">
                        <strong>เสร็จสิ้น:</strong> {data.endTime 
                          ? format(new Date(data.endTime), 'dd/MM/yyyy HH:mm:ss')
                          : '-'}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Typography variant="body2">
                        <strong>ระยะเวลาทำงาน:</strong> {formatDuration(data.startTime, data.endTime)}
                      </Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    ผลลัพธ์
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  
                  <Typography variant="body1" gutterBottom>
                    <strong>กลุ่มทั้งหมด:</strong> {data.groups?.length || 0} กลุ่ม
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    <strong>โพสต์ที่สแกน:</strong> {data.results?.totalPostsScanned || 0} โพสต์
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    <strong>คอมเมนต์ที่โพสต์:</strong> {data.results?.totalCommentsPosted || 0} ข้อความ
                  </Typography>
                  <Typography variant="body1">
                    <strong>ข้อผิดพลาด:</strong> {data.results?.errors?.length || 0} รายการ
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center" mb={2}>
                    <GroupIcon color="primary" sx={{ mr: 1 }} />
                    <Typography variant="h6">กลุ่มที่สแกน</Typography>
                  </Box>
                  <Divider sx={{ mb: 2 }} />
                  
                  <List>
                    {data.groups && data.groups.length > 0 ? (
                      data.groups.map((group, index) => (
                        <ListItem key={index} divider={index < data.groups.length - 1}>
                          <ListItemText
                            primary={renderGroupName(group)}
                            secondary={typeof group === 'object' ? `ID: ${group.groupId || 'ไม่ระบุ'}` : ''}
                          />
                          {typeof group === 'object' && group._id && (
                            <Button 
                              size="small" 
                              onClick={() => navigate(`/groups/${group._id}`)}
                            >
                              ดูกลุ่ม
                            </Button>
                          )}
                        </ListItem>
                      ))
                    ) : (
                      <ListItem>
                        <ListItemText primary="ไม่พบข้อมูลกลุ่ม" />
                      </ListItem>
                    )}
                  </List>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center" mb={2}>
                    <FacebookIcon color="primary" sx={{ mr: 1 }} />
                    <Typography variant="h6">บัญชีที่ใช้</Typography>
                  </Box>
                  <Divider sx={{ mb: 2 }} />
                  
                  {data.facebookAccount ? (
                    <Box>
                      <Typography variant="body1">
                        <strong>ชื่อ:</strong> {typeof data.facebookAccount === 'object' 
                          ? (data.facebookAccount.name || '-') 
                          : 'ID: ' + data.facebookAccount}
                      </Typography>
                      <Typography variant="body1">
                        <strong>อีเมล:</strong> {typeof data.facebookAccount === 'object' 
                          ? data.facebookAccount.email 
                          : 'ไม่ระบุ'}
                      </Typography>
                      <Typography variant="body1">
                        <strong>สถานะ:</strong> {typeof data.facebookAccount === 'object' && data.facebookAccount.loginStatus
                          ? (data.facebookAccount.loginStatus === 'success' 
                              ? 'ล็อกอินสำเร็จ' 
                              : data.facebookAccount.loginStatus === 'failed'
                                ? 'ล็อกอินล้มเหลว'
                                : 'ไม่ทราบสถานะ')
                          : 'ไม่ทราบสถานะ'}
                      </Typography>
                      {typeof data.facebookAccount === 'object' && data.facebookAccount._id && (
                        <Button 
                          size="small" 
                          sx={{ mt: 2 }}
                          onClick={() => navigate(`/facebook-accounts/${data.facebookAccount._id}`)}
                        >
                          ดูบัญชี
                        </Button>
                      )}
                    </Box>
                  ) : (
                    <Typography variant="body1">ไม่พบข้อมูลบัญชี</Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    การตั้งค่างาน
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={4}>
                      <Typography variant="body1">
                        <strong>จำนวนโพสต์ต่อกลุ่ม:</strong> {data.settings?.postScanLimit || 20} โพสต์
                      </Typography>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <Typography variant="body1">
                        <strong>โหมดการทำงาน:</strong> {data.settings?.useParallel 
                          ? `ขนาน (${data.settings?.workerCount || 3} workers)` 
                          : 'ตามลำดับ'}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <Typography variant="body1">
                        <strong>แสดงหน้าต่าง:</strong> {data.settings?.headless 
                          ? 'ไม่แสดง (Headless)' 
                          : 'แสดง'}
                      </Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* แสดงปุ่มลบงาน */}
          <Box display="flex" justifyContent="flex-end" mt={3}>
            <Button
              variant="outlined"
              color="error"
              startIcon={<DeleteIcon />}
              onClick={() => setOpenConfirmDelete(true)}
              disabled={data.status === 'running'}
            >
              ลบงานนี้
            </Button>
          </Box>
        </>
      )}

      {/* แท็บที่ 2: บันทึกการทำงาน */}
      {activeTab === 1 && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            บันทึกการทำงาน
          </Typography>
          <Divider sx={{ mb: 3 }} />

          {isLoadingLogs ? (
            <Box display="flex" justifyContent="center" p={3}>
              <CircularProgress />
            </Box>
          ) : !logsData || logsData.length === 0 ? (
            <Alert severity="info">
              <AlertTitle>ไม่พบบันทึกการทำงาน</AlertTitle>
              <Typography variant="body2">
                ยังไม่มีบันทึกการทำงานสำหรับงานนี้
              </Typography>
            </Alert>
          ) : (
            <List>
              {logsData.map((log, index) => (
                <ListItem key={index} divider={index < logsData.length - 1}>
                  <ListItemIcon>
                    {getLogLevelIcon(log.level)}
                  </ListItemIcon>
                  <ListItemText
                    primary={log.message}
                    secondary={`${format(new Date(log.timestamp), 'dd/MM/yyyy HH:mm:ss')} (${formatDistanceToNow(new Date(log.timestamp), { addSuffix: true, locale: th })})`}
                  />
                </ListItem>
              ))}
            </List>
          )}
        </Paper>
      )}

      {/* แท็บที่ 3: รายละเอียดข้อผิดพลาด */}
      {activeTab === 2 && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            รายละเอียดข้อผิดพลาด
          </Typography>
          <Divider sx={{ mb: 3 }} />

          {!data.results?.errors || data.results.errors.length === 0 ? (
            <Alert severity="success">
              <AlertTitle>ไม่พบข้อผิดพลาด</AlertTitle>
              <Typography variant="body2">
                ไม่พบข้อผิดพลาดในการทำงานของงานนี้
              </Typography>
            </Alert>
          ) : (
            <List>
              {data.results.errors.map((error, index) => (
                <ListItem key={index} divider={index < data.results.errors.length - 1}>
                  <ListItemIcon>
                    <ErrorIcon color="error" />
                  </ListItemIcon>
                  <ListItemText
                    primary={error.message}
                    secondary={`กลุ่ม ID: ${error.groupId || 'ไม่ระบุ'} - ${error.timestamp ? format(new Date(error.timestamp), 'dd/MM/yyyy HH:mm:ss') : 'ไม่ระบุเวลา'}`}
                  />
                </ListItem>
              ))}
            </List>
          )}
        </Paper>
      )}

      {/* Dialog ยืนยันการลบ */}
      <ConfirmDialog
        open={openConfirmDelete}
        title="ยืนยันการลบงาน"
        content="คุณต้องการลบงานสแกนนี้ใช่หรือไม่? การดำเนินการนี้ไม่สามารถย้อนกลับได้"
        onConfirm={() => deleteMutation.mutate()}
        onCancel={() => setOpenConfirmDelete(false)}
        isLoading={deleteMutation.isLoading}
        confirmText="ลบงาน"
        confirmColor="error"
      />

      {/* Dialog ยืนยันการหยุดงาน */}
      <ConfirmDialog
        open={openConfirmStop}
        title="ยืนยันการหยุดงาน"
        content="คุณต้องการหยุดงานสแกนนี้ใช่หรือไม่? งานที่กำลังทำงานอยู่จะถูกหยุดทันที"
        onConfirm={() => stopMutation.mutate()}
        onCancel={() => setOpenConfirmStop(false)}
        isLoading={stopMutation.isLoading}
        confirmText="หยุดงาน"
        confirmColor="error"
      />
    </Box>
  );
};

export default TaskDetail;
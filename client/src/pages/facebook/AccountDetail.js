// client/src/pages/facebook/AccountDetail.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import {
  Box, Typography, Button, CircularProgress, Paper, Grid, TextField,
  Divider, Stack, IconButton, Alert, AlertTitle, Card, CardContent,
  Switch, FormControlLabel
} from '@mui/material';
import {
  Save as SaveIcon,
  ArrowBack as BackIcon,
  Refresh as RefreshIcon,
  Lock as LockIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  Warning as PendingIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

import api from '../../services/api';
import PageHeader from '../../components/common/PageHeader';
import ConfirmDialog from '../../components/common/ConfirmDialog';

const AccountDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [account, setAccount] = useState({
    email: '',
    password: '',
    name: '',
    isActive: true
  });
  const [showPassword, setShowPassword] = useState(false);
  const [openConfirmDelete, setOpenConfirmDelete] = useState(false);

  // ดึงข้อมูลบัญชี
  const { data, isLoading, error, refetch } = useQuery(
    ['facebook-account', id],
    async () => {
      const response = await api.get(`/facebook-accounts/${id}`);
      return response.data;
    },
    {
      enabled: !!id,
      onSuccess: (data) => {
        setAccount({
          email: data.data.email || '',
          password: data.data.password || '',
          name: data.data.name || '',
          isActive: data.data.isActive !== undefined ? data.data.isActive : true
        });
      },
      // ดึงข้อมูลทุก 500ms เมื่อสถานะเป็น pending (เร็วขึ้นเพื่อให้อัปเดตเร็วขึ้น)
      refetchInterval: (data) => data?.data?.loginStatus === 'pending' ? 500 : false
    }
  );

  // ดึงข้อมูลเมื่อมีการเปลี่ยนแปลงสถานะ
  useEffect(() => {
    // ตั้งเวลารีเฟรชข้อมูลทุก 1 วินาที
    const intervalId = setInterval(() => {
      if (data?.data?.loginStatus === 'pending') {
        refetch();
      }
    }, 1000);
    
    return () => clearInterval(intervalId);
  }, [data?.data?.loginStatus, refetch]);

  // Mutation สำหรับอัปเดตบัญชี
  const updateMutation = useMutation(
    (accountData) => api.put(`/facebook-accounts/${id}`, accountData),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['facebook-account', id]);
        toast.success('อัปเดตบัญชีสำเร็จ');
      },
      onError: (error) => {
        toast.error(`เกิดข้อผิดพลาด: ${error.response?.data?.message || error.message}`);
      }
    }
  );

  // Mutation สำหรับลบบัญชี
  const deleteMutation = useMutation(
    () => api.delete(`/facebook-accounts/${id}`),
    {
      onSuccess: () => {
        toast.success('ลบบัญชีสำเร็จ');
        navigate('/facebook-accounts');
      },
      onError: (error) => {
        toast.error(`เกิดข้อผิดพลาด: ${error.response?.data?.message || error.message}`);
      }
    }
  );

  // Mutation สำหรับทดสอบล็อกอิน
  const testLoginMutation = useMutation(
    () => api.post(`/facebook-accounts/${id}/test-login`),
    {
      onSuccess: () => {
        // ใช้ toast() หรือ toast.success() แทน toast.info()
        toast('กำลังทดสอบล็อกอิน กรุณารอสักครู่...');
        // ทำการรีเฟรชข้อมูลทันที
        refetch();
      },
      onError: (error) => {
        toast.error(`เกิดข้อผิดพลาด: ${error.response?.data?.message || error.message}`);
      }
    }
  );

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setAccount(prev => ({ ...prev, [name]: value }));
  };

  const handleSwitchChange = (e) => {
    const { name, checked } = e.target;
    setAccount(prev => ({ ...prev, [name]: checked }));
  };

  const handleSaveAccount = () => {
    updateMutation.mutate(account);
  };

  const getStatusIcon = () => {
    if (!data) return null;

    switch (data.data.loginStatus) {
      case 'success':
        return <SuccessIcon color="success" fontSize="large" />;
      case 'failed':
        return <ErrorIcon color="error" fontSize="large" />;
      case 'pending':
        return <PendingIcon color="warning" fontSize="large" />;
      default:
        return <PendingIcon color="disabled" fontSize="large" />;
    }
  };

  const getStatusColor = () => {
    if (!data) return 'info';

    switch (data.data.loginStatus) {
      case 'success': return 'success';
      case 'failed': return 'error';
      case 'pending': return 'warning';
      default: return 'info';
    }
  };

  const getStatusText = () => {
    if (!data) return 'ไม่ทราบสถานะ';

    switch (data.data.loginStatus) {
      case 'success': return 'เข้าสู่ระบบสำเร็จ';
      case 'failed': return 'เข้าสู่ระบบล้มเหลว';
      case 'pending': return 'กำลังดำเนินการ';
      default: return 'ไม่ทราบสถานะ';
    }
  };

  // ข้อความแสดงสาเหตุของความล้มเหลว (ถ้ามี)
  const getErrorMessage = () => {
    if (data?.data?.loginStatus === 'failed' && data?.data?.error) {
      return data.data.error;
    }
    return null;
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
          onClick={() => navigate('/facebook-accounts')}
          sx={{ mt: 2 }}
        >
          กลับไปที่รายการบัญชี
        </Button>
      </Box>
    );
  }

  return (
    <Box p={3}>
      <PageHeader 
        title="จัดการบัญชี Facebook" 
        actionButton={
          <Stack direction="row" spacing={2}>
            <Button
              variant="outlined"
              startIcon={<BackIcon />}
              onClick={() => navigate('/facebook-accounts')}
            >
              กลับ
            </Button>
            <Button
              variant="contained"
              color="primary"
              startIcon={<SaveIcon />}
              onClick={handleSaveAccount}
              disabled={updateMutation.isLoading}
            >
              {updateMutation.isLoading ? <CircularProgress size={24} /> : 'บันทึก'}
            </Button>
          </Stack>
        }
      />

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              ข้อมูลบัญชี
            </Typography>
            <Divider sx={{ mb: 3 }} />

            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  name="name"
                  label="ชื่อบัญชี (สำหรับแสดงในระบบ)"
                  value={account.name}
                  onChange={handleInputChange}
                  fullWidth
                  helperText="ใส่ชื่อที่ใช้แสดงในระบบ ไม่จำเป็นต้องตรงกับชื่อใน Facebook"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  name="email"
                  label="อีเมล Facebook"
                  value={account.email}
                  onChange={handleInputChange}
                  fullWidth
                  required
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  name="password"
                  label="รหัสผ่าน Facebook"
                  type={showPassword ? "text" : "password"}
                  value={account.password}
                  onChange={handleInputChange}
                  fullWidth
                  required
                  InputProps={{
                    endAdornment: (
                      <IconButton onClick={() => setShowPassword(!showPassword)}>
                        <LockIcon />
                      </IconButton>
                    )
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={account.isActive}
                      onChange={handleSwitchChange}
                      name="isActive"
                      color="primary"
                    />
                  }
                  label="เปิดใช้งาน"
                />
              </Grid>
            </Grid>

            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
              <Button
                variant="outlined"
                color="primary"
                startIcon={<RefreshIcon />}
                onClick={() => testLoginMutation.mutate()}
                disabled={testLoginMutation.isLoading || data?.data?.loginStatus === 'pending'}
              >
                {testLoginMutation.isLoading || data?.data?.loginStatus === 'pending' ? 
                  <CircularProgress size={24} /> : 'ทดสอบล็อกอิน'}
              </Button>

              <Button
                variant="outlined"
                color="error"
                onClick={() => setOpenConfirmDelete(true)}
              >
                ลบบัญชีนี้
              </Button>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                สถานะบัญชี
              </Typography>
              <Divider sx={{ mb: 2 }} />

              <Box display="flex" alignItems="center" mb={2}>
                {getStatusIcon()}
                <Typography variant="h5" sx={{ ml: 1 }}>
                  {getStatusText()}
                </Typography>
              </Box>

              <Alert severity={getStatusColor()} sx={{ mb: 2 }}>
                <AlertTitle>ข้อมูลล่าสุด</AlertTitle>
                <Typography variant="body2">
                  <strong>เข้าสู่ระบบล่าสุด:</strong> {data.data.lastLogin ? format(new Date(data.data.lastLogin), 'dd/MM/yyyy HH:mm:ss') : 'ไม่มีข้อมูล'}
                </Typography>
                <Typography variant="body2">
                  <strong>Cookies:</strong> {data.data.cookiesPath ? 'มีข้อมูล' : 'ไม่มีข้อมูล'}
                </Typography>
                {getErrorMessage() && (
                  <Typography variant="body2" color="error" mt={1}>
                    <strong>สาเหตุ:</strong> {getErrorMessage()}
                  </Typography>
                )}
              </Alert>

              <Typography variant="body2" color="textSecondary">
                คำแนะนำ: ควรทดสอบล็อกอินก่อนทำงานสแกนเพื่อให้แน่ใจว่าบัญชียังใช้งานได้
              </Typography>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                คำแนะนำความปลอดภัย
              </Typography>
              <Divider sx={{ mb: 2 }} />

              <Typography variant="body2" paragraph>
                <strong>1. ตั้งค่าการยืนยันตัวตนสองชั้น:</strong> บัญชีนี้ควรมีการยืนยันตัวตนสองชั้นเพื่อความปลอดภัย
              </Typography>
              <Typography variant="body2" paragraph>
                <strong>2. เปลี่ยนรหัสผ่านเป็นประจำ:</strong> ควรเปลี่ยนรหัสผ่านทุก 30-90 วัน
              </Typography>
              <Typography variant="body2">
                <strong>3. ตรวจสอบกิจกรรมล่าสุด:</strong> ตรวจสอบกิจกรรมที่น่าสงสัยในบัญชีเป็นประจำ
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Dialog ยืนยันการลบ */}
      <ConfirmDialog
        open={openConfirmDelete}
        title="ยืนยันการลบบัญชี"
        content={`คุณต้องการลบบัญชี "${account.name || account.email}" ใช่หรือไม่? การดำเนินการนี้ไม่สามารถย้อนกลับได้`}
        onConfirm={() => deleteMutation.mutate()}
        onCancel={() => setOpenConfirmDelete(false)}
        isLoading={deleteMutation.isLoading}
        confirmText="ลบบัญชี"
        confirmColor="error"
      />
    </Box>
  );
};

export default AccountDetail;
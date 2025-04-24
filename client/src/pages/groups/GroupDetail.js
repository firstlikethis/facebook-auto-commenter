// client/src/pages/groups/GroupDetail.js
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import {
  Box, Typography, Button, CircularProgress, Paper, Grid, TextField,
  Divider, Stack, IconButton, Alert, AlertTitle, Card, CardContent,
  Switch, FormControlLabel, MenuItem, Select, FormControl, InputLabel
} from '@mui/material';
import {
  Save as SaveIcon,
  ArrowBack as BackIcon,
  PlayArrow as ScanIcon,
  Delete as DeleteIcon,
  BarChart as StatsIcon,
  Link as LinkIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

import api from '../../services/api';
import PageHeader from '../../components/common/PageHeader';
import ConfirmDialog from '../../components/common/ConfirmDialog';

const GroupDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [group, setGroup] = useState({
    name: '',
    groupId: '',
    url: '',
    description: '',
    isActive: true,
    scanEnabled: true,
    scanInterval: 24,
    postScanLimit: 20,
    priority: 0,
    category: '',
    facebookAccount: ''
  });
  const [openConfirmDelete, setOpenConfirmDelete] = useState(false);
  const [openConfirmScan, setOpenConfirmScan] = useState(false);

  // ดึงข้อมูลกลุ่ม
  const { data, isLoading, error } = useQuery(
    ['group', id],
    async () => {
      const response = await api.get(`/groups/${id}`);
      return response.data.data;
    },
    {
      enabled: !!id,
      onSuccess: (data) => {
        setGroup({
          name: data.name || '',
          groupId: data.groupId || '',
          url: data.url || '',
          description: data.description || '',
          isActive: data.isActive !== undefined ? data.isActive : true,
          scanEnabled: data.scanEnabled !== undefined ? data.scanEnabled : true,
          scanInterval: data.scanInterval || 24,
          postScanLimit: data.postScanLimit || 20,
          priority: data.priority || 0,
          category: data.category || '',
          facebookAccount: data.facebookAccount?._id || data.facebookAccount || ''
        });
      }
    }
  );

  // ดึงข้อมูลบัญชี Facebook
  const { data: accountsData } = useQuery(
    'facebook-accounts',
    async () => {
      const response = await api.get('/facebook-accounts');
      return response.data.data;
    }
  );

  // Mutation สำหรับอัปเดตกลุ่ม
  const updateMutation = useMutation(
    (groupData) => api.put(`/groups/${id}`, groupData),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['group', id]);
        toast.success('อัปเดตกลุ่มสำเร็จ');
      },
      onError: (error) => {
        toast.error(`เกิดข้อผิดพลาด: ${error.response?.data?.message || error.message}`);
      }
    }
  );

  // Mutation สำหรับลบกลุ่ม
  const deleteMutation = useMutation(
    () => api.delete(`/groups/${id}`),
    {
      onSuccess: () => {
        toast.success('ลบกลุ่มสำเร็จ');
        navigate('/groups');
      },
      onError: (error) => {
        toast.error(`เกิดข้อผิดพลาด: ${error.response?.data?.message || error.message}`);
      }
    }
  );

  // Mutation สำหรับสแกนกลุ่ม
  const scanMutation = useMutation(
    () => api.post(`/groups/${id}/scan`, { postScanLimit: group.postScanLimit }),
    {
      onSuccess: () => {
        toast.success('เริ่มสแกนกลุ่มสำเร็จ');
        navigate('/tasks');
      },
      onError: (error) => {
        toast.error(`เกิดข้อผิดพลาด: ${error.response?.data?.message || error.message}`);
      }
    }
  );

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setGroup(prev => ({ ...prev, [name]: value }));
  };

  const handleSwitchChange = (e) => {
    const { name, checked } = e.target;
    setGroup(prev => ({ ...prev, [name]: checked }));
  };

  const handleSaveGroup = () => {
    updateMutation.mutate(group);
  };

  const handleStartScan = () => {
    scanMutation.mutate();
    setOpenConfirmScan(false);
  };

  const openGroupInFacebook = () => {
    if (group.url) {
      window.open(group.url, '_blank');
    }
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
          onClick={() => navigate('/groups')}
          sx={{ mt: 2 }}
        >
          กลับไปที่รายการกลุ่ม
        </Button>
      </Box>
    );
  }

  return (
    <Box p={3}>
      <PageHeader 
        title="จัดการกลุ่ม Facebook" 
        actionButton={
          <Stack direction="row" spacing={2}>
            <Button
              variant="outlined"
              startIcon={<BackIcon />}
              onClick={() => navigate('/groups')}
            >
              กลับ
            </Button>
            <Button
              variant="contained"
              color="success"
              startIcon={<ScanIcon />}
              onClick={() => setOpenConfirmScan(true)}
              disabled={!group.isActive || !group.scanEnabled}
            >
              สแกนทันที
            </Button>
            <Button
              variant="contained"
              color="primary"
              startIcon={<SaveIcon />}
              onClick={handleSaveGroup}
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
              ข้อมูลกลุ่ม
            </Typography>
            <Divider sx={{ mb: 3 }} />

            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  name="name"
                  label="ชื่อกลุ่ม"
                  value={group.name}
                  onChange={handleInputChange}
                  fullWidth
                  required
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  name="groupId"
                  label="Group ID"
                  value={group.groupId}
                  onChange={handleInputChange}
                  fullWidth
                  required
                  helperText="เลขหรือชื่อในลิงก์ เช่น 123456789"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  name="url"
                  label="URL กลุ่ม"
                  value={group.url}
                  onChange={handleInputChange}
                  fullWidth
                  InputProps={{
                    endAdornment: (
                      <IconButton onClick={openGroupInFacebook} disabled={!group.url}>
                        <LinkIcon />
                      </IconButton>
                    )
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  name="category"
                  label="หมวดหมู่"
                  value={group.category}
                  onChange={handleInputChange}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>บัญชี Facebook</InputLabel>
                  <Select
                    name="facebookAccount"
                    value={group.facebookAccount}
                    onChange={handleInputChange}
                    label="บัญชี Facebook"
                  >
                    <MenuItem value="">ไม่ระบุ</MenuItem>
                    {accountsData && accountsData.map((account) => (
                      <MenuItem key={account._id} value={account._id}>
                        {account.name || account.email}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  name="description"
                  label="คำอธิบาย"
                  value={group.description}
                  onChange={handleInputChange}
                  fullWidth
                  multiline
                  rows={3}
                />
              </Grid>
            </Grid>
          </Paper>

          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              การตั้งค่าการสแกน
            </Typography>
            <Divider sx={{ mb: 3 }} />

            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={group.isActive}
                      onChange={handleSwitchChange}
                      name="isActive"
                      color="primary"
                    />
                  }
                  label="เปิดใช้งาน"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={group.scanEnabled}
                      onChange={handleSwitchChange}
                      name="scanEnabled"
                      color="primary"
                    />
                  }
                  label="เปิดสแกน"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  name="scanInterval"
                  label="ช่วงเวลาการสแกน (ชั่วโมง)"
                  type="number"
                  value={group.scanInterval}
                  onChange={handleInputChange}
                  fullWidth
                  InputProps={{
                    inputProps: { min: 1 }
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  name="postScanLimit"
                  label="จำนวนโพสต์ที่จะสแกน"
                  type="number"
                  value={group.postScanLimit}
                  onChange={handleInputChange}
                  fullWidth
                  InputProps={{
                    inputProps: { min: 1, max: 100 }
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  name="priority"
                  label="ลำดับความสำคัญ"
                  type="number"
                  value={group.priority}
                  onChange={handleInputChange}
                  fullWidth
                  helperText="ตัวเลขสูงกว่ามีความสำคัญมากกว่า"
                  InputProps={{
                    inputProps: { min: 0 }
                  }}
                />
              </Grid>
            </Grid>

            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
              <Button
                variant="outlined"
                color="info"
                startIcon={<StatsIcon />}
                onClick={() => navigate(`/groups/${id}/stats`)}
              >
                ดูสถิติ
              </Button>

              <Button
                variant="outlined"
                color="error"
                startIcon={<DeleteIcon />}
                onClick={() => setOpenConfirmDelete(true)}
              >
                ลบกลุ่มนี้
              </Button>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                สถิติกลุ่ม
              </Typography>
              <Divider sx={{ mb: 2 }} />

              <Typography variant="body1" gutterBottom>
                <strong>จำนวนการสแกน:</strong> {data.totalScans || 0} ครั้ง
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>โพสต์ที่สแกน:</strong> {data.totalPostsScanned || 0} โพสต์
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>คอมเมนต์ที่โพสต์:</strong> {data.totalCommentsPosted || 0} ข้อความ
              </Typography>
              <Typography variant="body1">
                <strong>สแกนล่าสุด:</strong> {data.lastScanDate 
                  ? format(new Date(data.lastScanDate), 'dd/MM/yyyy HH:mm:ss') 
                  : 'ไม่เคยสแกน'}
              </Typography>

              <Box mt={2}>
                <Button
                  variant="outlined"
                  color="primary"
                  fullWidth
                  onClick={() => navigate(`/groups/${id}/stats`)}
                  startIcon={<StatsIcon />}
                >
                  ดูสถิติเพิ่มเติม
                </Button>
              </Box>
            </CardContent>
          </Card>

          <Alert severity="info" sx={{ mb: 3 }}>
            <AlertTitle>คำแนะนำ</AlertTitle>
            <Typography variant="body2" paragraph>
              การสแกนกลุ่มจะทำให้ระบบตรวจสอบโพสต์ใหม่ในกลุ่มและคอมเมนต์โดยอัตโนมัติหากพบคำสำคัญที่ตรงกัน
            </Typography>
            <Typography variant="body2">
              ตั้งค่าจำนวนโพสต์ที่เหมาะสมเพื่อให้ระบบทำงานได้อย่างมีประสิทธิภาพ
            </Typography>
          </Alert>

          {group.facebookAccount ? (
            <Alert severity="success">
              <AlertTitle>บัญชีที่ใช้สแกน</AlertTitle>
              <Typography variant="body2">
                กลุ่มนี้ถูกตั้งค่าให้ใช้บัญชี {accountsData?.find(a => a._id === group.facebookAccount)?.name || accountsData?.find(a => a._id === group.facebookAccount)?.email || 'ไม่ทราบชื่อ'} สำหรับการสแกน
              </Typography>
            </Alert>
          ) : (
            <Alert severity="warning">
              <AlertTitle>ไม่ได้กำหนดบัญชี</AlertTitle>
              <Typography variant="body2">
                กลุ่มนี้ยังไม่ได้กำหนดบัญชี Facebook ที่จะใช้สแกน ระบบจะใช้บัญชีที่กำหนดในการตั้งค่างานสแกน
              </Typography>
            </Alert>
          )}
        </Grid>
      </Grid>

      {/* Dialog ยืนยันการลบ */}
      <ConfirmDialog
        open={openConfirmDelete}
        title="ยืนยันการลบกลุ่ม"
        content={`คุณต้องการลบกลุ่ม "${group.name}" ใช่หรือไม่? การดำเนินการนี้ไม่สามารถย้อนกลับได้`}
        onConfirm={() => deleteMutation.mutate()}
        onCancel={() => setOpenConfirmDelete(false)}
        isLoading={deleteMutation.isLoading}
        confirmText="ลบกลุ่ม"
        confirmColor="error"
      />

      {/* Dialog ยืนยันการสแกน */}
      <ConfirmDialog
        open={openConfirmScan}
        title="ยืนยันการสแกนกลุ่ม"
        content={`คุณต้องการสแกนกลุ่ม "${group.name}" ทันทีใช่หรือไม่? ระบบจะสแกนโพสต์จำนวน ${group.postScanLimit} โพสต์`}
        onConfirm={handleStartScan}
        onCancel={() => setOpenConfirmScan(false)}
        isLoading={scanMutation.isLoading}
        confirmText="เริ่มสแกน"
        confirmColor="success"
      />
    </Box>
  );
};

export default GroupDetail;
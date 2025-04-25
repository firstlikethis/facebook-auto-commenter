// client/src/pages/comments/CommentList.js
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Button, CircularProgress, Paper, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, IconButton, Chip,
  TextField, InputAdornment, Dialog, DialogActions, DialogContent,
  DialogContentText, DialogTitle, Stack, Tooltip, FormControl,
  InputLabel, Select, MenuItem, Grid, Card, CardContent
} from '@mui/material';
import {
  Search as SearchIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  MoreVert as MoreIcon,
  Refresh as RefreshIcon,
  FilterList as FilterIcon,
  ClearAll as ClearAllIcon,
  CheckCircleOutline as SuccessIcon,
  Cancel as ErrorIcon,
  Comment as CommentIcon // Added the missing import here
} from '@mui/icons-material';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

import api from '../../services/api';
import PageHeader from '../../components/common/PageHeader';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import EmptyState from '../../components/common/EmptyState';
import Pagination from '../../components/common/Pagination';

const CommentList = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState({
    groupId: '',
    keywordMatched: '',
    success: ''
  });
  const [dateFilter, setDateFilter] = useState({
    fromDate: '',
    toDate: ''
  });
  const [openFilterDialog, setOpenFilterDialog] = useState(false);
  const [openCleanupDialog, setOpenCleanupDialog] = useState(false);
  const [cleanupDays, setCleanupDays] = useState(30);
  const [selectedComment, setSelectedComment] = useState(null);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);

  // ดึงข้อมูลคอมเมนต์
  const { data, isLoading, error } = useQuery(
    ['comments', page, limit, search, filter, dateFilter],
    async () => {
      const params = { page, limit, search };
      
      // เพิ่มตัวกรอง
      if (filter.groupId) params.groupId = filter.groupId;
      if (filter.keywordMatched) params.keywordMatched = filter.keywordMatched;
      if (filter.success !== '') params.success = filter.success;
      if (dateFilter.fromDate) params.fromDate = dateFilter.fromDate;
      if (dateFilter.toDate) params.toDate = dateFilter.toDate;
      
      const response = await api.get('/comments', { params });
      return response.data;
    },
    {
      keepPreviousData: true
    }
  );

  // ดึงข้อมูลกลุ่ม
  const { data: groupsData } = useQuery(
    'all-groups',
    async () => {
      const response = await api.get('/groups', { params: { limit: 100 } });
      return response.data.data;
    }
  );

  // ดึงข้อมูลคำสำคัญ
  const { data: keywordsData } = useQuery(
    'all-keywords',
    async () => {
      const response = await api.get('/keywords/categories');
      return response.data.data;
    }
  );

  // Mutation สำหรับลบคอมเมนต์
  const deleteMutation = useMutation(
    (id) => api.delete(`/comments/${id}`),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['comments']);
        toast.success('ลบคอมเมนต์สำเร็จ');
        setOpenDeleteDialog(false);
      },
      onError: (error) => {
        toast.error(`เกิดข้อผิดพลาด: ${error.response?.data?.message || error.message}`);
      }
    }
  );

  // Mutation สำหรับลบคอมเมนต์เก่า
  const cleanupMutation = useMutation(
    (days) => api.post('/comments/cleanup', { days }),
    {
      onSuccess: (response) => {
        queryClient.invalidateQueries(['comments']);
        toast.success(response.data.message || 'ลบคอมเมนต์เก่าสำเร็จ');
        setOpenCleanupDialog(false);
      },
      onError: (error) => {
        toast.error(`เกิดข้อผิดพลาด: ${error.response?.data?.message || error.message}`);
      }
    }
  );

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilter(prev => ({ ...prev, [name]: value }));
  };

  const handleDateFilterChange = (e) => {
    const { name, value } = e.target;
    setDateFilter(prev => ({ ...prev, [name]: value }));
  };

  const handleOpenFilterDialog = () => {
    setOpenFilterDialog(true);
  };

  const handleCloseFilterDialog = () => {
    setOpenFilterDialog(false);
  };

  const handleApplyFilter = () => {
    setPage(1);
    handleCloseFilterDialog();
  };

  const handleResetFilter = () => {
    setFilter({
      groupId: '',
      keywordMatched: '',
      success: ''
    });
    setDateFilter({
      fromDate: '',
      toDate: ''
    });
    setSearch('');
    setPage(1);
    handleCloseFilterDialog();
  };

  const handleDeleteComment = (comment) => {
    setSelectedComment(comment);
    setOpenDeleteDialog(true);
  };

  const handleConfirmDelete = () => {
    if (selectedComment) {
      deleteMutation.mutate(selectedComment._id);
    }
  };

  const handleCleanupComments = () => {
    cleanupMutation.mutate(cleanupDays);
  };

  const handleExportComments = async () => {
    try {
      const params = { ...filter };
      if (dateFilter.fromDate) params.fromDate = dateFilter.fromDate;
      if (dateFilter.toDate) params.toDate = dateFilter.toDate;
      if (search) params.search = search;
      
      const response = await api.get('/comments/export', {
        params,
        responseType: 'blob'
      });
      
      // สร้าง URL สำหรับดาวน์โหลด
      const url = window.URL.createObjectURL(new Blob([response]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `comments-export-${format(new Date(), 'yyyy-MM-dd')}.csv`);
      document.body.appendChild(link);
      link.click();
      
      // ล้าง URL
      window.URL.revokeObjectURL(url);
      
      toast.success('ส่งออกข้อมูลสำเร็จ');
    } catch (error) {
      toast.error('เกิดข้อผิดพลาดในการส่งออกข้อมูล');
    }
  };

  // สถิติคอมเมนต์
  const { data: statsData, isLoading: isLoadingStats } = useQuery(
    'comments-stats',
    async () => {
      const response = await api.get('/comments/stats');
      return response.data.data;
    }
  );

  // แสดงชื่อกลุ่ม
  const getGroupName = (groupId) => {
    if (!groupsData) return groupId;
    const group = groupsData.find(g => g.groupId === groupId);
    return group ? group.name : groupId;
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
          variant="contained" 
          startIcon={<RefreshIcon />} 
          onClick={() => queryClient.invalidateQueries(['comments'])}
          sx={{ mt: 2 }}
        >
          ลองใหม่
        </Button>
      </Box>
    );
  }

  const comments = data?.data || [];
  const totalComments = data?.total || 0;

  return (
    <Box p={3}>
      <PageHeader 
        title="ประวัติคอมเมนต์" 
        subtitle="รายการคอมเมนต์ทั้งหมดที่ระบบได้โพสต์"
        actionButton={
          <Stack direction="row" spacing={2}>
            <Button
              variant="outlined"
              color="error"
              startIcon={<ClearAllIcon />}
              onClick={() => setOpenCleanupDialog(true)}
            >
              ล้างข้อมูลเก่า
            </Button>
            <Button
              variant="outlined"
              color="primary"
              startIcon={<RefreshIcon />}
              onClick={() => handleExportComments()}
            >
              ส่งออกข้อมูล
            </Button>
          </Stack>
        }
      />

      {/* แสดงสถิติคอมเมนต์ */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                คอมเมนต์ทั้งหมด
              </Typography>
              <Typography variant="h4" color="primary">
                {isLoadingStats ? <CircularProgress size={24} /> : statsData?.total || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                วันนี้
              </Typography>
              <Typography variant="h4" color="info.main">
                {isLoadingStats ? <CircularProgress size={24} /> : statsData?.today || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                7 วันที่ผ่านมา
              </Typography>
              <Typography variant="h4" color="success.main">
                {isLoadingStats ? <CircularProgress size={24} /> : statsData?.last7Days || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                อัตราสำเร็จ
              </Typography>
              <Typography variant="h4" color="warning.main">
                {isLoadingStats ? <CircularProgress size={24} /> : `${statsData?.successRate || 0}%`}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* ส่วนค้นหาและตัวกรอง */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
          <TextField
            placeholder="ค้นหาคอมเมนต์..."
            value={search}
            onChange={handleSearchChange}
            variant="outlined"
            size="small"
            fullWidth
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              )
            }}
          />
          <Button
            variant="outlined"
            color="primary"
            startIcon={<FilterIcon />}
            onClick={handleOpenFilterDialog}
            size="small"
          >
            ตัวกรอง {Object.values(filter).some(val => val !== '') || 
                    Object.values(dateFilter).some(val => val !== '') ? '(กำลังใช้งาน)' : ''}
          </Button>
        </Stack>
      </Paper>

      {comments.length === 0 ? (
        <EmptyState 
          title="ไม่พบข้อมูลคอมเมนต์"
          description={search || Object.values(filter).some(val => val !== '') || 
                    Object.values(dateFilter).some(val => val !== '') 
                ? "ไม่พบคอมเมนต์ที่ตรงกับการค้นหา" 
                : "ยังไม่มีประวัติการคอมเมนต์ในระบบ"}
          actionText={search || Object.values(filter).some(val => val !== '') || 
                    Object.values(dateFilter).some(val => val !== '') 
                ? "ล้างตัวกรอง" 
                : undefined}
          onAction={handleResetFilter}
          icon={<CommentIcon sx={{ fontSize: 64 }} />}
        />
      ) : (
        <>
          <TableContainer component={Paper} elevation={3}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>วันที่</TableCell>
                  <TableCell>กลุ่ม</TableCell>
                  <TableCell>คำสำคัญ</TableCell>
                  <TableCell>ข้อความคอมเมนต์</TableCell>
                  <TableCell>สถานะ</TableCell>
                  <TableCell>การดำเนินการ</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {comments.map((comment) => (
                  <TableRow key={comment._id}>
                    <TableCell>
                      {format(new Date(comment.createdAt), 'dd/MM/yyyy HH:mm:ss')}
                    </TableCell>
                    <TableCell>
                      <Tooltip title={comment.groupId || '-'}>
                        <Typography variant="body2" noWrap sx={{ maxWidth: 150 }}>
                          {getGroupName(comment.groupId)}
                        </Typography>
                      </Tooltip>
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
                      <Tooltip title={comment.messageUsed || '-'}>
                        <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                          {comment.messageUsed}
                        </Typography>
                      </Tooltip>
                    </TableCell>
                    <TableCell>
                      <Chip
                        icon={comment.success ? <SuccessIcon /> : <ErrorIcon />}
                        label={comment.success ? 'สำเร็จ' : 'ล้มเหลว'}
                        color={comment.success ? 'success' : 'error'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={1}>
                        {comment.postUrl && (
                          <Tooltip title="ดูโพสต์">
                            <IconButton 
                              color="info"
                              onClick={() => window.open(comment.postUrl, '_blank')}
                              size="small"
                            >
                              <ViewIcon />
                            </IconButton>
                          </Tooltip>
                        )}
                        <Tooltip title="ลบคอมเมนต์">
                          <IconButton 
                            color="error"
                            onClick={() => handleDeleteComment(comment)}
                            size="small"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <Pagination
            page={page}
            count={Math.ceil(totalComments / limit)}
            limit={limit}
            onPageChange={(newPage) => setPage(newPage)}
            onLimitChange={(newLimit) => {
              setLimit(newLimit);
              setPage(1);
            }}
            total={totalComments}
          />
        </>
      )}

      {/* Dialog ตัวกรอง */}
      <Dialog open={openFilterDialog} onClose={handleCloseFilterDialog} maxWidth="sm" fullWidth>
        <DialogTitle>ตัวกรองคอมเมนต์</DialogTitle>
        <DialogContent>
          <DialogContentText mb={2}>
            กรองข้อมูลคอมเมนต์ตามเงื่อนไขต่อไปนี้
          </DialogContentText>
          
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>กลุ่ม</InputLabel>
                <Select
                  name="groupId"
                  value={filter.groupId}
                  onChange={handleFilterChange}
                  label="กลุ่ม"
                >
                  <MenuItem value="">ทั้งหมด</MenuItem>
                  {groupsData && groupsData.map((group) => (
                    <MenuItem key={group.groupId} value={group.groupId}>
                      {group.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>คำสำคัญ</InputLabel>
                <Select
                  name="keywordMatched"
                  value={filter.keywordMatched}
                  onChange={handleFilterChange}
                  label="คำสำคัญ"
                >
                  <MenuItem value="">ทั้งหมด</MenuItem>
                  {keywordsData && keywordsData.map((keyword) => (
                    <MenuItem key={keyword} value={keyword}>
                      {keyword}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>สถานะ</InputLabel>
                <Select
                  name="success"
                  value={filter.success}
                  onChange={handleFilterChange}
                  label="สถานะ"
                >
                  <MenuItem value="">ทั้งหมด</MenuItem>
                  <MenuItem value="true">สำเร็จ</MenuItem>
                  <MenuItem value="false">ล้มเหลว</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                name="fromDate"
                label="จากวันที่"
                type="date"
                value={dateFilter.fromDate}
                onChange={handleDateFilterChange}
                InputLabelProps={{ shrink: true }}
                fullWidth
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                name="toDate"
                label="ถึงวันที่"
                type="date"
                value={dateFilter.toDate}
                onChange={handleDateFilterChange}
                InputLabelProps={{ shrink: true }}
                fullWidth
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleResetFilter} color="error" startIcon={<ClearAllIcon />}>
            ล้างตัวกรอง
          </Button>
          <Button onClick={handleCloseFilterDialog}>
            ยกเลิก
          </Button>
          <Button onClick={handleApplyFilter} variant="contained" color="primary">
            กรอง
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog ยืนยันการลบ */}
      <ConfirmDialog
        open={openDeleteDialog}
        title="ยืนยันการลบคอมเมนต์"
        content="คุณต้องการลบประวัติคอมเมนต์นี้ใช่หรือไม่? การดำเนินการนี้ไม่สามารถย้อนกลับได้"
        onConfirm={handleConfirmDelete}
        onCancel={() => setOpenDeleteDialog(false)}
        isLoading={deleteMutation.isLoading}
        confirmText="ลบคอมเมนต์"
        confirmColor="error"
      />

      {/* Dialog ล้างข้อมูลเก่า */}
      <Dialog open={openCleanupDialog} onClose={() => setOpenCleanupDialog(false)}>
        <DialogTitle>ล้างประวัติคอมเมนต์เก่า</DialogTitle>
        <DialogContent>
          <DialogContentText mb={2}>
            ระบบจะลบประวัติคอมเมนต์ที่เก่ากว่าจำนวนวันที่กำหนด
          </DialogContentText>
          <TextField
            label="จำนวนวัน"
            type="number"
            value={cleanupDays}
            onChange={(e) => setCleanupDays(parseInt(e.target.value))}
            fullWidth
            InputProps={{
              inputProps: { min: 1 }
            }}
            helperText="ลบคอมเมนต์ที่เก่ากว่ากี่วัน (ค่าเริ่มต้น: 30 วัน)"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCleanupDialog(false)}>
            ยกเลิก
          </Button>
          <Button 
            onClick={handleCleanupComments} 
            variant="contained" 
            color="error"
            disabled={cleanupMutation.isLoading}
          >
            {cleanupMutation.isLoading ? <CircularProgress size={24} /> : 'ล้างข้อมูล'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CommentList;
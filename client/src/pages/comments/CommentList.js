// client/src/pages/comments/CommentList.js
import React, { useState, useEffect } from 'react';
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
  Comment as CommentIcon
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
  const [isRetrying, setIsRetrying] = useState(false);

  // ดึงข้อมูลคอมเมนต์
  const commentsQuery = useQuery(
    ['comments', page, limit, search, filter, dateFilter],
    async () => {
      try {
        const params = { page, limit, search };
        
        // เพิ่มตัวกรอง
        if (filter.groupId) params.groupId = filter.groupId;
        if (filter.keywordMatched) params.keywordMatched = filter.keywordMatched;
        if (filter.success !== '') params.success = filter.success;
        if (dateFilter.fromDate) params.fromDate = dateFilter.fromDate;
        if (dateFilter.toDate) params.toDate = dateFilter.toDate;
        
        const response = await api.get('/comments', { params });
        return response.data;
      } catch (error) {
        console.error('Error fetching comments:', error);
        // ถ้ามี error ให้ throw เพื่อให้ react-query จัดการ
        throw new Error(error.response?.data?.message || 'เกิดข้อผิดพลาดในการโหลดข้อมูล');
      }
    },
    {
      keepPreviousData: true,
      retry: 2, // พยายามดึงข้อมูลใหม่ 2 ครั้งหากเกิด error
      staleTime: 30000, // ข้อมูลจะถือว่าเก่าหลังจาก 30 วินาที
      onError: (error) => {
        console.error('Comments data error:', error);
        toast.error('ไม่สามารถโหลดข้อมูลคอมเมนต์ได้: ' + error.message);
      }
    }
  );

  // ดึงข้อมูลกลุ่ม - แยกการโหลดและใช้ stale time ที่นานขึ้น
  const groupsQuery = useQuery(
    'all-groups',
    async () => {
      try {
        const response = await api.get('/groups', { params: { limit: 100 } });
        return response.data.data || [];
      } catch (error) {
        console.error('Error fetching groups:', error);
        // ส่งค่าเริ่มต้นกลับเพื่อไม่ให้แอปพลิเคชันพัง
        return []; // ส่งคืนอาร์เรย์ว่างถ้าเกิด error
      }
    },
    {
      staleTime: 300000, // 5 นาที
      retry: 2,
      onError: (error) => {
        console.error('Groups data error:', error);
        // ไม่แสดง toast error สำหรับข้อมูลที่ไม่ critical
      }
    }
  );

  // ดึงข้อมูลคำสำคัญ - แยกการโหลดและใช้ stale time ที่นานขึ้น
  const keywordsQuery = useQuery(
    'all-keywords',
    async () => {
      try {
        const response = await api.get('/keywords/categories');
        return response.data.data || [];
      } catch (error) {
        console.error('Error fetching keywords:', error);
        return []; // ส่งคืนอาร์เรย์ว่างถ้าเกิด error
      }
    },
    {
      staleTime: 300000, // 5 นาที
      retry: 2,
      onError: (error) => {
        console.error('Keywords data error:', error);
        // ไม่แสดง toast error สำหรับข้อมูลที่ไม่ critical
      }
    }
  );

  // สถิติคอมเมนต์ - โหลดแยกและใช้ stale time สั้นกว่า
  const statsQuery = useQuery(
    'comments-stats',
    async () => {
      try {
        const response = await api.get('/comments/stats');
        return response.data.data || {
          total: 0,
          today: 0,
          last7Days: 0,
          successRate: 0
        };
      } catch (error) {
        console.error('Error fetching comment stats:', error);
        // ส่งคืนข้อมูลเริ่มต้นถ้าเกิด error
        return {
          total: 0,
          today: 0,
          last7Days: 0,
          successRate: 0
        };
      }
    },
    {
      staleTime: 60000, // 1 นาที
      retry: 1,
      onError: (error) => {
        console.error('Stats data error:', error);
        // ไม่แสดง toast error สำหรับข้อมูลที่ไม่ critical
      }
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
      
      // ดึงข้อมูลคอมเมนต์ที่จะส่งออก
      const response = await api.get('/comments', {
        params: {
          ...params,
          limit: 1000 // ขอข้อมูลจำนวนมากเพื่อส่งออก
        }
      });
      
      // ถ้าไม่มีข้อมูล
      if (!response.data?.data || response.data.data.length === 0) {
        toast.error('ไม่มีข้อมูลสำหรับส่งออก');
        return;
      }
      
      // แปลงข้อมูลให้เหมาะสมสำหรับ CSV
      const comments = response.data.data;
      const csvData = [];
      
      // สร้างหัวตาราง
      const headers = [
        'วันที่', 'กลุ่ม', 'ชื่อกลุ่ม', 'คำสำคัญ', 'ข้อความคอมเมนต์', 'สถานะ', 'URL'
      ];
      csvData.push(headers.join(','));
      
      // เพิ่มข้อมูลแต่ละแถว
      comments.forEach(comment => {
        const rowData = [
          comment.createdAt ? format(new Date(comment.createdAt), 'dd/MM/yyyy HH:mm:ss') : '',
          comment.groupId || '',
          getGroupName(comment.groupId),
          comment.keywordMatched || '',
          // เอสเคปคอมม่าและเครื่องหมายคำพูดในข้อความ
          `"${(comment.messageUsed || '').replace(/"/g, '""')}"`,
          comment.success ? 'สำเร็จ' : 'ล้มเหลว',
          comment.postUrl || ''
        ];
        
        csvData.push(rowData.join(','));
      });
      
      // สร้างไฟล์ CSV
      const csvContent = csvData.join('\n');
      const blob = new Blob(["\ufeff", csvContent], { type: 'text/csv;charset=utf-8;' });
      
      // สร้าง URL สำหรับดาวน์โหลด
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `comments-export-${format(new Date(), 'yyyy-MM-dd')}.csv`);
      document.body.appendChild(link);
      link.click();
      
      // ล้าง URL
      window.URL.revokeObjectURL(url);
      
      toast.success('ส่งออกข้อมูลสำเร็จ');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('เกิดข้อผิดพลาดในการส่งออกข้อมูล');
    }
  };

  // แสดงชื่อกลุ่ม - แก้ไขให้ตรวจสอบว่า groupsQuery.data เป็น array หรือไม่
  const getGroupName = (groupId) => {
    if (!groupId) return '-';
    
    // ตรวจสอบว่ามี groupsData หรือไม่ และเป็น array หรือไม่
    const groups = Array.isArray(groupsQuery.data) ? groupsQuery.data : [];
    
    // ตรวจสอบว่ามี group ที่ตรงกับ groupId หรือไม่
    const group = groups.find(g => g && g.groupId === groupId);
    
    return group ? group.name : groupId;
  };

  // ฟังก์ชันสำหรับโหลดข้อมูลใหม่
  const handleRefreshData = () => {
    setIsRetrying(true);
    
    // Invalidate queries ทั้งหมดที่เกี่ยวข้อง
    queryClient.invalidateQueries(['comments']);
    queryClient.invalidateQueries('comments-stats');
    queryClient.invalidateQueries('all-groups');
    queryClient.invalidateQueries('all-keywords');
    
    // ตั้งเวลาปิดการแสดง "กำลังลองใหม่..." หลังจาก 2 วินาที
    setTimeout(() => {
      setIsRetrying(false);
    }, 2000);
  };

  // ถ้ากำลังโหลดข้อมูล
  if (commentsQuery.isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  // ถ้าเกิด error และไม่ได้กำลังลองใหม่
  if (commentsQuery.error && !isRetrying) {
    return (
      <Box p={3}>
        <Typography color="error">
          เกิดข้อผิดพลาดในการโหลดข้อมูล: {commentsQuery.error.message}
        </Typography>
        <Button 
          variant="contained" 
          startIcon={<RefreshIcon />} 
          onClick={handleRefreshData}
          sx={{ mt: 2 }}
        >
          ลองใหม่
        </Button>
      </Box>
    );
  }

  // ดึงข้อมูลจาก query ด้วยการตรวจสอบค่า null/undefined
  const comments = commentsQuery.data?.data || [];
  const totalComments = commentsQuery.data?.total || 0;
  const categories = keywordsQuery.data || [];
  const isLoadingStats = statsQuery.isLoading;
  const statsData = statsQuery.data || {
    total: 0,
    today: 0,
    last7Days: 0,
    successRate: 0
  };

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
              onClick={handleExportComments}
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
          {/* เพิ่มปุ่ม Refresh */}
          <Button
            variant="outlined"
            color="secondary"
            startIcon={<RefreshIcon />}
            onClick={handleRefreshData}
            size="small"
            disabled={isRetrying}
          >
            {isRetrying ? 'กำลังลองใหม่...' : 'รีเฟรช'}
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
                      {comment.createdAt ? format(new Date(comment.createdAt), 'dd/MM/yyyy HH:mm:ss') : '-'}
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
                          {comment.messageUsed || '-'}
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
                  {Array.isArray(groupsQuery.data) && groupsQuery.data.map((group) => (
                    group && group.groupId ? (
                      <MenuItem key={group.groupId} value={group.groupId}>
                        {group.name}
                      </MenuItem>
                    ) : null
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
                  {categories && categories.map((keyword) => (
                    keyword ? (
                      <MenuItem key={keyword} value={keyword}>
                        {keyword}
                      </MenuItem>
                    ) : null
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
            onChange={(e) => setCleanupDays(parseInt(e.target.value) || 30)}
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
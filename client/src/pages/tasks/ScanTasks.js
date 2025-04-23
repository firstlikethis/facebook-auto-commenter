// client/src/pages/tasks/ScanTasks.js
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Button, CircularProgress, Paper, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, IconButton,
  Chip, Stack, Tooltip, InputAdornment, TextField, Badge,
  Menu, MenuItem, ListItemIcon, ListItemText, LinearProgress
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Visibility as ViewIcon,
  PlayArrow as StartIcon,
  Stop as StopIcon,
  BarChart as StatsIcon,
  Delete as DeleteIcon,
  Schedule as ScheduleIcon,
  MoreVert as MoreIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  Pending as PendingIcon,
  FilterList as FilterIcon
} from '@mui/icons-material';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

import { scanTaskService } from '../../services/scanTaskService';
import PageHeader from '../../components/common/PageHeader';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import EmptyState from '../../components/common/EmptyState';
import Pagination from '../../components/common/Pagination';

const ScanTasks = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState({
    status: '',
    type: ''
  });
  const [openConfirmDelete, setOpenConfirmDelete] = useState(false);
  const [openConfirmStop, setOpenConfirmStop] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [filterMenuAnchor, setFilterMenuAnchor] = useState(null);

  // โหลดข้อมูลงานสแกน
  const { data, isLoading, error } = useQuery(
    ['scan-tasks', page, limit, search, filter],
    () => scanTaskService.getTasks(page, limit, { 
      search,
      status: filter.status !== '' ? filter.status : undefined,
      type: filter.type !== '' ? filter.type : undefined
    }),
    {
      keepPreviousData: true,
      refetchInterval: 5000 // รีเฟรชทุก 5 วินาที
    }
  );

  // โหลดงานที่กำลังทำงานอยู่
  const { data: activeTasks } = useQuery(
    'active-tasks',
    () => scanTaskService.getActiveTasks(),
    {
      refetchInterval: 5000 // รีเฟรชทุก 5 วินาที
    }
  );

  // Mutation สำหรับลบงาน
  const deleteMutation = useMutation(
    (id) => scanTaskService.deleteTask(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['scan-tasks']);
        toast.success('ลบงานสแกนสำเร็จ');
        setOpenConfirmDelete(false);
      },
      onError: (error) => {
        toast.error(`เกิดข้อผิดพลาด: ${error.response?.data?.message || error.message}`);
      }
    }
  );

  // Mutation สำหรับเริ่มงาน
  const startTaskMutation = useMutation(
    (id) => scanTaskService.startTask(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['scan-tasks']);
        toast.success('เริ่มงานสแกนสำเร็จ');
      },
      onError: (error) => {
        toast.error(`เกิดข้อผิดพลาด: ${error.response?.data?.message || error.message}`);
      }
    }
  );

  // Mutation สำหรับหยุดงาน
  const stopTaskMutation = useMutation(
    (id) => scanTaskService.stopTask(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['scan-tasks']);
        toast.success('หยุดงานสแกนสำเร็จ');
        setOpenConfirmStop(false);
      },
      onError: (error) => {
        toast.error(`เกิดข้อผิดพลาด: ${error.response?.data?.message || error.message}`);
      }
    }
  );

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setPage(1); // รีเซ็ตหน้าเมื่อค้นหา
  };

  const handleFilterChange = (key, value) => {
    setFilter({
      ...filter,
      [key]: value
    });
    setPage(1); // รีเซ็ตหน้าเมื่อกรอง
    setFilterMenuAnchor(null);
  };

  const handleDeleteClick = (task) => {
    setSelectedTask(task);
    setOpenConfirmDelete(true);
  };

  const handleConfirmDelete = () => {
    if (selectedTask) {
      deleteMutation.mutate(selectedTask._id);
    }
  };

  const handleStartTask = (id) => {
    startTaskMutation.mutate(id);
  };

  const handleStopClick = (task) => {
    setSelectedTask(task);
    setOpenConfirmStop(true);
  };

  const handleConfirmStop = () => {
    if (selectedTask) {
      stopTaskMutation.mutate(selectedTask._id);
    }
  };

  const handleMenuOpen = (event, task) => {
    setAnchorEl(event.currentTarget);
    setSelectedTask(task);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleFilterMenuOpen = (event) => {
    setFilterMenuAnchor(event.currentTarget);
  };

  const handleFilterMenuClose = () => {
    setFilterMenuAnchor(null);
  };

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

  const getTypeChip = (type) => {
    switch (type) {
      case 'one-time':
        return (
          <Chip 
            label="ครั้งเดียว" 
            size="small" 
            color="primary" 
            variant="outlined" 
          />
        );
      case 'recurring':
        return (
          <Chip 
            icon={<ScheduleIcon fontSize="small" />}
            label="ทำซ้ำ" 
            size="small" 
            color="secondary" 
            variant="outlined" 
          />
        );
      default:
        return null;
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
      </Box>
    );
  }

  const tasks = data?.data || [];
  const totalTasks = data?.total || 0;
  const activeTasksCount = activeTasks?.data?.length || 0;

  return (
    <Box p={3}>
      <PageHeader 
        title={
          <Stack direction="row" spacing={2} alignItems="center">
            <Typography variant="h5">งานสแกน</Typography>
            {activeTasksCount > 0 && (
              <Badge badgeContent={activeTasksCount} color="error">
                <Chip 
                  icon={<StartIcon />} 
                  label="กำลังทำงานอยู่" 
                  color="info" 
                  variant="outlined"
                />
              </Badge>
            )}
          </Stack>
        }
        actionButton={
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => navigate('/tasks/new')}
          >
            สร้างงานใหม่
          </Button>
        }
      />

      <Paper sx={{ p: 2, mb: 3 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
          <TextField
            placeholder="ค้นหางานสแกน..."
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
            onClick={handleFilterMenuOpen}
            size="small"
          >
            กรอง
          </Button>
        </Stack>
      </Paper>

      {tasks.length === 0 ? (
        <EmptyState 
          title="ไม่พบข้อมูลงานสแกน"
          description={search || filter.status || filter.type ? "ไม่พบงานที่ตรงกับเงื่อนไขการค้นหา" : "คุณยังไม่มีงานสแกนในระบบ กรุณาสร้างงานใหม่เพื่อเริ่มต้น"}
          actionText={search || filter.status || filter.type ? "ล้างตัวกรอง" : "สร้างงานใหม่"}
          onAction={search || filter.status || filter.type 
            ? () => {
                setSearch('');
                setFilter({ status: '', type: '' });
              } 
            : () => navigate('/tasks/new')
          }
          icon={<ScheduleIcon sx={{ fontSize: 64 }} />}
        />
      ) : (
        <>
          <TableContainer component={Paper} elevation={3}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>กลุ่มเป้าหมาย</TableCell>
                  <TableCell>กำหนดการ</TableCell>
                  <TableCell>บัญชี Facebook</TableCell>
                  <TableCell>สถานะ</TableCell>
                  <TableCell>ผลลัพธ์</TableCell>
                  <TableCell>การดำเนินการ</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {tasks.map((task) => (
                  <TableRow key={task._id}>
                    <TableCell>
                      <Box>
                        <Typography variant="body2">
                          {task.groups && task.groups.length > 0
                            ? `${task.groups.length} กลุ่ม`
                            : 'ไม่ระบุกลุ่ม'}
                        </Typography>
                        {getTypeChip(task.type)}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        <strong>ตั้งเวลา:</strong> {format(new Date(task.scheduledTime), 'dd/MM/yyyy HH:mm')}
                      </Typography>
                      {task.startTime && (
                        <Typography variant="body2">
                          <strong>เริ่ม:</strong> {format(new Date(task.startTime), 'dd/MM/yyyy HH:mm')}
                        </Typography>
                      )}
                      {task.endTime && (
                        <Typography variant="body2">
                          <strong>เสร็จสิ้น:</strong> {format(new Date(task.endTime), 'dd/MM/yyyy HH:mm')}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      {task.facebookAccount 
                        ? (typeof task.facebookAccount === 'object' 
                            ? task.facebookAccount.name || task.facebookAccount.email 
                            : 'ไม่ทราบ')
                        : '-'}
                    </TableCell>
                    <TableCell>
                      {getStatusChip(task.status)}
                      {task.status === 'running' && (
                        <LinearProgress 
                          sx={{ 
                            mt: 1, 
                            height: 8, 
                            borderRadius: 4,
                            backgroundColor: '#e0e0e0'
                          }} 
                        />
                      )}
                    </TableCell>
                    <TableCell>
                      {task.results ? (
                        <>
                          <Typography variant="body2">
                            <strong>โพสต์:</strong> {task.results.totalPostsScanned || 0}
                          </Typography>
                          <Typography variant="body2">
                            <strong>คอมเมนต์:</strong> {task.results.totalCommentsPosted || 0}
                          </Typography>
                          {task.results.errors && task.results.errors.length > 0 && (
                            <Chip 
                              label={`${task.results.errors.length} ข้อผิดพลาด`} 
                              color="error" 
                              size="small"
                              sx={{ mt: 0.5 }}
                            />
                          )}
                        </>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={1}>
                        <Tooltip title="ดูรายละเอียด">
                          <IconButton 
                            color="primary"
                            onClick={() => navigate(`/tasks/${task._id}`)}
                          >
                            <ViewIcon />
                          </IconButton>
                        </Tooltip>
                        
                        {task.status === 'pending' && (
                          <Tooltip title="เริ่มทำงาน">
                            <IconButton 
                              color="success"
                              onClick={() => handleStartTask(task._id)}
                            >
                              <StartIcon />
                            </IconButton>
                          </Tooltip>
                        )}
                        
                        {task.status === 'running' && (
                          <Tooltip title="หยุดทำงาน">
                            <IconButton 
                              color="error"
                              onClick={() => handleStopClick(task)}
                            >
                              <StopIcon />
                            </IconButton>
                          </Tooltip>
                        )}
                        
                        <Tooltip title="ตัวเลือกเพิ่มเติม">
                          <IconButton onClick={(e) => handleMenuOpen(e, task)}>
                            <MoreIcon />
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
            count={Math.ceil(totalTasks / limit)}
            limit={limit}
            onPageChange={(newPage) => setPage(newPage)}
            onLimitChange={(newLimit) => {
              setLimit(newLimit);
              setPage(1);
            }}
            total={totalTasks}
          />
        </>
      )}

      {/* เมนูตัวเลือกเพิ่มเติม */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => {
          handleMenuClose();
          navigate(`/tasks/${selectedTask?._id}`);
        }}>
          <ListItemIcon>
            <ViewIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="ดูรายละเอียด" />
        </MenuItem>
        
        {selectedTask?.status === 'pending' && (
          <MenuItem onClick={() => {
            handleMenuClose();
            handleStartTask(selectedTask?._id);
          }}>
            <ListItemIcon>
              <StartIcon fontSize="small" color="success" />
            </ListItemIcon>
            <ListItemText primary="เริ่มทำงาน" />
          </MenuItem>
        )}
        
        {selectedTask?.status === 'running' && (
          <MenuItem onClick={() => {
            handleMenuClose();
            handleStopClick(selectedTask);
          }}>
            <ListItemIcon>
              <StopIcon fontSize="small" color="error" />
            </ListItemIcon>
            <ListItemText primary="หยุดทำงาน" />
          </MenuItem>
        )}
        
        <MenuItem onClick={() => {
          handleMenuClose();
          navigate('/tasks/new', { state: { cloneFrom: selectedTask } });
        }}>
          <ListItemIcon>
            <AddIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="สร้างจากต้นแบบ" />
        </MenuItem>
        
        <MenuItem onClick={() => {
          handleMenuClose();
          handleDeleteClick(selectedTask);
        }}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText primary="ลบ" sx={{ color: 'error.main' }} />
        </MenuItem>
      </Menu>

      {/* เมนูตัวกรอง */}
      <Menu
        anchorEl={filterMenuAnchor}
        open={Boolean(filterMenuAnchor)}
        onClose={handleFilterMenuClose}
      >
        <MenuItem disabled>
          <Typography variant="subtitle2">กรองตามสถานะ</Typography>
        </MenuItem>
        <MenuItem 
          selected={filter.status === ''}
          onClick={() => handleFilterChange('status', '')}
        >
          ทุกสถานะ
        </MenuItem>
        <MenuItem 
          selected={filter.status === 'pending'}
          onClick={() => handleFilterChange('status', 'pending')}
        >
          รอดำเนินการ
        </MenuItem>
        <MenuItem 
          selected={filter.status === 'running'}
          onClick={() => handleFilterChange('status', 'running')}
        >
          กำลังทำงาน
        </MenuItem>
        <MenuItem 
          selected={filter.status === 'completed'}
          onClick={() => handleFilterChange('status', 'completed')}
        >
          เสร็จสิ้น
        </MenuItem>
        <MenuItem 
          selected={filter.status === 'failed'}
          onClick={() => handleFilterChange('status', 'failed')}
        >
          ล้มเหลว
        </MenuItem>
        <MenuItem 
          selected={filter.status === 'canceled'}
          onClick={() => handleFilterChange('status', 'canceled')}
        >
          ยกเลิก
        </MenuItem>
        
        <Divider sx={{ my: 1 }} />
        
        <MenuItem disabled>
          <Typography variant="subtitle2">กรองตามประเภท</Typography>
        </MenuItem>
        <MenuItem 
          selected={filter.type === ''}
          onClick={() => handleFilterChange('type', '')}
        >
          ทุกประเภท
        </MenuItem>
        <MenuItem 
          selected={filter.type === 'one-time'}
          onClick={() => handleFilterChange('type', 'one-time')}
        >
          ครั้งเดียว
        </MenuItem>
        <MenuItem 
          selected={filter.type === 'recurring'}
          onClick={() => handleFilterChange('type', 'recurring')}
        >
          ทำซ้ำ
        </MenuItem>
      </Menu>

      {/* Dialog ยืนยันการลบ */}
      <ConfirmDialog
        open={openConfirmDelete}
        title="ยืนยันการลบงานสแกน"
        content="คุณต้องการลบงานสแกนนี้ใช่หรือไม่? การดำเนินการนี้ไม่สามารถย้อนกลับได้"
        onConfirm={handleConfirmDelete}
        onCancel={() => setOpenConfirmDelete(false)}
        isLoading={deleteMutation.isLoading}
      />

      {/* Dialog ยืนยันการหยุดงาน */}
      <ConfirmDialog
        open={openConfirmStop}
        title="ยืนยันการหยุดงานสแกน"
        content="คุณต้องการหยุดงานสแกนนี้ใช่หรือไม่? งานที่กำลังทำงานอยู่จะถูกหยุดทันที"
        confirmText="หยุดงาน"
        confirmColor="error"
        onConfirm={handleConfirmStop}
        onCancel={() => setOpenConfirmStop(false)}
        isLoading={stopTaskMutation.isLoading}
      />
    </Box>
  );
};

export default ScanTasks;
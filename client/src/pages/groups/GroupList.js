// client/src/pages/groups/GroupList.js
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Button, CircularProgress, Paper, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, IconButton,
  Chip, TextField, Switch, FormControlLabel, Stack, Tooltip,
  InputAdornment, MenuItem, Select, FormControl, InputLabel, Divider,
  Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Visibility as ViewIcon,
  PlayArrow as ScanIcon,
  Delete as DeleteIcon,
  CheckCircle as ActiveIcon,
  Cancel as InactiveIcon,
  BarChart as StatsIcon,
  Facebook as FacebookIcon
} from '@mui/icons-material';
import toast from 'react-hot-toast';

import { groupService } from '../../services/groupService';
import { facebookAccountService } from '../../services/facebookAccountService';
import PageHeader from '../../components/common/PageHeader';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import EmptyState from '../../components/common/EmptyState';
import Pagination from '../../components/common/Pagination';

const GroupList = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState({
    isActive: '',
    scanEnabled: ''
  });
  const [openDialog, setOpenDialog] = useState(false);
  const [openConfirmDelete, setOpenConfirmDelete] = useState(false);
  const [openDetectDialog, setOpenDetectDialog] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [newGroup, setNewGroup] = useState({
    name: '',
    groupId: '',
    url: '',
    facebookAccount: '',
    isActive: true,
    scanEnabled: true
  });

  // โหลดข้อมูลกลุ่ม
  const { data, isLoading, error } = useQuery(
    ['groups', page, limit, search, filter],
    () => groupService.getGroups(page, limit, { 
      search,
      isActive: filter.isActive !== '' ? filter.isActive : undefined,
      scanEnabled: filter.scanEnabled !== '' ? filter.scanEnabled : undefined
    })
  );

  // โหลดข้อมูลบัญชี Facebook
  const { data: accountsData } = useQuery(
    'facebookAccounts',
    () => facebookAccountService.getAccounts()
  );

  // Mutation สำหรับสร้างกลุ่มใหม่
  const createMutation = useMutation(
    (groupData) => groupService.createGroup(groupData),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['groups']);
        toast.success('เพิ่มกลุ่มสำเร็จ');
        handleCloseDialog();
      },
      onError: (error) => {
        toast.error(`เกิดข้อผิดพลาด: ${error.response?.data?.message || error.message}`);
      }
    }
  );

  // Mutation สำหรับลบกลุ่ม
  const deleteMutation = useMutation(
    (id) => groupService.deleteGroup(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['groups']);
        toast.success('ลบกลุ่มสำเร็จ');
        setOpenConfirmDelete(false);
      },
      onError: (error) => {
        toast.error(`เกิดข้อผิดพลาด: ${error.response?.data?.message || error.message}`);
      }
    }
  );

  // Mutation สำหรับค้นหากลุ่มจาก Facebook
  const detectMutation = useMutation(
    (facebookAccountId) => groupService.detectGroups(facebookAccountId),
    {
      onSuccess: (data) => {
        queryClient.invalidateQueries(['groups']);
        toast.success(`พบกลุ่มทั้งหมด ${data.count} กลุ่ม`);
        setOpenDetectDialog(false);
      },
      onError: (error) => {
        toast.error(`เกิดข้อผิดพลาด: ${error.response?.data?.message || error.message}`);
      }
    }
  );

  // Mutation สำหรับเปลี่ยนสถานะกลุ่ม
  const toggleStatusMutation = useMutation(
    (id) => groupService.toggleGroupStatus(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['groups']);
        toast.success('เปลี่ยนสถานะกลุ่มสำเร็จ');
      },
      onError: (error) => {
        toast.error(`เกิดข้อผิดพลาด: ${error.response?.data?.message || error.message}`);
      }
    }
  );

  const handleOpenDialog = () => {
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setNewGroup({
      name: '',
      groupId: '',
      url: '',
      facebookAccount: '',
      isActive: true,
      scanEnabled: true
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewGroup({
      ...newGroup,
      [name]: value
    });
  };

  const handleSwitchChange = (e) => {
    const { name, checked } = e.target;
    setNewGroup({
      ...newGroup,
      [name]: checked
    });
  };

  const handleCreateGroup = () => {
    if (!newGroup.groupId || !newGroup.name) {
      toast.error('กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }
    
    // ถ้าไม่มี url ให้สร้างจาก groupId
    if (!newGroup.url && newGroup.groupId) {
      newGroup.url = `https://www.facebook.com/groups/${newGroup.groupId}/`;
    }
    
    createMutation.mutate(newGroup);
  };

  const handleDeleteClick = (group) => {
    setSelectedGroup(group);
    setOpenConfirmDelete(true);
  };

  const handleConfirmDelete = () => {
    if (selectedGroup) {
      deleteMutation.mutate(selectedGroup._id);
    }
  };

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setPage(1); // รีเซ็ตหน้าเมื่อค้นหา
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilter({
      ...filter,
      [name]: value
    });
    setPage(1); // รีเซ็ตหน้าเมื่อกรอง
  };

  const handleDetectGroups = () => {
    if (!selectedGroup?.facebookAccount) {
      toast.error('กรุณาเลือกบัญชี Facebook');
      return;
    }
    detectMutation.mutate(selectedGroup.facebookAccount);
  };

  const handleToggleStatus = (id) => {
    toggleStatusMutation.mutate(id);
  };

  const handleScanGroup = (id) => {
    navigate(`/tasks/new?groupId=${id}`);
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

  const groups = data?.data || [];
  const totalGroups = data?.total || 0;
  const accounts = accountsData?.data || [];

  return (
    <Box p={3}>
      <PageHeader 
        title="กลุ่ม Facebook" 
        actionButton={
          <>
            <Button
              variant="outlined"
              color="primary"
              startIcon={<FacebookIcon />}
              onClick={() => setOpenDetectDialog(true)}
              sx={{ mr: 1 }}
            >
              ค้นหากลุ่มอัตโนมัติ
            </Button>
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={handleOpenDialog}
            >
              เพิ่มกลุ่ม
            </Button>
          </>
        }
      />

      <Paper sx={{ p: 2, mb: 3 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <TextField
            placeholder="ค้นหากลุ่ม..."
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
          <FormControl variant="outlined" size="small" sx={{ minWidth: 120 }}>
            <InputLabel>สถานะ</InputLabel>
            <Select
              name="isActive"
              value={filter.isActive}
              onChange={handleFilterChange}
              label="สถานะ"
            >
              <MenuItem value="">ทั้งหมด</MenuItem>
              <MenuItem value="true">ใช้งาน</MenuItem>
              <MenuItem value="false">ไม่ใช้งาน</MenuItem>
            </Select>
          </FormControl>
          <FormControl variant="outlined" size="small" sx={{ minWidth: 150 }}>
            <InputLabel>เปิดสแกน</InputLabel>
            <Select
              name="scanEnabled"
              value={filter.scanEnabled}
              onChange={handleFilterChange}
              label="เปิดสแกน"
            >
              <MenuItem value="">ทั้งหมด</MenuItem>
              <MenuItem value="true">เปิดสแกน</MenuItem>
              <MenuItem value="false">ปิดสแกน</MenuItem>
            </Select>
          </FormControl>
        </Stack>
      </Paper>

      {groups.length === 0 ? (
        <EmptyState 
          title="ไม่พบข้อมูลกลุ่ม"
          description={search ? "ไม่พบกลุ่มที่ตรงกับการค้นหา" : "คุณยังไม่มีกลุ่ม Facebook ในระบบ กรุณาเพิ่มกลุ่มเพื่อเริ่มใช้งาน"}
          actionText={search ? "ล้างการค้นหา" : "เพิ่มกลุ่ม"}
          onAction={search ? () => setSearch('') : handleOpenDialog}
        />
      ) : (
        <>
          <TableContainer component={Paper} elevation={3}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>ชื่อกลุ่ม</TableCell>
                  <TableCell>Group ID</TableCell>
                  <TableCell>บัญชี Facebook</TableCell>
                  <TableCell>สถิติ</TableCell>
                  <TableCell>สถานะ</TableCell>
                  <TableCell>การดำเนินการ</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {groups.map((group) => (
                  <TableRow key={group._id}>
                    <TableCell>
                      <Typography variant="body1">{group.name}</Typography>
                      <Typography variant="caption" color="textSecondary">
                        {group.lastScanDate 
                          ? `สแกนล่าสุด: ${new Date(group.lastScanDate).toLocaleString('th-TH')}`
                          : 'ยังไม่เคยสแกน'}
                      </Typography>
                    </TableCell>
                    <TableCell>{group.groupId}</TableCell>
                    <TableCell>
                      {group.facebookAccount 
                        ? (typeof group.facebookAccount === 'object' 
                            ? group.facebookAccount.name || group.facebookAccount.email 
                            : 'ไม่ทราบ')
                        : '-'}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        สแกน: {group.totalScans || 0} ครั้ง
                      </Typography>
                      <Typography variant="body2">
                        โพสต์: {group.totalPostsScanned || 0}
                      </Typography>
                      <Typography variant="body2">
                        คอมเมนต์: {group.totalCommentsPosted || 0}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Stack direction="column" spacing={1}>
                        <Chip
                          icon={group.isActive ? <ActiveIcon /> : <InactiveIcon />}
                          label={group.isActive ? 'ใช้งาน' : 'ไม่ใช้งาน'}
                          color={group.isActive ? 'success' : 'default'}
                          size="small"
                          variant="outlined"
                          onClick={() => handleToggleStatus(group._id)}
                        />
                        <Chip
                          label={group.scanEnabled ? 'เปิดสแกน' : 'ปิดสแกน'}
                          color={group.scanEnabled ? 'primary' : 'default'}
                          size="small"
                          variant="outlined"
                        />
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={1}>
                        <Tooltip title="ดูรายละเอียด">
                          <IconButton 
                            color="primary"
                            onClick={() => navigate(`/groups/${group._id}`)}
                          >
                            <ViewIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="ดูสถิติ">
                          <IconButton 
                            color="info"
                            onClick={() => navigate(`/groups/${group._id}/stats`)}
                          >
                            <StatsIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="สแกนทันที">
                          <IconButton 
                            color="success"
                            onClick={() => handleScanGroup(group._id)}
                          >
                            <ScanIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="ลบ">
                          <IconButton 
                            color="error"
                            onClick={() => handleDeleteClick(group)}
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
            count={Math.ceil(totalGroups / limit)}
            limit={limit}
            onPageChange={(newPage) => setPage(newPage)}
            onLimitChange={(newLimit) => {
              setLimit(newLimit);
              setPage(1);
            }}
            total={totalGroups}
          />
        </>
      )}

      {/* Dialog สำหรับสร้างกลุ่มใหม่ */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>เพิ่มกลุ่ม Facebook</DialogTitle>
        <DialogContent>
          <DialogContentText>
            กรุณากรอกข้อมูลกลุ่ม Facebook ที่ต้องการเพิ่ม
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            name="name"
            label="ชื่อกลุ่ม"
            type="text"
            fullWidth
            variant="outlined"
            value={newGroup.name}
            onChange={handleInputChange}
            required
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            name="groupId"
            label="Group ID (เลขหรือชื่อในลิงก์)"
            type="text"
            fullWidth
            variant="outlined"
            value={newGroup.groupId}
            onChange={handleInputChange}
            required
            helperText="ตัวอย่าง: 123456789 หรือจาก URL: facebook.com/groups/123456789/"
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            name="url"
            label="URL กลุ่ม (ไม่จำเป็น)"
            type="text"
            fullWidth
            variant="outlined"
            value={newGroup.url}
            onChange={handleInputChange}
            helperText="ระบบจะสร้าง URL อัตโนมัติจาก Group ID ถ้าไม่ได้กรอก"
            sx={{ mb: 2 }}
          />
          <FormControl fullWidth margin="dense" sx={{ mb: 2 }}>
            <InputLabel>บัญชี Facebook</InputLabel>
            <Select
              name="facebookAccount"
              value={newGroup.facebookAccount}
              onChange={handleInputChange}
              label="บัญชี Facebook"
            >
              <MenuItem value="">ไม่ระบุ</MenuItem>
              {accounts.map((account) => (
                <MenuItem key={account._id} value={account._id}>
                  {account.name || account.email}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControlLabel
            control={
              <Switch
                checked={newGroup.isActive}
                onChange={handleSwitchChange}
                name="isActive"
                color="primary"
              />
            }
            label="เปิดใช้งาน"
          />
          <FormControlLabel
            control={
              <Switch
                checked={newGroup.scanEnabled}
                onChange={handleSwitchChange}
                name="scanEnabled"
                color="primary"
              />
            }
            label="เปิดให้สแกน"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>ยกเลิก</Button>
          <Button 
            onClick={handleCreateGroup} 
            variant="contained" 
            color="primary"
            disabled={createMutation.isLoading}
          >
            {createMutation.isLoading ? <CircularProgress size={24} /> : 'บันทึก'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog ยืนยันการลบ */}
      <ConfirmDialog
        open={openConfirmDelete}
        title="ยืนยันการลบกลุ่ม"
        content={`คุณต้องการลบกลุ่ม "${selectedGroup?.name}" ใช่หรือไม่?`}
        onConfirm={handleConfirmDelete}
        onCancel={() => setOpenConfirmDelete(false)}
        isLoading={deleteMutation.isLoading}
      />

      {/* Dialog ค้นหากลุ่มอัตโนมัติ */}
      <Dialog open={openDetectDialog} onClose={() => setOpenDetectDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>ค้นหากลุ่ม Facebook อัตโนมัติ</DialogTitle>
        <DialogContent>
          <DialogContentText>
            ระบบจะเข้าสู่ Facebook และค้นหากลุ่มที่คุณเป็นสมาชิกโดยอัตโนมัติ กรุณาเลือกบัญชีที่ต้องการใช้
          </DialogContentText>
          
          {accounts.length === 0 ? (
            <Box textAlign="center" p={2}>
              <Typography color="error">
                คุณยังไม่มีบัญชี Facebook ในระบบ กรุณาเพิ่มบัญชีก่อน
              </Typography>
              <Button 
                variant="contained" 
                color="primary" 
                onClick={() => {
                  setOpenDetectDialog(false);
                  navigate('/facebook-accounts');
                }}
                sx={{ mt: 2 }}
              >
                ไปที่หน้าจัดการบัญชี
              </Button>
            </Box>
          ) : (
            <FormControl fullWidth margin="dense" sx={{ mt: 2 }}>
              <InputLabel>บัญชี Facebook</InputLabel>
              <Select
                value={selectedGroup?.facebookAccount || ''}
                onChange={(e) => setSelectedGroup({ facebookAccount: e.target.value })}
                label="บัญชี Facebook"
              >
                <MenuItem value="">เลือกบัญชี</MenuItem>
                {accounts.map((account) => (
                  <MenuItem key={account._id} value={account._id}>
                    {account.name || account.email}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDetectDialog(false)}>ยกเลิก</Button>
          <Button 
            onClick={handleDetectGroups} 
            variant="contained" 
            color="primary"
            disabled={detectMutation.isLoading || accounts.length === 0}
          >
            {detectMutation.isLoading ? <CircularProgress size={24} /> : 'เริ่มค้นหา'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default GroupList;
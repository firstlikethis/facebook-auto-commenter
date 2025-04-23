// client/src/pages/facebook/AccountList.js
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Button, CircularProgress, Paper, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, IconButton,
  Chip, Dialog, DialogActions, DialogContent, DialogContentText,
  DialogTitle, TextField, Stack, Tooltip
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  HelpOutline as UnknownIcon
} from '@mui/icons-material';
import toast from 'react-hot-toast';

import { facebookAccountService } from '../../services/facebookAccountService';
import PageHeader from '../../components/common/PageHeader';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import EmptyState from '../../components/common/EmptyState';

const AccountList = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [openDialog, setOpenDialog] = useState(false);
  const [openConfirmDelete, setOpenConfirmDelete] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [newAccount, setNewAccount] = useState({
    email: '',
    password: '',
    name: ''
  });

  // โหลดข้อมูลบัญชี Facebook
  const { data, isLoading, error } = useQuery(
    'facebookAccounts',
    () => facebookAccountService.getAccounts()
  );

  // Mutation สำหรับสร้างบัญชีใหม่
  const createMutation = useMutation(
    (accountData) => facebookAccountService.createAccount(accountData),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('facebookAccounts');
        toast.success('เพิ่มบัญชี Facebook สำเร็จ');
        handleCloseDialog();
      },
      onError: (error) => {
        toast.error(`เกิดข้อผิดพลาด: ${error.response?.data?.message || error.message}`);
      }
    }
  );

  // Mutation สำหรับลบบัญชี
  const deleteMutation = useMutation(
    (id) => facebookAccountService.deleteAccount(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('facebookAccounts');
        toast.success('ลบบัญชี Facebook สำเร็จ');
        setOpenConfirmDelete(false);
      },
      onError: (error) => {
        toast.error(`เกิดข้อผิดพลาด: ${error.response?.data?.message || error.message}`);
      }
    }
  );

  // Mutation สำหรับทดสอบล็อกอิน
  const testLoginMutation = useMutation(
    (id) => facebookAccountService.testLogin(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('facebookAccounts');
        toast.success('ทดสอบล็อกอินสำเร็จ');
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
    setNewAccount({
      email: '',
      password: '',
      name: ''
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewAccount({
      ...newAccount,
      [name]: value
    });
  };

  const handleCreateAccount = () => {
    if (!newAccount.email || !newAccount.password) {
      toast.error('กรุณากรอกอีเมลและรหัสผ่าน');
      return;
    }
    createMutation.mutate(newAccount);
  };

  const handleDeleteClick = (account) => {
    setSelectedAccount(account);
    setOpenConfirmDelete(true);
  };

  const handleConfirmDelete = () => {
    if (selectedAccount) {
      deleteMutation.mutate(selectedAccount._id);
    }
  };

  const handleTestLogin = (id) => {
    testLoginMutation.mutate(id);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success':
        return <SuccessIcon color="success" />;
      case 'failed':
        return <ErrorIcon color="error" />;
      default:
        return <UnknownIcon color="disabled" />;
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'success':
        return 'ล็อกอินสำเร็จ';
      case 'failed':
        return 'ล็อกอินล้มเหลว';
      case 'pending':
        return 'กำลังดำเนินการ';
      default:
        return 'ไม่ทราบสถานะ';
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

  const accounts = data?.data || [];

  return (
    <Box p={3}>
      <PageHeader 
        title="บัญชี Facebook" 
        actionButton={
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={handleOpenDialog}
          >
            เพิ่มบัญชี
          </Button>
        }
      />

      {accounts.length === 0 ? (
        <EmptyState 
          title="ไม่พบบัญชี Facebook"
          description="คุณยังไม่มีบัญชี Facebook ในระบบ กรุณาเพิ่มบัญชีเพื่อเริ่มใช้งาน"
          actionText="เพิ่มบัญชี"
          onAction={handleOpenDialog}
        />
      ) : (
        <TableContainer component={Paper} elevation={3}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>ชื่อบัญชี</TableCell>
                <TableCell>อีเมล</TableCell>
                <TableCell>สถานะ</TableCell>
                <TableCell>เข้าสู่ระบบล่าสุด</TableCell>
                <TableCell>การดำเนินการ</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {accounts.map((account) => (
                <TableRow key={account._id}>
                  <TableCell>{account.name || 'ไม่ระบุชื่อ'}</TableCell>
                  <TableCell>{account.email}</TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={1} alignItems="center">
                      {getStatusIcon(account.loginStatus)}
                      <Typography variant="body2">
                        {getStatusLabel(account.loginStatus)}
                      </Typography>
                    </Stack>
                  </TableCell>
                  <TableCell>
                    {account.lastLogin 
                      ? new Date(account.lastLogin).toLocaleString('th-TH')
                      : '-'}
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={1}>
                      <Tooltip title="แก้ไข">
                        <IconButton 
                          color="primary"
                          onClick={() => navigate(`/facebook-accounts/${account._id}`)}
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="ทดสอบล็อกอิน">
                        <IconButton 
                          color="info"
                          onClick={() => handleTestLogin(account._id)}
                          disabled={testLoginMutation.isLoading}
                        >
                          <RefreshIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="ลบ">
                        <IconButton 
                          color="error"
                          onClick={() => handleDeleteClick(account)}
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
      )}

      {/* Dialog สำหรับสร้างบัญชีใหม่ */}
      <Dialog open={openDialog} onClose={handleCloseDialog}>
        <DialogTitle>เพิ่มบัญชี Facebook</DialogTitle>
        <DialogContent>
          <DialogContentText>
            กรุณากรอกข้อมูลบัญชี Facebook เพื่อใช้ในการคอมเมนต์อัตโนมัติ
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            name="name"
            label="ชื่อบัญชี (สำหรับแสดงในระบบ)"
            type="text"
            fullWidth
            variant="outlined"
            value={newAccount.name}
            onChange={handleInputChange}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            name="email"
            label="อีเมล Facebook"
            type="email"
            fullWidth
            variant="outlined"
            value={newAccount.email}
            onChange={handleInputChange}
            required
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            name="password"
            label="รหัสผ่าน Facebook"
            type="password"
            fullWidth
            variant="outlined"
            value={newAccount.password}
            onChange={handleInputChange}
            required
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>ยกเลิก</Button>
          <Button 
            onClick={handleCreateAccount} 
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
        title="ยืนยันการลบบัญชี"
        content={`คุณต้องการลบบัญชี "${selectedAccount?.name || selectedAccount?.email}" ใช่หรือไม่?`}
        onConfirm={handleConfirmDelete}
        onCancel={() => setOpenConfirmDelete(false)}
        isLoading={deleteMutation.isLoading}
      />
    </Box>
  );
};

export default AccountList;
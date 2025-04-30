// client/src/pages/tasks/NewTask.js
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation } from 'react-query';
import {
  Box, Typography, Button, CircularProgress, Paper, Grid, TextField,
  MenuItem, FormControl, InputLabel, Select, Checkbox, FormControlLabel,
  ListItemText, OutlinedInput, Chip, Card, CardContent, Switch, Stack,
  Alert, Divider, Tabs, Tab, StepLabel, Step, Stepper
} from '@mui/material';
import {
  Save as SaveIcon,
  ArrowBack as BackIcon,
  PlayArrow as StartIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

import { groupService } from '../../services/groupService';
import { facebookAccountService } from '../../services/facebookAccountService';
import { scanTaskService } from '../../services/scanTaskService';
import PageHeader from '../../components/common/PageHeader';

const ITEM_HEIGHT = 48;
const ITEM_PADDING_TOP = 8;
const MenuProps = {
  PaperProps: {
    style: {
      maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
      width: 250,
    },
  },
};

const NewTask = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const groupId = searchParams.get('groupId');
  const [activeStep, setActiveStep] = useState(0);
  
  const [task, setTask] = useState({
    type: 'one-time',
    groups: [],
    facebookAccount: '',
    scheduledTime: new Date(),
    useParallel: false,
    settings: {
      postScanLimit: 20,
      workerCount: 3,
      headless: true
    }
  });

  // โหลดข้อมูลเฉพาะกลุ่มที่ต้องการถ้ามี groupId
  const { data: singleGroupData, isLoading: isLoadingSingleGroup } = useQuery(
    ['single-group', groupId],
    () => groupService.getGroup(groupId),
    {
      enabled: !!groupId,
      retry: 1,
      onError: (error) => {
        console.error("Error fetching single group:", error);
        toast.error("ไม่สามารถดึงข้อมูลกลุ่มได้");
      }
    }
  );

  // โหลดข้อมูลกลุ่มทั้งหมด
  const { data: groupsData, isLoading: isLoadingGroups } = useQuery(
    'all-groups',
    () => groupService.getGroups(1, 100, { isActive: true, scanEnabled: true }),
    {
      enabled: !groupId,
      retry: 1,
      onError: (error) => {
        console.error("Error fetching all groups:", error);
      }
    }
  );

  // โหลดข้อมูลบัญชี Facebook
  const { data: accountsData, isLoading: isLoadingAccounts } = useQuery(
    'facebook-accounts',
    () => facebookAccountService.getAccounts(),
    {
      retry: 1,
      onError: (error) => {
        console.error("Error fetching Facebook accounts:", error);
      }
    }
  );

  // Mutation สำหรับสร้างงานใหม่
  const createTaskMutation = useMutation(
    (taskData) => scanTaskService.createTask(taskData),
    {
      onSuccess: (data) => {
        toast.success('สร้างงานสแกนสำเร็จ');
        
        if (task.startNow) {
          // เริ่มทำงานทันที
          scanTaskService.startTask(data.data._id)
            .then(() => {
              toast.success('เริ่มงานสแกนสำเร็จ');
              navigate(`/tasks/${data.data._id}`);
            })
            .catch((error) => {
              toast.error(`เกิดข้อผิดพลาดในการเริ่มงาน: ${error.response?.data?.message || error.message}`);
              navigate('/tasks');
            });
        } else {
          navigate('/tasks');
        }
      },
      onError: (error) => {
        toast.error(`เกิดข้อผิดพลาด: ${error.response?.data?.message || error.message}`);
      }
    }
  );

  // สำหรับจัดการกรณีมี groupId ที่ส่งมาจากหน้า Group
  useEffect(() => {
    try {
      if (groupId && singleGroupData && singleGroupData.data) {
        // ถ้าดึงข้อมูลกลุ่มเดียวสำเร็จ
        const selectedGroup = singleGroupData.data;
        setTask(prevTask => ({
          ...prevTask,
          groups: [selectedGroup._id],
          facebookAccount: selectedGroup.facebookAccount || ''
        }));
      }
    } catch (error) {
      console.error("Error setting group from URL parameter:", error);
    }
  }, [groupId, singleGroupData]);

  // สำหรับการ clone งานจากงานเดิม
  useEffect(() => {
    try {
      if (location.state?.cloneFrom) {
        const originalTask = location.state.cloneFrom;
        setTask({
          type: originalTask.type,
          groups: originalTask.groups,
          facebookAccount: originalTask.facebookAccount,
          scheduledTime: new Date(), // ตั้งเป็นเวลาปัจจุบัน
          useParallel: originalTask.settings?.useParallel || false,
          settings: {
            postScanLimit: originalTask.settings?.postScanLimit || 20,
            workerCount: originalTask.settings?.workerCount || 3,
            headless: originalTask.settings?.headless || true
          }
        });
      }
    } catch (error) {
      console.error("Error cloning from original task:", error);
    }
  }, [location.state]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setTask(prevTask => ({ ...prevTask, [name]: value }));
  };

  const handleSettingsChange = (e) => {
    const { name, value } = e.target;
    setTask(prevTask => ({
      ...prevTask,
      settings: {
        ...prevTask.settings,
        [name]: value
      }
    }));
  };

  const handleSwitchChange = (e) => {
    const { name, checked } = e.target;
    if (name === 'useParallel') {
      setTask(prevTask => ({ ...prevTask, [name]: checked }));
    } else {
      setTask(prevTask => ({
        ...prevTask,
        settings: {
          ...prevTask.settings,
          [name]: checked
        }
      }));
    }
  };

  const handleDateChange = (e) => {
    try {
      // แปลงค่าจาก input เป็น Date object
      const dateValue = new Date(e.target.value);
      setTask(prevTask => ({ ...prevTask, scheduledTime: dateValue }));
    } catch (error) {
      console.error("Invalid date format:", error);
    }
  };

  const handleGroupsChange = (event) => {
    const { value } = event.target;
    setTask(prevTask => ({ ...prevTask, groups: value }));
  };

  const handleNextStep = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBackStep = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleCreateTask = () => {
    // ตรวจสอบข้อมูล
    if (task.groups.length === 0) {
      toast.error('กรุณาเลือกกลุ่มอย่างน้อย 1 กลุ่ม');
      setActiveStep(0);
      return;
    }

    if (!task.facebookAccount) {
      toast.error('กรุณาเลือกบัญชี Facebook');
      setActiveStep(0);
      return;
    }

    // เพิ่มตัวแปร startNow สำหรับเริ่มงานทันที
    const taskToCreate = {
      ...task,
      startNow: task.startNow || false
    };

    createTaskMutation.mutate(taskToCreate);
  };

  if (isLoadingGroups || isLoadingAccounts || isLoadingSingleGroup) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  // สร้างรายการกลุ่มที่จะแสดงในตัวเลือก
  const groups = groupId && singleGroupData?.data 
    ? [singleGroupData.data] // กรณีมีการเลือกกลุ่มเดียวจาก URL
    : (groupsData?.data || []); // กรณีแสดงกลุ่มทั้งหมด

  const accounts = accountsData?.data || [];

  // Format the current date and time for the datetime-local input
  const formatDateTimeForInput = (date) => {
    return format(date, "yyyy-MM-dd'T'HH:mm");
  };

  return (
    <Box p={3}>
      <PageHeader 
        title="สร้างงานสแกนใหม่"
        actionButton={
          <Button
            variant="outlined"
            startIcon={<BackIcon />}
            onClick={() => navigate('/tasks')}
          >
            กลับ
          </Button>
        }
      />

      <Paper sx={{ p: 3, mb: 3 }}>
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          <Step>
            <StepLabel>เลือกกลุ่มและบัญชี</StepLabel>
          </Step>
          <Step>
            <StepLabel>กำหนดเวลาและตั้งค่า</StepLabel>
          </Step>
          <Step>
            <StepLabel>ยืนยันและสร้างงาน</StepLabel>
          </Step>
        </Stepper>

        {/* ขั้นตอนที่ 1: เลือกกลุ่มและบัญชี */}
        {activeStep === 0 && (
          <Box>
            <Typography variant="h6" gutterBottom>
              เลือกกลุ่มและบัญชี Facebook
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel id="groups-select-label">กลุ่ม Facebook</InputLabel>
                  <Select
                    labelId="groups-select-label"
                    multiple
                    value={task.groups}
                    onChange={handleGroupsChange}
                    input={<OutlinedInput label="กลุ่ม Facebook" />}
                    renderValue={(selected) => (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {selected.map((value) => {
                          const group = groups.find(g => g._id === value);
                          return (
                            <Chip key={value} label={group ? group.name : value} />
                          );
                        })}
                      </Box>
                    )}
                    MenuProps={MenuProps}
                  >
                    {groups.map((group) => (
                      <MenuItem key={group._id} value={group._id}>
                        <Checkbox checked={task.groups.indexOf(group._id) > -1} />
                        <ListItemText primary={group.name} />
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel id="account-select-label">บัญชี Facebook</InputLabel>
                  <Select
                    labelId="account-select-label"
                    value={task.facebookAccount}
                    name="facebookAccount"
                    onChange={handleInputChange}
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
              </Grid>
            </Grid>
            
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
              <Button
                variant="contained"
                color="primary"
                onClick={handleNextStep}
              >
                ถัดไป
              </Button>
            </Box>
          </Box>
        )}

        {/* ขั้นตอนที่ 2: กำหนดเวลาและตั้งค่า */}
        {activeStep === 1 && (
          <Box>
            <Typography variant="h6" gutterBottom>
              กำหนดเวลาและตั้งค่า
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel id="type-select-label">ประเภทงาน</InputLabel>
                  <Select
                    labelId="type-select-label"
                    value={task.type}
                    name="type"
                    onChange={handleInputChange}
                    label="ประเภทงาน"
                  >
                    <MenuItem value="one-time">ทำงานครั้งเดียว</MenuItem>
                    <MenuItem value="recurring">ทำงานซ้ำ (อยู่ระหว่างพัฒนา)</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} md={6}>
                {/* แทนที่ DateTimePicker ด้วย TextField ชั่วคราว */}
                <TextField
                  label="วันและเวลาที่ต้องการสแกน"
                  type="datetime-local"
                  value={formatDateTimeForInput(task.scheduledTime)}
                  onChange={handleDateChange}
                  fullWidth
                  InputLabelProps={{
                    shrink: true,
                  }}
                />
              </Grid>
              
              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="h6" sx={{ mb: 2 }}>
                  ตั้งค่าการสแกน
                </Typography>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  name="postScanLimit"
                  label="จำนวนโพสต์ที่จะสแกนต่อกลุ่ม"
                  type="number"
                  value={task.settings.postScanLimit}
                  onChange={handleSettingsChange}
                  fullWidth
                  InputProps={{
                    inputProps: { min: 1, max: 100 }
                  }}
                  helperText="จำนวนโพสต์ที่จะสแกนในแต่ละกลุ่ม (1-100)"
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={task.settings.headless}
                      onChange={handleSwitchChange}
                      name="headless"
                      color="primary"
                    />
                  }
                  label="โหมดไร้หน้าจอ (Headless)"
                />
                <Typography variant="caption" color="textSecondary" display="block">
                  เปิดใช้งานเพื่อทำงานแบบไม่แสดงหน้าจอบราวเซอร์
                </Typography>
              </Grid>
              
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={task.useParallel}
                      onChange={handleSwitchChange}
                      name="useParallel"
                      color="primary"
                    />
                  }
                  label="ใช้งานโหมดขนาน (Parallel Mode)"
                />
                <Typography variant="caption" color="textSecondary" display="block">
                  เปิดใช้งานเพื่อสแกนหลายกลุ่มพร้อมกัน (เหมาะสำหรับงานที่มีหลายกลุ่ม)
                </Typography>
              </Grid>
              
              {task.useParallel && (
                <Grid item xs={12} md={6}>
                  <TextField
                    name="workerCount"
                    label="จำนวน Workers"
                    type="number"
                    value={task.settings.workerCount}
                    onChange={handleSettingsChange}
                    fullWidth
                    InputProps={{
                      inputProps: { min: 1, max: 5 }
                    }}
                    helperText="จำนวน Workers ที่จะทำงานพร้อมกัน (1-5)"
                  />
                </Grid>
              )}
            </Grid>
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
              <Button onClick={handleBackStep}>
                ย้อนกลับ
              </Button>
              <Button
                variant="contained"
                color="primary"
                onClick={handleNextStep}
              >
                ถัดไป
              </Button>
            </Box>
          </Box>
        )}

        {/* ขั้นตอนที่ 3: ยืนยันและสร้างงาน */}
        {activeStep === 2 && (
          <Box>
            <Typography variant="h6" gutterBottom>
              ยืนยันและสร้างงาน
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      สรุปข้อมูลงานสแกน
                    </Typography>
                    
                    <Typography variant="body1" gutterBottom>
                      <strong>กลุ่มที่จะสแกน:</strong> {task.groups.length} กลุ่ม
                    </Typography>
                    
                    <Typography variant="body2" sx={{ mb: 2 }}>
                      {task.groups.map((groupId) => {
                        const group = groups.find(g => g._id === groupId);
                        return group ? group.name : groupId;
                      }).join(', ')}
                    </Typography>
                    
                    <Typography variant="body1" gutterBottom>
                      <strong>บัญชี Facebook:</strong> {
                        accounts.find(a => a._id === task.facebookAccount)?.name || 
                        accounts.find(a => a._id === task.facebookAccount)?.email ||
                        'ไม่ระบุ'
                      }
                    </Typography>
                    
                    <Typography variant="body1" gutterBottom>
                      <strong>ประเภทงาน:</strong> {task.type === 'one-time' ? 'ทำงานครั้งเดียว' : 'ทำงานซ้ำ'}
                    </Typography>
                    
                    <Typography variant="body1" gutterBottom>
                      <strong>กำหนดเวลา:</strong> {format(task.scheduledTime, 'dd/MM/yyyy HH:mm')}
                    </Typography>
                    
                    <Typography variant="body1" gutterBottom>
                      <strong>โพสต์ต่อกลุ่ม:</strong> {task.settings.postScanLimit} โพสต์
                    </Typography>
                    
                    <Typography variant="body1" gutterBottom>
                      <strong>โหมดการทำงาน:</strong> {task.useParallel ? `ขนาน (${task.settings.workerCount} Workers)` : 'ตามลำดับ'}
                    </Typography>
                    
                    <Typography variant="body1">
                      <strong>แสดงหน้าจอ:</strong> {task.settings.headless ? 'ไม่แสดง (Headless)' : 'แสดง'}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={task.startNow || false}
                      onChange={(e) => setTask(prev => ({ ...prev, startNow: e.target.checked }))}
                      color="primary"
                    />
                  }
                  label="เริ่มทำงานทันทีหลังจากสร้างงาน"
                />
              </Grid>
            </Grid>
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
              <Button onClick={handleBackStep}>
                ย้อนกลับ
              </Button>
              <Button
                variant="contained"
                color="primary"
                startIcon={task.startNow ? <StartIcon /> : <SaveIcon />}
                onClick={handleCreateTask}
                disabled={createTaskMutation.isLoading}
              >
                {createTaskMutation.isLoading 
                  ? <CircularProgress size={24} /> 
                  : (task.startNow ? 'สร้างและเริ่มทำงาน' : 'สร้างงาน')}
              </Button>
            </Box>
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default NewTask;
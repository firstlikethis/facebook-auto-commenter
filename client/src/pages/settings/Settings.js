// client/src/pages/settings/Settings.js
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import {
  Box, Typography, Button, CircularProgress, Paper, Grid, Divider,
  TextField, Switch, FormControlLabel, Tab, Tabs, Slider, Alert,
  Card, CardContent, CardActions, Select, MenuItem, FormControl,
  InputLabel, InputAdornment, IconButton, Snackbar
} from '@mui/material';
import {
  Save as SaveIcon,
  Refresh as RefreshIcon,
  Settings as SettingsIcon,
  Speed as SpeedIcon,
  Timer as TimerIcon,
  AccessibilityNew as HumanIcon,
  Notifications as NotificationIcon,
  Restore as RestoreIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import toast from 'react-hot-toast';

import api from '../../services/api';
import PageHeader from '../../components/common/PageHeader';
import ConfirmDialog from '../../components/common/ConfirmDialog';

const Settings = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState(0);
  const [openConfirmReset, setOpenConfirmReset] = useState(false);

  // ดึงการตั้งค่าทั้งหมด
  const { data, isLoading, error } = useQuery(
    'settings',
    async () => {
      const response = await api.get('/settings');
      return response.data.data;
    }
  );

  // สร้าง state สำหรับแต่ละหมวดการตั้งค่า
  const [browserSettings, setBrowserSettings] = useState({
    headless: true,
    userAgent: '',
    blockResources: false,
    userDataDir: './user-data'
  });

  const [scanSettings, setScanSettings] = useState({
    defaultGroupScanLimit: 10,
    defaultPostScanLimit: 20,
    commentDelay: 5000,
    scrollDelay: 3000,
    maxConcurrentWorkers: 3,
    workerTimeout: 600000 // 10 นาที
  });

  const [delaySettings, setDelaySettings] = useState({
    betweenClicks: { min: 300, max: 800 },
    betweenKeys: { min: 50, max: 150 },
    beforeComment: { min: 1000, max: 3000 },
    afterComment: { min: 3000, max: 7000 },
    betweenGroups: { min: 5000, max: 15000 }
  });

  const [humanBehaviorSettings, setHumanBehaviorSettings] = useState({
    simulateHumanTyping: true,
    simulateMouseMovement: false,
    randomScrolls: true
  });

  const [notificationSettings, setNotificationSettings] = useState({
    enableEmailNotifications: false,
    emailAddress: '',
    notifyOnCompletion: true,
    notifyOnError: true,
    enableBrowserNotifications: true
  });

  // อัปเดต state เมื่อโหลดข้อมูลสำเร็จ
  React.useEffect(() => {
    if (data) {
      if (data.browserSettings) setBrowserSettings(data.browserSettings);
      if (data.scanSettings) setScanSettings(data.scanSettings);
      if (data.delaySettings) setDelaySettings(data.delaySettings);
      if (data.humanBehaviorSettings) setHumanBehaviorSettings(data.humanBehaviorSettings);
      if (data.notificationSettings) setNotificationSettings(data.notificationSettings);
    }
  }, [data]);

  // Mutation สำหรับบันทึกการตั้งค่า
  const updateSettingsMutation = useMutation(
    (settings) => api.put('/settings', settings),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('settings');
        toast.success('บันทึกการตั้งค่าสำเร็จ');
      },
      onError: (error) => {
        toast.error(`เกิดข้อผิดพลาด: ${error.response?.data?.message || error.message}`);
      }
    }
  );

  // Mutation สำหรับรีเซ็ตการตั้งค่า
  const resetSettingsMutation = useMutation(
    () => api.post('/settings/reset'),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('settings');
        toast.success('รีเซ็ตการตั้งค่าเป็นค่าเริ่มต้นสำเร็จ');
        setOpenConfirmReset(false);
      },
      onError: (error) => {
        toast.error(`เกิดข้อผิดพลาด: ${error.response?.data?.message || error.message}`);
      }
    }
  );

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  // อัปเดตการตั้งค่าเบราว์เซอร์
  const handleBrowserSettingsChange = (e) => {
    const { name, value, checked } = e.target;
    setBrowserSettings(prev => ({
      ...prev,
      [name]: e.target.type === 'checkbox' ? checked : value
    }));
  };

  // อัปเดตการตั้งค่าการสแกน
  const handleScanSettingsChange = (e) => {
    const { name, value } = e.target;
    setScanSettings(prev => ({
      ...prev,
      [name]: name === 'maxConcurrentWorkers' ? parseInt(value) : parseInt(value)
    }));
  };

  // อัปเดตการตั้งค่าความหน่วงเวลา
  const handleDelaySettingsChange = (type, range, value) => {
    setDelaySettings(prev => ({
      ...prev,
      [type]: {
        ...prev[type],
        [range]: value
      }
    }));
  };

  // อัปเดตการตั้งค่าพฤติกรรมเสมือนมนุษย์
  const handleHumanBehaviorSettingsChange = (e) => {
    const { name, checked } = e.target;
    setHumanBehaviorSettings(prev => ({
      ...prev,
      [name]: checked
    }));
  };

  // อัปเดตการตั้งค่าการแจ้งเตือน
  const handleNotificationSettingsChange = (e) => {
    const { name, value, checked } = e.target;
    setNotificationSettings(prev => ({
      ...prev,
      [name]: e.target.type === 'checkbox' ? checked : value
    }));
  };

  // บันทึกการตั้งค่า
  const handleSaveSettings = () => {
    const allSettings = {
      browserSettings,
      scanSettings,
      delaySettings,
      humanBehaviorSettings,
      notificationSettings
    };
    
    updateSettingsMutation.mutate(allSettings);
  };

  // รีเซ็ตการตั้งค่าเป็นค่าเริ่มต้น
  const handleResetSettings = () => {
    resetSettingsMutation.mutate();
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
        <Alert severity="error">
          เกิดข้อผิดพลาดในการโหลดข้อมูล: {error.message}
        </Alert>
      </Box>
    );
  }

  return (
    <Box p={3}>
      <PageHeader 
        title="ตั้งค่าระบบ"
        subtitle="กำหนดค่าต่างๆ สำหรับการทำงานของระบบ"
        actionButton={
          <Box>
            <Button
              variant="outlined"
              color="error"
              startIcon={<RestoreIcon />}
              onClick={() => setOpenConfirmReset(true)}
              sx={{ mr: 2 }}
            >
              รีเซ็ตเป็นค่าเริ่มต้น
            </Button>
            <Button
              variant="contained"
              color="primary"
              startIcon={<SaveIcon />}
              onClick={handleSaveSettings}
              disabled={updateSettingsMutation.isLoading}
            >
              {updateSettingsMutation.isLoading ? <CircularProgress size={24} /> : 'บันทึกการตั้งค่า'}
            </Button>
          </Box>
        }
      />

      <Paper sx={{ mb: 3 }}>
        <Tabs 
          value={activeTab} 
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          textColor="primary"
          indicatorColor="primary"
        >
          <Tab icon={<SettingsIcon />} label="ทั่วไป" />
          <Tab icon={<SpeedIcon />} label="การสแกน" />
          <Tab icon={<TimerIcon />} label="เวลาหน่วง" />
          <Tab icon={<HumanIcon />} label="พฤติกรรมมนุษย์" />
          <Tab icon={<NotificationIcon />} label="การแจ้งเตือน" />
        </Tabs>
      </Paper>

      {/* แท็บที่ 1: การตั้งค่าทั่วไป */}
      {activeTab === 0 && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            การตั้งค่าเบราว์เซอร์
          </Typography>
          <Divider sx={{ mb: 3 }} />

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                name="userAgent"
                label="User Agent"
                value={browserSettings.userAgent}
                onChange={handleBrowserSettingsChange}
                fullWidth
                helperText="User Agent ที่ใช้ในการเชื่อมต่อกับ Facebook"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                name="userDataDir"
                label="ที่อยู่เก็บข้อมูลผู้ใช้"
                value={browserSettings.userDataDir}
                onChange={handleBrowserSettingsChange}
                fullWidth
                helperText="โฟลเดอร์ที่ใช้เก็บข้อมูลผู้ใช้และคุกกี้"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={browserSettings.headless}
                    onChange={handleBrowserSettingsChange}
                    name="headless"
                    color="primary"
                  />
                }
                label="โหมดไร้หน้าจอ (Headless)"
              />
              <Typography variant="caption" color="textSecondary" display="block">
                เมื่อเปิดใช้งาน เบราว์เซอร์จะทำงานแบบไม่แสดงหน้าจอ
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={browserSettings.blockResources}
                    onChange={handleBrowserSettingsChange}
                    name="blockResources"
                    color="primary"
                  />
                }
                label="บล็อกทรัพยากร"
              />
              <Typography variant="caption" color="textSecondary" display="block">
                บล็อกการโหลดรูปภาพ สไตล์ชีต และฟอนต์เพื่อความเร็วและประหยัดแบนด์วิดท์
              </Typography>
            </Grid>
          </Grid>
        </Paper>
      )}

      {/* แท็บที่ 2: การตั้งค่าการสแกน */}
      {activeTab === 1 && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            การตั้งค่าการสแกน
          </Typography>
          <Divider sx={{ mb: 3 }} />

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                name="defaultGroupScanLimit"
                label="จำนวนกลุ่มที่จะสแกนต่อครั้ง (ค่าเริ่มต้น)"
                type="number"
                value={scanSettings.defaultGroupScanLimit}
                onChange={handleScanSettingsChange}
                fullWidth
                InputProps={{ inputProps: { min: 1 } }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                name="defaultPostScanLimit"
                label="จำนวนโพสต์ที่จะสแกนต่อกลุ่ม (ค่าเริ่มต้น)"
                type="number"
                value={scanSettings.defaultPostScanLimit}
                onChange={handleScanSettingsChange}
                fullWidth
                InputProps={{ inputProps: { min: 1, max: 100 } }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                name="commentDelay"
                label="เวลาหน่วงระหว่างการคอมเมนต์ (มิลลิวินาที)"
                type="number"
                value={scanSettings.commentDelay}
                onChange={handleScanSettingsChange}
                fullWidth
                InputProps={{ inputProps: { min: 1000 } }}
                helperText="ระยะเวลารอหลังจากคอมเมนต์แล้วก่อนดำเนินการต่อ"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                name="scrollDelay"
                label="เวลาหน่วงระหว่างการเลื่อนหน้า (มิลลิวินาที)"
                type="number"
                value={scanSettings.scrollDelay}
                onChange={handleScanSettingsChange}
                fullWidth
                InputProps={{ inputProps: { min: 500 } }}
                helperText="ระยะเวลารอหลังจากเลื่อนหน้าเพื่อให้เนื้อหาโหลด"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                name="maxConcurrentWorkers"
                label="จำนวน Workers สูงสุด"
                type="number"
                value={scanSettings.maxConcurrentWorkers}
                onChange={handleScanSettingsChange}
                fullWidth
                InputProps={{ inputProps: { min: 1, max: 10 } }}
                helperText="จำนวนงานที่สามารถทำงานพร้อมกันในโหมดขนาน"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                name="workerTimeout"
                label="ระยะเวลาที่ Worker ทำงานได้สูงสุด (มิลลิวินาที)"
                type="number"
                value={scanSettings.workerTimeout}
                onChange={handleScanSettingsChange}
                fullWidth
                InputProps={{ 
                  inputProps: { min: 60000 },
                  endAdornment: <InputAdornment position="end">ms</InputAdornment>
                }}
                helperText="ถ้า Worker ทำงานนานเกินกว่านี้จะถูกบังคับให้หยุด (ขั้นต่ำ 1 นาที)"
              />
            </Grid>
          </Grid>
        </Paper>
      )}

      {/* แท็บที่ 3: การตั้งค่าเวลาหน่วง */}
      {activeTab === 2 && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            การตั้งค่าเวลาหน่วง
          </Typography>
          <Divider sx={{ mb: 3 }} />

          <Box mb={4}>
            <Typography variant="subtitle1" gutterBottom>
              ระยะเวลาระหว่างการคลิก (มิลลิวินาที)
            </Typography>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={2}>
                <Typography>{delaySettings.betweenClicks.min} ms</Typography>
              </Grid>
              <Grid item xs={8}>
                <Slider
                  value={[delaySettings.betweenClicks.min, delaySettings.betweenClicks.max]}
                  onChange={(e, newValue) => {
                    handleDelaySettingsChange('betweenClicks', 'min', newValue[0]);
                    handleDelaySettingsChange('betweenClicks', 'max', newValue[1]);
                  }}
                  valueLabelDisplay="auto"
                  min={100}
                  max={2000}
                  step={50}
                />
              </Grid>
              <Grid item xs={2}>
                <Typography>{delaySettings.betweenClicks.max} ms</Typography>
              </Grid>
            </Grid>
          </Box>

          <Box mb={4}>
            <Typography variant="subtitle1" gutterBottom>
              ระยะเวลาระหว่างการกดแป้นพิมพ์ (มิลลิวินาที)
            </Typography>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={2}>
                <Typography>{delaySettings.betweenKeys.min} ms</Typography>
              </Grid>
              <Grid item xs={8}>
                <Slider
                  value={[delaySettings.betweenKeys.min, delaySettings.betweenKeys.max]}
                  onChange={(e, newValue) => {
                    handleDelaySettingsChange('betweenKeys', 'min', newValue[0]);
                    handleDelaySettingsChange('betweenKeys', 'max', newValue[1]);
                  }}
                  valueLabelDisplay="auto"
                  min={10}
                  max={500}
                  step={10}
                />
              </Grid>
              <Grid item xs={2}>
                <Typography>{delaySettings.betweenKeys.max} ms</Typography>
              </Grid>
            </Grid>
          </Box>

          <Box mb={4}>
            <Typography variant="subtitle1" gutterBottom>
              ระยะเวลาก่อนคอมเมนต์ (มิลลิวินาที)
            </Typography>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={2}>
                <Typography>{delaySettings.beforeComment.min} ms</Typography>
              </Grid>
              <Grid item xs={8}>
                <Slider
                  value={[delaySettings.beforeComment.min, delaySettings.beforeComment.max]}
                  onChange={(e, newValue) => {
                    handleDelaySettingsChange('beforeComment', 'min', newValue[0]);
                    handleDelaySettingsChange('beforeComment', 'max', newValue[1]);
                  }}
                  valueLabelDisplay="auto"
                  min={500}
                  max={5000}
                  step={100}
                />
              </Grid>
              <Grid item xs={2}>
                <Typography>{delaySettings.beforeComment.max} ms</Typography>
              </Grid>
            </Grid>
          </Box>

          <Box mb={4}>
            <Typography variant="subtitle1" gutterBottom>
              ระยะเวลาหลังคอมเมนต์ (มิลลิวินาที)
            </Typography>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={2}>
                <Typography>{delaySettings.afterComment.min} ms</Typography>
              </Grid>
              <Grid item xs={8}>
                <Slider
                  value={[delaySettings.afterComment.min, delaySettings.afterComment.max]}
                  onChange={(e, newValue) => {
                    handleDelaySettingsChange('afterComment', 'min', newValue[0]);
                    handleDelaySettingsChange('afterComment', 'max', newValue[1]);
                  }}
                  valueLabelDisplay="auto"
                  min={1000}
                  max={10000}
                  step={500}
                />
              </Grid>
              <Grid item xs={2}>
                <Typography>{delaySettings.afterComment.max} ms</Typography>
              </Grid>
            </Grid>
          </Box>

          <Box>
            <Typography variant="subtitle1" gutterBottom>
              ระยะเวลาระหว่างกลุ่ม (มิลลิวินาที)
            </Typography>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={2}>
                <Typography>{delaySettings.betweenGroups.min} ms</Typography>
              </Grid>
              <Grid item xs={8}>
                <Slider
                  value={[delaySettings.betweenGroups.min, delaySettings.betweenGroups.max]}
                  onChange={(e, newValue) => {
                    handleDelaySettingsChange('betweenGroups', 'min', newValue[0]);
                    handleDelaySettingsChange('betweenGroups', 'max', newValue[1]);
                  }}
                  valueLabelDisplay="auto"
                  min={1000}
                  max={30000}
                  step={1000}
                />
              </Grid>
              <Grid item xs={2}>
                <Typography>{delaySettings.betweenGroups.max} ms</Typography>
              </Grid>
            </Grid>
          </Box>
        </Paper>
      )}

      {/* แท็บที่ 4: การตั้งค่าพฤติกรรมเสมือนมนุษย์ */}
      {activeTab === 3 && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            การตั้งค่าพฤติกรรมเสมือนมนุษย์
          </Typography>
          <Divider sx={{ mb: 3 }} />

          <Alert severity="info" sx={{ mb: 3 }}>
            <Typography variant="body2">
              การตั้งค่าพฤติกรรมเสมือนมนุษย์ช่วยให้ระบบทำงานในลักษณะที่เหมือนมนุษย์มากขึ้น ทำให้มีโอกาสถูกตรวจจับว่าเป็นระบบอัตโนมัติน้อยลง
            </Typography>
          </Alert>

          <Grid container spacing={3}>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={humanBehaviorSettings.simulateHumanTyping}
                    onChange={handleHumanBehaviorSettingsChange}
                    name="simulateHumanTyping"
                    color="primary"
                  />
                }
                label="จำลองการพิมพ์แบบมนุษย์"
              />
              <Typography variant="caption" color="textSecondary" display="block">
                พิมพ์ด้วยความเร็วที่ไม่สม่ำเสมอและมีการหยุดพักเป็นระยะๆ เหมือนมนุษย์
              </Typography>
            </Grid>
            
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={humanBehaviorSettings.simulateMouseMovement}
                    onChange={handleHumanBehaviorSettingsChange}
                    name="simulateMouseMovement"
                    color="primary"
                  />
                }
                label="จำลองการเคลื่อนไหวของเมาส์"
              />
              <Typography variant="caption" color="textSecondary" display="block">
                เคลื่อนเมาส์ในลักษณะที่เหมือนมนุษย์ก่อนการคลิก
              </Typography>
            </Grid>
            
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={humanBehaviorSettings.randomScrolls}
                    onChange={handleHumanBehaviorSettingsChange}
                    name="randomScrolls"
                    color="primary"
                  />
                }
                label="การเลื่อนหน้าแบบสุ่ม"
              />
              <Typography variant="caption" color="textSecondary" display="block">
                เลื่อนหน้าจอขึ้นลงเป็นระยะๆ ระหว่างการสแกนเพื่อดูเหมือนผู้ใช้จริง
              </Typography>
            </Grid>
          </Grid>
        </Paper>
      )}

      {/* แท็บที่ 5: การตั้งค่าการแจ้งเตือน */}
      {activeTab === 4 && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            การตั้งค่าการแจ้งเตือน
          </Typography>
          <Divider sx={{ mb: 3 }} />

          <Grid container spacing={3}>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={notificationSettings.enableBrowserNotifications}
                    onChange={handleNotificationSettingsChange}
                    name="enableBrowserNotifications"
                    color="primary"
                  />
                }
                label="เปิดใช้งานการแจ้งเตือนในเบราว์เซอร์"
              />
              <Typography variant="caption" color="textSecondary" display="block">
                แสดงการแจ้งเตือนในเบราว์เซอร์เมื่อมีเหตุการณ์สำคัญ
              </Typography>
            </Grid>
            
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={notificationSettings.enableEmailNotifications}
                    onChange={handleNotificationSettingsChange}
                    name="enableEmailNotifications"
                    color="primary"
                  />
                }
                label="เปิดใช้งานการแจ้งเตือนทางอีเมล"
              />
            </Grid>
            
            {notificationSettings.enableEmailNotifications && (
              <Grid item xs={12} md={6}>
                <TextField
                  name="emailAddress"
                  label="อีเมลสำหรับการแจ้งเตือน"
                  type="email"
                  value={notificationSettings.emailAddress}
                  onChange={handleNotificationSettingsChange}
                  fullWidth
                  required={notificationSettings.enableEmailNotifications}
                />
              </Grid>
            )}
            
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
                แจ้งเตือนเมื่อ:
              </Typography>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={notificationSettings.notifyOnCompletion}
                    onChange={handleNotificationSettingsChange}
                    name="notifyOnCompletion"
                    color="primary"
                  />
                }
                label="งานสแกนเสร็จสิ้น"
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={notificationSettings.notifyOnError}
                    onChange={handleNotificationSettingsChange}
                    name="notifyOnError"
                    color="primary"
                  />
                }
                label="เกิดข้อผิดพลาด"
              />
            </Grid>
          </Grid>
        </Paper>
      )}

      {/* Dialog ยืนยันรีเซ็ตการตั้งค่า */}
      <ConfirmDialog
        open={openConfirmReset}
        title="ยืนยันการรีเซ็ตการตั้งค่า"
        content="คุณต้องการรีเซ็ตการตั้งค่าทั้งหมดเป็นค่าเริ่มต้นหรือไม่? การดำเนินการนี้ไม่สามารถย้อนกลับได้"
        onConfirm={handleResetSettings}
        onCancel={() => setOpenConfirmReset(false)}
        isLoading={resetSettingsMutation.isLoading}
        confirmText="รีเซ็ตการตั้งค่า"
        confirmColor="error"
      />
    </Box>
  );
};

export default Settings;
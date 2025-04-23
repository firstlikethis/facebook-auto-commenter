// client/src/components/layout/Navbar.js
import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  Box, 
  IconButton, 
  Menu, 
  MenuItem, 
  Badge, 
  Tooltip,
  Avatar,
  Switch,
  ListItemIcon,
  Divider
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  Settings as SettingsIcon,
  Person as PersonIcon,
  DarkMode as DarkModeIcon,
  LightMode as LightModeIcon,
  Logout as LogoutIcon
} from '@mui/icons-material';

const Navbar = ({ title }) => {
  const { user, logout } = useAuth();
  const { darkMode, toggleTheme } = useTheme();
  const [anchorEl, setAnchorEl] = useState(null);
  const [notificationAnchorEl, setNotificationAnchorEl] = useState(null);

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleNotificationOpen = (event) => {
    setNotificationAnchorEl(event.currentTarget);
  };

  const handleNotificationClose = () => {
    setNotificationAnchorEl(null);
  };

  const handleLogout = () => {
    handleMenuClose();
    logout();
  };

  return (
    <AppBar 
      position="fixed" 
      color="default"
      elevation={1}
      sx={{ 
        zIndex: (theme) => theme.zIndex.drawer + 1,
        backgroundColor: darkMode ? 'secondary.900' : 'white',
        color: darkMode ? 'white' : 'text.primary'
      }}
    >
      <Toolbar>
        <Typography
          variant="h6"
          component="div"
          sx={{ flexGrow: 1, fontWeight: 'medium' }}
        >
          {title}
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Tooltip title="การแจ้งเตือน">
            <IconButton
              size="large"
              color="inherit"
              onClick={handleNotificationOpen}
            >
              <Badge badgeContent={3} color="error">
                <NotificationsIcon />
              </Badge>
            </IconButton>
          </Tooltip>

          <Tooltip title={darkMode ? 'โหมดสว่าง' : 'โหมดมืด'}>
            <IconButton 
              color="inherit" 
              onClick={toggleTheme}
              sx={{ mx: 1 }}
            >
              {darkMode ? <LightModeIcon /> : <DarkModeIcon />}
            </IconButton>
          </Tooltip>

          <Tooltip title="บัญชีผู้ใช้">
            <IconButton
              onClick={handleMenuOpen}
              size="small"
              sx={{ ml: 1 }}
              aria-controls="menu-appbar"
              aria-haspopup="true"
            >
              <Avatar 
                sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}
              >
                {user?.username?.charAt(0).toUpperCase() || 'U'}
              </Avatar>
            </IconButton>
          </Tooltip>
        </Box>

        {/* User Menu */}
        <Menu
          id="menu-appbar"
          anchorEl={anchorEl}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right',
          }}
          keepMounted
          transformOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
        >
          <Box sx={{ px: 2, py: 1 }}>
            <Typography variant="subtitle1" fontWeight="medium">
              {user?.username || 'ผู้ใช้งาน'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {user?.email || 'user@example.com'}
            </Typography>
          </Box>
          
          <Divider />
          
          <MenuItem onClick={handleMenuClose}>
            <ListItemIcon>
              <PersonIcon fontSize="small" />
            </ListItemIcon>
            โปรไฟล์
          </MenuItem>
          
          <MenuItem onClick={handleMenuClose}>
            <ListItemIcon>
              <SettingsIcon fontSize="small" />
            </ListItemIcon>
            ตั้งค่า
          </MenuItem>
          
          <Divider />
          
          <MenuItem onClick={handleLogout}>
            <ListItemIcon>
              <LogoutIcon fontSize="small" color="error" />
            </ListItemIcon>
            <Typography color="error">ออกจากระบบ</Typography>
          </MenuItem>
        </Menu>

        {/* Notifications Menu */}
        <Menu
          anchorEl={notificationAnchorEl}
          open={Boolean(notificationAnchorEl)}
          onClose={handleNotificationClose}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
          PaperProps={{
            sx: { 
              width: 320,
              maxHeight: 400
            },
          }}
        >
          <Box sx={{ p: 2 }}>
            <Typography variant="subtitle1" fontWeight="medium">
              การแจ้งเตือน
            </Typography>
          </Box>
          
          <Divider />
          
          <MenuItem onClick={handleNotificationClose}>
            <Box>
              <Typography variant="body2" fontWeight="medium">
                มีงานสแกนเสร็จสิ้น
              </Typography>
              <Typography variant="caption" color="text.secondary">
                งานสแกนกลุ่ม "รถยนต์มือสอง" เสร็จสิ้นแล้ว
              </Typography>
            </Box>
          </MenuItem>
          
          <MenuItem onClick={handleNotificationClose}>
            <Box>
              <Typography variant="body2" fontWeight="medium">
                พบคอมเมนต์ใหม่ 12 รายการ
              </Typography>
              <Typography variant="caption" color="text.secondary">
                ระบบได้โพสต์คอมเมนต์ใหม่ในกลุ่ม "อสังหาริมทรัพย์"
              </Typography>
            </Box>
          </MenuItem>
          
          <MenuItem onClick={handleNotificationClose}>
            <Box>
              <Typography variant="body2" fontWeight="medium">
                มีบัญชี Facebook ล็อกอินล้มเหลว
              </Typography>
              <Typography variant="caption" color="text.secondary">
                โปรดตรวจสอบการตั้งค่าบัญชี Facebook
              </Typography>
            </Box>
          </MenuItem>
          
          <Divider />
          
          <Box sx={{ p: 1, display: 'flex', justifyContent: 'center' }}>
            <Typography 
              variant="body2" 
              color="primary" 
              sx={{ cursor: 'pointer' }}
              onClick={handleNotificationClose}
            >
              ดูการแจ้งเตือนทั้งหมด
            </Typography>
          </Box>
        </Menu>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
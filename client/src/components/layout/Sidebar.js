// client/src/components/layout/Sidebar.js
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Dashboard as DashboardIcon,
  Facebook as FacebookIcon,
  Group as GroupIcon,
  Loyalty as KeywordIcon,
  Comment as CommentIcon,
  Schedule as TaskIcon,
  Settings as SettingsIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  BarChart as StatsIcon,
  Logout as LogoutIcon
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { Box, Drawer, List, ListItem, ListItemIcon, ListItemText, Typography, Divider, IconButton, Tooltip } from '@mui/material';

const DRAWER_WIDTH = 240;

const Sidebar = ({ open, toggleSidebar }) => {
  const location = useLocation();
  const { logout, user } = useAuth();
  const { darkMode } = useTheme();
  
  const menuItems = [
    { 
      path: '/', 
      name: 'แดชบอร์ด', 
      icon: <DashboardIcon /> 
    },
    { 
      path: '/facebook-accounts', 
      name: 'บัญชี Facebook', 
      icon: <FacebookIcon /> 
    },
    { 
      path: '/groups', 
      name: 'กลุ่ม Facebook', 
      icon: <GroupIcon /> 
    },
    { 
      path: '/keywords', 
      name: 'คำสำคัญ', 
      icon: <KeywordIcon /> 
    },
    { 
      path: '/tasks', 
      name: 'งานสแกน', 
      icon: <TaskIcon /> 
    },
    { 
      path: '/comments', 
      name: 'ประวัติคอมเมนต์', 
      icon: <CommentIcon /> 
    },
    { 
      path: '/stats', 
      name: 'สถิติและรายงาน', 
      icon: <StatsIcon /> 
    },
    { 
      path: '/settings', 
      name: 'ตั้งค่า', 
      icon: <SettingsIcon /> 
    },
  ];

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: open ? DRAWER_WIDTH : 72,
        flexShrink: 0,
        [`& .MuiDrawer-paper`]: {
          width: open ? DRAWER_WIDTH : 72,
          boxSizing: 'border-box',
          borderRight: '1px solid',
          borderColor: 'divider',
          overflowX: 'hidden',
          transition: 'width 0.2s ease-in-out',
          backgroundColor: darkMode ? 'secondary.900' : 'white',
          color: darkMode ? 'white' : 'inherit',
        },
      }}
      open={open}
    >
      <Box sx={{ height: 70, display: 'flex', alignItems: 'center', px: 2, justifyContent: open ? 'space-between' : 'center' }}>
        {open && (
          <Typography variant="h6" component="div" noWrap sx={{ fontWeight: 'bold' }}>
            FB Auto Commenter
          </Typography>
        )}
        <IconButton onClick={toggleSidebar} sx={{ ml: open ? 0 : 'auto' }}>
          {open ? <ChevronLeftIcon /> : <ChevronRightIcon />}
        </IconButton>
      </Box>
      
      <Divider />
      
      <List sx={{ mt: 1 }}>
        {menuItems.map((item) => (
          <ListItem
            button
            component={Link}
            to={item.path}
            key={item.path}
            sx={{
              mb: 0.5,
              minHeight: 48,
              justifyContent: open ? 'initial' : 'center',
              borderRadius: '0 24px 24px 0',
              width: open ? 'calc(100% - 8px)' : 'calc(100% - 16px)',
              ml: '4px',
              px: 2.5,
              ...(location.pathname === item.path && {
                backgroundColor: darkMode ? 'primary.800' : 'primary.100',
                '&:hover': {
                  backgroundColor: darkMode ? 'primary.700' : 'primary.200',
                },
              }),
            }}
          >
            <Tooltip title={open ? '' : item.name} placement="right">
              <ListItemIcon
                sx={{
                  minWidth: 0,
                  mr: open ? 3 : 'auto',
                  justifyContent: 'center',
                  color: location.pathname === item.path 
                    ? 'primary.500' 
                    : (darkMode ? 'grey.300' : 'grey.600'),
                }}
              >
                {item.icon}
              </ListItemIcon>
            </Tooltip>
            {open && (
              <ListItemText 
                primary={item.name} 
                sx={{
                  color: location.pathname === item.path 
                    ? 'primary.500' 
                    : (darkMode ? 'grey.300' : 'grey.600')
                }}
              />
            )}
          </ListItem>
        ))}
      </List>
      
      <Box sx={{ flexGrow: 1 }} />
      
      <Divider />
      
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: open ? 'space-between' : 'center',
          p: 2,
          flexDirection: open ? 'row' : 'column',
        }}
      >
        {open && (
          <Box>
            <Typography variant="body2" fontWeight="medium">
              {user?.username || 'ผู้ใช้งาน'}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {user?.email}
            </Typography>
          </Box>
        )}
        <Tooltip title="ออกจากระบบ">
          <IconButton 
            color="error" 
            onClick={logout}
            sx={{ ml: open ? 0 : 'auto', mt: open ? 0 : 1 }}
          >
            <LogoutIcon />
          </IconButton>
        </Tooltip>
      </Box>
    </Drawer>
  );
};

export default Sidebar;
// client/src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { QueryClient, QueryClientProvider } from 'react-query';
import { ThemeProvider as MuiThemeProvider, createTheme, CssBaseline } from '@mui/material';

// Auth Components
import AuthGuard from './components/auth/AuthGuard';
import GuestGuard from './components/auth/GuestGuard';

// Layouts
import DashboardLayout from './layouts/DashboardLayout';
import AuthLayout from './layouts/AuthLayout';

// Pages
import Dashboard from './pages/Dashboard';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import NotFound from './pages/NotFound';

// Facebook Account Pages
import FacebookAccountList from './pages/facebook/AccountList';
import FacebookAccountDetail from './pages/facebook/AccountDetail';

// Group Pages
import GroupList from './pages/groups/GroupList';
import GroupDetail from './pages/groups/GroupDetail';
import GroupStats from './pages/groups/GroupStats';

// Keyword Pages
import KeywordList from './pages/keywords/KeywordList';
import KeywordDetail from './pages/keywords/KeywordDetail';

// Task Pages
import ScanTasks from './pages/tasks/ScanTasks';
import NewTask from './pages/tasks/NewTask';
import TaskDetail from './pages/tasks/TaskDetail';

// Comment Pages
import CommentList from './pages/comments/CommentList';

// Stats Pages
import Stats from './pages/stats/Stats';

// Settings Pages
import Settings from './pages/settings/Settings';

// Context Providers
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { SettingsProvider } from './contexts/SettingsContext';

// Create React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 30000,
    },
  },
});

function App() {
  // ใช้ theme จาก context แทน local state
  const { darkMode } = useTheme();
  
  const theme = React.useMemo(() => createTheme({
    palette: {
      mode: darkMode ? 'dark' : 'light',
      primary: {
        main: '#6366f1',
        light: '#818cf8',
        dark: '#4f46e5',
        contrastText: '#ffffff',
      },
      secondary: {
        main: '#64748b',
        light: '#94a3b8',
        dark: '#475569',
        contrastText: '#ffffff',
      },
      success: {
        main: '#22c55e',
        light: '#4ade80',
        dark: '#16a34a',
      },
      error: {
        main: '#ef4444',
        light: '#f87171',
        dark: '#dc2626',
      },
      warning: {
        main: '#f59e0b',
        light: '#fbbf24',
        dark: '#d97706',
      },
      info: {
        main: '#3b82f6',
        light: '#60a5fa',
        dark: '#2563eb',
      },
      background: {
        default: darkMode ? '#0f172a' : '#f1f5f9',
        paper: darkMode ? '#1e293b' : '#ffffff',
      },
      text: {
        primary: darkMode ? '#f8fafc' : '#1e293b',
        secondary: darkMode ? '#94a3b8' : '#64748b',
      },
    },
    typography: {
      fontFamily: '"Sarabun", "Roboto", "Helvetica", "Arial", sans-serif',
    },
    shape: {
      borderRadius: 8,
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            fontWeight: 500,
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            boxShadow: darkMode 
              ? '0 1px 3px rgba(0,0,0,0.4), 0 1px 2px rgba(0,0,0,0.48)'
              : '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)',
            borderRadius: 8,
          },
        },
      },
    },
  }), [darkMode]);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <MuiThemeProvider theme={theme}>
          <CssBaseline />
          <AuthProvider>
            <SettingsProvider>
              <Router>
                <Routes>
                  {/* Auth Routes */}
                  <Route element={<GuestGuard />}>
                    <Route element={<AuthLayout />}>
                      <Route path="/login" element={<Login />} />
                      <Route path="/register" element={<Register />} />
                    </Route>
                  </Route>

                  {/* Protected Routes */}
                  <Route element={<AuthGuard />}>
                    <Route element={<DashboardLayout />}>
                      <Route path="/" element={<Dashboard />} />
                      
                      {/* Facebook Account Routes */}
                      <Route path="/facebook-accounts" element={<FacebookAccountList />} />
                      <Route path="/facebook-accounts/:id" element={<FacebookAccountDetail />} />
                      
                      {/* Group Routes */}
                      <Route path="/groups" element={<GroupList />} />
                      <Route path="/groups/:id" element={<GroupDetail />} />
                      <Route path="/groups/:id/stats" element={<GroupStats />} />
                      
                      {/* Keyword Routes */}
                      <Route path="/keywords" element={<KeywordList />} />
                      <Route path="/keywords/:id" element={<KeywordDetail />} />
                      
                      {/* Task Routes */}
                      <Route path="/tasks" element={<ScanTasks />} />
                      <Route path="/tasks/new" element={<NewTask />} />
                      <Route path="/tasks/:id" element={<TaskDetail />} />
                      
                      {/* Comment Routes */}
                      <Route path="/comments" element={<CommentList />} />
                      
                      {/* Stats Routes */}
                      <Route path="/stats" element={<Stats />} />
                      
                      {/* Settings Routes */}
                      <Route path="/settings" element={<Settings />} />
                    </Route>
                  </Route>

                  {/* 404 Not Found */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Router>

              {/* Toast Notifications */}
              <Toaster position="top-right" />
            </SettingsProvider>
          </AuthProvider>
        </MuiThemeProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

// ฟังก์ชันนี้ช่วยให้เราสามารถใช้ theme hooks ในส่วน App component ได้
function AppWithTheme() {
  return (
    <ThemeProvider>
      <App />
    </ThemeProvider>
  );
}

export default AppWithTheme;
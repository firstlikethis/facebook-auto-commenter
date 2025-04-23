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

// Context Providers
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
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
  const [themeMode, setThemeMode] = React.useState('light');

  const theme = React.useMemo(() => createTheme({
    palette: {
      mode: themeMode,
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
        default: themeMode === 'light' ? '#f1f5f9' : '#0f172a',
        paper: themeMode === 'light' ? '#ffffff' : '#1e293b',
      },
      text: {
        primary: themeMode === 'light' ? '#1e293b' : '#f8fafc',
        secondary: themeMode === 'light' ? '#64748b' : '#94a3b8',
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
            boxShadow: themeMode === 'light' 
              ? '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)'
              : '0 1px 3px rgba(0,0,0,0.4), 0 1px 2px rgba(0,0,0,0.48)',
            borderRadius: 8,
          },
        },
      },
    },
  }), [themeMode]);

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
                      {/* ลิงก์ไปยังหน้าอื่นๆ จะถูกเพิ่มที่นี่ */}
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

export default App;
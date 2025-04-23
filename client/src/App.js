// client/src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { QueryClient, QueryClientProvider } from 'react-query';
import { ReactQueryDevtools } from 'react-query/devtools';

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
import GroupList from './pages/groups/GroupList';
import GroupDetail from './pages/groups/GroupDetail';
import KeywordList from './pages/keywords/KeywordList';
import KeywordDetail from './pages/keywords/KeywordDetail';
import CommentHistory from './pages/comments/CommentHistory';
import ScanTasks from './pages/tasks/ScanTasks';
import TaskDetail from './pages/tasks/TaskDetail';
import Settings from './pages/settings/Settings';
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
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
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
                    <Route path="/groups" element={<GroupList />} />
                    <Route path="/groups/:id" element={<GroupDetail />} />
                    <Route path="/keywords" element={<KeywordList />} />
                    <Route path="/keywords/:id" element={<KeywordDetail />} />
                    <Route path="/comments" element={<CommentHistory />} />
                    <Route path="/tasks" element={<ScanTasks />} />
                    <Route path="/tasks/:id" element={<TaskDetail />} />
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
      </ThemeProvider>
      
      {/* React Query Devtools - visible only in development */}
      <ReactQueryDevtools initialIsOpen={false} position="bottom-right" />
    </QueryClientProvider>
  );
}

export default App;
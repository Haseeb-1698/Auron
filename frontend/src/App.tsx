import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Box } from '@mui/material';

import { useAppDispatch, useAppSelector } from '@hooks/redux';
import { checkAuth } from '@features/auth/authSlice';
import { initializeWebSocket } from '@services/websocket';

import MainLayout from '@components/layout/MainLayout';
import PrivateRoute from '@components/common/PrivateRoute';
import LoadingScreen from '@components/common/LoadingScreen';

// Pages
import LoginPage from '@pages/auth/LoginPage';
import RegisterPage from '@pages/auth/RegisterPage';
import DashboardPage from '@pages/DashboardPage';
import LabsPage from '@pages/LabsPage';
import LabDetailPage from '@pages/labs/LabDetailPage';
import ProgressPage from '@pages/ProgressPage';
import ReportsPage from '@pages/ReportsPage';
import CollaborationPage from '@pages/CollaborationPage';
import ProfilePage from '@pages/ProfilePage';
import NotFoundPage from '@pages/NotFoundPage';

/**
 * Main Application Component
 * Handles routing, authentication, and WebSocket initialization
 */
function App(): JSX.Element {
  const dispatch = useAppDispatch();
  const { isAuthenticated, isLoading, user } = useAppSelector((state) => state.auth);

  // Check authentication status on mount
  useEffect(() => {
    dispatch(checkAuth());
  }, [dispatch]);

  // Initialize WebSocket connection when authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      const cleanup = initializeWebSocket(user.id);
      return cleanup;
    }
    return undefined;
  }, [isAuthenticated, user]);

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Protected Routes */}
        <Route
          path="/"
          element={
            <PrivateRoute>
              <MainLayout />
            </PrivateRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="labs" element={<LabsPage />} />
          <Route path="labs/:labId" element={<LabDetailPage />} />
          <Route path="progress" element={<ProgressPage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="collaboration" element={<CollaborationPage />} />
          <Route path="profile" element={<ProfilePage />} />
        </Route>

        {/* 404 */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Box>
  );
}

export default App;

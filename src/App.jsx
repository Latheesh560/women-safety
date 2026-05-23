import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './context/authStore';

import PrivateRoute from './components/PrivateRoute';
import DashboardLayout from './components/DashboardLayout';

import LandingPage from './pages/LandingPage';
import SignupPage from './pages/SignupPage';
import LoginPage from './pages/LoginPage';
import HomePage from './pages/HomePage';
import SafeRoutesPage from './pages/SafeRoutesPage';
import IncidentReportPage from './pages/IncidentReportPage';
import MyReportsPage from './pages/MyReportsPage';
import SOSCenterPage from './pages/SOSCenterPage';
import CommunitySupportPage from './pages/CommunitySupportPage';
import SettingsPage from './pages/SettingsPage';


function App() {
  const { fetchUser, token, user } = useAuthStore();

  useEffect(() => {
    if (token && !user) {
      fetchUser();
    }
  }, [token, user, fetchUser]);

  const wrapWithLayout = (Component, title) => (
    <DashboardLayout title={title}>
      <Component />
    </DashboardLayout>
  );

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/login" element={<LoginPage />} />

        <Route
          path="/home"
          element={
            <PrivateRoute>
              <HomePage />
            </PrivateRoute>
          }
        />
        <Route
          path="/safe-routes"
          element={
            <PrivateRoute>
              {wrapWithLayout(SafeRoutesPage, 'Safe Routes')}
            </PrivateRoute>
          }
        />
        <Route
          path="/incident-report"
          element={
            <PrivateRoute>
              {wrapWithLayout(IncidentReportPage, 'Report Incident')}
            </PrivateRoute>
          }
        />
        <Route
          path="/my-reports"
          element={
            <PrivateRoute>
              {wrapWithLayout(MyReportsPage, 'My Reports')}
            </PrivateRoute>
          }
        />
        <Route
          path="/sos-center"
          element={
            <PrivateRoute>
              {wrapWithLayout(SOSCenterPage, 'SOS Center')}
            </PrivateRoute>
          }
        />
        <Route
          path="/community"
          element={
            <PrivateRoute>
              {wrapWithLayout(CommunitySupportPage, 'Community')}
            </PrivateRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <PrivateRoute>
              {wrapWithLayout(SettingsPage, 'Settings')}
            </PrivateRoute>
          }
        />


        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

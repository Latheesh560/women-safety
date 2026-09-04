import React, { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './context/authStore';

import PrivateRoute from './components/PrivateRoute';
import DashboardLayout from './components/DashboardLayout';

const LandingPage = lazy(() => import('./pages/LandingPage'));
const SignupPage = lazy(() => import('./pages/SignupPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const HomePage = lazy(() => import('./pages/HomePage'));
const SafeRoutesPage = lazy(() => import('./pages/SafeRoutesPage'));
const IncidentReportPage = lazy(() => import('./pages/IncidentReportPage'));
const MyReportsPage = lazy(() => import('./pages/MyReportsPage'));
const SOSCenterPage = lazy(() => import('./pages/SOSCenterPage'));
const CommunitySupportPage = lazy(() => import('./pages/CommunitySupportPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));


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

  const routeFallback = (
    <div className="min-h-screen flex items-center justify-center text-sm font-semibold text-slate-500">
      Loading…
    </div>
  );

  return (
    <BrowserRouter>
      <Suspense fallback={routeFallback}>
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
      </Suspense>
    </BrowserRouter>
  );
}

export default App;

import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { Navbar, Sidebar, ProtectedRoute } from './components/layout';
import {
  LoginPage,
  DashboardPage,
  AnomaliesPage,
  RiskPage,
  LoginLogsPage,
  UsersPage,
  AuditPage,
  GrokAiPage,
} from './pages';
import { WinstonConsole } from './components/ui';
import { grokAiApi } from './api';
import logger from './utils/logger';

const AppLayout = () => {
  const { isAuthenticated, isAdmin } = useAuth();
  const [winstonOpen, setWinstonOpen] = useState(false);
  const [aiStatus, setAiStatus] = useState(null);
  const location = useLocation();

  useEffect(() => {
    logger.info(`Navigated to route: ${location.pathname}`);
  }, [location.pathname]);

  useEffect(() => {
    if (isAuthenticated) {
      grokAiApi.getStatus()
        .then((res) => setAiStatus(res))
        .catch(() => null);
    }
  }, [isAuthenticated]);

  return (
    <div className="h-screen max-h-screen w-screen overflow-hidden flex flex-col bg-slate-50 dark:bg-[#09090b] text-zinc-900 dark:text-zinc-100 transition-colors duration-200">
      {/* Top Navbar: permanently fixed and pinned */}
      <Navbar
        onOpenWinston={() => setWinstonOpen(true)}
        aiStatus={aiStatus}
      />

      {/* Main Workspace: fixed height, strictly contained */}
      <div className="flex-1 min-h-0 flex overflow-hidden">
        {/* Desktop Sidebar: permanently pinned on the left */}
        <Sidebar />

        {/* Content Pane: the only scrolling element */}
        <main className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          <Routes>
            <Route
              path="/"
              element={<Navigate to={isAdmin ? "/dashboard" : "/anomalies"} replace />}
            />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute adminOnly>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/anomalies"
              element={
                <ProtectedRoute>
                  <AnomaliesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/risk"
              element={
                <ProtectedRoute>
                  <RiskPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/logs"
              element={
                <ProtectedRoute>
                  <LoginLogsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/users"
              element={
                <ProtectedRoute adminOnly>
                  <UsersPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/audit"
              element={
                <ProtectedRoute adminOnly>
                  <AuditPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/ai"
              element={
                <ProtectedRoute>
                  <GrokAiPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/grok-ai"
              element={<Navigate to="/ai" replace />}
            />
            <Route
              path="*"
              element={<Navigate to="/" replace />}
            />
          </Routes>
        </main>
      </div>

      {/* Winston Live Telemetry Console Drawer */}
      <WinstonConsole isOpen={winstonOpen} onClose={() => setWinstonOpen(false)} />
    </div>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route
              path="/*"
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}

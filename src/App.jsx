import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { AnimatePresence, motion } from 'framer-motion';

import LoginPage from './pages/LoginPage';
import TrackingPage from './pages/TrackingPage';
import DashboardLayout from './components/layout/DashboardLayout';
import DashboardView from './views/DashboardView';
import CasesView from './views/CasesView';
import AnalyticsView from './views/AnalyticsView';
import SettingsView from './views/SettingsView';
import useAuthStore from './stores/authStore';

const queryClient = new QueryClient();

function ProtectedRoute({ children }) {
  const token = useAuthStore((s) => s.token);
  if (!token) return <Navigate to="/login" replace />;
  return children;
}

function DashboardShell() {
  const [activeTab, setActiveTab] = useState('dashboard');
  return (
    <DashboardLayout activeTab={activeTab} onTabChange={setActiveTab}>
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
        >
          {activeTab === 'dashboard' && <DashboardView />}
          {activeTab === 'cases' && <CasesView />}
          {activeTab === 'analytics' && <AnalyticsView />}
          {activeTab === 'settings' && <SettingsView />}
        </motion.div>
      </AnimatePresence>
    </DashboardLayout>
  );
}

export default function App() {
  useEffect(() => {
    useAuthStore.getState().checkAuth();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 6000,
          style: {
            background: 'rgba(255,255,255,0.95)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255,255,255,0.3)',
            borderRadius: '12px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
            padding: '12px 16px',
            fontSize: '13px',
          },
        }}
      />
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/track/:token" element={<TrackingPage />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardShell />
              </ProtectedRoute>
            }
          />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

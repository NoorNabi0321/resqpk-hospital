import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';

import LoginPage from './pages/LoginPage';
import TrackingPage from './pages/TrackingPage';
import CampRegisterPage from './pages/CampRegisterPage';
import DashboardLayout from './components/layout/DashboardLayout';
import IncomingView from './pages/views/IncomingView';
import CaseDetailView from './pages/views/CaseDetailView';
import ResourcesView from './pages/views/ResourcesView';
import HistoryView from './pages/views/HistoryView';
import CampDashboardView from './pages/views/CampDashboardView';
import AnalyticsView from './views/AnalyticsView';
import useAuthStore from './stores/authStore';

const queryClient = new QueryClient({
  defaultOptions: { queries: { refetchOnWindowFocus: false, retry: 1 } },
});

function ProtectedRoute({ children }) {
  const token = useAuthStore((s) => s.token);
  if (!token) return <Navigate to="/login" replace />;
  return children;
}

/**
 * Camps get a different home than hospitals: they have no case feed, so they
 * land on their own dashboard instead of Incoming.
 */
function HomeRedirect() {
  const hospital = useAuthStore((s) => s.hospital);
  const isCamp = hospital?.facility_type === 'medical_camp';
  return <Navigate to={isCamp ? '/camp' : '/incoming'} replace />;
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
          duration: 5000,
          style: {
            background: '#FFFFFF',
            border: '1px solid #E5E9F0',
            borderRadius: '12px',
            boxShadow: '0 4px 12px rgba(16,24,40,0.10)',
            padding: '12px 16px',
            fontSize: '13px',
            color: '#111827',
          },
        }}
      />
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/track/:token" element={<TrackingPage />} />
          <Route path="/camp/register" element={<CampRegisterPage />} />

          {/* Authenticated shell */}
          <Route
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/incoming" element={<IncomingView />} />
            <Route path="/case/:caseId" element={<CaseDetailView />} />
            <Route path="/resources" element={<ResourcesView />} />
            <Route path="/history" element={<HistoryView />} />
            <Route path="/analytics" element={<AnalyticsView />} />
            <Route path="/camp" element={<CampDashboardView />} />
          </Route>

          {/* Legacy links from v1 */}
          <Route path="/dashboard" element={<Navigate to="/incoming" replace />} />
          <Route path="/" element={<HomeRedirect />} />
          <Route path="*" element={<HomeRedirect />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

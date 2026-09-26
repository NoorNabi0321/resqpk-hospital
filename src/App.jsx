import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';

import LoginPage from './pages/LoginPage';
import SosPage from './pages/public/SosPage';
import TrackPage from './pages/public/TrackPage';
import CampRegisterPage from './pages/CampRegisterPage';
import HospitalRegisterPage from './pages/HospitalRegisterPage';
import RegisterChoicePage from './pages/RegisterChoicePage';
import DashboardLayout from './components/layout/DashboardLayout';
import IncomingView from './pages/views/IncomingView';
import CaseDetailView from './pages/views/CaseDetailView';
import ResourcesView from './pages/views/ResourcesView';
import HistoryView from './pages/views/HistoryView';
import CampDashboardView from './pages/views/CampDashboardView';
import CampPatientsView from './pages/views/CampPatientsView';
import AdminFacilitiesView from './pages/views/AdminFacilitiesView';
import AnalyticsView from './views/AnalyticsView';
import useAuthStore from './stores/authStore';
import { audienceOf, homeFor } from './lib/navigation';

const queryClient = new QueryClient({
  defaultOptions: { queries: { refetchOnWindowFocus: false, retry: 1 } },
});

function ProtectedRoute({ children }) {
  const token = useAuthStore((s) => s.token);
  const ready = useAuthStore((s) => s.ready);
  if (!token) return <Navigate to="/login" replace />;
  // Wait for the profile before anything decides where this account belongs.
  if (!ready) {
    return (
      <div className="min-h-screen grid place-items-center bg-page text-ink-muted">
        <span className="text-sm">Loading…</span>
      </div>
    );
  }
  return children;
}

/** Each kind of account has its own first screen. */
function HomeRedirect() {
  const token = useAuthStore((s) => s.token);
  const ready = useAuthStore((s) => s.ready);
  const user = useAuthStore((s) => s.user);
  const hospital = useAuthStore((s) => s.hospital);
  if (!token) return <Navigate to="/login" replace />;
  // Same reason as ProtectedRoute: decide nothing until the account is known.
  if (!ready) return null;
  return <Navigate to={homeFor(user, hospital)} replace />;
}

/**
 * Routes are guarded, not merely hidden.
 *
 * Leaving the tabs out of the nav stops nobody typing /incoming, and a camp
 * that reached it would sit watching an empty ambulance feed wondering why
 * nothing arrives. Anyone in the wrong place is sent to their own home.
 */
function For({ audience, children }) {
  const user = useAuthStore((s) => s.user);
  const hospital = useAuthStore((s) => s.hospital);
  const allowed = Array.isArray(audience) ? audience : [audience];
  if (!allowed.includes(audienceOf(user, hospital))) {
    return <Navigate to={homeFor(user, hospital)} replace />;
  }
  return children;
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
          {/* Public — no account. The patient side of the system. */}
          <Route path="/sos" element={<SosPage />} />
          <Route path="/t/:token" element={<TrackPage />} />
          <Route path="/c/:caseId" element={<TrackPage />} />
          {/* Older links shared before the shorter /t/ form existed. */}
          <Route path="/track/:token" element={<TrackPage />} />

          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterChoicePage />} />
          <Route path="/register/hospital" element={<HospitalRegisterPage />} />
          <Route path="/register/camp" element={<CampRegisterPage />} />
          {/* The old camp link, still in the wild. */}
          <Route path="/camp/register" element={<Navigate to="/register/camp" replace />} />

          {/* Authenticated shell */}
          <Route
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/incoming" element={<For audience="hospital"><IncomingView /></For>} />
            <Route path="/case/:caseId" element={<For audience="hospital"><CaseDetailView /></For>} />
            <Route path="/resources" element={<For audience="hospital"><ResourcesView /></For>} />
            <Route path="/history" element={<For audience="hospital"><HistoryView /></For>} />
            <Route path="/analytics" element={<For audience="hospital"><AnalyticsView /></For>} />

            <Route path="/camp" element={<For audience="medical_camp"><CampDashboardView /></For>} />
            <Route path="/camp/patients" element={<For audience="medical_camp"><CampPatientsView /></For>} />

            <Route path="/admin/facilities" element={<For audience="super_admin"><AdminFacilitiesView /></For>} />
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

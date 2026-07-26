import { Outlet } from 'react-router-dom';

import TopNav from './TopNav';
import { useHospitalSocket } from '../../realtime/useHospitalSocket';

/**
 * v2 shell: sticky top nav + routed content. The socket lives here so every
 * view shares one connection and no screen manages its own.
 */
export default function DashboardLayout() {
  useHospitalSocket();

  return (
    <div className="min-h-screen bg-page">
      <TopNav />
      <main className="px-4 py-5">
        <Outlet />
      </main>
    </div>
  );
}

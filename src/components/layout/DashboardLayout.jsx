import TopNav from './TopNav';
import { useHospitalSocket } from '../../realtime/useHospitalSocket';

export default function DashboardLayout({ children, activeTab, onTabChange }) {
  // Keep the live socket + store populated while the dashboard is mounted.
  useHospitalSocket();

  return (
    <div className="min-h-screen bg-background-primary">
      <TopNav activeTab={activeTab} onTabChange={onTabChange} />
      <main className="pt-14">{children}</main>
    </div>
  );
}

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LayoutDashboard, AlertCircle, BarChart2, Settings, Bell } from 'lucide-react';

import useAuthStore from '../../stores/authStore';
import useRealtimeStore from '../../stores/realtimeStore';
import PillNav from '../ui/PillNav';
import LiveDot from '../ui/LiveDot';
import { cn } from '../../lib/utils';

export default function TopNav({ activeTab, onTabChange }) {
  const navigate = useNavigate();
  const { hospital, user, logout } = useAuthStore();
  const activeCases = useRealtimeStore((s) => s.activeCases);
  const beds = useRealtimeStore((s) => s.beds);
  const isLive = useRealtimeStore((s) => s.isLive);
  const [menuOpen, setMenuOpen] = useState(false);

  const availableBeds = beds.reduce((sum, b) => sum + (b.available_count || 0), 0);
  const bedColor =
    availableBeds > 5
      ? 'text-emergency-green'
      : availableBeds >= 1
        ? 'text-emergency-amber'
        : 'text-emergency-red';

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'cases', label: 'Active Cases', icon: AlertCircle, badge: activeCases.length },
    { id: 'analytics', label: 'Analytics', icon: BarChart2 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const initials = (hospital?.name ?? user?.email ?? '?').slice(0, 1).toUpperCase();
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="fixed top-0 inset-x-0 h-14 z-50 bg-white border-b border-gray-200 flex items-center px-4 gap-4">
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-emergency-red font-bold text-lg">ResQPK</span>
        <span className="text-gray-300">•</span>
        <span className="text-gray-600 text-sm truncate">{hospital?.name ?? 'Hospital'}</span>
      </div>

      <div className="flex-1 flex justify-center">
        <PillNav tabs={tabs} activeTab={activeTab} onTabChange={onTabChange} />
      </div>

      <div className="flex items-center gap-3">
        <LiveDot isLive={isLive} />
        <span className={cn('text-xs font-medium px-2.5 py-1 rounded-full bg-gray-100', bedColor)}>
          🛏 {availableBeds} beds
        </span>
        <button className="text-gray-500 hover:text-gray-700" aria-label="Notifications">
          <Bell size={18} />
        </button>
        <div className="relative">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="w-8 h-8 rounded-full bg-emergency-blue text-white text-sm font-medium flex items-center justify-center"
          >
            {initials}
          </button>
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-200 p-2 z-50">
                <div className="px-3 py-2">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {hospital?.name ?? 'Hospital'}
                  </p>
                  <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-3 py-2 rounded-lg text-sm text-emergency-red hover:bg-emergency-red/10"
                >
                  Logout
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { BarChart3, LogOut, Volume2, VolumeX } from 'lucide-react';

import useAuthStore from '../../stores/authStore';
import useRealtimeStore from '../../stores/realtimeStore';
import { isMuted, setMuted } from '../../lib/alerts';
import NotificationBell from './NotificationBell';

// v2 nav: three working tabs. Analytics is demoted to an icon — it is for
// managers reviewing later, never for the person handling a live ambulance.
const TABS = [
  { to: '/incoming', label: 'Incoming' },
  { to: '/resources', label: 'Resources' },
  { to: '/history', label: 'History' },
];

function TabLink({ to, label }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        [
          'px-4 h-9 inline-flex items-center rounded-lg text-sm font-medium transition-colors',
          isActive ? 'bg-info-tint text-info' : 'text-ink-soft hover:bg-page hover:text-ink',
        ].join(' ')
      }
    >
      {label}
    </NavLink>
  );
}

export default function TopNav() {
  const navigate = useNavigate();
  const hospital = useAuthStore((s) => s.hospital);
  const logout = useAuthStore((s) => s.logout);
  const isLive = useRealtimeStore((s) => s.isLive);
  const [muted, setMutedState] = useState(isMuted());

  const toggleMute = () => {
    const next = !muted;
    setMuted(next);
    setMutedState(next);
  };

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <header className="h-14 bg-card border-b border-line sticky top-0 z-40">
      <div className="h-full px-4 flex items-center gap-4">
        {/* Identity */}
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="w-7 h-7 rounded-lg bg-critical text-white grid place-items-center text-xs font-bold shrink-0">
            R
          </span>
          <div className="min-w-0">
            <div className="text-sm font-semibold leading-tight">ResQPK</div>
            <div className="text-[11px] text-ink-muted truncate leading-tight max-w-[180px]">
              {hospital?.name || 'Hospital'}
            </div>
          </div>
        </div>

        {/* Primary tabs */}
        <nav className="flex items-center gap-1 mx-auto">
          {TABS.map((t) => (
            <TabLink key={t.to} {...t} />
          ))}
        </nav>

        {/* Utilities */}
        <div className="flex items-center gap-1 shrink-0">
          <span
            className={[
              'hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium',
              isLive ? 'bg-ready-tint text-ready' : 'bg-critical-tint text-critical',
            ].join(' ')}
            title={isLive ? 'Live connection active' : 'Reconnecting…'}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${isLive ? 'bg-ready animate-pulse' : 'bg-critical'}`}
            />
            {isLive ? 'Live' : 'Offline'}
          </span>

          <button
            onClick={toggleMute}
            title={muted ? 'Alerts muted — click to unmute' : 'Alert sounds on'}
            className="w-9 h-9 grid place-items-center rounded-lg text-ink-muted hover:bg-page hover:text-ink transition-colors"
          >
            {muted ? <VolumeX size={17} /> : <Volume2 size={17} />}
          </button>

          <NotificationBell />

          <NavLink
            to="/analytics"
            title="Analytics"
            className={({ isActive }) =>
              [
                'w-9 h-9 grid place-items-center rounded-lg transition-colors',
                isActive ? 'bg-info-tint text-info' : 'text-ink-muted hover:bg-page hover:text-ink',
              ].join(' ')
            }
          >
            <BarChart3 size={17} />
          </NavLink>

          <button
            onClick={handleLogout}
            title="Sign out"
            className="w-9 h-9 grid place-items-center rounded-lg text-ink-muted hover:bg-critical-tint hover:text-critical transition-colors"
          >
            <LogOut size={17} />
          </button>
        </div>
      </div>
    </header>
  );
}

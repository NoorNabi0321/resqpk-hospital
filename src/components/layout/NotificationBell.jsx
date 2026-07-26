import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell } from 'lucide-react';

import useNotificationStore from '../../stores/notificationStore';
import useNow from '../../hooks/useNow';
import { tone as toneStyle } from '../../lib/tones';

// "just now" / "4m ago" / "2h ago" / clock time beyond a day.
function timeAgo(at, now) {
  const secs = Math.max(0, Math.floor((now - at) / 1000));
  if (secs < 45) return 'just now';
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return new Date(at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function NotificationBell() {
  const navigate = useNavigate();
  const items = useNotificationStore((s) => s.items);
  const panelOpen = useNotificationStore((s) => s.panelOpen);
  const togglePanel = useNotificationStore((s) => s.togglePanel);
  const closePanel = useNotificationStore((s) => s.closePanel);
  const clear = useNotificationStore((s) => s.clear);
  const wrapRef = useRef(null);

  // Refresh the relative timestamps while the panel is open.
  const now = useNow(panelOpen ? 30000 : 600000);
  const unread = items.filter((i) => !i.read).length;

  // Click-away and Escape both dismiss.
  useEffect(() => {
    if (!panelOpen) return undefined;
    const onDown = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) closePanel();
    };
    const onKey = (e) => e.key === 'Escape' && closePanel();
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [panelOpen, closePanel]);

  return (
    <div ref={wrapRef} className="relative">
      <button
        onClick={togglePanel}
        title="Notifications"
        className={[
          'w-9 h-9 grid place-items-center rounded-lg transition-colors relative',
          panelOpen ? 'bg-info-tint text-info' : 'text-ink-muted hover:bg-page hover:text-ink',
        ].join(' ')}
      >
        <Bell size={17} />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-critical text-white text-[10px] font-bold grid place-items-center">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {panelOpen && (
        <div className="absolute right-0 top-11 w-[340px] bg-card border border-line rounded-card shadow-card-hover z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-line">
            <span className="text-sm font-semibold">Notifications</span>
            {items.length > 0 && (
              <button onClick={clear} className="text-[11px] text-ink-muted hover:text-ink">
                Clear all
              </button>
            )}
          </div>

          <div className="max-h-[360px] overflow-y-auto">
            {items.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-ink-muted">
                No notifications yet.
              </p>
            ) : (
              items.map((n) => {
                const { edge: color, tint, Icon } = toneStyle(n.tone);
                const clickable = !!n.caseId;
                return (
                  <button
                    key={n.id}
                    disabled={!clickable}
                    onClick={() => {
                      if (!clickable) return;
                      closePanel();
                      navigate(`/case/${n.caseId}`);
                    }}
                    className={[
                      'w-full text-left flex items-start gap-3 px-4 py-3 border-b border-line last:border-0',
                      clickable ? 'hover:bg-page cursor-pointer' : 'cursor-default',
                    ].join(' ')}
                  >
                    <span
                      className="w-7 h-7 rounded-lg grid place-items-center shrink-0 mt-0.5"
                      style={{ background: tint, color }}
                    >
                      <Icon size={14} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium leading-snug">{n.title}</span>
                      {n.body && (
                        <span className="block text-xs text-ink-muted mt-0.5 leading-snug">
                          {n.body}
                        </span>
                      )}
                      <span className="block text-[11px] text-ink-faint mt-1">
                        {timeAgo(n.at, now)}
                      </span>
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

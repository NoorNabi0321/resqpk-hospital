import { useEffect, useState } from 'react';
import { AnimatePresence } from 'framer-motion';

import LiveMapPanel from '../components/dashboard/LiveMapPanel';
import CaseFeed from '../components/dashboard/CaseFeed';
import CaseDetailPanel from '../components/dashboard/CaseDetailPanel';
import StatsRow from '../components/dashboard/StatsRow';
import BedManager from '../components/dashboard/BedManager';
import useRealtimeStore from '../stores/realtimeStore';
import useAuthStore from '../stores/authStore';

function lastUpdatedLabel(lastEventAt, now) {
  if (!lastEventAt) return 'Awaiting updates';
  const secs = Math.max(0, Math.floor((now - lastEventAt) / 1000));
  if (secs < 5) return 'Updated just now';
  if (secs < 60) return `Updated ${secs}s ago`;
  return `Updated ${Math.floor(secs / 60)}m ago`;
}

// Module 5 D5: full dashboard — map (left, full height) + active-case feed
// (top-right) + animated stats row (bottom-right) + sliding detail panel.
export default function DashboardView() {
  const activeCases = useRealtimeStore((s) => s.activeCases);
  const driverPositions = useRealtimeStore((s) => s.driverPositions);
  const lastEventAt = useRealtimeStore((s) => s.lastEventAt);
  const hospital = useAuthStore((s) => s.hospital);
  const [selectedCaseId, setSelectedCaseId] = useState(null);
  const [bedManagerOpen, setBedManagerOpen] = useState(false);
  const [now, setNow] = useState(Date.now());

  // Tick once a second so the "Updated Xago" label stays fresh.
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <div
      className="grid gap-4 p-4 overflow-hidden h-[calc(100vh-56px)]"
      style={{ gridTemplateColumns: '40% 1fr', gridTemplateRows: '1fr auto' }}
    >
      {/* Left: live map, spans both rows */}
      <div
        className="rounded-2xl overflow-hidden border border-gray-200 min-h-0"
        style={{ gridRow: '1 / 3' }}
      >
        <LiveMapPanel
          activeCases={activeCases}
          hospitalLat={hospital?.lat != null ? Number(hospital.lat) : undefined}
          hospitalLng={hospital?.lng != null ? Number(hospital.lng) : undefined}
          driverPositions={driverPositions}
          onCaseClick={setSelectedCaseId}
        />
      </div>

      {/* Top-right: active case feed */}
      <div className="min-h-0 flex flex-col" style={{ gridColumn: 2, gridRow: 1 }}>
        <div className="flex items-center justify-between px-1 pb-3 shrink-0">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-gray-900">Active Cases</h2>
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-emergency-red/10 text-emergency-red">
              {activeCases.length}
            </span>
          </div>
          <span className="text-xs text-gray-400">{lastUpdatedLabel(lastEventAt, now)}</span>
        </div>
        <div className="flex-1 min-h-0">
          <CaseFeed
            cases={activeCases}
            onCaseSelect={setSelectedCaseId}
            selectedCaseId={selectedCaseId}
            showHeader={false}
          />
        </div>
      </div>

      {/* Bottom-right: stats row */}
      <div style={{ gridColumn: 2, gridRow: 2 }}>
        <StatsRow onManageBeds={() => setBedManagerOpen(true)} />
      </div>

      <CaseDetailPanel
        selectedCaseId={selectedCaseId}
        onClose={() => setSelectedCaseId(null)}
      />

      <AnimatePresence>
        {bedManagerOpen && <BedManager onClose={() => setBedManagerOpen(false)} />}
      </AnimatePresence>
    </div>
  );
}

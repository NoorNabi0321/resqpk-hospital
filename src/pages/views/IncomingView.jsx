import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence } from 'framer-motion';

import useRealtimeStore from '../../stores/realtimeStore';
import useNow from '../../hooks/useNow';
import { normalizeCase, liveEtaSeconds } from '../../lib/utils';
import { flashTabTitle } from '../../lib/alerts';
import AmbulanceCard from '../../components/incoming/AmbulanceCard';

// How long an arrived ambulance stays on screen before moving to History.
const ARRIVED_LINGER_MS = 5 * 60 * 1000;

const URGENCY_RANK = { critical: 0, moderate: 1, low: 2, unknown: 3 };

export default function IncomingView() {
  const activeCases = useRealtimeStore((s) => s.activeCases);
  const etaByCase = useRealtimeStore((s) => s.etaByCase);
  const newReportCaseIds = useRealtimeStore((s) => s.newReportCaseIds);
  const removeCase = useRealtimeStore((s) => s.removeCase);
  const now = useNow(1000);

  // Cases that reached the gate: kept visible briefly, then dropped.
  const [arrivedAt, setArrivedAt] = useState({}); // { caseId: ms }
  const timers = useRef({});

  const cases = useMemo(
    () =>
      activeCases
        .map(normalizeCase)
        .filter((c) => !['completed', 'cancelled'].includes(c.status)),
    [activeCases],
  );

  // Start the linger countdown the moment a case reports 'arrived'.
  useEffect(() => {
    cases.forEach((c) => {
      if (c.status !== 'arrived' || arrivedAt[c.id]) return;
      setArrivedAt((prev) => ({ ...prev, [c.id]: Date.now() }));
      timers.current[c.id] = setTimeout(() => removeCase(c.id), ARRIVED_LINGER_MS);
    });
  }, [cases, arrivedAt, removeCase]);

  useEffect(() => {
    const running = timers.current;
    return () => Object.values(running).forEach(clearTimeout);
  }, []);

  // Soonest ETA first; on a tie the more urgent case wins.
  const sorted = useMemo(() => {
    const etaFor = (c) => liveEtaSeconds(etaByCase[c.id], now) ?? c.etaSeconds ?? Infinity;
    return [...cases].sort((a, b) => {
      const diff = etaFor(a) - etaFor(b);
      if (diff !== 0) return diff;
      return (URGENCY_RANK[a.urgency] ?? 3) - (URGENCY_RANK[b.urgency] ?? 3);
    });
  }, [cases, etaByCase, now]);

  // Keep the tab title in sync with the queue length.
  useEffect(() => {
    flashTabTitle(sorted.length);
  }, [sorted.length]);

  return (
    <div className="max-w-[860px] mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-semibold">
          Incoming Ambulances <span className="text-ink-muted font-normal">({sorted.length})</span>
        </h1>
      </div>

      {sorted.length === 0 ? (
        <div className="v2-card p-12 text-center">
          <p className="text-ink-muted">
            No incoming ambulances. New cases will appear here instantly.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <AnimatePresence initial={false}>
            {sorted.map((c) => (
              <AmbulanceCard
                key={c.id}
                c={c}
                etaSeconds={liveEtaSeconds(etaByCase[c.id], now) ?? c.etaSeconds ?? null}
                isNewReport={newReportCaseIds.includes(c.id)}
                hasArrived={c.status === 'arrived'}
              />
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

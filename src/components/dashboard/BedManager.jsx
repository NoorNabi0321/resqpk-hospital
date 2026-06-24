import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Loader2, Minus, Plus, X } from 'lucide-react';

import { getSocket } from '../../realtime/socketClient';
import apiClient from '../../api/client';
import useRealtimeStore from '../../stores/realtimeStore';

const BED_TYPES = ['general', 'icu', 'trauma', 'pediatric', 'maternity'];

function initialFromStore(beds) {
  const byType = Object.fromEntries(beds.map((b) => [b.bed_type, b]));
  const state = {};
  for (const t of BED_TYPES) {
    const b = byType[t];
    state[t] = {
      available: Number(b?.available_count ?? 0),
      reserved: Number(b?.reserved_count ?? 0),
      total: Number(b?.total_count ?? 0),
    };
  }
  return state;
}

function Stepper({ value, onDec, onInc }) {
  return (
    <div className="flex items-center gap-1">
      <button
        onClick={onDec}
        className="w-6 h-6 rounded-md bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600"
      >
        <Minus size={13} />
      </button>
      <span className="w-7 text-center text-sm font-semibold tabular-nums">{value}</span>
      <button
        onClick={onInc}
        className="w-6 h-6 rounded-md bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600"
      >
        <Plus size={13} />
      </button>
    </div>
  );
}

export default function BedManager({ onClose }) {
  const beds = useRealtimeStore((s) => s.beds);
  const [rows, setRows] = useState(() => initialFromStore(beds));
  const [status, setStatus] = useState({}); // type -> 'saving' | 'saved'
  const timers = useRef({});

  const persist = (type, next) => {
    setStatus((s) => ({ ...s, [type]: 'saving' }));
    clearTimeout(timers.current[type]);
    timers.current[type] = setTimeout(() => {
      const payload = {
        bedType: type,
        availableCount: next.available,
        reservedCount: next.reserved,
      };
      const done = (ok) => {
        setStatus((s) => ({ ...s, [type]: ok ? 'saved' : 'idle' }));
        if (ok) setTimeout(() => setStatus((s) => ({ ...s, [type]: 'idle' })), 1500);
      };
      const socket = getSocket();
      if (socket && socket.connected) {
        socket.emit('hospital:bed_status_changed', payload, (res) => done(res?.success));
      } else {
        // REST fallback if the socket is unavailable.
        apiClient
          .put('/api/cases/beds', payload)
          .then(() => done(true))
          .catch(() => done(false));
      }
    }, 800);
  };

  const change = (type, field, delta) => {
    setRows((prev) => {
      const r = { ...prev[type] };
      let val = Math.max(0, r[field] + delta);
      if (r.total > 0) {
        const other = field === 'available' ? r.reserved : r.available;
        val = Math.max(0, Math.min(val, r.total - other));
      }
      r[field] = val;
      const next = { ...prev, [type]: r };
      persist(type, r);
      return next;
    });
  };

  const saveAll = () => BED_TYPES.forEach((t) => persist(t, rows[t]));

  return (
    <motion.div
      initial={{ y: 24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 24, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 320, damping: 30 }}
      className="fixed bottom-4 right-4 z-50 w-[460px] glass rounded-2xl shadow-xl p-4"
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-900">Manage Beds</h3>
        <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 text-gray-500">
          <X size={16} />
        </button>
      </div>

      <div className="grid grid-cols-[80px_1fr_1fr_56px_28px] gap-2 items-center text-[10px] font-semibold uppercase tracking-wide text-gray-400 px-1 pb-1">
        <span>Type</span>
        <span className="text-center">Available</span>
        <span className="text-center">Reserved</span>
        <span className="text-right">Total</span>
        <span />
      </div>

      <div className="space-y-1">
        {BED_TYPES.map((type) => {
          const r = rows[type];
          const dot =
            r.available === 0 ? 'bg-emergency-red' : r.available > 3 ? 'bg-emergency-green' : 'bg-emergency-amber';
          const st = status[type];
          return (
            <div
              key={type}
              className="grid grid-cols-[80px_1fr_1fr_56px_28px] gap-2 items-center py-1.5 border-t border-gray-100"
            >
              <span className="flex items-center gap-1.5 text-sm font-medium capitalize text-gray-800">
                <span className={`w-2 h-2 rounded-full ${dot}`} />
                {type}
              </span>
              <div className="flex justify-center">
                <Stepper
                  value={r.available}
                  onDec={() => change(type, 'available', -1)}
                  onInc={() => change(type, 'available', 1)}
                />
              </div>
              <div className="flex justify-center">
                <Stepper
                  value={r.reserved}
                  onDec={() => change(type, 'reserved', -1)}
                  onInc={() => change(type, 'reserved', 1)}
                />
              </div>
              <span className="text-right text-xs text-gray-400">{r.total}</span>
              <span className="flex justify-center">
                {st === 'saving' && <Loader2 size={14} className="text-gray-400 animate-spin" />}
                {st === 'saved' && <Check size={14} className="text-emergency-green" />}
              </span>
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-100">
        <span className="text-[11px] text-gray-400">
          {Object.values(status).includes('saving') ? 'Saving…' : 'Changes save automatically'}
        </span>
        <button
          onClick={saveAll}
          className="text-sm font-medium px-3 py-1.5 rounded-lg bg-emergency-green/10 text-emergency-green hover:bg-emergency-green/20"
        >
          Save All
        </button>
      </div>
    </motion.div>
  );
}

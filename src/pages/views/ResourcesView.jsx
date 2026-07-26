import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Check, Loader2, Minus, Plus } from 'lucide-react';
import toast from 'react-hot-toast';

import apiClient from '../../api/client';
import { getResources, updateResource } from '../../api/v2';
import { getSocket } from '../../realtime/socketClient';
import useRealtimeStore from '../../stores/realtimeStore';

const BED_TYPES = ['general', 'icu', 'trauma', 'pediatric', 'maternity'];
const BED_LABELS = {
  general: 'General',
  icu: 'ICU',
  trauma: 'Trauma',
  pediatric: 'Pediatric',
  maternity: 'Maternity',
};

// Specialists read better as duty states than as stock levels.
const STATUS_OPTIONS = {
  default: [
    { value: 'available', label: 'Available' },
    { value: 'limited', label: 'Limited' },
    { value: 'unavailable', label: 'Down' },
  ],
  specialist: [
    { value: 'available', label: 'On duty' },
    { value: 'limited', label: 'Limited' },
    { value: 'unavailable', label: 'Off duty' },
  ],
};

const STATUS_STYLE = {
  available: 'bg-ready text-white',
  limited: 'bg-decision text-white',
  unavailable: 'bg-critical text-white',
};

function Stepper({ value, onDec, onInc }) {
  return (
    <div className="flex items-center gap-1">
      <button
        onClick={onDec}
        className="w-6 h-6 rounded-md bg-gray-100 hover:bg-gray-200 grid place-items-center text-ink-soft"
      >
        <Minus size={13} />
      </button>
      <span className="w-7 text-center text-sm font-semibold tabular-nums">{value}</span>
      <button
        onClick={onInc}
        className="w-6 h-6 rounded-md bg-gray-100 hover:bg-gray-200 grid place-items-center text-ink-soft"
      >
        <Plus size={13} />
      </button>
    </div>
  );
}

function SavedTick({ state }) {
  if (state === 'saving') return <Loader2 size={13} className="animate-spin text-ink-faint" />;
  if (state === 'saved') return <Check size={13} className="text-ready" />;
  return <span className="w-3.5" />;
}

// --- Beds (moved here from the v1 dashboard widget) --------------------------

function buildBedRows(beds) {
  const byType = Object.fromEntries(beds.map((b) => [b.bed_type, b]));
  return Object.fromEntries(
    BED_TYPES.map((t) => [
      t,
      {
        available: Number(byType[t]?.available_count ?? 0),
        reserved: Number(byType[t]?.reserved_count ?? 0),
        total: Number(byType[t]?.total_count ?? 0),
        exists: !!byType[t],
      },
    ]),
  );
}

function BedsSection() {
  const beds = useRealtimeStore((s) => s.beds);
  const [rows, setRows] = useState(() => buildBedRows(beds));
  const [status, setStatus] = useState({});
  const timers = useRef({});

  // Re-seed when the store's beds change (initial snapshot, or another screen
  // editing). Adjusted during render rather than in an effect.
  const [syncedBeds, setSyncedBeds] = useState(beds);
  if (syncedBeds !== beds) {
    setSyncedBeds(beds);
    setRows(buildBedRows(beds));
  }

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
        else toast.error(`Could not save ${BED_LABELS[type]} beds`);
      };
      const socket = getSocket();
      if (socket?.connected) {
        socket.emit('hospital:bed_status_changed', payload, (res) => done(res?.success));
      } else {
        apiClient
          .put('/api/cases/beds', payload)
          .then(() => done(true))
          .catch(() => done(false));
      }
    }, 600);
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
      persist(type, r);
      return { ...prev, [type]: r };
    });
  };

  const present = BED_TYPES.filter((t) => rows[t]?.exists);
  const list = present.length > 0 ? present : BED_TYPES;

  return (
    <section className="v2-card p-5">
      <h2 className="font-semibold mb-4">Beds</h2>
      <div className="grid grid-cols-[110px_1fr_1fr_64px_20px] gap-3 items-center text-[10px] font-semibold uppercase tracking-wide text-ink-faint pb-2">
        <span>Type</span>
        <span className="text-center">Available</span>
        <span className="text-center">Reserved</span>
        <span className="text-right">Total</span>
        <span />
      </div>
      <div className="flex flex-col gap-2.5">
        {list.map((t) => (
          <div key={t} className="grid grid-cols-[110px_1fr_1fr_64px_20px] gap-3 items-center">
            <span className="text-sm font-medium">{BED_LABELS[t]}</span>
            <div className="flex justify-center">
              <Stepper
                value={rows[t]?.available ?? 0}
                onDec={() => change(t, 'available', -1)}
                onInc={() => change(t, 'available', 1)}
              />
            </div>
            <div className="flex justify-center">
              <Stepper
                value={rows[t]?.reserved ?? 0}
                onDec={() => change(t, 'reserved', -1)}
                onInc={() => change(t, 'reserved', 1)}
              />
            </div>
            <span className="text-right text-sm text-ink-muted tabular-nums">
              {rows[t]?.total ?? 0}
            </span>
            <SavedTick state={status[t]} />
          </div>
        ))}
      </div>
    </section>
  );
}

// --- Equipment / specialists / services --------------------------------------

function ResourceRow({ row, group, onChanged }) {
  const [status, setStatus] = useState(row.status);
  const [quantity, setQuantity] = useState(row.quantity);
  const [saveState, setSaveState] = useState('idle');
  const timer = useRef(null);

  // Another receptionist may have changed this row on their screen. Adjust
  // during render (React's documented pattern for "state derived from a prop
  // that can also change locally") rather than in an effect, which would
  // render once with stale values first.
  const [syncedFrom, setSyncedFrom] = useState({
    status: row.status,
    quantity: row.quantity,
  });
  if (syncedFrom.status !== row.status || syncedFrom.quantity !== row.quantity) {
    setSyncedFrom({ status: row.status, quantity: row.quantity });
    setStatus(row.status);
    setQuantity(row.quantity);
  }

  const options = STATUS_OPTIONS[group === 'specialist' ? 'specialist' : 'default'];

  // Optimistic: the control moves now, the request catches up.
  const persist = (next) => {
    setSaveState('saving');
    clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      try {
        await updateResource(row.canonical_key, next);
        setSaveState('saved');
        setTimeout(() => setSaveState('idle'), 1500);
        onChanged?.();
      } catch (err) {
        setSaveState('idle');
        setStatus(row.status);
        setQuantity(row.quantity);
        toast.error(err.response?.data?.message || `Could not update ${row.resource_name}`);
      }
    }, 600);
  };

  const pickStatus = (value) => {
    setStatus(value);
    persist({ status: value, quantity });
  };

  const changeQuantity = (delta) => {
    const next = Math.max(0, Number(quantity ?? 0) + delta);
    setQuantity(next);
    persist({ status, quantity: next });
  };

  return (
    <div className="flex items-center gap-3 py-2 border-b border-line last:border-0">
      <span className="flex-1 text-sm font-medium">{row.resource_name}</span>

      {row.quantity != null && (
        <Stepper
          value={quantity ?? 0}
          onDec={() => changeQuantity(-1)}
          onInc={() => changeQuantity(1)}
        />
      )}

      <div className="flex rounded-lg border border-line overflow-hidden">
        {options.map((opt) => (
          <button
            key={opt.value}
            onClick={() => pickStatus(opt.value)}
            className={[
              'px-2.5 h-8 text-[11px] font-medium transition',
              status === opt.value
                ? STATUS_STYLE[opt.value]
                : 'bg-white text-ink-muted hover:bg-page',
            ].join(' ')}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <SavedTick state={saveState} />
    </div>
  );
}

function ResourceGroup({ title, rows, group, onChanged }) {
  if (!rows?.length) return null;
  return (
    <section className="v2-card p-5">
      <h2 className="font-semibold mb-2">{title}</h2>
      <div className="flex flex-col">
        {rows.map((r) => (
          <ResourceRow key={r.canonical_key} row={r} group={group} onChanged={onChanged} />
        ))}
      </div>
    </section>
  );
}

export default function ResourcesView() {
  const setResources = useRealtimeStore((s) => s.setResources);
  const storeResources = useRealtimeStore((s) => s.resources);
  const lastEventAt = useRealtimeStore((s) => s.lastEventAt);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['resources'],
    queryFn: getResources,
  });

  // Mirror into the store so socket patches from another screen land here too.
  useEffect(() => {
    if (data) setResources(data);
  }, [data, setResources]);

  const resources = storeResources || data;

  if (isLoading) {
    return (
      <div className="max-w-[860px] mx-auto h-48 grid place-items-center text-ink-muted">
        <div className="flex items-center gap-2 text-sm">
          <Loader2 size={16} className="animate-spin" /> Loading resources…
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="max-w-[860px] mx-auto v2-card p-8 text-center text-ink-muted">
        Could not load resources.
      </div>
    );
  }

  return (
    <div className="max-w-[860px] mx-auto flex flex-col gap-4">
      <h1 className="text-lg font-semibold">Resources</h1>

      <BedsSection />
      <ResourceGroup
        title="Equipment"
        rows={resources?.equipment}
        group="equipment"
        onChanged={refetch}
      />
      <ResourceGroup
        title="Specialists"
        rows={resources?.specialist}
        group="specialist"
        onChanged={refetch}
      />
      <ResourceGroup title="Services" rows={resources?.service} group="service" onChanged={refetch} />

      <p className="text-xs text-ink-faint text-center pb-4">
        Changes save automatically
        {lastEventAt ? ` · last update ${new Date(lastEventAt).toLocaleTimeString()}` : ''}
      </p>
    </div>
  );
}

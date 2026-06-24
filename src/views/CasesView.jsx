import { useMemo, useState } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { ChevronRight, Search } from 'lucide-react';

import apiClient from '../api/client';
import StatusBadge from '../components/ui/StatusBadge';
import CaseDetailPanel from '../components/dashboard/CaseDetailPanel';
import { normalizeCase, formatDuration, formatTime, getStatusLabel } from '../lib/utils';

const PAGE_SIZE = 20;

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'Active' },
  { key: 'en_route', label: 'En Route' },
  { key: 'completed', label: 'Completed' },
  { key: 'cancelled', label: 'Cancelled' },
];

function todayInPKT() {
  // Pakistan is UTC+5 — shift now into PKT before slicing the date.
  return new Date(Date.now() + 5 * 3600 * 1000).toISOString().slice(0, 10);
}

export default function CasesView() {
  const [status, setStatus] = useState('all');
  const [date, setDate] = useState(todayInPKT());
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0); // zero-based
  const [selected, setSelected] = useState(null); // raw case object

  const { data, isLoading, isError } = useQuery({
    queryKey: ['cases', date, status, page],
    queryFn: async () => {
      const res = await apiClient.get('/api/cases', {
        params: { date, status, limit: PAGE_SIZE, offset: page * PAGE_SIZE },
      });
      return res.data.data;
    },
    refetchInterval: 30000,
    placeholderData: keepPreviousData,
  });

  const rows = useMemo(() => (data?.cases ?? []).map(normalizeCase), [data]);
  const total = data?.total ?? 0;

  // Search filters the current page by case number or patient name.
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (c) =>
        (c.caseNumber ?? '').toLowerCase().includes(q) ||
        (c.patientName ?? '').toLowerCase().includes(q),
    );
  }, [rows, search]);

  const from = total === 0 ? 0 : page * PAGE_SIZE + 1;
  const to = Math.min(page * PAGE_SIZE + rows.length, total);
  const hasPrev = page > 0;
  const hasNext = (page + 1) * PAGE_SIZE < total;

  const changeStatus = (s) => {
    setStatus(s);
    setPage(0);
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h1 className="text-xl font-bold text-gray-900">All Cases</h1>
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={date}
            max={todayInPKT()}
            onChange={(e) => {
              setDate(e.target.value);
              setPage(0);
            }}
            className="text-sm border border-gray-200 rounded-lg px-2.5 py-1.5 text-gray-700"
          />
          <div className="relative">
            <Search size={15} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search case # or name"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="text-sm border border-gray-200 rounded-lg pl-8 pr-3 py-1.5 w-56"
            />
          </div>
        </div>
      </div>

      {/* Filter pills */}
      <div className="flex flex-wrap gap-2 mb-4">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => changeStatus(f.key)}
            className={`text-sm px-3.5 py-1.5 rounded-full transition-colors ${
              status === f.key
                ? 'bg-emergency-red text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-gray-200 overflow-hidden bg-white">
        {/* Column header */}
        <div className="grid grid-cols-[110px_1.5fr_110px_1fr_1fr_120px_44px] gap-3 px-4 py-2.5 bg-gray-50 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
          <span>Case #</span>
          <span>Patient</span>
          <span>Urgency</span>
          <span>Status</span>
          <span>Driver</span>
          <span>ETA / Time</span>
          <span />
        </div>

        {isLoading ? (
          <p className="text-sm text-gray-400 text-center py-10">Loading cases…</p>
        ) : isError ? (
          <p className="text-sm text-emergency-red text-center py-10">Failed to load cases.</p>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-10">No cases match.</p>
        ) : (
          filtered.map((c) => {
            const raw = (data?.cases ?? []).find((x) => (x.id ?? x.caseId) === c.id);
            const completed = c.status === 'completed';
            return (
              <div
                key={c.id}
                onClick={() => setSelected(raw)}
                className="grid grid-cols-[110px_1.5fr_110px_1fr_1fr_120px_44px] gap-3 px-4 py-3 items-center border-t border-gray-100 cursor-pointer transition-all duration-[120ms] border-l-2 border-l-transparent hover:bg-gray-50 hover:border-l-emergency-red"
              >
                <span className="font-mono text-xs text-gray-400">{c.caseNumber}</span>
                <span className="flex items-center gap-2 min-w-0">
                  <span className="font-medium text-[14px] text-gray-900 truncate">
                    {c.patientName}
                  </span>
                  {(c.gender || c.age != null) && (
                    <span className="shrink-0 text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500">
                      {[c.gender?.[0]?.toUpperCase(), c.age != null ? `${c.age}` : null]
                        .filter(Boolean)
                        .join(' · ')}
                    </span>
                  )}
                </span>
                <span>
                  <StatusBadge level={c.urgency} />
                </span>
                <span className="text-[13px] text-gray-600">{getStatusLabel(c.status)}</span>
                <span className="text-[13px] text-gray-600 truncate">{c.driverName ?? '—'}</span>
                <span className="text-[13px] text-gray-600">
                  {completed
                    ? `Completed ${formatTime(c.driverArrivedAt ?? c.sosTriggeredAt)}`
                    : formatDuration(c.etaSeconds)}
                </span>
                <span className="flex justify-end text-gray-300">
                  <ChevronRight size={18} />
                </span>
              </div>
            );
          })
        )}
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between mt-4 text-sm text-gray-500">
        <span>
          {total === 0 ? 'No cases' : `Showing ${from}–${to} of ${total} cases`}
        </span>
        <div className="flex gap-2">
          <button
            disabled={!hasPrev}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            className="px-3 py-1.5 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50"
          >
            Previous
          </button>
          <button
            disabled={!hasNext}
            onClick={() => setPage((p) => p + 1)}
            className="px-3 py-1.5 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50"
          >
            Next
          </button>
        </div>
      </div>

      <CaseDetailPanel
        selectedCaseId={selected ? (selected.id ?? selected.caseId) : null}
        caseData={selected}
        onClose={() => setSelected(null)}
      />
    </div>
  );
}

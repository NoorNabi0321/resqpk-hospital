import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, FileDown, Search } from 'lucide-react';

import apiClient from '../../api/client';
import { normalizeCase, formatTime, getStatusLabel } from '../../lib/utils';

const PAGE_SIZE = 20;

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'completed', label: 'Completed' },
  { key: 'cancelled', label: 'Cancelled' },
  { key: 'active', label: 'Active' },
];

function todayInPKT() {
  return new Date(Date.now() + 5 * 3600 * 1000).toISOString().slice(0, 10);
}

function DecisionCell({ c }) {
  if (c.decision === 'accepted') {
    return (
      <span className="text-ready font-medium">
        Accepted{c.preparationNote ? ` · ${c.preparationNote}` : ''}
      </span>
    );
  }
  if (c.decision === 'redirected') {
    return (
      <span className="text-ink-muted">
        Redirected{c.redirectReason ? ` · ${c.redirectReason}` : ''}
      </span>
    );
  }
  return <span className="text-ink-faint">—</span>;
}

export default function HistoryView() {
  const navigate = useNavigate();
  const [status, setStatus] = useState('all');
  const [date, setDate] = useState(todayInPKT());
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['history', date, status, page],
    queryFn: async () => {
      const res = await apiClient.get('/api/cases', {
        params: { date, status, limit: PAGE_SIZE, offset: page * PAGE_SIZE },
      });
      return res.data.data;
    },
    placeholderData: keepPreviousData,
  });

  const rows = useMemo(() => (data?.cases ?? []).map(normalizeCase), [data]);
  const total = data?.total ?? 0;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (r) =>
        r.caseNumber?.toLowerCase().includes(q) || r.patientName?.toLowerCase().includes(q),
    );
  }, [rows, search]);

  return (
    <div className="max-w-[1100px] mx-auto">
      <h1 className="text-lg font-semibold mb-4">History</h1>

      {/* Filters */}
      <div className="v2-card p-4 mb-4 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => {
                setStatus(f.key);
                setPage(0);
              }}
              className={[
                'px-3 h-8 rounded-lg text-xs font-medium transition',
                status === f.key ? 'bg-info-tint text-info' : 'text-ink-soft hover:bg-page',
              ].join(' ')}
            >
              {f.label}
            </button>
          ))}
        </div>

        <input
          type="date"
          value={date}
          onChange={(e) => {
            setDate(e.target.value);
            setPage(0);
          }}
          className="h-8 px-2.5 rounded-lg border border-line text-xs text-ink-soft"
        />

        <div className="relative ml-auto">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-faint" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Case number or patient"
            className="h-8 pl-8 pr-3 rounded-lg border border-line text-xs w-56"
          />
        </div>
      </div>

      {/* Table */}
      <div className="v2-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[10px] uppercase tracking-wide text-ink-faint border-b border-line">
                <th className="text-left font-semibold px-4 py-2.5">Case</th>
                <th className="text-left font-semibold px-4 py-2.5">Patient</th>
                <th className="text-left font-semibold px-4 py-2.5">Urgency</th>
                <th className="text-left font-semibold px-4 py-2.5">Status</th>
                <th className="text-left font-semibold px-4 py-2.5">Decision</th>
                <th className="text-left font-semibold px-4 py-2.5">Report</th>
                <th className="text-left font-semibold px-4 py-2.5">Time</th>
                <th className="w-8" />
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-ink-muted">
                    Loading…
                  </td>
                </tr>
              ) : isError ? (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-ink-muted">
                    Could not load cases.
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-ink-muted">
                    No cases for this day.
                  </td>
                </tr>
              ) : (
                filtered.map((c) => (
                  <tr
                    key={c.id}
                    onClick={() => navigate(`/case/${c.id}`)}
                    className="border-b border-line last:border-0 hover:bg-page cursor-pointer"
                  >
                    <td className="px-4 py-3 font-medium">{c.caseNumber}</td>
                    <td className="px-4 py-3">{c.patientName}</td>
                    <td className="px-4 py-3">
                      <span
                        className={[
                          'px-2 py-0.5 rounded text-[11px] font-medium',
                          c.urgency === 'critical'
                            ? 'bg-critical-tint text-critical'
                            : c.urgency === 'moderate'
                              ? 'bg-decision-tint text-decision'
                              : c.urgency === 'low'
                                ? 'bg-ready-tint text-ready'
                                : 'bg-gray-100 text-ink-muted',
                        ].join(' ')}
                      >
                        {c.urgency}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-ink-soft">{getStatusLabel(c.status)}</td>
                    <td className="px-4 py-3 text-xs">
                      <DecisionCell c={c} />
                    </td>
                    <td className="px-4 py-3">
                      {c.hasAiReport ? (
                        <span className="inline-flex items-center gap-1 text-info text-xs">
                          <FileDown size={13} /> PDF
                        </span>
                      ) : (
                        <span className="text-ink-faint text-xs">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-ink-muted text-xs">
                      {formatTime(c.sosTriggeredAt)}
                    </td>
                    <td className="px-2">
                      <ChevronRight size={15} className="text-ink-faint" />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {total > PAGE_SIZE && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-line text-xs text-ink-muted">
            <span>
              Page {page + 1} of {pages} · {total} cases
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="w-8 h-8 grid place-items-center rounded-lg hover:bg-page disabled:opacity-30"
              >
                <ChevronLeft size={15} />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(pages - 1, p + 1))}
                disabled={page >= pages - 1}
                className="w-8 h-8 grid place-items-center rounded-lg hover:bg-page disabled:opacity-30"
              >
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

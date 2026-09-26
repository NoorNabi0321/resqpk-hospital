import { useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  AlertTriangle, Check, Download, Loader2, Pencil, Plus, Search, Trash2, UserPlus, X,
} from 'lucide-react';

import {
  createCampVisit, deleteCampVisit, getCampDashboard, getCampVisitSummary,
  listCampVisits, updateCampVisit,
} from '../../api/v2';
import apiClient from '../../api/client';

const GENDERS = [
  { value: 'female', label: 'Female' },
  { value: 'male', label: 'Male' },
  { value: 'other', label: 'Other' },
];

const EMPTY = {
  patientName: '', age: '', gender: '', phone: '',
  servicesGiven: [], bloodPressure: '', bloodSugar: '',
  findings: '', needsFollowup: false, followupNote: '',
};

const input =
  'w-full rounded-lg border border-line bg-card px-3 py-2 text-[14px] text-ink '
  + 'placeholder-ink-faint outline-none focus:border-brand focus:ring-2 focus:ring-brand/20';

function Stat({ label, value, tone = 'ink' }) {
  const tones = { ink: 'text-ink', brand: 'text-brand-ink', decision: 'text-decision' };
  return (
    <div className="v2-card p-4">
      <p className="text-xs text-ink-muted">{label}</p>
      <p className={`mt-1 text-[26px] font-bold tabular-nums leading-none ${tones[tone]}`}>{value}</p>
    </div>
  );
}

/**
 * The register. Built for a desk with a queue in front of it.
 *
 * The form stays open and clears itself after each save, focus returns to the
 * name box, and nothing is required except a name — a volunteer with twenty
 * people waiting will not fill in nine fields, and a record with only a name
 * is worth more than no record.
 */
function EntryForm({ services, onSaved }) {
  const [form, setForm] = useState(EMPTY);
  const nameRef = useRef(null);
  const queryClient = useQueryClient();

  const save = useMutation({
    mutationFn: (payload) => createCampVisit(payload),
    onSuccess: (saved) => {
      toast.success(`${saved.patientName} recorded`);
      setForm(EMPTY);
      nameRef.current?.focus();
      queryClient.invalidateQueries({ queryKey: ['camp-visits'] });
      queryClient.invalidateQueries({ queryKey: ['camp-visit-summary'] });
      onSaved?.();
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Could not save'),
  });

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const toggleService = (s) =>
    setForm((f) => ({
      ...f,
      servicesGiven: f.servicesGiven.includes(s)
        ? f.servicesGiven.filter((x) => x !== s)
        : [...f.servicesGiven, s],
    }));

  const submit = (e) => {
    e.preventDefault();
    if (!form.patientName.trim()) return toast.error('A name is required');
    save.mutate(form);
  };

  return (
    <form onSubmit={submit} className="v2-card p-5">
      <div className="mb-4 flex items-center gap-2">
        <UserPlus size={17} className="text-brand-ink" />
        <h2 className="text-[15px] font-semibold text-ink">Record a patient</h2>
      </div>

      <div className="grid gap-3 sm:grid-cols-[2fr_80px_1fr_1.4fr]">
        <input ref={nameRef} className={input} placeholder="Name" autoFocus
          value={form.patientName} onChange={set('patientName')} />
        <input className={input} placeholder="Age" type="number" min="0" max="130"
          value={form.age} onChange={set('age')} />
        <select className={input} value={form.gender} onChange={set('gender')}>
          <option value="">Gender</option>
          {GENDERS.map((g) => <option key={g.value} value={g.value}>{g.label}</option>)}
        </select>
        <input className={input} placeholder="Phone (optional)"
          value={form.phone} onChange={set('phone')} />
      </div>

      {services.length > 0 && (
        <div className="mt-3">
          <p className="mb-1.5 text-xs text-ink-muted">Services given</p>
          <div className="flex flex-wrap gap-1.5">
            {services.map((s) => {
              const on = form.servicesGiven.includes(s);
              return (
                <button key={s} type="button" onClick={() => toggleService(s)}
                  className={[
                    'px-2.5 py-1 rounded-lg text-[12px] font-medium border transition',
                    on ? 'bg-ready-tint border-ready text-ready' : 'border-line text-ink-soft hover:bg-page',
                  ].join(' ')}>
                  {on && <Check size={11} className="mr-1 -mt-0.5 inline" />}{s}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_1fr_2fr]">
        {/* Free text, not parsed: "120/80", "14.2" and "high" are all things
            a volunteer writes, and refusing any of them loses the reading. */}
        <input className={input} placeholder="BP e.g. 120/80"
          value={form.bloodPressure} onChange={set('bloodPressure')} />
        <input className={input} placeholder="Sugar"
          value={form.bloodSugar} onChange={set('bloodSugar')} />
        <input className={input} placeholder="Findings / advice"
          value={form.findings} onChange={set('findings')} />
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <label className="inline-flex items-center gap-2 text-[13px] text-ink-soft">
          <input type="checkbox" checked={form.needsFollowup}
            onChange={(e) => setForm((f) => ({ ...f, needsFollowup: e.target.checked }))}
            className="h-4 w-4 accent-[#D97706]" />
          Needs follow-up
        </label>
        {form.needsFollowup && (
          <input className={`${input} flex-1 min-w-[200px]`} placeholder="Refer to…"
            value={form.followupNote} onChange={set('followupNote')} />
        )}
        <button type="submit" disabled={save.isPending}
          className="ml-auto inline-flex h-10 items-center gap-2 rounded-lg bg-brand-ink px-5 text-[14px] font-semibold text-white transition hover:brightness-95 disabled:opacity-60">
          {save.isPending ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />}
          Save
        </button>
      </div>
    </form>
  );
}

function EditRow({ visit, onDone }) {
  const [form, setForm] = useState({
    patientName: visit.patientName, age: visit.age ?? '', phone: visit.phone ?? '',
    findings: visit.findings ?? '', needsFollowup: visit.needsFollowup,
  });
  const queryClient = useQueryClient();
  const save = useMutation({
    mutationFn: (payload) => updateCampVisit(visit.id, payload),
    onSuccess: () => {
      toast.success('Updated');
      queryClient.invalidateQueries({ queryKey: ['camp-visits'] });
      queryClient.invalidateQueries({ queryKey: ['camp-visit-summary'] });
      onDone();
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Could not update'),
  });

  return (
    <tr className="bg-page">
      <td colSpan={7} className="px-4 py-3">
        <div className="flex flex-wrap items-center gap-2">
          <input className={`${input} w-44`} value={form.patientName}
            onChange={(e) => setForm((f) => ({ ...f, patientName: e.target.value }))} />
          <input className={`${input} w-20`} type="number" value={form.age}
            onChange={(e) => setForm((f) => ({ ...f, age: e.target.value }))} />
          <input className={`${input} w-40`} value={form.phone} placeholder="Phone"
            onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
          <input className={`${input} flex-1 min-w-[180px]`} value={form.findings} placeholder="Findings"
            onChange={(e) => setForm((f) => ({ ...f, findings: e.target.value }))} />
          <label className="inline-flex items-center gap-1.5 text-[12px] text-ink-soft">
            <input type="checkbox" checked={form.needsFollowup} className="h-4 w-4 accent-[#D97706]"
              onChange={(e) => setForm((f) => ({ ...f, needsFollowup: e.target.checked }))} />
            Follow-up
          </label>
          <button onClick={() => save.mutate(form)} disabled={save.isPending}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-ready px-3 text-[13px] font-semibold text-white">
            <Check size={14} /> Save
          </button>
          <button onClick={onDone}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-line px-3 text-[13px] text-ink-soft">
            <X size={14} /> Cancel
          </button>
        </div>
      </td>
    </tr>
  );
}

export default function CampPatientsView() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [followupOnly, setFollowupOnly] = useState(false);
  const [editing, setEditing] = useState(null);

  const campQuery = useQuery({ queryKey: ['camp-dashboard'], queryFn: getCampDashboard });
  const summaryQuery = useQuery({ queryKey: ['camp-visit-summary'], queryFn: getCampVisitSummary });
  const visitsQuery = useQuery({
    queryKey: ['camp-visits', { search, followupOnly }],
    queryFn: () => listCampVisits({ search: search || undefined, followupOnly: followupOnly || undefined }),
  });

  const services = campQuery.data?.camp?.servicesOffered || [];
  const summary = summaryQuery.data;
  const visits = visitsQuery.data?.visits || [];

  const remove = useMutation({
    mutationFn: (id) => deleteCampVisit(id),
    onSuccess: () => {
      toast.success('Record deleted');
      queryClient.invalidateQueries({ queryKey: ['camp-visits'] });
      queryClient.invalidateQueries({ queryKey: ['camp-visit-summary'] });
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Could not delete'),
  });

  const download = async () => {
    try {
      const res = await apiClient.get('/api/camp-visits/export.csv', { responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([res.data], { type: 'text/csv' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `camp-patients-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error('Export failed');
    }
  };

  const topServices = useMemo(
    () => (summary?.servicesToday || []).filter((s) => s.count > 0).slice(0, 6),
    [summary],
  );

  return (
    <div className="max-w-[1100px] mx-auto space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="Seen today" value={summary?.seenToday ?? '—'} tone="brand" />
        <Stat label="Seen in total" value={summary?.seenTotal ?? '—'} />
        <Stat label="Awaiting follow-up" value={summary?.awaitingFollowup ?? '—'} tone="decision" />
      </div>

      {topServices.length > 0 && (
        <div className="v2-card p-4">
          <p className="mb-2 text-xs text-ink-muted">Services given today</p>
          <div className="flex flex-wrap gap-1.5">
            {topServices.map((s) => (
              <span key={s.service}
                className="inline-flex items-center gap-1.5 rounded-lg bg-page px-2.5 py-1 text-[12px] text-ink-soft">
                {s.service}
                <span className="font-semibold tabular-nums text-ink">{s.count}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      <EntryForm services={services} />

      {/* The register itself -------------------------------------------- */}
      <div className="v2-card overflow-hidden">
        <div className="flex flex-wrap items-center gap-2.5 border-b border-line p-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" />
            <input className={`${input} pl-9`} placeholder="Search by name or phone"
              value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <button onClick={() => setFollowupOnly((v) => !v)}
            className={[
              'inline-flex h-10 items-center gap-1.5 rounded-lg border px-3 text-[13px] font-medium transition',
              followupOnly
                ? 'bg-decision-tint border-decision text-decision'
                : 'border-line text-ink-soft hover:bg-page',
            ].join(' ')}>
            <AlertTriangle size={14} /> Follow-ups
          </button>
          <button onClick={download}
            className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-line px-3 text-[13px] text-ink-soft hover:bg-page">
            <Download size={14} /> CSV
          </button>
        </div>

        {visitsQuery.isLoading ? (
          <div className="grid h-32 place-items-center text-ink-muted">
            <Loader2 size={18} className="animate-spin" />
          </div>
        ) : visits.length === 0 ? (
          <div className="grid h-32 place-items-center px-6 text-center text-sm text-ink-muted">
            {search || followupOnly
              ? 'Nothing matches that.'
              : 'No one recorded yet. The first patient you see goes in the form above.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-page text-ink-muted">
                <tr className="text-[11px] uppercase tracking-wide">
                  <th className="px-4 py-2.5 text-left font-semibold">Name</th>
                  <th className="px-4 py-2.5 text-left font-semibold">Age / sex</th>
                  <th className="px-4 py-2.5 text-left font-semibold">Phone</th>
                  <th className="px-4 py-2.5 text-left font-semibold">Services</th>
                  <th className="px-4 py-2.5 text-left font-semibold">Readings</th>
                  <th className="px-4 py-2.5 text-left font-semibold">Date</th>
                  <th className="px-4 py-2.5" />
                </tr>
              </thead>
              <tbody>
                {visits.map((v) => (
                  editing === v.id ? (
                    <EditRow key={v.id} visit={v} onDone={() => setEditing(null)} />
                  ) : (
                    <tr key={v.id} className="border-t border-line">
                      <td className="px-4 py-3">
                        <span className="font-medium text-ink">{v.patientName}</span>
                        {v.needsFollowup && (
                          <span className="ml-2 inline-flex items-center gap-1 rounded bg-decision-tint px-1.5 py-0.5 text-[10px] font-semibold text-decision">
                            <AlertTriangle size={9} /> Follow-up
                          </span>
                        )}
                        {v.findings && (
                          <p className="mt-0.5 text-[12px] text-ink-muted">{v.findings}</p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-ink-soft">
                        {v.age ?? '—'}{v.gender ? ` · ${v.gender[0].toUpperCase()}` : ''}
                      </td>
                      <td className="px-4 py-3 text-ink-soft tabular-nums">{v.phone || '—'}</td>
                      <td className="px-4 py-3 text-[12px] text-ink-soft">
                        {v.servicesGiven.length ? v.servicesGiven.join(', ') : '—'}
                      </td>
                      <td className="px-4 py-3 text-[12px] text-ink-soft">
                        {[v.bloodPressure && `BP ${v.bloodPressure}`, v.bloodSugar && `Sugar ${v.bloodSugar}`]
                          .filter(Boolean).join(' · ') || '—'}
                      </td>
                      <td className="px-4 py-3 text-[12px] text-ink-muted tabular-nums">{v.visitedOn}</td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          <button onClick={() => setEditing(v.id)} title="Edit"
                            className="rounded p-1.5 text-ink-faint hover:bg-page hover:text-ink-soft">
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm(`Delete the record for ${v.patientName}?`)) {
                                remove.mutate(v.id);
                              }
                            }}
                            title="Delete"
                            className="rounded p-1.5 text-ink-faint hover:bg-critical-tint hover:text-critical">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  CalendarDays, Check, Loader2, MapPin, Pencil, Phone, Plus, Smartphone, X,
} from 'lucide-react';

import { getCampDashboard, updateCampProfile } from '../../api/v2';
import LocationPicker from '../../components/auth/LocationPicker';

const input =
  'w-full rounded-lg border border-line bg-card px-3 py-2 text-[14px] text-ink '
  + 'placeholder-ink-faint outline-none focus:border-brand focus:ring-2 focus:ring-brand/20';

function Card({ children, className = '' }) {
  return <section className={`v2-card p-5 ${className}`}>{children}</section>;
}

/**
 * Whether patients can see this camp, and why not when they cannot.
 *
 * Three separate things have to be true and a camp that is invisible needs to
 * know which one is failing — "not approved yet" and "your dates ran out" call
 * for completely different responses, and the old banner said only that the
 * dates had ended.
 */
function VisibilityBanner({ isApproved, visibleToPatients, daysRemaining, camp }) {
  if (!isApproved) {
    return (
      <div className="rounded-lg border border-decision/30 bg-decision-tint px-4 py-3">
        <p className="text-sm font-medium text-decision">Waiting for approval</p>
        <p className="mt-0.5 text-xs text-decision/80">
          ResQPK is reviewing your registration. Patients cannot see the camp yet. You can still
          set everything up and record patients in the meantime.
        </p>
      </div>
    );
  }
  if (visibleToPatients) {
    return (
      <div className="rounded-lg border border-ready/30 bg-ready-tint px-4 py-3">
        <p className="text-sm font-medium text-ready">Live — nearby patients can find you</p>
        <p className="mt-0.5 text-xs text-ready/80">
          {daysRemaining} {daysRemaining === 1 ? 'day' : 'days'} left of your camp dates.
        </p>
      </div>
    );
  }

  const today = new Date().toISOString().slice(0, 10);
  const notStarted = camp?.startDate && camp.startDate > today;
  return (
    <div className="rounded-lg border border-line bg-page px-4 py-3">
      <p className="text-sm font-medium text-ink-soft">
        {notStarted ? 'Not started yet' : 'Camp dates have ended'}
      </p>
      <p className="mt-0.5 text-xs text-ink-muted">
        {notStarted
          ? `You will appear to patients from ${camp.startDate}.`
          : 'Patients can no longer find this camp. Change the end date below to run for longer.'}
      </p>
    </div>
  );
}

/** What the camp looks like in the patient's app, so it can be checked. */
function AppPreview({ camp }) {
  return (
    <Card>
      <div className="mb-3 flex items-center gap-2">
        <Smartphone size={16} className="text-ink-faint" />
        <h2 className="text-[15px] font-semibold text-ink">How patients see you</h2>
      </div>
      <div className="mx-auto max-w-[360px] rounded-card border border-line bg-page p-3">
        <div className="rounded-xl border border-line bg-card p-4">
          <p className="text-[17px] font-semibold leading-snug text-ink">{camp.name}</p>
          {camp.description && (
            <p className="mt-1 line-clamp-2 text-[13px] text-ink-soft">{camp.description}</p>
          )}
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            <span className="rounded-full bg-info-tint px-2.5 py-1 text-[12px] font-medium text-info">
              2.0 km
            </span>
            <span className="rounded-full bg-page px-2.5 py-1 text-[12px] text-ink-soft">
              {camp.daysRemaining ?? 0} days left
            </span>
          </div>
          {camp.address && (
            <p className="mt-2.5 flex items-start gap-1.5 text-[12px] text-ink-muted">
              <MapPin size={12} className="mt-0.5 shrink-0" />
              <span className="line-clamp-1">{camp.address}</span>
            </p>
          )}
        </div>
        <p className="mt-2 text-center text-[11px] text-ink-faint">
          Distance is an example — each patient sees their own.
        </p>
      </div>
    </Card>
  );
}

function EditForm({ camp, onCancel }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    campName: camp.name || '',
    organizerName: camp.organizerName || '',
    description: camp.description || '',
    address: camp.address || '',
    contactPhone: camp.contactPhone || '',
    startDate: camp.startDate || '',
    endDate: camp.endDate || '',
    lat: camp.lat ?? '',
    lng: camp.lng ?? '',
  });
  const [services, setServices] = useState(camp.servicesOffered || []);
  const [draft, setDraft] = useState('');

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const addService = (e) => {
    if (e.key !== 'Enter' && e.type !== 'click') return;
    e.preventDefault();
    const value = draft.trim();
    if (!value || services.includes(value)) return;
    setServices((s) => [...s, value]);
    setDraft('');
  };

  const save = useMutation({
    mutationFn: (payload) => updateCampProfile(payload),
    onSuccess: () => {
      toast.success('Camp updated');
      queryClient.invalidateQueries({ queryKey: ['camp-dashboard'] });
      onCancel();
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Could not save'),
  });

  const submit = (e) => {
    e.preventDefault();
    save.mutate({ ...form, servicesOffered: services });
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="mb-1.5 block text-xs font-medium text-ink-soft">Camp name</label>
          <input className={input} value={form.campName} onChange={set('campName')} />
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1.5 block text-xs font-medium text-ink-soft">Organizer / NGO</label>
          <input className={input} value={form.organizerName} onChange={set('organizerName')} />
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1.5 block text-xs font-medium text-ink-soft">Description</label>
          <textarea className={`${input} h-20 resize-none`} value={form.description}
            onChange={set('description')} />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-ink-soft">Start date</label>
          <input type="date" className={input} value={form.startDate} onChange={set('startDate')} />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-ink-soft">End date</label>
          <input type="date" className={input} value={form.endDate} onChange={set('endDate')} />
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1.5 block text-xs font-medium text-ink-soft">Address</label>
          <input className={input} value={form.address} onChange={set('address')} />
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1.5 block text-xs font-medium text-ink-soft">Contact phone</label>
          <input className={input} value={form.contactPhone} onChange={set('contactPhone')} />
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-medium text-ink-soft">
          Services offered — type and press Enter
        </label>
        <div className="flex gap-2">
          <input className={input} value={draft} onChange={(e) => setDraft(e.target.value)}
            onKeyDown={addService} placeholder="e.g. Free eye checkup" />
          <button type="button" onClick={addService}
            className="shrink-0 rounded-lg border border-line px-3 text-sm text-ink-soft hover:bg-page">
            <Plus size={15} />
          </button>
        </div>
        {services.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {services.map((s) => (
              <span key={s}
                className="inline-flex items-center gap-1 rounded-lg bg-ready-tint px-2.5 py-1 text-[12px] font-medium text-ready">
                {s}
                <button type="button" onClick={() => setServices((v) => v.filter((x) => x !== s))}>
                  <X size={11} />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-medium text-ink-soft">Where the camp is</label>
        <LocationPicker lat={form.lat} lng={form.lng}
          onChange={({ lat, lng }) => setForm((f) => ({ ...f, lat, lng }))} />
      </div>

      <div className="flex gap-2">
        <button type="submit" disabled={save.isPending}
          className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-lg bg-brand-ink text-[15px] font-semibold text-white disabled:opacity-60">
          {save.isPending ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
          Save changes
        </button>
        <button type="button" onClick={onCancel}
          className="h-11 rounded-lg border border-line px-5 text-[15px] text-ink-soft hover:bg-page">
          Cancel
        </button>
      </div>
    </form>
  );
}

export default function CampDashboardView() {
  const [editing, setEditing] = useState(false);
  const { data, isLoading, isError } = useQuery({
    queryKey: ['camp-dashboard'],
    queryFn: getCampDashboard,
  });

  // Leaflet measures itself on mount; inside a panel that was display:none it
  // comes up as a grey box until something makes it re-measure.
  useEffect(() => {
    if (editing) window.dispatchEvent(new Event('resize'));
  }, [editing]);

  if (isLoading) {
    return (
      <div className="mx-auto grid h-48 max-w-[760px] place-items-center text-ink-muted">
        <Loader2 size={18} className="animate-spin" />
      </div>
    );
  }

  if (isError || !data?.camp) {
    return (
      <div className="v2-card mx-auto max-w-[760px] p-8 text-center text-ink-muted">
        This account is not linked to a medical camp.
      </div>
    );
  }

  const { camp, isApproved, visibleToPatients, daysRemaining } = data;

  return (
    <div className="mx-auto max-w-[760px] space-y-4">
      <VisibilityBanner
        isApproved={isApproved}
        visibleToPatients={visibleToPatients}
        daysRemaining={daysRemaining}
        camp={camp}
      />

      <Card>
        <div className="mb-4 flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <h1 className="text-[20px] font-bold leading-tight text-ink">{camp.name}</h1>
            {camp.organizerName && (
              <p className="mt-0.5 text-sm text-ink-soft">{camp.organizerName}</p>
            )}
          </div>
          {!editing && (
            <button onClick={() => setEditing(true)}
              className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg border border-line px-3 text-[13px] font-medium text-ink-soft hover:bg-page">
              <Pencil size={14} /> Edit
            </button>
          )}
        </div>

        {editing ? (
          <EditForm camp={camp} onCancel={() => setEditing(false)} />
        ) : (
          <div className="space-y-3">
            {camp.description && (
              <p className="text-[14px] leading-relaxed text-ink-soft">{camp.description}</p>
            )}

            <div className="grid gap-2 text-[13px] text-ink-soft sm:grid-cols-2">
              <span className="inline-flex items-center gap-2">
                <CalendarDays size={14} className="text-ink-faint" />
                {camp.startDate} → {camp.endDate}
              </span>
              {camp.contactPhone && (
                <span className="inline-flex items-center gap-2">
                  <Phone size={14} className="text-ink-faint" />
                  {camp.contactPhone}
                </span>
              )}
              {camp.address && (
                <span className="inline-flex items-start gap-2 sm:col-span-2">
                  <MapPin size={14} className="mt-0.5 shrink-0 text-ink-faint" />
                  {camp.address}
                </span>
              )}
            </div>

            {(camp.servicesOffered || []).length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {camp.servicesOffered.map((s) => (
                  <span key={s}
                    className="rounded-lg bg-ready-tint px-2.5 py-1 text-[12px] font-medium text-ready">
                    {s}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </Card>

      {!editing && <AppPreview camp={camp} />}
    </div>
  );
}

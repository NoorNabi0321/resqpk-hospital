import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  Building2, Check, Clock, Loader2, MapPin, Phone, Stethoscope, User, X,
} from 'lucide-react';

import { approveFacility, listFacilities, rejectFacility } from '../../api/v2';

const TABS = [
  { key: 'pending', label: 'Waiting' },
  { key: 'approved', label: 'Approved' },
  { key: 'rejected', label: 'Rejected' },
];

const TYPES = [
  { key: 'all', label: 'All' },
  { key: 'hospital', label: 'Hospitals' },
  { key: 'medical_camp', label: 'Camps' },
];

function StatusPill({ status }) {
  const map = {
    pending: ['bg-decision-tint text-decision', 'Waiting'],
    approved: ['bg-ready-tint text-ready', 'Approved'],
    rejected: ['bg-page text-ink-muted', 'Rejected'],
  };
  const [cls, label] = map[status] || map.pending;
  return <span className={`rounded-md px-2 py-0.5 text-[11px] font-semibold ${cls}`}>{label}</span>;
}

function RejectBox({ onCancel, onConfirm, busy }) {
  const [reason, setReason] = useState('');
  return (
    <div className="mt-3 rounded-lg border border-line bg-page p-3">
      <p className="mb-2 text-[12px] font-medium text-ink-soft">
        Why is this being refused? They will be told.
      </p>
      <div className="flex flex-wrap gap-2">
        <input
          autoFocus
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="e.g. Could not verify the address"
          className="min-w-[220px] flex-1 rounded-lg border border-line bg-card px-3 py-2 text-[13px] outline-none focus:border-brand"
        />
        <button
          onClick={() => reason.trim() && onConfirm(reason.trim())}
          disabled={!reason.trim() || busy}
          className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-critical px-3 text-[13px] font-semibold text-white disabled:opacity-50"
        >
          {busy ? <Loader2 size={14} className="animate-spin" /> : <X size={14} />} Reject
        </button>
        <button onClick={onCancel}
          className="inline-flex h-9 items-center rounded-lg border border-line px-3 text-[13px] text-ink-soft">
          Cancel
        </button>
      </div>
    </div>
  );
}

function FacilityCard({ facility, onApprove, onReject, busyId }) {
  const [rejecting, setRejecting] = useState(false);
  const isCamp = facility.facilityType === 'medical_camp';
  const Icon = isCamp ? Stethoscope : Building2;
  const busy = busyId === facility.id;

  return (
    <article className={`v2-card p-5 ${facility.status === 'pending' ? 'border-l-4 border-l-decision' : ''}`}>
      <div className="flex flex-wrap items-start gap-3">
        <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${isCamp ? 'bg-ready-tint' : 'bg-critical-tint'}`}>
          <Icon size={20} className={isCamp ? 'text-ready' : 'text-critical'} />
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-[16px] font-semibold text-ink">{facility.name}</h3>
            <StatusPill status={facility.status} />
            <span className="text-[11px] text-ink-faint">
              {isCamp ? 'Medical camp' : 'Hospital'}
            </span>
          </div>

          {facility.organizerName && (
            <p className="mt-0.5 text-[13px] text-ink-soft">{facility.organizerName}</p>
          )}
          {facility.description && (
            <p className="mt-1.5 text-[13px] leading-relaxed text-ink-soft">{facility.description}</p>
          )}

          <div className="mt-2.5 grid gap-1 text-[12px] text-ink-soft sm:grid-cols-2">
            {facility.address && (
              <span className="inline-flex items-start gap-1.5">
                <MapPin size={12} className="mt-0.5 shrink-0 text-ink-faint" />
                {facility.address}
              </span>
            )}
            {(facility.emergencyPhone || facility.phone) && (
              <span className="inline-flex items-center gap-1.5">
                <Phone size={12} className="text-ink-faint" />
                {facility.emergencyPhone || facility.phone}
              </span>
            )}
            {facility.admin && (
              <span className="inline-flex items-center gap-1.5">
                <User size={12} className="text-ink-faint" />
                {facility.admin.fullName} · {facility.admin.email}
              </span>
            )}
            <span className="inline-flex items-center gap-1.5">
              <Clock size={12} className="text-ink-faint" />
              Submitted {facility.submittedAt ? new Date(facility.submittedAt).toLocaleDateString() : '—'}
            </span>
          </div>

          {isCamp ? (
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              <span className="rounded bg-page px-2 py-0.5 text-[11px] text-ink-soft">
                {facility.startDate} → {facility.endDate}
              </span>
              {(facility.servicesOffered || []).map((s) => (
                <span key={s} className="rounded bg-page px-2 py-0.5 text-[11px] text-ink-soft">{s}</span>
              ))}
            </div>
          ) : (
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {facility.hasEmergencyWard && (
                <span className="rounded bg-critical-tint px-2 py-0.5 text-[11px] font-medium text-critical">
                  Emergency ward
                </span>
              )}
              {facility.hasIcu && <span className="rounded bg-page px-2 py-0.5 text-[11px] text-ink-soft">ICU</span>}
              {facility.hasTraumaCenter && <span className="rounded bg-page px-2 py-0.5 text-[11px] text-ink-soft">Trauma centre</span>}
              {facility.totalBeds > 0 && (
                <span className="rounded bg-page px-2 py-0.5 text-[11px] text-ink-soft">{facility.totalBeds} beds</span>
              )}
            </div>
          )}

          {facility.status === 'rejected' && facility.rejectionReason && (
            <p className="mt-2.5 rounded-lg bg-page px-3 py-2 text-[12px] text-ink-soft">
              Refused: {facility.rejectionReason}
            </p>
          )}
        </div>

        {facility.status === 'pending' && !rejecting && (
          <div className="flex shrink-0 gap-2">
            <button onClick={() => onApprove(facility.id)} disabled={busy}
              className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-ready px-4 text-[14px] font-semibold text-white transition hover:brightness-95 disabled:opacity-60">
              {busy ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />} Approve
            </button>
            <button onClick={() => setRejecting(true)} disabled={busy}
              className="inline-flex h-10 items-center gap-1.5 rounded-lg border-2 border-critical px-4 text-[14px] font-semibold text-critical transition hover:bg-critical-tint">
              <X size={15} /> Reject
            </button>
          </div>
        )}
      </div>

      {rejecting && (
        <RejectBox
          busy={busy}
          onCancel={() => setRejecting(false)}
          onConfirm={(reason) => { onReject(facility.id, reason); setRejecting(false); }}
        />
      )}
    </article>
  );
}

/**
 * Who is allowed to appear in the app.
 *
 * A hospital approved here can be sent ambulances, so this is the one screen
 * where saying yes too quickly has a patient arriving somewhere nobody checked.
 * Everything needed to check is on the card: the address, the pin, who signed
 * up, and what they claim to have.
 */
export default function AdminFacilitiesView() {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState('pending');
  const [type, setType] = useState('all');
  const [busyId, setBusyId] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-facilities', status, type],
    queryFn: () => listFacilities({ status, type }),
  });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-facilities'] });
    queryClient.invalidateQueries({ queryKey: ['admin-pending-count'] });
  };

  const approve = useMutation({
    mutationFn: (id) => approveFacility(id),
    onMutate: (id) => setBusyId(id),
    onSuccess: (f) => { toast.success(`${f.name} approved`); refresh(); },
    onError: (err) => toast.error(err.response?.data?.message || 'Could not approve'),
    onSettled: () => setBusyId(null),
  });

  const reject = useMutation({
    mutationFn: ({ id, reason }) => rejectFacility(id, reason),
    onMutate: ({ id }) => setBusyId(id),
    onSuccess: (f) => { toast.success(`${f.name} rejected`); refresh(); },
    onError: (err) => toast.error(err.response?.data?.message || 'Could not reject'),
    onSettled: () => setBusyId(null),
  });

  const facilities = data?.facilities || [];

  return (
    <div className="max-w-[1100px] mx-auto space-y-4">
      <div>
        <h1 className="text-[22px] font-bold text-ink">Registrations</h1>
        <p className="mt-0.5 text-sm text-ink-soft">
          Hospitals and medical camps waiting to appear in ResQPK.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="inline-flex rounded-lg border border-line bg-card p-0.5">
          {TABS.map((t) => (
            <button key={t.key} onClick={() => setStatus(t.key)}
              className={[
                'px-3.5 py-1.5 rounded-md text-[13px] font-medium transition',
                status === t.key ? 'bg-brand-ink text-white' : 'text-ink-soft hover:bg-page',
              ].join(' ')}>
              {t.label}
            </button>
          ))}
        </div>

        <div className="inline-flex rounded-lg border border-line bg-card p-0.5">
          {TYPES.map((t) => (
            <button key={t.key} onClick={() => setType(t.key)}
              className={[
                'px-3 py-1.5 rounded-md text-[13px] font-medium transition',
                type === t.key ? 'bg-page text-ink' : 'text-ink-soft hover:bg-page',
              ].join(' ')}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="grid h-40 place-items-center text-ink-muted">
          <Loader2 size={18} className="animate-spin" />
        </div>
      ) : facilities.length === 0 ? (
        <div className="v2-card grid h-40 place-items-center px-6 text-center text-sm text-ink-muted">
          {status === 'pending' ? 'Nothing waiting. Everything has been looked at.' : 'Nothing here.'}
        </div>
      ) : (
        <div className="space-y-3">
          {facilities.map((f) => (
            <FacilityCard
              key={f.id}
              facility={f}
              busyId={busyId}
              onApprove={(id) => approve.mutate(id)}
              onReject={(id, reason) => reject.mutate({ id, reason })}
            />
          ))}
        </div>
      )}
    </div>
  );
}

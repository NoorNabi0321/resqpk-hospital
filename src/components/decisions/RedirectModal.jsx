import { useEffect, useState } from 'react';
import { AlertTriangle, Check, Loader2, X } from 'lucide-react';
import toast from 'react-hot-toast';

import { getAlternatives, redirectCase, getDecisionConstants } from '../../api/v2';

export default function RedirectModal({ caseId, onClose, onRedirected }) {
  const [loading, setLoading] = useState(true);
  const [hospitals, setHospitals] = useState([]);
  const [reasons, setReasons] = useState([]);
  const [selectedHospital, setSelectedHospital] = useState(null);
  const [selectedReason, setSelectedReason] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [list, constants] = await Promise.all([
          getAlternatives(caseId),
          getDecisionConstants(),
        ]);
        if (cancelled) return;
        setHospitals(list || []);
        setReasons(constants?.redirectReasons || []);
      } catch (err) {
        if (!cancelled) {
          toast.error(err.response?.data?.message || 'Could not load alternative hospitals');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [caseId]);

  // Escape closes — standard modal behaviour the receptionist will expect.
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const confirm = async () => {
    if (!selectedHospital || !selectedReason) return;
    setSubmitting(true);
    try {
      await redirectCase(caseId, selectedHospital.hospital.id, selectedReason);
      toast.success(
        `Case redirected to ${selectedHospital.hospital.name}. Driver has been notified.`,
      );
      onRedirected?.();
    } catch (err) {
      const message = err.response?.data?.message || 'Redirect failed';
      toast.error(message);
      // Someone else decided first — the caller refreshes to show the truth.
      if (message.includes('already decided')) onRedirected?.();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 grid place-items-center p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="bg-card rounded-card shadow-card-hover w-full max-w-2xl max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Redirect to another hospital"
      >
        {/* Header */}
        <div className="p-5 border-b border-line flex items-start justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold">Redirect to another hospital</h2>
            <p className="text-xs text-ink-muted mt-0.5">
              Sorted by resource match and distance from the ambulance
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 grid place-items-center rounded-lg text-ink-muted hover:bg-page"
          >
            <X size={17} />
          </button>
        </div>

        {/* Hospital list */}
        <div className="flex-1 overflow-y-auto p-5 space-y-2">
          {loading ? (
            <div className="h-40 grid place-items-center text-ink-muted text-sm">
              <div className="flex items-center gap-2">
                <Loader2 size={16} className="animate-spin" /> Finding alternatives…
              </div>
            </div>
          ) : hospitals.length === 0 ? (
            <p className="text-sm text-ink-muted text-center py-8">
              No other active hospitals are available.
            </p>
          ) : (
            hospitals.map((h) => {
              const ok = h.resourceMatch?.overallOk;
              const selected = selectedHospital?.hospital.id === h.hospital.id;
              return (
                <button
                  key={h.hospital.id}
                  onClick={() => setSelectedHospital(h)}
                  className={[
                    'w-full text-left p-3.5 rounded-lg border transition',
                    selected ? 'border-info bg-info-tint' : 'border-line hover:bg-page',
                    ok ? 'border-l-4 border-l-ready' : '',
                  ].join(' ')}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-semibold text-sm">{h.hospital.name}</span>
                    <span className="text-xs text-ink-muted shrink-0">{h.distanceText}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span
                      className={[
                        'px-2 py-0.5 rounded text-[11px] font-medium',
                        ok ? 'bg-ready-tint text-ready' : 'bg-critical-tint text-critical',
                      ].join(' ')}
                    >
                      {ok ? 'Resources match' : `Missing ${h.resourceMatch?.missingCount ?? 0}`}
                    </span>
                    <span className="text-[11px] text-ink-muted truncate">
                      {h.resourceMatch?.summary}
                    </span>
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Reason */}
        <div className="px-5 py-4 border-t border-line">
          <p className="text-xs font-medium text-ink-soft mb-2">Reason for redirect (required)</p>
          <div className="flex flex-wrap gap-2">
            {reasons.map((r) => (
              <button
                key={r}
                onClick={() => setSelectedReason(r)}
                className={[
                  'px-3 py-1.5 rounded-lg text-xs font-medium border transition',
                  selectedReason === r
                    ? 'bg-decision-tint border-decision text-decision'
                    : 'border-line text-ink-soft hover:bg-page',
                ].join(' ')}
              >
                {selectedReason === r && <Check size={12} className="inline mr-1 -mt-0.5" />}
                {r}
              </button>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="p-5 border-t border-line flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="h-10 px-4 rounded-lg text-sm font-medium text-ink-soft hover:bg-page"
          >
            Cancel
          </button>
          <button
            onClick={confirm}
            disabled={!selectedHospital || !selectedReason || submitting}
            className="h-10 px-5 rounded-lg bg-decision text-white text-sm font-semibold inline-flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed hover:brightness-95 transition"
          >
            {submitting ? (
              <Loader2 size={15} className="animate-spin" />
            ) : (
              <AlertTriangle size={15} />
            )}
            Confirm Redirect
          </button>
        </div>
      </div>
    </div>
  );
}

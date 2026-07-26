import toast from 'react-hot-toast';

import { normalizeCase } from './utils';
import useNotificationStore from '../stores/notificationStore';
import ToastCard from '../components/ui/ToastCard';

// Shows the toast AND records it in the notification history.
function notify({ tone, title, body, meta, duration = 6000, id, caseId }) {
  useNotificationStore.getState().push({ tone, title, body, caseId });
  toast.custom((t) => <ToastCard t={t} tone={tone} title={title} body={body} meta={meta} />, {
    duration,
    id,
  });
}

// New emergency case.
export function notifyNewCase(raw) {
  const c = normalizeCase(raw);
  notify({
    tone: 'critical',
    title: 'New emergency',
    body: `${c.patientName || 'Patient'} · ${c.urgency || 'unknown severity'}`,
    meta: `ETA ${raw.etaText || raw.durationText || '—'}`,
    duration: 8000,
    id: `new-case-${c.id}`,
    caseId: c.id,
  });
}

// Ambulance arriving in under two minutes.
export function notifyEtaWarning(raw) {
  const c = normalizeCase(raw);
  notify({
    tone: 'eta',
    title: 'Arriving soon',
    body: `${c.patientName || 'Patient'} arrives in under 2 minutes`,
    duration: 6000,
    id: `eta-warn-${c.id}`,
    caseId: c.id,
  });
}

// AI report ready — the edge colour follows the urgency.
export function notifyAIReportReady(patientName, urgencyLevel) {
  const tone =
    urgencyLevel === 'critical' ? 'critical' : urgencyLevel === 'moderate' ? 'decision' : 'ready';
  notify({
    tone,
    title: 'AI report ready',
    body: `${patientName || 'Patient'} — ${urgencyLevel || 'unknown'}`,
    meta: 'Open the case to review the report',
    duration: 9000,
  });
}

// Bed status confirmation.
export function notifyBedUpdate(data) {
  notify({
    tone: 'ready',
    title: 'Bed status updated',
    body: `${data.bedType} — ${data.availableCount} available`,
    duration: 3000,
    id: `bed-${data.bedType}`,
  });
}

// Hospital decisions and driver messages (called from the socket hook).
export function notifyDecision({ tone = 'info', title, body, caseId }) {
  notify({ tone, title, body, caseId, duration: 6000 });
}

import toast from 'react-hot-toast';
import { cn, normalizeCase } from './utils';

// New emergency case — red, attention-grabbing, 8s.
export function notifyNewCase(raw) {
  const c = normalizeCase(raw);
  toast.custom(
    (t) => (
      <div
        className={cn(
          'flex items-start gap-3 p-3 rounded-xl glass border-l-4 border-l-emergency-red',
          t.visible ? 'animate-slide-in-right' : 'opacity-0',
        )}
      >
        <div className="w-2 h-2 bg-emergency-red rounded-full animate-pulse mt-1.5 flex-shrink-0" />
        <div>
          <p className="font-medium text-sm">🚨 New Emergency</p>
          <p className="text-xs text-gray-500 mt-0.5">
            {c.patientName || 'Patient'} • {c.urgency || 'Unknown severity'}
          </p>
          <p className="text-xs text-gray-400">ETA: {raw.etaText || raw.durationText || '—'}</p>
        </div>
      </div>
    ),
    { duration: 8000, id: `new-case-${c.id}` },
  );
}

// Ambulance arriving in under two minutes — amber.
export function notifyEtaWarning(raw) {
  const c = normalizeCase(raw);
  toast.custom(
    (t) => (
      <div
        className={cn(
          'flex items-start gap-3 p-3 rounded-xl glass border-l-4 border-l-emergency-amber',
          t.visible ? 'animate-slide-in-right' : 'opacity-0',
        )}
      >
        <div className="w-2 h-2 bg-emergency-amber rounded-full animate-pulse mt-1.5 flex-shrink-0" />
        <div>
          <p className="font-medium text-sm">⏱ Arriving Soon</p>
          <p className="text-xs text-gray-500">
            {c.patientName || 'Patient'} arrives in under 2 minutes
          </p>
        </div>
      </div>
    ),
    { duration: 6000, id: `eta-warn-${c.id}` },
  );
}

// AI report ready — urgency-colored, links the hospital to preparation notes.
export function notifyAIReportReady(patientName, urgencyLevel) {
  const color =
    urgencyLevel === 'critical'
      ? 'border-l-emergency-red'
      : urgencyLevel === 'moderate'
        ? 'border-l-emergency-amber'
        : 'border-l-emergency-green';
  toast.custom(
    (t) => (
      <div
        className={cn(
          'flex items-start gap-3 p-3 rounded-xl glass border-l-4',
          color,
          t.visible ? 'animate-slide-in-right' : 'opacity-0',
        )}
      >
        <span className="text-lg leading-none">🤖</span>
        <div>
          <p className="font-medium text-sm">AI Report Ready</p>
          <p className="text-xs text-gray-500 mt-0.5">
            {patientName || 'Patient'} — {urgencyLevel || 'unknown'}
          </p>
          <p className="text-xs text-gray-400">Hospital preparation notes available</p>
        </div>
      </div>
    ),
    { duration: 10000 },
  );
}

// Bed status confirmation — green success toast.
export function notifyBedUpdate(data) {
  toast.success(`Bed status updated: ${data.bedType} — ${data.availableCount} available`, {
    duration: 3000,
    iconTheme: { primary: '#10B981', secondary: '#fff' },
  });
}

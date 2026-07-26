import { AlertTriangle, Bed, Clock, FileText, Siren } from 'lucide-react';

// One place defining what each notification tone looks like, shared by the
// toast card and the notification history panel so they can't drift apart.
export const TONES = {
  critical: { edge: '#DC2626', tint: '#FEF2F2', Icon: Siren },
  decision: { edge: '#D97706', tint: '#FFFBEB', Icon: AlertTriangle },
  ready: { edge: '#059669', tint: '#ECFDF5', Icon: Bed },
  info: { edge: '#2563EB', tint: '#EFF6FF', Icon: FileText },
  eta: { edge: '#D97706', tint: '#FFFBEB', Icon: Clock },
};

export function tone(name) {
  return TONES[name] || TONES.info;
}

export default TONES;

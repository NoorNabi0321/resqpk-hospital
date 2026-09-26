import { Link } from 'react-router-dom';
import { ArrowRight, Hospital, Stethoscope } from 'lucide-react';

import AuthShell from '../components/auth/AuthShell';

/**
 * Which kind of facility is registering.
 *
 * Two things sign up here and they need different forms — a hospital has an
 * emergency ward and beds, a camp has dates and a services list. Asking once,
 * up front, is shorter than one form that hides half of itself.
 */
const OPTIONS = [
  {
    to: '/register/hospital',
    icon: Hospital,
    title: 'Hospital',
    body: 'Receive emergency cases, see what is arriving and when, and keep the bay ready.',
    note: 'Reviewed by ResQPK before it can receive emergencies.',
    accent: 'text-critical',
    tint: 'bg-critical-tint',
  },
  {
    to: '/register/camp',
    icon: Stethoscope,
    title: 'Medical camp',
    body: 'Appear on the map for nearby patients, and keep a register of everyone you see.',
    note: 'Reviewed by ResQPK before patients can find it.',
    accent: 'text-ready',
    tint: 'bg-ready-tint',
  },
];

export default function RegisterChoicePage() {
  return (
    <AuthShell
      title="Register with ResQPK"
      subtitle="Which are you setting up?"
      width="max-w-[560px]"
      footer={
        <>
          Already registered?{' '}
          <Link to="/login" className="font-medium text-brand-ink hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <div className="grid gap-3.5">
        {OPTIONS.map(({ to, icon: Icon, title, body, note, accent, tint }) => (
          <Link
            key={to}
            to={to}
            className="group flex items-start gap-4 rounded-lg border border-line p-4 text-left transition hover:border-brand hover:bg-page"
          >
            <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl ${tint}`}>
              <Icon size={22} className={accent} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-1.5">
                <span className="text-[17px] font-semibold text-ink">{title}</span>
                <ArrowRight
                  size={15}
                  className="text-ink-faint transition group-hover:translate-x-0.5 group-hover:text-brand-ink"
                />
              </span>
              <span className="mt-1 block text-[13px] leading-relaxed text-ink-soft">{body}</span>
              <span className="mt-1.5 block text-[11px] text-ink-faint">{note}</span>
            </span>
          </Link>
        ))}
      </div>
    </AuthShell>
  );
}

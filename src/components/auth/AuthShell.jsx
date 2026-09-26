import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

import wordmark from '../../assets/logo-wordmark.webp';

/**
 * The frame every signed-out screen sits in.
 *
 * The old login was a dark glass card on near-black, which shared nothing with
 * the app a patient or a driver sees. One product should look like one
 * product, so this is the app's cream page, its coral, and its wordmark.
 */
export default function AuthShell({ title, subtitle, children, footer, width = 'max-w-[460px]' }) {
  return (
    <div className="min-h-screen w-full bg-page px-4 py-10 flex flex-col items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className={`w-full ${width}`}
      >
        <div className="mb-7 text-center">
          <Link to="/login" className="inline-block">
            <img src={wordmark} alt="ResQPK" className="h-11 mx-auto" />
          </Link>
          <h1 className="mt-5 text-[26px] font-bold tracking-tight text-ink">{title}</h1>
          {subtitle && <p className="mt-1.5 text-sm text-ink-soft">{subtitle}</p>}
        </div>

        <div className="rounded-card border border-line bg-card p-7 shadow-card">{children}</div>

        {footer && <div className="mt-5 text-center text-sm text-ink-soft">{footer}</div>}
      </motion.div>
    </div>
  );
}

/** A labelled input. Every field on these screens is one of these. */
export function Field({ label, hint, error, children }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-ink-soft">{label}</label>
      {children}
      {hint && !error && <p className="mt-1 text-[11px] text-ink-faint">{hint}</p>}
      {error && <p className="mt-1 text-[11px] text-critical">{error}</p>}
    </div>
  );
}

export const inputClass =
  'w-full rounded-lg border border-line bg-card px-3.5 py-2.5 text-[15px] text-ink '
  + 'placeholder-ink-faint outline-none transition focus:border-brand '
  + 'focus:ring-2 focus:ring-brand/20';

/** The one filled action on a form. brand-ink, because the label is white. */
export const submitClass =
  'w-full h-12 rounded-lg bg-brand-ink text-white font-semibold text-[15px] '
  + 'inline-flex items-center justify-center gap-2 transition hover:brightness-95 '
  + 'disabled:opacity-60 disabled:cursor-not-allowed';

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Loader2, X } from 'lucide-react';

import { registerHospital } from '../api/v2';
import AuthShell, { Field, inputClass, submitClass } from '../components/auth/AuthShell';
import LocationPicker from '../components/auth/LocationPicker';

const EMPTY = {
  hospitalName: '',
  hospitalType: 'private',
  address: '',
  city: 'Hyderabad',
  lat: '',
  lng: '',
  phone: '',
  emergencyPhone: '',
  totalBeds: '',
  adminFullName: '',
  adminEmail: '',
  adminPassword: '',
};

const TYPES = [
  { value: 'public', label: 'Government' },
  { value: 'private', label: 'Private' },
  { value: 'charity', label: 'Charity / trust' },
  { value: 'military', label: 'Military' },
];

const CAPABILITIES = [
  { key: 'hasEmergencyWard', label: 'Emergency ward', defaultOn: true },
  { key: 'hasIcu', label: 'ICU', defaultOn: false },
  { key: 'hasTraumaCenter', label: 'Trauma centre', defaultOn: false },
];

export default function HospitalRegisterPage() {
  const [form, setForm] = useState(EMPTY);
  const [caps, setCaps] = useState(() =>
    Object.fromEntries(CAPABILITIES.map((c) => [c.key, c.defaultOn])));
  const [specialties, setSpecialties] = useState([]);
  const [draft, setDraft] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [done, setDone] = useState(false);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const addSpecialty = (e) => {
    if (e.key !== 'Enter' && e.type !== 'click') return;
    e.preventDefault();
    const value = draft.trim();
    if (!value || specialties.includes(value)) return;
    setSpecialties((s) => [...s, value]);
    setDraft('');
  };

  const validate = () => {
    if (!form.hospitalName.trim()) return 'Hospital name is required';
    if (!form.address.trim()) return 'Address is required';
    if (!form.lat || !form.lng) return 'Set the location on the map';
    if (!form.adminFullName.trim()) return 'Your name is required';
    if (!form.adminEmail.trim()) return 'A sign-in email is required';
    if (form.adminPassword.length < 8) return 'Password must be at least 8 characters';
    return null;
  };

  const submit = async (e) => {
    e.preventDefault();
    const problem = validate();
    if (problem) return setError(problem);

    setSubmitting(true);
    setError(null);
    try {
      await registerHospital({ ...form, ...caps, specialties });
      setDone(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <AuthShell title="Registration received" subtitle={form.hospitalName}>
        <div className="text-center">
          <CheckCircle2 size={44} className="mx-auto text-ready" />
          <p className="mt-4 text-[15px] text-ink">
            ResQPK will review your hospital before it can receive emergencies.
          </p>
          <p className="mt-2 text-[13px] text-ink-soft">
            You can sign in now with the email and password you just set. The dashboard will
            tell you when the review is done.
          </p>
          <Link
            to="/login"
            className={`${submitClass} mt-6`}
          >
            Go to sign in
          </Link>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Register a hospital"
      subtitle="Reviewed by ResQPK before it can receive emergencies"
      width="max-w-[680px]"
      footer={
        <>
          Registering a camp instead?{' '}
          <Link to="/register/camp" className="font-medium text-brand-ink hover:underline">
            Camp registration
          </Link>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Field label="Hospital name">
              <input className={inputClass} value={form.hospitalName} onChange={set('hospitalName')}
                placeholder="Civil Hospital Hyderabad" />
            </Field>
          </div>

          <Field label="Type">
            <select className={inputClass} value={form.hospitalType} onChange={set('hospitalType')}>
              {TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </Field>

          <Field label="City">
            <input className={inputClass} value={form.city} onChange={set('city')} />
          </Field>

          <div className="sm:col-span-2">
            <Field label="Address">
              <input className={inputClass} value={form.address} onChange={set('address')}
                placeholder="Hospital Road, near Saddar" />
            </Field>
          </div>

          <Field label="Reception phone">
            <input className={inputClass} value={form.phone} onChange={set('phone')}
              placeholder="0221234567" />
          </Field>

          <Field label="Emergency phone" hint="Shown to patients choosing a hospital">
            <input className={inputClass} value={form.emergencyPhone} onChange={set('emergencyPhone')}
              placeholder="0221234568" />
          </Field>
        </div>

        {/* Location ------------------------------------------------------- */}
        <div>
          <p className="mb-2 text-xs font-medium text-ink-soft">
            Location — drag the pin to your entrance
          </p>
          <LocationPicker
            lat={form.lat}
            lng={form.lng}
            onChange={({ lat, lng }) => setForm((f) => ({ ...f, lat, lng }))}
          />
        </div>

        {/* Capabilities --------------------------------------------------- */}
        <div>
          <p className="mb-2 text-xs font-medium text-ink-soft">What you have</p>
          <div className="flex flex-wrap gap-2">
            {CAPABILITIES.map((c) => (
              <button
                key={c.key}
                type="button"
                onClick={() => setCaps((v) => ({ ...v, [c.key]: !v[c.key] }))}
                className={[
                  'px-3 py-1.5 rounded-lg text-[13px] font-medium border transition',
                  caps[c.key]
                    ? 'bg-ready-tint border-ready text-ready'
                    : 'border-line text-ink-soft hover:bg-page',
                ].join(' ')}
              >
                {c.label}
              </button>
            ))}
          </div>
          {!caps.hasEmergencyWard && (
            <p className="mt-2 text-[11px] text-decision">
              Without an emergency ward you will not be offered emergency cases.
            </p>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Total beds" hint="Approximate is fine">
            <input type="number" min="0" className={inputClass}
              value={form.totalBeds} onChange={set('totalBeds')} placeholder="120" />
          </Field>

          <Field label="Specialties" hint="Type and press Enter">
            <div className="flex gap-2">
              <input
                className={inputClass}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={addSpecialty}
                placeholder="e.g. Cardiology"
              />
              <button type="button" onClick={addSpecialty}
                className="shrink-0 rounded-lg border border-line px-3 text-sm text-ink-soft hover:bg-page">
                Add
              </button>
            </div>
          </Field>
        </div>

        {specialties.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {specialties.map((s) => (
              <span key={s}
                className="inline-flex items-center gap-1 rounded-lg bg-page px-2.5 py-1 text-[12px] text-ink-soft">
                {s}
                <button type="button" onClick={() => setSpecialties((v) => v.filter((x) => x !== s))}
                  className="text-ink-faint hover:text-critical">
                  <X size={12} />
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Sign-in -------------------------------------------------------- */}
        <div className="border-t border-line pt-5">
          <p className="mb-3 text-xs font-medium text-ink-soft">Your sign-in</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Field label="Your full name">
                <input className={inputClass} value={form.adminFullName} onChange={set('adminFullName')} />
              </Field>
            </div>
            <Field label="Email">
              <input type="email" autoComplete="username" className={inputClass}
                value={form.adminEmail} onChange={set('adminEmail')} />
            </Field>
            <Field label="Password" hint="At least 8 characters">
              <input type="password" autoComplete="new-password" className={inputClass}
                value={form.adminPassword} onChange={set('adminPassword')} />
            </Field>
          </div>
        </div>

        {error && (
          <div className="rounded-lg border border-critical/30 bg-critical-tint px-3 py-2.5">
            <p className="text-[13px] text-critical">{error}</p>
          </div>
        )}

        <button type="submit" disabled={submitting} className={submitClass}>
          {submitting ? (<><Loader2 size={16} className="animate-spin" /> Submitting…</>) : 'Register hospital'}
        </button>
      </form>
    </AuthShell>
  );
}

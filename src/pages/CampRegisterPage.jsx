import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Loader2, X } from 'lucide-react';

import { registerCamp } from '../api/v2';
import AuthShell, { Field, inputClass, submitClass } from '../components/auth/AuthShell';
import LocationPicker from '../components/auth/LocationPicker';

const EMPTY = {
  campName: '',
  organizerName: '',
  description: '',
  address: '',
  lat: '',
  lng: '',
  startDate: '',
  endDate: '',
  contactPhone: '',
  adminFullName: '',
  adminEmail: '',
  adminPassword: '',
};

export default function CampRegisterPage() {
  const [form, setForm] = useState(EMPTY);
  const [services, setServices] = useState([]);
  const [serviceDraft, setServiceDraft] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [done, setDone] = useState(false);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const addService = (e) => {
    if (e.key !== 'Enter' && e.type !== 'click') return;
    e.preventDefault();
    const value = serviceDraft.trim();
    if (!value || services.includes(value)) return;
    setServices((s) => [...s, value]);
    setServiceDraft('');
  };

  const validate = () => {
    if (!form.campName.trim()) return 'Camp name is required';
    if (!form.organizerName.trim()) return 'Organizer name is required';
    if (services.length === 0) return 'Add at least one service';
    if (!form.startDate || !form.endDate) return 'Start and end dates are required';
    if (form.startDate > form.endDate) return 'Start date must be on or before the end date';
    if (!form.lat || !form.lng) return 'Location coordinates are required';
    if (!form.adminEmail.trim() || !form.adminPassword) return 'Admin email and password are required';
    if (form.adminPassword.length < 8) return 'Password must be at least 8 characters';
    return null;
  };

  const submit = async (e) => {
    e.preventDefault();
    const problem = validate();
    if (problem) {
      setError(problem);
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await registerCamp({
        ...form,
        lat: Number(form.lat),
        lng: Number(form.lng),
        servicesOffered: services,
      });
      setDone(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <AuthShell title="Registration received" subtitle={form.campName}>
        <div className="text-center">
          <CheckCircle2 size={44} className="mx-auto text-ready" />
          <p className="mt-4 text-[15px] text-ink">
            ResQPK will review your camp before patients can find it.
          </p>
          <p className="mt-2 text-[13px] text-ink-soft">
            Sign in with <span className="font-medium">{form.adminEmail}</span> to check the
            review, and to start keeping a register of everyone you see.
          </p>
          <Link to="/login" className={`${submitClass} mt-6`}>Go to sign in</Link>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Register a medical camp"
      subtitle="Reviewed by ResQPK before patients can find it"
      width="max-w-[680px]"
      footer={
        <>
          Registering a hospital instead?{' '}
          <Link to="/register/hospital" className="font-medium text-brand-ink hover:underline">
            Hospital registration
          </Link>
        </>
      }
    >
      <form onSubmit={submit}>
        {error && (
          <div className="mb-4 rounded-lg bg-critical-tint border border-critical/30 px-4 py-3 text-sm text-critical">
            {error}
          </div>
        )}

        {/* Camp */}
        <section className="flex flex-col gap-4">

          <Field label="Camp name">
            <input className={inputClass} value={form.campName} onChange={set('campName')} />
          </Field>

          <Field label="Organizer / NGO">
            <input
              className={inputClass}
              value={form.organizerName}
              onChange={set('organizerName')}
            />
          </Field>

          <Field label="Description">
            <textarea
              className={`${inputClass} h-20 py-2 resize-none`}
              value={form.description}
              onChange={set('description')}
            />
          </Field>

          <Field label="Services offered" hint="Type a service and press Enter">
            <div className="mt-1 flex gap-2">
              <input
                className="flex-1 h-10 px-3 rounded-lg border border-line text-sm focus:outline-none focus:border-brand"
                value={serviceDraft}
                onChange={(e) => setServiceDraft(e.target.value)}
                onKeyDown={addService}
                placeholder="e.g. Free eye checkup"
              />
              <button
                type="button"
                onClick={addService}
                className="h-10 px-4 rounded-lg border border-line text-sm text-ink-soft hover:bg-page"
              >
                Add
              </button>
            </div>
            {services.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {services.map((s) => (
                  <span
                    key={s}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-ready-tint text-ready text-[11px] font-medium"
                  >
                    {s}
                    <button
                      type="button"
                      onClick={() => setServices((list) => list.filter((x) => x !== s))}
                      className="hover:opacity-70"
                    >
                      <X size={11} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </Field>

          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Start date">
              <input
                type="date"
                className={inputClass}
                value={form.startDate}
                onChange={set('startDate')}
              />
            </Field>
            <Field label="End date">
              <input
                type="date"
                className={inputClass}
                value={form.endDate}
                onChange={set('endDate')}
              />
            </Field>
          </div>
        </section>

        {/* Location */}
        <section className="mt-5 flex flex-col gap-4 border-t border-line pt-5">
          <h2 className="text-xs font-medium text-ink-soft">Where the camp is</h2>

          <Field label="Address">
            <input className={inputClass} value={form.address} onChange={set('address')} />
          </Field>

          {/* Two coordinate boxes used to be here. Almost nobody can answer
              that about their own tent, and a dropped digit puts the camp in
              another province. */}
          <LocationPicker
            lat={form.lat}
            lng={form.lng}
            onChange={({ lat, lng }) => setForm((f) => ({ ...f, lat, lng }))}
          />

          <Field label="Contact phone">
            <input
              className={inputClass}
              value={form.contactPhone}
              onChange={set('contactPhone')}
              placeholder="03211234567"
            />
          </Field>
        </section>

        <section className="mt-5 flex flex-col gap-4 border-t border-line pt-5">
          <h2 className="text-xs font-medium text-ink-soft">Your sign-in</h2>

          <Field label="Full name">
            <input
              className={inputClass}
              value={form.adminFullName}
              onChange={set('adminFullName')}
            />
          </Field>

          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Email">
              <input
                type="email"
                className={inputClass}
                value={form.adminEmail}
                onChange={set('adminEmail')}
              />
            </Field>
            <Field label="Password" hint="At least 8 characters">
              <input
                type="password"
                className={inputClass}
                value={form.adminPassword}
                onChange={set('adminPassword')}
              />
            </Field>
          </div>
        </section>

        <button type="submit" disabled={submitting} className={`${submitClass} mt-5`}>
          {submitting ? (<><Loader2 size={16} className="animate-spin" /> Submitting…</>) : 'Register camp'}
        </button>
      </form>
    </AuthShell>
  );
}

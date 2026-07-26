import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Loader2, X } from 'lucide-react';

import { registerCamp } from '../api/v2';

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

function Field({ label, hint, children }) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-ink-soft">{label}</span>
      {children}
      {hint && <span className="block text-[11px] text-ink-faint mt-1">{hint}</span>}
    </label>
  );
}

const inputClass =
  'mt-1 w-full h-10 px-3 rounded-lg border border-line text-sm focus:outline-none focus:border-info';

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
      <div className="min-h-screen bg-page grid place-items-center p-6">
        <div className="v2-card p-8 max-w-md w-full text-center">
          <CheckCircle2 size={40} className="text-ready mx-auto mb-3" />
          <h1 className="text-lg font-semibold">Registration received</h1>
          <p className="text-sm text-ink-muted mt-2">
            Your camp will appear to patients after approval.
          </p>
          <p className="text-sm text-ink-soft mt-4">
            Sign in later with <span className="font-medium">{form.adminEmail}</span> to check your
            approval status.
          </p>
          <Link
            to="/login"
            className="inline-block mt-6 h-10 px-5 leading-10 rounded-lg bg-info text-white text-sm font-medium"
          >
            Go to sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-page py-10 px-4">
      <form onSubmit={submit} className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-xl font-semibold">Register a Medical Camp</h1>
          <p className="text-sm text-ink-muted mt-1">
            Free health camps appear in the ResQPK app for nearby patients during your camp dates.
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-critical-tint border border-critical/30 px-4 py-3 text-sm text-critical">
            {error}
          </div>
        )}

        {/* Camp */}
        <section className="v2-card p-5 mb-4 flex flex-col gap-4">
          <h2 className="font-semibold">Camp details</h2>

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
                className="flex-1 h-10 px-3 rounded-lg border border-line text-sm focus:outline-none focus:border-info"
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
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-info-tint text-info text-[11px] font-medium"
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
        <section className="v2-card p-5 mb-4 flex flex-col gap-4">
          <h2 className="font-semibold">Location</h2>

          <Field label="Address">
            <input className={inputClass} value={form.address} onChange={set('address')} />
          </Field>

          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Latitude" hint="From Google Maps: long-press the spot">
              <input
                className={inputClass}
                value={form.lat}
                onChange={set('lat')}
                placeholder="25.3960"
              />
            </Field>
            <Field label="Longitude">
              <input
                className={inputClass}
                value={form.lng}
                onChange={set('lng')}
                placeholder="68.3578"
              />
            </Field>
          </div>

          <Field label="Contact phone">
            <input
              className={inputClass}
              value={form.contactPhone}
              onChange={set('contactPhone')}
              placeholder="03211234567"
            />
          </Field>
        </section>

        {/* Login */}
        <section className="v2-card p-5 mb-4 flex flex-col gap-4">
          <h2 className="font-semibold">Camp admin login</h2>
          <p className="text-xs text-ink-muted -mt-2">
            Use this to sign in and check your approval status.
          </p>

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

        <div className="flex items-center justify-between gap-4">
          <Link to="/login" className="text-sm text-ink-muted hover:text-ink">
            Back to sign in
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="h-11 px-6 rounded-lg bg-info text-white text-sm font-semibold inline-flex items-center gap-2 disabled:opacity-50"
          >
            {submitting && <Loader2 size={15} className="animate-spin" />}
            Register camp
          </button>
        </div>
      </form>
    </div>
  );
}

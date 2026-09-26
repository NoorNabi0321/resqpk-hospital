import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, LogIn } from 'lucide-react';

import useAuthStore from '../stores/authStore';
import AuthShell, { Field, inputClass, submitClass } from '../components/auth/AuthShell';

/**
 * One door for everyone who works on this side of ResQPK.
 *
 * Hospitals, medical camps and ResQPK administrators all sign in here with an
 * email. The screen no longer says "Hospital Dashboard", because two of those
 * three are not hospitals and the wording left camps wondering whether they
 * were in the wrong place. Where each lands is decided by the account, not by
 * a tab they have to pick correctly.
 */
export default function LoginPage() {
  const navigate = useNavigate();
  const { login, isLoading, error } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const ok = await login(email, password);
    // Home works out hospital, camp or admin from the account itself.
    if (ok) navigate('/');
  };

  return (
    <AuthShell
      title="Sign in"
      subtitle="For hospitals, medical camps and ResQPK staff"
      footer={
        <>
          New here?{' '}
          <Link to="/register" className="font-medium text-brand-ink hover:underline">
            Register your hospital or camp
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Email">
          <input
            type="email"
            required
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@hospital.org"
            className={inputClass}
          />
        </Field>

        <Field label="Password">
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className={`${inputClass} pr-11`}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-faint hover:text-ink-soft"
            >
              {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
          </div>
        </Field>

        {error && (
          <div className="rounded-lg border border-critical/30 bg-critical-tint px-3 py-2.5">
            <p className="text-[13px] text-critical">{error}</p>
          </div>
        )}

        <button type="submit" disabled={isLoading} className={submitClass}>
          {isLoading ? 'Signing in…' : (<><LogIn size={17} /> Sign in</>)}
        </button>
      </form>
    </AuthShell>
  );
}

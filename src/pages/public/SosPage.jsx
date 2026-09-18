import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Phone, MapPin, Loader2, ArrowRight, ShieldAlert } from 'lucide-react';

import { triggerSos, lookupByCode } from '../../api/public';
import { rememberCase, recentCases, shareTokenFromUrl } from '../../lib/publicStorage';

const PK_PHONE = /^(\+?92\d{10}|03\d{9})$/;

/**
 * Zero-install emergency request.
 *
 * The one channel where location really is automatic: the browser gives
 * coordinates after a single permission prompt, which is something WhatsApp
 * cannot do. No account, no download — a link or a QR code is the whole
 * onboarding.
 */
export default function SosPage() {
  const navigate = useNavigate();
  const [stage, setStage] = useState('idle'); // idle | locating | form | sending
  const [position, setPosition] = useState(null);
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [forSelf, setForSelf] = useState(true);
  const [error, setError] = useState(null);
  const [code, setCode] = useState('');
  const recent = recentCases();

  function askForLocation() {
    setError(null);
    if (!navigator.geolocation) {
      setError('This browser cannot share location. Please call 1122.');
      return;
    }
    setStage('locating');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPosition({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: Math.round(pos.coords.accuracy),
        });
        setStage('form');
      },
      (err) => {
        setStage('idle');
        setError(
          err.code === err.PERMISSION_DENIED
            ? 'Location permission is needed to send an ambulance. Allow it and try again, or call 1122 now.'
            : 'Could not get your location. Move to an open area and try again, or call 1122.',
        );
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 30000 },
    );
  }

  async function submit(e) {
    e.preventDefault();
    if (!PK_PHONE.test(phone.trim())) {
      setError('Enter a valid phone number, for example 03001234567.');
      return;
    }
    setStage('sending');
    setError(null);
    try {
      const result = await triggerSos({
        lat: position.lat,
        lng: position.lng,
        accuracy: position.accuracy,
        reporterPhone: phone.trim(),
        reporterName: name.trim() || null,
        reportedFor: forSelf ? 'self' : 'other',
      });

      const shareToken = shareTokenFromUrl(result.trackingUrl);
      rememberCase({
        caseId: result.caseId,
        caseToken: result.caseToken,
        accessCode: result.accessCode,
        caseNumber: result.caseNumber,
        shareToken,
      });
      navigate(shareToken ? `/t/${shareToken}` : `/c/${result.caseId}`, { replace: true });
    } catch (err) {
      setStage('form');
      setError(err.response?.data?.message || 'Could not send the request. Call 1122 now.');
    }
  }

  async function openByCode(e) {
    e.preventDefault();
    setError(null);
    try {
      const found = await lookupByCode(code.trim());
      rememberCase({
        caseId: found.caseId,
        caseToken: found.caseToken,
        accessCode: code.trim(),
        caseNumber: found.caseNumber,
      });
      navigate(`/c/${found.caseId}`);
    } catch (err) {
      setError(
        err.response?.status === 429
          ? 'Too many attempts. Wait a minute and try again.'
          : 'No request found for that code.',
      );
    }
  }

  return (
    <div className="min-h-screen bg-page flex justify-center">
      <div className="w-full max-w-[480px] bg-card min-h-screen flex flex-col shadow-card">
        <header className="px-5 py-4 border-b border-line">
          <p className="font-bold text-lg text-ink">ResQPK</p>
          <p className="text-[13px] text-ink-muted">Emergency ambulance — Hyderabad, Sindh</p>
        </header>

        <main className="flex-1 px-5 py-6 flex flex-col items-center">
          {stage === 'form' ? (
            <form onSubmit={submit} className="w-full space-y-5">
              <div className="flex items-start gap-2 rounded-card bg-ready-tint border border-ready/30 p-3">
                <MapPin size={18} className="text-ready mt-0.5 shrink-0" />
                <div className="text-[13px] text-ink-soft">
                  <p className="font-semibold text-ink">Location found</p>
                  <p>Accurate to about {position.accuracy} m</p>
                </div>
              </div>

              <div>
                <label htmlFor="phone" className="block text-[13px] font-semibold text-ink mb-1.5">
                  Your phone number
                </label>
                <input
                  id="phone"
                  type="tel"
                  inputMode="tel"
                  autoFocus
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="03001234567"
                  className="w-full rounded-card border border-line px-3.5 py-3 text-[15px] focus:outline-none focus:ring-2 focus:ring-info/40"
                />
                <p className="text-[12px] text-ink-muted mt-1.5">
                  The ambulance crew calls this number if they cannot find you.
                </p>
              </div>

              <div>
                <label htmlFor="name" className="block text-[13px] font-semibold text-ink mb-1.5">
                  Your name <span className="font-normal text-ink-faint">(optional)</span>
                </label>
                <input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-card border border-line px-3.5 py-3 text-[15px] focus:outline-none focus:ring-2 focus:ring-info/40"
                />
              </div>

              <div>
                <p className="text-[13px] font-semibold text-ink mb-1.5">Who needs help?</p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: 'Me', value: true },
                    { label: 'Someone else', value: false },
                  ].map((opt) => (
                    <button
                      key={opt.label}
                      type="button"
                      onClick={() => setForSelf(opt.value)}
                      className={`rounded-card border px-3 py-3 text-[14px] font-medium transition ${
                        forSelf === opt.value
                          ? 'border-info bg-info-tint text-info'
                          : 'border-line text-ink-soft'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {error && <p className="text-[13px] text-critical">{error}</p>}

              <button
                type="submit"
                disabled={stage === 'sending'}
                className="w-full rounded-card bg-critical text-white font-semibold py-4 text-[16px] disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {stage === 'sending' ? (
                  <>
                    <Loader2 size={18} className="animate-spin" /> Sending…
                  </>
                ) : (
                  <>Send ambulance</>
                )}
              </button>
              <button
                type="button"
                onClick={() => setStage('idle')}
                className="w-full text-[13px] text-ink-muted py-1"
              >
                Cancel
              </button>
            </form>
          ) : (
            <>
              <button
                type="button"
                onClick={askForLocation}
                disabled={stage === 'locating'}
                className="mt-6 w-[200px] h-[200px] rounded-full bg-critical text-white font-bold text-[28px] shadow-card-hover active:scale-95 transition disabled:opacity-70 flex flex-col items-center justify-center gap-1"
              >
                {stage === 'locating' ? (
                  <>
                    <Loader2 size={40} className="animate-spin" />
                    <span className="text-[14px] font-medium">Finding you…</span>
                  </>
                ) : (
                  <>
                    SOS
                    <span className="text-[13px] font-medium opacity-90">Tap for ambulance</span>
                  </>
                )}
              </button>

              <p className="text-[13px] text-ink-muted mt-5 text-center max-w-[300px]">
                No app, no sign-up. Your location is shared once, only with the responding crew.
              </p>

              {error && (
                <div className="mt-5 w-full flex items-start gap-2 rounded-card bg-critical-tint border border-critical/30 p-3">
                  <ShieldAlert size={18} className="text-critical mt-0.5 shrink-0" />
                  <p className="text-[13px] text-ink-soft">{error}</p>
                </div>
              )}

              {recent.length > 0 && (
                <div className="w-full mt-8">
                  <p className="text-[13px] font-semibold text-ink mb-2">Your recent requests</p>
                  <div className="space-y-2">
                    {recent.map((c) => (
                      <button
                        key={c.caseId}
                        onClick={() => navigate(c.shareToken ? `/t/${c.shareToken}` : `/c/${c.caseId}`)}
                        className="w-full flex items-center justify-between rounded-card border border-line px-3.5 py-3 text-left"
                      >
                        <span>
                          <span className="block text-[14px] font-medium text-ink">
                            {c.caseNumber || 'Request'}
                          </span>
                          <span className="block text-[12px] text-ink-muted">{c.accessCode}</span>
                        </span>
                        <ArrowRight size={16} className="text-ink-faint" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <form onSubmit={openByCode} className="w-full mt-8">
                <label htmlFor="code" className="block text-[13px] font-semibold text-ink mb-1.5">
                  Have a request code?
                </label>
                <div className="flex gap-2">
                  <input
                    id="code"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="RQ-7K2M-9XQ4"
                    className="flex-1 rounded-card border border-line px-3.5 py-2.5 text-[14px] uppercase focus:outline-none focus:ring-2 focus:ring-info/40"
                  />
                  <button
                    type="submit"
                    disabled={code.trim().length < 6}
                    className="rounded-card border border-line px-4 text-[14px] font-medium text-ink-soft disabled:opacity-50"
                  >
                    Open
                  </button>
                </div>
              </form>
            </>
          )}
        </main>

        <footer className="px-5 py-4 border-t border-line text-center">
          <a
            href="tel:1122"
            className="inline-flex items-center gap-2 text-[15px] font-semibold text-ink"
          >
            <Phone size={16} /> Call Rescue 1122
          </a>
          <p className="text-[11px] text-ink-faint mt-1">
            Edhi 115 · Chhipa 1020 · Police 15
          </p>
        </footer>
      </div>
    </div>
  );
}

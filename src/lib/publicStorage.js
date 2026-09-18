// Remembering a request on the device that raised it.
//
// Someone with no account still needs to find their ambulance after closing the
// tab. The case token and request code live here; nothing else does. This is a
// convenience, not a security boundary — the server authorises every call.
const KEY = 'resqpk_public_cases';
const MAX_KEPT = 5;

function read() {
  try {
    const raw = localStorage.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return []; // private mode, cleared storage, corrupted value
  }
}

function write(list) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list.slice(0, MAX_KEPT)));
  } catch {
    /* storage unavailable — the page still works, it just forgets */
  }
}

export function rememberCase({ caseId, caseToken, accessCode, caseNumber, shareToken }) {
  if (!caseId) return;
  const others = read().filter((c) => c.caseId !== caseId);
  write([
    { caseId, caseToken, accessCode, caseNumber, shareToken, savedAt: new Date().toISOString() },
    ...others,
  ]);
}

export function recentCases() {
  // Tokens last 24 hours; older entries would only produce confusing 401s.
  const cutoff = Date.now() - 24 * 3600 * 1000;
  return read().filter((c) => new Date(c.savedAt).getTime() > cutoff);
}

export function forgetCase(caseId) {
  write(read().filter((c) => c.caseId !== caseId));
}

/** The share token out of a tracking URL, whatever host the backend used. */
export function shareTokenFromUrl(trackingUrl) {
  if (!trackingUrl) return null;
  const match = String(trackingUrl).match(/\/t\/([A-Za-z0-9]+)/);
  return match ? match[1] : null;
}

export default { rememberCase, recentCases, forgetCase, shareTokenFromUrl };

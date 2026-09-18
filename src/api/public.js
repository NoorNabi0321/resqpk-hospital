// API calls for the public pages — no account, no login.
//
// Deliberately NOT api/client.js: that instance redirects to /login on a 401,
// which is exactly the wrong behaviour on a page nobody is expected to log into.
// Access here is proved by a case token, and the pages handle their own errors.
import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const publicClient = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
});

const withToken = (caseToken) => ({ headers: { Authorization: `Bearer ${caseToken}` } });
const unwrap = (res) => res.data?.data;

/** Raise an emergency. No account; a callback number is required instead. */
export async function triggerSos({ lat, lng, accuracy, reporterPhone, reporterName, reportedFor, address }) {
  const res = await publicClient.post('/api/sos/trigger', {
    lat,
    lng,
    accuracy,
    reporterPhone,
    reporterName: reporterName || null,
    reportedFor: reportedFor || 'self',
    address: address || null,
    channel: 'web',
  });
  return unwrap(res);
}

/** Open a tracking link: returns the case snapshot plus a fresh case token. */
export async function fetchTracking(shareToken) {
  return unwrap(await publicClient.get(`/api/cases/track/${shareToken}`));
}

/** Exchange a typed request code for a case token. Rate limited server-side. */
export async function lookupByCode(accessCode) {
  return unwrap(await publicClient.post('/api/cases/lookup', { accessCode }));
}

export async function fetchCase(caseId, caseToken) {
  return unwrap(await publicClient.get(`/api/cases/${caseId}`, withToken(caseToken)));
}

export async function cancelCase(caseId, caseToken, reason = 'changed_mind') {
  return unwrap(await publicClient.post('/api/sos/cancel', { caseId, reason }, withToken(caseToken)));
}

export async function fetchReport(caseId, caseToken) {
  try {
    return unwrap(await publicClient.get(`/api/ai/report/${caseId}`, withToken(caseToken)));
  } catch (err) {
    if (err.response?.status === 404) return null; // no report yet is normal
    throw err;
  }
}

/**
 * Add clinical detail to a running case: a typed description, a voice note, a
 * photo, or any combination. Goes through the same pipeline the app uses.
 */
export async function submitDetails({ caseId, caseToken, text, audioBlob, imageFile }) {
  const form = new FormData();
  form.append('case_id', caseId);
  if (text) form.append('text', text);
  if (audioBlob) form.append('voice_note', audioBlob, 'voice-note.webm');
  if (imageFile) form.append('images', imageFile, imageFile.name || 'photo.jpg');

  const res = await publicClient.post('/api/ai/report', form, {
    headers: { Authorization: `Bearer ${caseToken}` }, // let the browser set the boundary
    timeout: 120000, // transcription plus the model
  });
  return unwrap(res);
}

export default {
  triggerSos,
  fetchTracking,
  lookupByCode,
  fetchCase,
  cancelCase,
  fetchReport,
  submitDetails,
};

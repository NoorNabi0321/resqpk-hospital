// Audio + tab-title alerts for the Incoming screen.
//
// Tones are synthesised with the Web Audio API rather than shipped as files:
// no asset to load, no CDN, and it works offline. One distinct chime for a new
// ambulance, a softer tick for a new report or message, silence for the rest.

let audioContext = null;
let muted = false;

function getContext() {
  if (typeof window === 'undefined') return null;
  const Ctx = window.AudioContext || window.webkitAudioContext;
  if (!Ctx) return null;
  if (!audioContext) audioContext = new Ctx();
  // Browsers suspend audio until the user interacts with the page.
  if (audioContext.state === 'suspended') audioContext.resume().catch(() => {});
  return audioContext;
}

export function setMuted(value) {
  muted = !!value;
  try {
    localStorage.setItem('resqpk_muted', muted ? '1' : '0');
  } catch {
    /* storage unavailable — mute stays in memory only */
  }
}

export function isMuted() {
  if (typeof localStorage === 'undefined') return muted;
  return localStorage.getItem('resqpk_muted') === '1';
}

// One tone. `when` is an offset in seconds so tones can be sequenced.
function tone(ctx, { frequency, start, duration, peak = 0.18 }) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const at = ctx.currentTime + start;

  osc.type = 'sine';
  osc.frequency.setValueAtTime(frequency, at);

  // Short attack, exponential release — a chime, not a beep.
  gain.gain.setValueAtTime(0.0001, at);
  gain.gain.exponentialRampToValueAtTime(peak, at + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, at + duration);

  osc.connect(gain).connect(ctx.destination);
  osc.start(at);
  osc.stop(at + duration + 0.02);
}

/** Two-tone rising chime (~0.4s) — a new ambulance is incoming. */
export function playNewCaseChime() {
  if (isMuted()) return;
  const ctx = getContext();
  if (!ctx) return;
  try {
    tone(ctx, { frequency: 660, start: 0, duration: 0.18, peak: 0.2 });
    tone(ctx, { frequency: 880, start: 0.16, duration: 0.24, peak: 0.2 });
  } catch {
    /* audio is a nicety, never break the screen for it */
  }
}

/** Single soft tone — a new report or message arrived. */
export function playSoftTick() {
  if (isMuted()) return;
  const ctx = getContext();
  if (!ctx) return;
  try {
    tone(ctx, { frequency: 520, start: 0, duration: 0.14, peak: 0.09 });
  } catch {
    /* ignore */
  }
}

// --- tab title ---------------------------------------------------------------

const BASE_TITLE = 'ResQPK Hospital';
let restoreBound = false;

function restoreTitle() {
  document.title = BASE_TITLE;
}

/**
 * Marks the tab so a receptionist looking at another window notices.
 * Clears when the window regains focus, or immediately when count is 0.
 */
export function flashTabTitle(count) {
  if (typeof document === 'undefined') return;
  if (!count) {
    restoreTitle();
    return;
  }

  document.title = `(${count}) Incoming — ResQPK`;

  if (!restoreBound) {
    window.addEventListener('focus', restoreTitle);
    restoreBound = true;
  }
}

export default { playNewCaseChime, playSoftTick, flashTabTitle, setMuted, isMuted };

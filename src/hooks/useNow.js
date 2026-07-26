import { useEffect, useState } from 'react';

/**
 * One shared clock for every ticking ETA on a screen. Lifting the interval to
 * the list (instead of one timer per card) keeps a busy Incoming view cheap.
 */
export default function useNow(intervalMs = 1000) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);

  return now;
}

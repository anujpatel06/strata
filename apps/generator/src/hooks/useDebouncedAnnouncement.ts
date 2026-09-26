import { useEffect, useRef, useState } from 'react';

/**
 * Returns `message` for an aria-live region, but only after it has been stable for `delayMs`.
 * The initial message is not announced, so screen readers don't hear a status on page load.
 */
export function useDebouncedAnnouncement(message: string, delayMs = 500): string {
  const [announced, setAnnounced] = useState('');
  const initial = useRef(message);
  const changed = useRef(false);

  useEffect(() => {
    if (!changed.current && message === initial.current) return;
    changed.current = true;
    const timer = window.setTimeout(() => setAnnounced(message), delayMs);
    return () => window.clearTimeout(timer);
  }, [message, delayMs]);

  return announced;
}

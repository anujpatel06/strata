'use client';

import { IconAlertTriangle, IconCheck, IconCircleCheck, IconLink } from '@tabler/icons-react';
import { Button } from '@strata/react';
import { useEffect, useState } from 'react';
import { plural } from './format';
import { useDebouncedAnnouncement, useThemes } from './themes-provider';
import styles from './themes.module.css';

/** "6 inputs → 316 tokens · 7.9 ms · 78/78 checks pass", plus a polite live region for changes. */
export function ThemeStats() {
  const { theme } = useThemes();
  const { summary } = theme;
  const allPass = summary.failed === 0;
  const announcement = useDebouncedAnnouncement(
    `Theme updated: ${summary.passed} of ${summary.checks} checks pass, ${plural(summary.adjustments, 'adjustment')} by the solver.`,
  );
  return (
    <>
      <p className={styles.stats}>
        <span className={styles.statsIcon} data-pass={allPass || undefined} aria-hidden="true">
          {allPass ? <IconCircleCheck stroke={1.75} /> : <IconAlertTriangle stroke={1.75} />}
        </span>
        <span>
          6 inputs <span aria-hidden="true">→</span>
          <span className="visually-hidden"> generate</span> {summary.tokenCount} tokens
        </span>
        <span className={styles.statsSep} aria-hidden="true">
          ·
        </span>
        {/* Measured with performance.now() on each render, so server and browser differ. */}
        <span suppressHydrationWarning>{`${summary.generationMs.toFixed(1)} ms`}</span>
        <span className={styles.statsSep} aria-hidden="true">
          ·
        </span>
        <span>
          {summary.passed}/{summary.checks} checks pass
        </span>
      </p>
      <CopyLink />
      <p className="visually-hidden" role="status" aria-live="polite" aria-atomic="true">
        {announcement}
      </p>
    </>
  );
}

/** Every input lives in the query string, so the address is the theme. */
function CopyLink() {
  const [state, setState] = useState<'idle' | 'copied' | 'blocked'>('idle');
  useEffect(() => {
    if (state !== 'copied') return;
    const t = window.setTimeout(() => setState('idle'), 1600);
    return () => window.clearTimeout(t);
  }, [state]);
  const copy = async () => {
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard API unavailable');
      await navigator.clipboard.writeText(window.location.href);
      setState('copied');
    } catch {
      setState('blocked');
    }
  };
  return (
    <>
      <Button variant="ghost" size="sm" onPress={copy} className={styles.copyLink}>
        {state === 'copied' ? <IconCheck aria-hidden stroke={2} /> : <IconLink aria-hidden stroke={1.75} />}
        {state === 'copied' ? 'Link copied' : 'Copy link'}
      </Button>
      <p className="visually-hidden" role="status" aria-live="polite">
        {state === 'copied' ? 'Link to this theme copied.' : state === 'blocked' ? 'The clipboard is blocked here. Copy the address bar instead — it holds every input.' : ''}
      </p>
    </>
  );
}

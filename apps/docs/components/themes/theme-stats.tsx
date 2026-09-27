'use client';

import { IconAlertTriangle, IconCheck, IconCircleCheck, IconLink } from '@strata/icons';
import { Button } from '@strata/react';
import { useEffect, useState } from 'react';
import { plural } from './format';
import { useDebouncedAnnouncement, useThemes } from './themes-provider';
import styles from './themes.module.css';

/** The theme in three figures (checks passed, tokens, generation time), plus a polite live region for changes. */
export function ThemeStats() {
  const { theme } = useThemes();
  const { summary } = theme;
  const allPass = summary.failed === 0;
  const announcement = useDebouncedAnnouncement(
    `Theme updated: ${summary.passed} of ${summary.checks} checks pass, ${plural(summary.adjustments, 'adjustment')} by the solver.`,
  );
  return (
    <>
      {/* Three figures, set as numbers: the pass count leads, because it's the promise. Status is icon + words. */}
      <dl className={styles.stats}>
        <div className={styles.stat} data-lead>
          <dt className={styles.statLabel}>
            <span className={styles.statsIcon} data-pass={allPass || undefined} aria-hidden="true">
              {allPass ? <IconCircleCheck /> : <IconAlertTriangle />}
            </span>
            {allPass ? 'Contrast checks pass' : 'Contrast checks'}
          </dt>
          <dd className={styles.statValue}>
            {summary.passed}
            <span className={styles.statOf}>/{summary.checks}</span>
          </dd>
        </div>
        <div className={styles.stat}>
          <dt className={styles.statLabel}>Tokens from 6 inputs</dt>
          <dd className={styles.statValue}>{summary.tokenCount}</dd>
        </div>
        <div className={styles.stat}>
          <dt className={styles.statLabel}>To generate</dt>
          {/* Measured with performance.now() on each render, so server and browser differ. */}
          <dd className={styles.statValue} suppressHydrationWarning>
            {summary.generationMs.toFixed(1)}
            <span className={styles.statOf}> ms</span>
          </dd>
        </div>
      </dl>
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
        {state === 'copied' ? <IconCheck aria-hidden stroke={2} /> : <IconLink aria-hidden />}
        {state === 'copied' ? 'Link copied' : 'Copy link'}
      </Button>
      <p className="visually-hidden" role="status" aria-live="polite">
        {state === 'copied' ? 'Link to this theme copied.' : state === 'blocked' ? 'The clipboard is blocked here. Copy the address bar instead — it holds every input.' : ''}
      </p>
    </>
  );
}

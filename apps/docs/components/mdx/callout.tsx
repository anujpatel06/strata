import { Alert, type AlertTone } from '@strata/react';
import type { ReactNode } from 'react';
import styles from './prose.module.css';

/** A note in running text — Strata's Alert, with the prose spacing. */
export function Callout({ tone = 'neutral', title, children }: { tone?: AlertTone; title?: ReactNode; children?: ReactNode }) {
  return (
    <Alert tone={tone} title={title} className={styles.callout}>
      {children}
    </Alert>
  );
}

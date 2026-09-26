'use client';

import type { HTMLAttributes, JSX, Ref } from 'react';
import { VisuallyHidden } from 'react-aria-components';
import styles from './spinner.module.css';

const cx = (...c: Array<string | false | null | undefined>) => c.filter(Boolean).join(' ');

export interface SpinnerProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'role'> {
  size?: 'sm' | 'md' | 'lg';
  /** Announced to screen readers (role="status"). Not shown. */
  label?: string;
  ref?: Ref<HTMLSpanElement>;
}

/** An indeterminate loading indicator in the current text colour. */
export function Spinner({ size = 'md', label = 'Loading', className, ...rest }: SpinnerProps): JSX.Element {
  return (
    <span {...rest} role="status" data-size={size} className={cx(styles.spinner, className)}>
      <svg className={styles.svg} viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">
        <circle className={styles.track} cx="12" cy="12" r="9.5" />
        <circle className={styles.arc} cx="12" cy="12" r="9.5" pathLength="100" />
      </svg>
      <VisuallyHidden elementType="span">{label}</VisuallyHidden>
    </span>
  );
}

'use client';

import type { CSSProperties, HTMLAttributes, JSX, Ref } from 'react';
import { VisuallyHidden } from 'react-aria-components';
import styles from './spinner.module.css';

const cx = (...c: Array<string | false | null | undefined>) => c.filter(Boolean).join(' ');

export interface SpinnerProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'role'> {
  size?: 'sm' | 'md' | 'lg';
  /** Announced to screen readers (role="status"). Not shown. */
  label?: string;
  ref?: Ref<HTMLSpanElement>;
}

/** Eight spokes at 45° steps. `trail` is how many steps a spoke sits behind the bright head (spoke 0). */
const SPOKES = Array.from({ length: 8 }, (_, i) => ({ i, trail: (8 - i) % 8 }));

/**
 * An indeterminate loading indicator in the current text colour: eight spokes whose brightness chases
 * round the dial (the Apple / Geist activity indicator). Only opacity animates, so it stays alive with
 * reduced motion on — nothing rotates.
 */
export function Spinner({ size = 'md', label = 'Loading', className, ...rest }: SpinnerProps): JSX.Element {
  return (
    <span {...rest} role="status" data-size={size} className={cx(styles.spinner, className)}>
      <svg className={styles.svg} viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">
        {SPOKES.map(({ i, trail }) => (
          <line
            key={i}
            className={styles.spoke}
            x1="12"
            y1="2.75"
            x2="12"
            y2="7.25"
            transform={`rotate(${i * 45} 12 12)`}
            style={{ '--_i': i, '--_trail': trail } as CSSProperties}
          />
        ))}
      </svg>
      <VisuallyHidden elementType="span">{label}</VisuallyHidden>
    </span>
  );
}

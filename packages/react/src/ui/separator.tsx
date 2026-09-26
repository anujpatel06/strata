'use client';

import type { JSX, ReactNode, Ref } from 'react';
import { Separator as AriaSeparator, type SeparatorProps as AriaSeparatorProps } from 'react-aria-components';
import styles from './separator.module.css';

const cx = (...c: Array<string | false | null | undefined>) => c.filter(Boolean).join(' ');

export interface SeparatorProps extends Omit<AriaSeparatorProps, 'className'> {
  className?: string;
  /**
   * Text in the middle of a horizontal rule, e.g. "or". A labelled divider is read as its text,
   * not announced as a separator, so keep the label meaningful on its own.
   */
  label?: ReactNode;
  ref?: Ref<HTMLElement>;
}

/** A hairline between groups of content. Horizontal by default. */
export function Separator({ label, orientation = 'horizontal', className, ref, ...rest }: SeparatorProps): JSX.Element {
  if (label != null && label !== false && orientation === 'horizontal') {
    const data = Object.fromEntries(Object.entries(rest).filter(([key]) => key.startsWith('data-')));
    return (
      <div {...data} id={rest.id} style={rest.style} ref={ref as Ref<HTMLDivElement>} className={cx(styles.labelled, className)}>
        <span className={styles.line} aria-hidden="true" />
        <span className={styles.label}>{label}</span>
        <span className={styles.line} aria-hidden="true" />
      </div>
    );
  }
  return <AriaSeparator {...rest} ref={ref} orientation={orientation} className={cx(styles.separator, className)} />;
}

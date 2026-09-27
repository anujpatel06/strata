'use client';

import type { HTMLAttributes, JSX, ReactNode, Ref } from 'react';
import styles from './badge.module.css';

const cx = (...c: Array<string | false | null | undefined>) => c.filter(Boolean).join(' ');

export type BadgeTone = 'neutral' | 'info' | 'success' | 'warning' | 'danger' | 'brand';
export type BadgeVariant = 'soft' | 'solid' | 'outline' | 'status';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  /** Feedback colour. `brand` uses the primary action colours. */
  tone?: BadgeTone;
  /**
   * `soft` = tinted fill, `solid` = strong fill, `outline` = hairline border only,
   * `status` = no chip at all: a small tone-coloured dot and the label in body text ("● Ready to review").
   * The dot is decoration; the label carries the meaning.
   */
  variant?: BadgeVariant;
  size?: 'sm' | 'md';
  /** Leading icon, sized to the text. Decorative — the label carries the meaning. */
  icon?: ReactNode;
  /** Shows a small status dot before the label (e.g. "● Active"). Always on for `variant="status"`. */
  dot?: boolean;
  ref?: Ref<HTMLSpanElement>;
}

/** A short status or count label. Pair tone with a clear word — colour is never the only signal. */
export function Badge({
  tone = 'neutral',
  variant = 'soft',
  size = 'md',
  icon,
  dot = false,
  className,
  children,
  ...rest
}: BadgeProps): JSX.Element {
  return (
    <span
      {...rest}
      data-tone={tone}
      data-variant={variant}
      data-size={size}
      className={cx(styles.badge, className)}
    >
      {(dot || variant === 'status') && <span className={styles.dot} aria-hidden="true" />}
      {icon != null && icon !== false && (
        <span className={styles.icon} aria-hidden="true">
          {icon}
        </span>
      )}
      {children}
    </span>
  );
}

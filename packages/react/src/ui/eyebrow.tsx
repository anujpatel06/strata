'use client';

import type { HTMLAttributes, JSX, ReactNode, Ref } from 'react';
import styles from './eyebrow.module.css';

const cx = (...c: Array<string | false | null | undefined>) => c.filter(Boolean).join(' ');

export interface EyebrowProps extends HTMLAttributes<HTMLElement> {
  /** A short hairline dash before the text, like an editorial kicker. Ignored when `icon` is set. */
  lead?: 'rule';
  /** Decorative icon before the text, sized to the cap height. */
  icon?: ReactNode;
  /** Colours only the rule or icon; the text stays `text.subtle` so it always reads. */
  tone?: 'neutral' | 'brand' | 'accent' | 'info' | 'success' | 'warning' | 'danger';
  /** `p` for a label above a heading or section (default); `span` inside other text or flex rows. */
  as?: 'p' | 'span';
  ref?: Ref<HTMLElement>;
}

/**
 * A small uppercase label with wide tracking that sits above a heading or figure ("— First time here",
 * "Wallet · 2026"). Not a heading: it names a group without adding to the document outline.
 */
export function Eyebrow({
  lead,
  icon,
  tone = 'neutral',
  as: As = 'p',
  className,
  children,
  ref,
  ...rest
}: EyebrowProps): JSX.Element {
  const hasIcon = icon != null && icon !== false;
  return (
    <As
      {...rest}
      ref={ref as Ref<HTMLParagraphElement & HTMLSpanElement>}
      data-tone={tone}
      data-lead={hasIcon ? 'icon' : lead}
      className={cx(styles.eyebrow, className)}
    >
      {hasIcon ? (
        <span className={styles.icon} aria-hidden="true">
          {icon}
        </span>
      ) : (
        lead === 'rule' && <span className={styles.rule} aria-hidden="true" />
      )}
      <span className={styles.text}>{children}</span>
    </As>
  );
}

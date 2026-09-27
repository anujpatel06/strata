'use client';

import type { HTMLAttributes, JSX, ReactNode, Ref } from 'react';
import styles from './tag.module.css';

const cx = (...c: Array<string | false | null | undefined>) => c.filter(Boolean).join(' ');

/**
 * Tag tones. Soft tags put `fg` on `bg`; every pair is one the engine contrast-checks
 * (packages/theme-engine/src/contrast-pairs.json):
 *   neutral  text.subtle on surface.sunken       brand    action.secondary.fg on action.secondary.bg
 *   accent   accent.text on accent.subtle        info/success/warning/danger   feedback.*.fg on feedback.*.bg
 * Outline and dashed tags have no fill, so their text sits on the page: text.default / text.subtle, text.brand,
 * accent.text and feedback.*.fg are each checked against surface.default.
 */
export type TagTone = 'neutral' | 'brand' | 'accent' | 'info' | 'success' | 'warning' | 'danger';
export type TagVariant = 'soft' | 'outline' | 'dashed';

export interface TagProps extends HTMLAttributes<HTMLSpanElement> {
  /** Colour. Category tags usually stay neutral; a tone marks an attribute that matters ("Cashless"). */
  tone?: TagTone;
  /** `soft` = tinted fill (default), `outline` = hairline edge only, `dashed` = a placeholder or optional attribute. */
  variant?: TagVariant;
  /** `md` is 24px tall, `sm` is 20px. */
  size?: 'sm' | 'md';
  /** Small caps style: uppercase, slightly smaller, semibold and tracked open ("CASHLESS"). Keep it to one or two words. */
  uppercase?: boolean;
  /** Leading icon or small Avatar, sized to the text. Decorative: the label carries the meaning. */
  leading?: ReactNode;
  ref?: Ref<HTMLSpanElement>;
}

/**
 * A static label for an attribute or category ("Cashless", "Home collection"). Not interactive.
 * For a status or a count, use Badge.
 */
export function Tag({
  tone = 'neutral',
  variant = 'soft',
  size = 'md',
  uppercase = false,
  leading,
  className,
  children,
  ...rest
}: TagProps): JSX.Element {
  return (
    <span
      {...rest}
      data-tone={tone}
      data-variant={variant}
      data-size={size}
      data-uppercase={uppercase || undefined}
      className={cx(styles.tag, className)}
    >
      {leading != null && leading !== false && (
        <span className={styles.leading} aria-hidden="true">
          {leading}
        </span>
      )}
      <span className={styles.label}>{children}</span>
    </span>
  );
}

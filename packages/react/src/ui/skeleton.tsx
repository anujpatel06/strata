'use client';

import type { CSSProperties, HTMLAttributes, JSX, Ref } from 'react';
import styles from './skeleton.module.css';

const cx = (...c: Array<string | false | null | undefined>) => c.filter(Boolean).join(' ');

/** Numbers are pixels; strings are any CSS length ("60%", "1em", "12rem"). */
type Length = number | string;

export interface SkeletonProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'children'> {
  inlineSize?: Length;
  blockSize?: Length;
  /** Corner radius, from the theme's shape tokens. */
  radius?: 'field' | 'container' | 'pill' | 'badge';
  /** A circle (e.g. an avatar placeholder); `inlineSize` sets the diameter. */
  circle?: boolean;
  ref?: Ref<HTMLSpanElement>;
}

/**
 * A placeholder block shown while content loads. Hidden from assistive technology — mark the
 * loading region with aria-busy="true" instead.
 */
export function Skeleton({
  inlineSize,
  blockSize,
  radius = 'field',
  circle = false,
  className,
  style,
  ...rest
}: SkeletonProps): JSX.Element {
  const size: CSSProperties = {};
  if (inlineSize !== undefined) size.inlineSize = inlineSize;
  if (blockSize !== undefined) size.blockSize = blockSize;
  return (
    <span
      aria-hidden="true"
      {...rest}
      data-radius={circle ? 'pill' : radius}
      data-circle={circle || undefined}
      style={{ ...size, ...style }}
      className={cx(styles.skeleton, className)}
    />
  );
}

export interface SkeletonTextProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'children'> {
  /** Number of lines. The last line is 60% wide. */
  lines?: number;
  ref?: Ref<HTMLSpanElement>;
}

/** Lines of placeholder text that follow the surrounding font size and line height. */
export function SkeletonText({ lines = 3, className, ...rest }: SkeletonTextProps): JSX.Element {
  const count = Math.max(1, Math.floor(lines));
  return (
    <span aria-hidden="true" {...rest} className={cx(styles.text, className)}>
      {Array.from({ length: count }, (_, i) => (
        <span
          key={i}
          className={styles.skeleton}
          data-radius="badge"
          data-line=""
          data-last={i === count - 1 && count > 1 ? '' : undefined}
        />
      ))}
    </span>
  );
}

'use client';

import { useCallback, useId, type CSSProperties, type HTMLAttributes, type JSX, type Ref } from 'react';
import { useLocale } from 'react-aria-components';
import { chartAreaPath, chartColor, chartLinePath, useChartSize } from './chart';
import styles from './sparkline.module.css';

const cx = (...c: Array<string | false | null | undefined>) => c.filter(Boolean).join(' ');

export interface SparklineProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  /** Values, oldest first. Missing values (null) leave a gap. */
  data: Array<number | null>;
  /** `area` adds a gradient fill under the line. */
  variant?: 'area' | 'line';
  curve?: 'smooth' | 'linear';
  /** A ringed dot on the latest value. */
  showEndDot?: boolean;
  /** Colour by meaning. Use `success`/`danger` only when the direction is good or bad news. Ignored when `series` is set. */
  tone?: 'brand' | 'neutral' | 'info' | 'success' | 'warning' | 'danger';
  /** Colour by chart palette slot (1–4), to match a series in a nearby chart. */
  series?: 1 | 2 | 3 | 4;
  /** Fixes the y range; by default the line fills the height. */
  yDomain?: [number, number];
  /**
   * Makes the sparkline an image with this name, e.g. "Revenue, up 12% over 30 days". Without it the sparkline
   * is decorative (aria-hidden), so the numbers beside it must say what matters.
   */
  'aria-label'?: string;
  ref?: Ref<HTMLDivElement>;
}

/** Inset so the 2px stroke and the ringed end dot aren't clipped at the edges. */
const PAD = 4;

/** A small trend line for stat cards and table cells. Fills its box: size it with CSS (default 100% × 32px). */
export function Sparkline({
  data,
  variant = 'area',
  curve = 'smooth',
  showEndDot = true,
  tone = 'brand',
  series,
  yDomain,
  className,
  style,
  'aria-label': ariaLabel,
  ref,
  ...rest
}: SparklineProps): JSX.Element {
  const { direction } = useLocale();
  const isRtl = direction === 'rtl';
  const [boxRef, { width, height }] = useChartSize<HTMLDivElement>();
  const setRef = useCallback(
    (el: HTMLDivElement | null) => {
      boxRef(el);
      if (typeof ref === 'function') ref(el);
      else if (ref) (ref as { current: HTMLDivElement | null }).current = el;
    },
    [boxRef, ref],
  );
  const gradient = `${useId().replace(/[^a-zA-Z0-9_-]/g, '')}-spark`;

  const finite = data.filter((v): v is number => typeof v === 'number' && Number.isFinite(v));
  const [lo, hi] = yDomain ?? [Math.min(...finite), Math.max(...finite)];
  const drawn = width > 0 && height > 0 && finite.length > 1;
  const span = hi - lo;
  const x = (i: number) => PAD + (data.length > 1 ? (i / (data.length - 1)) * (width - PAD * 2) : 0);
  const y = (v: number) => (span ? PAD + (1 - (v - lo) / span) * (height - PAD * 2) : height / 2);
  const points = data.map((v, i) => (typeof v === 'number' && Number.isFinite(v) ? ([x(i), y(v)] as const) : null));
  const mirror = isRtl ? (px: number) => width - px : undefined;
  let last = -1;
  for (let i = data.length - 1; i >= 0 && last < 0; i--) if (points[i]) last = i;
  const end = last >= 0 ? points[last] : null;

  const color = series ? chartColor(series - 1) : undefined;

  return (
    <div
      {...rest}
      ref={setRef}
      role={ariaLabel ? 'img' : undefined}
      aria-label={ariaLabel}
      aria-hidden={ariaLabel ? undefined : true}
      data-tone={color ? undefined : tone}
      className={cx(styles.sparkline, className)}
      style={color ? ({ ...style, '--_c': color } as CSSProperties) : style}
    >
      {drawn && (
        <svg className={styles.svg} width={width} height={height} aria-hidden="true" focusable="false">
          {variant === 'area' && (
            <>
              <defs>
                <linearGradient id={gradient} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" className={styles.stopTop} />
                  <stop offset="100%" className={styles.stopBottom} />
                </linearGradient>
              </defs>
              <path className={styles.area} d={chartAreaPath(points, height, curve, mirror)} fill={`url(#${gradient})`} />
            </>
          )}
          <path className={styles.line} d={chartLinePath(points, curve, mirror)} pathLength={1} />
          {showEndDot && end && <circle className={styles.dot} cx={mirror ? mirror(end[0]) : end[0]} cy={end[1]} r={4} />}
        </svg>
      )}
    </div>
  );
}

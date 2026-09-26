'use client';

import { createContext, useContext, type HTMLAttributes, type JSX, type ReactNode, type Ref } from 'react';
import { useLocale } from 'react-aria-components';
import { IconTrendingDown, IconTrendingUp } from '@tabler/icons-react';
import { Badge } from './badge';
import styles from './stat-tile.module.css';

const cx = (...c: Array<string | false | null | undefined>) => c.filter(Boolean).join(' ');

const MINUS = '−'; // "−": a true minus. Same bidi class as "-", but reads as a number sign, not a hyphen.

const InGroup = createContext(false);

/** Formats a fractional change (0.064 → "+6.4%", −0.032 → "−3.2%", 0 → "0%") in the given locale. */
export function formatDelta(delta: number, locale: string, options?: Intl.NumberFormatOptions): string {
  return new Intl.NumberFormat(locale, {
    style: 'percent',
    maximumFractionDigits: 1,
    signDisplay: 'exceptZero',
    ...options,
  })
    .formatToParts(delta)
    .map((part) => (part.type === 'minusSign' ? part.value.replace('-', MINUS) : part.value))
    .join('');
}

export interface StatTileProps extends HTMLAttributes<HTMLElement> {
  label: ReactNode;
  /** The figure, already formatted (currency, units, compact notation). */
  value: ReactNode;
  /** Change as a fraction: 0.064 = +6.4%. Shown as a coloured pill with a trend icon. */
  delta?: number;
  /** What the change is measured against, e.g. "vs last month". */
  deltaLabel?: ReactNode;
  /** Whether an increase is good news (revenue) or bad news (churn, costs). */
  positiveIsGood?: boolean;
  /** Overrides the delta's Intl.NumberFormat options (default: percent, 1 decimal, signed). */
  deltaFormatOptions?: Intl.NumberFormatOptions;
  /** A quiet line under the value, used instead of a delta ("Updated 5 min ago"). */
  caption?: ReactNode;
  /** Decorative icon at the top inline-end. */
  icon?: ReactNode;
  /** Recent values, oldest first. Drawn as a small line with an area fill. Decorative. */
  sparkline?: number[];
  /** `lg` is for a dashboard's lead figures; `sm` for dense rows. */
  size?: 'sm' | 'md' | 'lg';
  /** Same chrome options as Card. Use `ghost` for tiles inside an existing card. */
  variant?: 'default' | 'outline' | 'ghost';
  ref?: Ref<HTMLElement>;
}

/**
 * One headline number with its label and change. On its own it renders a <dl>; inside a
 * StatTileGroup (a <dl>) each tile is a <div> of <dt>/<dd>, so a row of figures is one list.
 */
export function StatTile({
  label,
  value,
  delta,
  deltaLabel,
  positiveIsGood = true,
  deltaFormatOptions,
  caption,
  icon,
  sparkline,
  size = 'md',
  variant = 'default',
  className,
  ref,
  ...rest
}: StatTileProps): JSX.Element {
  const inGroup = useContext(InGroup);
  const { locale, direction } = useLocale();
  const hasDelta = typeof delta === 'number' && Number.isFinite(delta);
  const Root = inGroup ? 'div' : 'dl';

  let tone: 'neutral' | 'success' | 'danger' = 'neutral';
  if (hasDelta && delta !== 0) tone = delta > 0 === positiveIsGood ? 'success' : 'danger';
  const TrendIcon = hasDelta && delta !== 0 ? (delta > 0 ? IconTrendingUp : IconTrendingDown) : null;

  const has = (node: ReactNode) => node != null && node !== false && node !== '';
  const hasMeta = hasDelta || has(deltaLabel) || has(caption);
  const finite = sparkline?.filter(Number.isFinite) ?? [];
  const points = finite.length > 1 ? finite : null;

  return (
    <Root
      {...rest}
      ref={ref as Ref<HTMLDivElement & HTMLDListElement>}
      data-size={size}
      data-variant={variant}
      data-sparkline={points ? '' : undefined}
      className={cx(styles.tile, className)}
    >
      <dt className={styles.label}>
        <span className={styles.labelText}>{label}</span>
        {has(icon) && (
          <span className={styles.icon} aria-hidden="true">
            {icon}
          </span>
        )}
      </dt>
      <dd className={styles.value}>{value}</dd>
      {hasMeta && (
        <dd className={styles.meta}>
          {hasDelta ? (
            <Badge
              size="sm"
              tone={tone}
              variant="soft"
              className={styles.delta}
              icon={TrendIcon ? <TrendIcon stroke={2} className={styles.trend} /> : undefined}
            >
              {/* Isolated in the locale's own direction, so "+6.4%" never flips to "6.4%+" in RTL pages. */}
              <span dir={direction}>{formatDelta(delta, locale, deltaFormatOptions)}</span>
            </Badge>
          ) : (
            <span className={styles.caption}>{has(caption) ? caption : deltaLabel}</span>
          )}
          {hasDelta && has(deltaLabel) && <span className={styles.deltaLabel}>{deltaLabel}</span>}
        </dd>
      )}
      {points && (
        <dd className={styles.spark} aria-hidden="true">
          <Sparkline values={points} />
        </dd>
      )}
    </Root>
  );
}

/* The SVG coordinate space matches the CSS box (80 × 32, see .sparkSvg), so strokes and the end dot stay crisp. */
const W = 80;
const H = 32;
const PAD = 4;

/** `values` are finite and at least two. */
function Sparkline({ values }: { values: number[] }): JSX.Element {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const coords = values.map((v, i) => {
    const x = PAD + (i / (values.length - 1)) * (W - PAD * 2);
    const y = max === min ? H / 2 : PAD + (1 - (v - min) / range) * (H - PAD * 2);
    return [Math.round(x * 100) / 100, Math.round(y * 100) / 100] as const;
  });
  const line = coords.map(([x, y]) => `${x},${y}`).join(' ');
  const first = coords[0] ?? [PAD, H / 2];
  const last = coords[coords.length - 1] ?? [W - PAD, H / 2];
  const area = `M${first[0]},${H} L${line.replaceAll(' ', ' L')} L${last[0]},${H} Z`;
  return (
    <svg className={styles.sparkSvg} viewBox={`0 0 ${W} ${H}`} focusable="false">
      <path className={styles.sparkArea} d={area} />
      <polyline className={styles.sparkLine} points={line} />
      <circle className={styles.sparkDot} cx={last[0]} cy={last[1]} r="2.5" />
    </svg>
  );
}

export interface StatTileGroupProps extends HTMLAttributes<HTMLDListElement> {
  ref?: Ref<HTMLDListElement>;
}

/** A responsive row of StatTiles, rendered as one <dl>. Columns fill the width, ~220px minimum each. */
export function StatTileGroup({ className, children, ...rest }: StatTileGroupProps): JSX.Element {
  return (
    <InGroup.Provider value={true}>
      <dl {...rest} className={cx(styles.group, className)}>
        {children}
      </dl>
    </InGroup.Provider>
  );
}

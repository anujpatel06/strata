'use client';

import {
  useCallback,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type HTMLAttributes,
  type JSX,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
  type Ref,
} from 'react';
import { ListBox, ListBoxItem, useLocale } from 'react-aria-components';
import styles from './chart.module.css';

/*
 * Shared chart pieces: the legend, the tooltip readout, the data table, and ChartFrame, the plot shell that
 * AreaChart, LineChart and BarChart draw into. SVG only, no chart library.
 *
 * Accessibility model (see meta "accessibility.notes"):
 * - The plot's hit layer is a React Aria ListBox (horizontal): one option per x position, named with its x and
 *   every series value ("Mar: Revenue ₹4.2L, Costs ₹3.1L"). One Tab stop, arrows move, Home/End jump, and React
 *   Aria mirrors the arrows in RTL. Moving focus to an option makes the screen reader read it, so there is no live
 *   region to time. The same options are the pointer hit areas: full-height bands, so the crosshair snaps to the
 *   nearest x and a reader never has to land on a 2px line.
 * - The SVG, axes and tooltip are aria-hidden: they repeat what the options and the table say.
 * - Every chart renders a <table> of its data (visually hidden unless showTable), so no value is gated behind hover.
 */

const cx = (...c: Array<string | false | null | undefined>) => c.filter(Boolean).join(' ');

/* ------------------------------------------------------------------ *
 * Types, colour and formatting
 * ------------------------------------------------------------------ */

export interface ChartSeries {
  /** Key of the value in each data row. */
  key: string;
  /** Shown in the legend, tooltip, table and the accessible names. */
  label: string;
  /** Overrides the palette colour. Pass a token, e.g. `var(--strata-color-text-brand)`. */
  color?: string;
}

export type ChartValueFormat = Intl.NumberFormatOptions | ((value: number, locale: string) => string);
export type ChartXFormat = Intl.DateTimeFormatOptions | ((x: unknown, locale: string) => string);

export interface ChartFormat {
  /** Values in the tooltip, table and accessible names. Default: up to 2 decimals. */
  value?: ChartValueFormat;
  /** Y-axis ticks. Default: `value` in compact notation ("12K") when it's options; `value` itself when it's a function. */
  axis?: ChartValueFormat;
  /** X values. Dates default to "12 Mar"; anything else is shown as a string. */
  x?: ChartXFormat;
}

/**
 * The series colour for a palette slot (0-based). The engine solves `--strata-chart-1..4` per brand and scheme:
 * each ≥ 3:1 on surfaces and colour-blind-safe as a set. The fallbacks only matter for themes built before them.
 * Past 4 series the slots repeat: fold the tail into "Other" instead (see guidelines).
 */
export function chartColor(index: number): string {
  const FALLBACK = [
    'var(--strata-color-text-brand)',
    'var(--strata-color-accent-text)',
    'var(--strata-color-feedback-info-fg)',
    'var(--strata-color-feedback-warning-fg)',
  ];
  const slot = ((index % 4) + 4) % 4;
  return `var(--strata-chart-${slot + 1}, ${FALLBACK[slot]})`;
}

export function formatChartValue(value: number | null | undefined, format: ChartValueFormat | undefined, locale: string): string {
  if (value == null || !Number.isFinite(value)) return '–';
  if (typeof format === 'function') return format(value, locale);
  return new Intl.NumberFormat(locale, { maximumFractionDigits: 2, ...format }).format(value);
}

export function formatChartX(x: unknown, format: ChartXFormat | undefined, locale: string): string {
  if (typeof format === 'function') return format(x, locale);
  if (x instanceof Date) return new Intl.DateTimeFormat(locale, format ?? { day: 'numeric', month: 'short' }).format(x);
  if (format && typeof x === 'number') return new Intl.DateTimeFormat(locale, format).format(new Date(x));
  return x == null ? '' : String(x);
}

/** The y-axis format: compact by default, so ticks stay short ("12K", "₹1.2L"). */
export function chartAxisFormat(format: ChartFormat | undefined): ChartValueFormat {
  if (format?.axis) return format.axis;
  if (typeof format?.value === 'function') return format.value;
  return { notation: 'compact', maximumFractionDigits: 1, ...format?.value };
}

/* ------------------------------------------------------------------ *
 * Scales and paths
 * ------------------------------------------------------------------ */

function tickStep(span: number, count: number): number {
  const raw = span / Math.max(1, count);
  const power = 10 ** Math.floor(Math.log10(raw));
  const error = raw / power;
  const factor = error >= 7.5 ? 10 : error >= 3.5 ? 5 : error >= 1.5 ? 2 : 1;
  return factor * power;
}

/**
 * Round ("nice") ticks covering [min, max]: 0 / 1,000 / 2,000, never 0 / 973 / 1,946.
 * With `exact`, the domain stays [min, max] and only ticks inside it are returned.
 */
export function chartTicks(min: number, max: number, count = 4, exact = false): { domain: [number, number]; ticks: number[] } {
  if (!Number.isFinite(min) || !Number.isFinite(max)) return { domain: [0, 1], ticks: [0, 1] };
  if (min === max) {
    const pad = Math.abs(min) || 1;
    [min, max] = min === 0 ? [0, 1] : min > 0 ? [0, max] : [min, 0];
    if (min === max) [min, max] = [min - pad, max + pad];
  }
  const step = tickStep(max - min, count);
  const lo = exact ? min : Math.floor(min / step) * step;
  const hi = exact ? max : Math.ceil(max / step) * step;
  const ticks: number[] = [];
  const first = Math.ceil(lo / step - 1e-9) * step;
  for (let t = first; t <= hi + step * 1e-9; t += step) ticks.push(Number(t.toPrecision(12)));
  return { domain: [lo, hi], ticks };
}

type Pt = readonly [number, number];
const r2 = (n: number) => Math.round(n * 100) / 100;

/**
 * Monotone cubic interpolation (Fritsch–Carlson, as in d3's curveMonotoneX): smooth, but it never overshoots
 * the data. A value that stays flat draws flat, and a peak is never drawn higher than it was.
 */
function monotoneSegments(p: readonly Pt[]): string {
  const n = p.length;
  const h: number[] = [];
  const s: number[] = [];
  for (let i = 0; i < n - 1; i++) {
    const dx = p[i + 1]![0] - p[i]![0];
    h.push(dx);
    s.push(dx ? (p[i + 1]![1] - p[i]![1]) / dx : 0);
  }
  const t: number[] = new Array(n).fill(0);
  for (let i = 1; i < n - 1; i++) {
    const s0 = s[i - 1]!;
    const s1 = s[i]!;
    const h0 = h[i - 1]!;
    const h1 = h[i]!;
    const q = (s0 * h1 + s1 * h0) / (h0 + h1 || 1);
    t[i] = (Math.sign(s0) + Math.sign(s1)) * Math.min(Math.abs(s0), Math.abs(s1), 0.5 * Math.abs(q)) || 0;
  }
  t[0] = n > 2 ? (3 * s[0]! - t[1]!) / 2 : s[0]!;
  t[n - 1] = n > 2 ? (3 * s[n - 2]! - t[n - 2]!) / 2 : s[n - 2]!;
  let d = '';
  for (let i = 0; i < n - 1; i++) {
    const [x0, y0] = p[i]!;
    const [x1, y1] = p[i + 1]!;
    const dx = h[i]! / 3;
    d += `C${r2(x0 + dx)},${r2(y0 + t[i]! * dx)},${r2(x1 - dx)},${r2(y1 - t[i + 1]! * dx)},${r2(x1)},${r2(y1)}`;
  }
  return d;
}

/** Splits at missing values: a gap in the data is a gap in the line, never an invented zero. */
function runs(points: ReadonlyArray<Pt | null>): Pt[][] {
  const out: Pt[][] = [];
  let run: Pt[] = [];
  for (const p of points) {
    if (p) run.push(p);
    else if (run.length) (out.push(run), (run = []));
  }
  if (run.length) out.push(run);
  return out;
}

function runPath(run: readonly Pt[], curve: 'smooth' | 'linear', mirror: (x: number) => number): string {
  const first = run[0]!;
  // Interpolate in logical (left-to-right) space, then mirror: the curve is the same shape in RTL.
  const body = curve === 'smooth' && run.length > 2 ? monotoneSegments(run) : run.slice(1).map(([x, y]) => `L${r2(x)},${r2(y)}`).join('');
  const d = `M${r2(first[0])},${r2(first[1])}${run.length === 1 ? 'h0' : body}`;
  return mirror === identity ? d : mirrorPath(d, mirror);
}

const identity = (x: number) => x;
function mirrorPath(d: string, mirror: (x: number) => number): string {
  // Every command above is absolute with x,y pairs, except "h0". Mirror each x.
  return d.replace(/([MLC])([^MLCh]+)/g, (_, cmd: string, args: string) => {
    const nums = args.split(',').map(Number);
    return cmd + nums.map((v, i) => (i % 2 === 0 ? r2(mirror(v)) : v)).join(',');
  });
}

/**
 * SVG path data for a line through `points` (logical x, y in px; null = gap). `mirror` maps logical x to
 * physical x (for RTL). The curve is monotone cubic when smooth.
 */
export function chartLinePath(points: ReadonlyArray<Pt | null>, curve: 'smooth' | 'linear' = 'smooth', mirror: (x: number) => number = identity): string {
  return runs(points).map((run) => runPath(run, curve, mirror)).join('');
}

/** The same line closed down to `baseline`, for area fills. */
export function chartAreaPath(
  points: ReadonlyArray<Pt | null>,
  baseline: number,
  curve: 'smooth' | 'linear' = 'smooth',
  mirror: (x: number) => number = identity,
): string {
  return runs(points)
    .filter((run) => run.length > 1)
    .map((run) => `${runPath(run, curve, mirror)}L${r2(mirror(run[run.length - 1]![0]))},${r2(baseline)}L${r2(mirror(run[0]![0]))},${r2(baseline)}Z`)
    .join('');
}

/* ------------------------------------------------------------------ *
 * Size
 * ------------------------------------------------------------------ */

/** jsdom and old browsers have no ResizeObserver; draw at a plausible size there instead of not at all. */
const FALLBACK_SIZE = { width: 640, height: 200 };

/** Measures an element's content box, following resizes. Returns 0×0 until mounted (SSR draws no marks). */
export function useChartSize<T extends HTMLElement>(): [(el: T | null) => void, { width: number; height: number }] {
  const [size, setSize] = useState({ width: 0, height: 0 });
  const observer = useRef<ResizeObserver | null>(null);
  const ref = useCallback((el: T | null) => {
    observer.current?.disconnect();
    observer.current = null;
    if (!el) return;
    const apply = (width: number, height: number) =>
      setSize((prev) => (Math.abs(prev.width - width) < 0.5 && Math.abs(prev.height - height) < 0.5 ? prev : { width, height }));
    if (typeof ResizeObserver === 'undefined') {
      apply(el.clientWidth || FALLBACK_SIZE.width, el.clientHeight || FALLBACK_SIZE.height);
      return;
    }
    const ro = new ResizeObserver(([entry]) => {
      if (entry) apply(entry.contentRect.width, entry.contentRect.height);
    });
    ro.observe(el);
    observer.current = ro;
  }, []);
  return [ref, size];
}

/* ------------------------------------------------------------------ *
 * Legend
 * ------------------------------------------------------------------ */

export interface ChartLegendProps extends HTMLAttributes<HTMLUListElement> {
  series: ChartSeries[];
  /** Swatch shape: mirror the mark. `line` for line charts, `square` for areas and bars. */
  shape?: 'line' | 'square';
  ref?: Ref<HTMLUListElement>;
}

/** Names each series next to a swatch of its colour. Text stays in text colours; only the swatch carries the hue. */
export function ChartLegend({ series, shape = 'square', className, ref, ...rest }: ChartLegendProps): JSX.Element {
  return (
    <ul {...rest} ref={ref} data-shape={shape} className={cx(styles.legend, className)}>
      {series.map((s, i) => (
        <li key={s.key} className={styles.legendItem} style={{ '--_c': s.color ?? chartColor(i) } as CSSProperties}>
          <span className={styles.swatch} aria-hidden="true" />
          {s.label}
        </li>
      ))}
    </ul>
  );
}

/* ------------------------------------------------------------------ *
 * Tooltip readout
 * ------------------------------------------------------------------ */

export interface ChartTooltipRow {
  key: string;
  label: string;
  value: string;
  color: string;
}

export interface ChartTooltipProps extends HTMLAttributes<HTMLDivElement> {
  /** The x value, formatted. */
  title: string;
  rows: ChartTooltipRow[];
  /** Key shape: a short line (default; tooltips key with a stroke, not a box) or a square. */
  shape?: 'line' | 'square';
  ref?: Ref<HTMLDivElement>;
}

/**
 * The readout inside a chart's floating tooltip. One series: a compact pill, value first. Several: a list where
 * the value is the strong element and the series name follows it quietly.
 */
export function ChartTooltip({ title, rows, shape = 'line', className, ref, ...rest }: ChartTooltipProps): JSX.Element {
  const single = rows.length === 1;
  return (
    <div {...rest} ref={ref} data-single={single ? '' : undefined} data-shape={shape} className={cx(styles.readout, className)}>
      {single ? (
        <>
          <span className={styles.readoutValue}>{rows[0]!.value}</span>
          <span className={styles.readoutTitle}>{title}</span>
        </>
      ) : (
        <>
          <span className={styles.readoutTitle}>{title}</span>
          <ul className={styles.readoutRows}>
            {rows.map((row) => (
              <li key={row.key} className={styles.readoutRow} style={{ '--_c': row.color } as CSSProperties}>
                <span className={styles.key} aria-hidden="true" />
                <span className={styles.readoutLabel}>{row.label}</span>
                <span className={styles.readoutValue}>{row.value}</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Data table
 * ------------------------------------------------------------------ */

export interface ChartTableProps extends HTMLAttributes<HTMLTableElement> {
  caption: string;
  /** Header of the first column (the x values). */
  xLabel?: string;
  series: ChartSeries[];
  rows: Array<{ x: string; values: string[] }>;
  /** Visible under the chart instead of visually hidden. */
  isVisible?: boolean;
  ref?: Ref<HTMLTableElement>;
}

/** The chart's data as a table: the WCAG equivalent of the picture. Visually hidden by default. */
export function ChartTable({ caption, xLabel = '', series, rows, isVisible = false, className, ref, ...rest }: ChartTableProps): JSX.Element {
  const table = (
    <table {...rest} ref={ref} className={cx(isVisible ? styles.table : undefined, className)}>
      <caption className={isVisible ? styles.srOnly : undefined}>{caption}</caption>
      <thead>
        <tr>
          <th scope="col">{xLabel}</th>
          {series.map((s) => (
            <th key={s.key} scope="col">
              {s.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, i) => (
          <tr key={i}>
            <th scope="row">{row.x}</th>
            {row.values.map((v, j) => (
              <td key={j}>{v}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
  // Browsers size a <table> to its content and ignore width: 1px, so the visually-hidden clip goes on a wrapper.
  // Without it the hidden table widened the page at 320px and made it scroll sideways.
  return isVisible ? table : <div className={styles.srOnly}>{table}</div>;
}

/* ------------------------------------------------------------------ *
 * Frame
 * ------------------------------------------------------------------ */

/** Coordinates handed to a chart's mark renderers. All x values are physical (already mirrored in RTL). */
export interface ChartPlot {
  width: number;
  height: number;
  isRtl: boolean;
  /** Centre of x position `i`. */
  x: (i: number) => number;
  /** Width of one band (the slot each x position owns). */
  band: number;
  /** Value → y. */
  y: (value: number) => number;
  /** y of the domain's zero (clamped into the plot). */
  baseline: number;
}

type ChartLabelling =
  | { 'aria-label': string; 'aria-labelledby'?: string }
  | { 'aria-label'?: string; 'aria-labelledby': string };

export type ChartFrameProps = Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'aria-label' | 'aria-labelledby'> &
  ChartLabelling & {
    /** Number of x positions. */
    count: number;
    /** `point`: positions run edge to edge (lines). `band`: each position owns an equal slot (bars). */
    mode: 'point' | 'band';
    /** Plot + x-axis height in px. */
    height: number;
    domain: [number, number];
    ticks: number[];
    tickLabel: (value: number) => string;
    xLabels: string[];
    /** Accessible name of each x position: its x and every series value. */
    optionLabels: string[];
    showGrid?: boolean;
    showXAxis?: boolean;
    showYAxis?: boolean;
    /** Rendered above the plot. */
    legend?: ReactNode;
    /** Rendered after the plot (the ChartTable). */
    table?: ReactNode;
    /** One-sentence description of the data, announced with the chart's name. */
    summary?: string;
    marks: (plot: ChartPlot) => ReactNode;
    /** Hover/focus layer for position `i` (crosshair, points). */
    active: (plot: ChartPlot, i: number) => ReactNode;
    /** Top of the marks at position `i`: where the tooltip points. */
    anchorY: (plot: ChartPlot, i: number) => number;
    tooltip: (i: number) => ReactNode;
    /** Content drawn under the hit layer but over the grid, e.g. the bar hover column. */
    underlay?: (plot: ChartPlot, i: number | null) => ReactNode;
    ref?: Ref<HTMLDivElement>;
  };

function focusVisible(el: Element): boolean {
  try {
    return el.matches(':focus-visible');
  } catch {
    return true;
  }
}

/** Space kept above the top tick, so the highest line and its ring aren't clipped. */
const TOP_PAD = 8;
/** Gap between the tooltip and the point it describes. */
const TIP_GAP = 12;

/**
 * The shell every Strata chart draws into: y-axis gutter, grid, SVG plot, x axis, the ListBox hit layer, the
 * floating tooltip, the legend and the table. Build custom charts on it; AreaChart and BarChart do.
 */
export function ChartFrame({
  count,
  mode,
  height,
  domain,
  ticks,
  tickLabel,
  xLabels,
  optionLabels,
  showGrid = true,
  showXAxis = true,
  showYAxis = true,
  legend,
  table,
  summary,
  marks,
  active,
  anchorY,
  tooltip,
  underlay,
  className,
  style,
  'aria-label': ariaLabel,
  'aria-labelledby': labelledBy,
  'aria-describedby': describedBy,
  ref,
  ...rest
}: ChartFrameProps): JSX.Element {
  const { direction } = useLocale();
  const isRtl = direction === 'rtl';
  const [plotRef, size] = useChartSize<HTMLDivElement>();
  const summaryId = useId();

  const [hovered, setHovered] = useState<number | null>(null);
  const [focused, setFocused] = useState<number | null>(null);
  const [dismissed, setDismissed] = useState<number | null>(null);

  const raw = hovered ?? focused;
  const current = raw != null && raw < count && raw !== dismissed ? raw : null;

  const { width, height: plotH } = size;
  const drawn = width > 0 && plotH > 0 && count > 0;
  const band = mode === 'band' ? width / Math.max(1, count) : count > 1 ? width / (count - 1) : width;
  const logicalX = (i: number) => (mode === 'band' ? (i + 0.5) * band : count > 1 ? i * band : width / 2);
  const mirror = (x: number) => (isRtl ? width - x : x);
  const [lo, hi] = domain;
  const span = hi - lo || 1;
  const y = (v: number) => TOP_PAD + (1 - (v - lo) / span) * (plotH - TOP_PAD);
  const plot: ChartPlot = {
    width,
    height: plotH,
    isRtl,
    x: (i) => mirror(logicalX(i)),
    band,
    y,
    baseline: y(Math.min(Math.max(0, lo), hi)),
  };

  // Pointer (mouse, pen and touch scrubbing): snap to the nearest x position, so nobody has to land on a 2px line.
  // The same bands are the ListBox options; React Aria only reports hover on actionable options, so the plot
  // tracks the pointer itself.
  const onPointer = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!drawn) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const lx = isRtl ? width - px : px;
    const i = mode === 'band' ? Math.floor(lx / band) : count > 1 ? Math.round(lx / band) : 0;
    const next = Math.min(count - 1, Math.max(0, i));
    if (next !== hovered) {
      setHovered(next);
      setDismissed(null);
    }
  };

  // X labels: as many as fit (~64px each), evenly spaced, always including the first.
  const maxLabels = Math.max(2, Math.floor(width / 64));
  const step = Math.max(1, Math.ceil(count / maxLabels));

  // Tooltip: centred over the point, clamped inside the plot, flipped below when there's no room above.
  const tipRef = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const el = tipRef.current;
    if (!el || current == null || !drawn) return;
    const tw = el.offsetWidth;
    const th = el.offsetHeight;
    const cxp = plot.x(current);
    const top = anchorY(plot, current);
    let px: number;
    let ty: number;
    if (top - th - TIP_GAP >= -TOP_PAD) {
      // Above the point, centred on it, clamped inside the plot.
      px = Math.min(Math.max(cxp, tw / 2), Math.max(tw / 2, width - tw / 2));
      ty = top - th - TIP_GAP;
    } else {
      // No room above: beside the crosshair, on whichever side has room (the inline end first).
      const endward = isRtl ? -1 : 1;
      const fitsEnd = isRtl ? cxp - TIP_GAP * 1.5 - tw >= 0 : cxp + TIP_GAP * 1.5 + tw <= width;
      const side = fitsEnd ? endward : -endward;
      px = cxp + side * (TIP_GAP * 1.5 + tw / 2);
      ty = Math.min(Math.max(-TOP_PAD, top - th / 2), plotH - th);
    }
    // Positioned from its inline-start edge: left in LTR, right in RTL.
    const tx = isRtl ? px + tw / 2 - width : px - tw / 2;
    el.style.setProperty('--_tx', `${r2(tx)}px`);
    el.style.setProperty('--_ty', `${r2(ty)}px`);
  });

  const hasTooltip = current != null && drawn;

  return (
    <div
      {...rest}
      ref={ref}
      className={cx(styles.chart, className)}
      style={{ ...style, '--_h': `${height}px` } as CSSProperties}
    >
      {legend}
      <div className={styles.frame} data-y-axis={showYAxis ? '' : undefined} data-x-axis={showXAxis ? '' : undefined}>
        {showYAxis && (
          <div className={styles.yAxis} aria-hidden="true">
            {ticks.map((t) => (
              <span key={t} className={styles.yTick} style={{ '--_y': `${r2(drawn ? y(t) : 0)}px` } as CSSProperties} data-hidden={drawn ? undefined : ''}>
                {tickLabel(t)}
              </span>
            ))}
          </div>
        )}
        <div
          ref={plotRef}
          className={styles.plot}
          data-active={hasTooltip ? '' : undefined}
          onPointerMove={onPointer}
          onPointerDown={onPointer}
          onPointerLeave={() => setHovered(null)}
          onPointerCancel={() => setHovered(null)}
        >
          {drawn && (
            <svg className={styles.svg} width={width} height={plotH} aria-hidden="true" focusable="false">
              {showGrid && (
                <g className={styles.grid}>
                  {ticks.map((t) => {
                    const gy = Math.round(y(t)) + 0.5;
                    return <line key={t} x1={0} x2={width} y1={gy} y2={gy} data-zero={t === 0 ? '' : undefined} />;
                  })}
                </g>
              )}
              {underlay?.(plot, current)}
              {marks(plot)}
              <g className={styles.activeLayer} data-visible={hasTooltip ? '' : undefined}>
                {current != null && active(plot, current)}
              </g>
            </svg>
          )}
          {drawn && (
            <ListBox
              aria-label={ariaLabel}
              aria-labelledby={labelledBy}
              aria-describedby={cx(summary && summaryId, describedBy) || undefined}
              orientation="horizontal"
              layout="stack"
              className={styles.hitLayer}
            >
              {optionLabels.map((label, i) => {
                const start = mode === 'band' ? i * band : Math.max(0, logicalX(i) - band / 2);
                const end = mode === 'band' ? (i + 1) * band : Math.min(width, logicalX(i) + band / 2);
                return (
                  <ListBoxItem
                    key={i}
                    id={i}
                    textValue={label}
                    aria-label={label}
                    className={styles.hit}
                    style={{ insetInlineStart: r2(start), inlineSize: r2(Math.max(1, end - start)) }}
                    onFocus={(e) => {
                      // Only keyboard focus shows the readout; a click focuses the option too, but the pointer
                      // already drives the hover state. (Browsers match :focus-visible after keyboard moves.)
                      setFocused(focusVisible(e.target) ? i : null);
                      setDismissed(null);
                    }}
                    onBlur={() => setFocused((f) => (f === i ? null : f))}
                    onKeyDown={(e) => {
                      // WCAG 1.4.13: content that appears on hover or focus can be dismissed without moving.
                      if (e.key === 'Escape' && current != null) setDismissed(current);
                      else e.continuePropagation();
                    }}
                  />
                );
              })}
            </ListBox>
          )}
          <div ref={tipRef} className={styles.tooltip} data-visible={hasTooltip ? '' : undefined} aria-hidden="true">
            {current != null && tooltip(current)}
          </div>
        </div>
        {showXAxis && (
          <div className={styles.xAxis} aria-hidden="true">
            {drawn &&
              xLabels.map((label, i) => {
                // First, last, and every step between that isn't crowding the last. "Crowding" is measured in pixels
                // (the same ~64px budget as maxLabels), not in steps, so narrow charts don't print "Sep 23Sep 30".
                const last = count - 1;
                const gapToLast = Math.abs(logicalX(last) - logicalX(i));
                if (i !== last && (i % step !== 0 || (i > 0 && gapToLast < 64))) return null;
                // Point charts anchor the first and last label to the plot edges so they never spill out.
                const edge = mode === 'point' && count > 1 ? (i === 0 ? 'start' : i === count - 1 ? 'end' : undefined) : undefined;
                return (
                  <span key={i} className={styles.xTick} data-edge={edge} style={{ '--_x': `${r2(logicalX(i))}px` } as CSSProperties}>
                    {label}
                  </span>
                );
              })}
          </div>
        )}
      </div>
      {summary && (
        <p id={summaryId} className={styles.srOnly}>
          {summary}
        </p>
      )}
      {table}
    </div>
  );
}

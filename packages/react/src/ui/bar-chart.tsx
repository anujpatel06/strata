'use client';

import { useId, type CSSProperties, type HTMLAttributes, type JSX, type Ref } from 'react';
import { useLocale } from 'react-aria-components';
import {
  ChartFrame,
  ChartLegend,
  ChartTable,
  ChartTooltip,
  chartAxisFormat,
  chartColor,
  chartTicks,
  formatChartValue,
  formatChartX,
  type ChartFormat,
  type ChartPlot,
  type ChartSeries,
} from './chart';
import styles from './bar-chart.module.css';

const cx = (...c: Array<string | false | null | undefined>) => c.filter(Boolean).join(' ');

type ChartRow = Record<string, unknown>;

type ChartLabelling =
  | { 'aria-label': string; 'aria-labelledby'?: string }
  | { 'aria-label'?: string; 'aria-labelledby': string };

export type BarChartProps<T extends ChartRow = ChartRow> = Omit<
  HTMLAttributes<HTMLDivElement>,
  'children' | 'aria-label' | 'aria-labelledby'
> &
  ChartLabelling & {
    /** One object per category, in order. */
    data: T[];
    /** Key of the category in each row. */
    x: keyof T & string;
    /** What to plot, in palette order. Several series draw as grouped bars. */
    series: ChartSeries[];
    format?: ChartFormat;
    /** Height of the plot and x axis, in px. */
    height?: number;
    showGrid?: boolean;
    showXAxis?: boolean;
    showYAxis?: boolean;
    /** Fixes the y range. Default: nice round numbers from 0. */
    yDomain?: [number, number];
    /**
     * Emphasis: the x value of one category to draw in the series colour; the others turn neutral.
     * For single-series charts where one bar is the story ("this month").
     */
    highlight?: unknown;
    /** Shows the legend above the plot. Default: when there are 2+ series. */
    showLegend?: boolean;
    /** Shows the data table under the chart instead of keeping it visually hidden. */
    showTable?: boolean;
    /** Header of the table's first column, e.g. "Month". */
    xLabel?: string;
    /** One sentence describing the data for screen readers. Default: the lowest and highest category per series. */
    summary?: string;
    ref?: Ref<HTMLDivElement>;
  };

const num = (v: unknown): number | null => (typeof v === 'number' && Number.isFinite(v) ? v : null);
const same = (a: unknown, b: unknown) => a === b || (a instanceof Date && b instanceof Date && a.getTime() === b.getTime());

/** Bars never get thicker than this: the band's leftover is air, not ink. */
const MAX_BAR = 24;
/** The surface gap between touching bars in a group. */
const GAP = 2;
/** Bars run this far past the baseline under a clip, so only their data end is rounded. */
const OVERHANG = 8;

/**
 * Compares magnitudes across categories: vertical bars with rounded data ends, square at the baseline. Hover,
 * touch or arrow keys show each category's values; the data is also a table for screen readers.
 */
export function BarChart<T extends ChartRow>({
  data,
  x,
  series,
  format,
  height = 240,
  showGrid = true,
  showXAxis = true,
  showYAxis = true,
  yDomain,
  highlight,
  showLegend,
  showTable = false,
  xLabel,
  summary,
  className,
  ...rest
}: BarChartProps<T>): JSX.Element {
  const { locale } = useLocale();
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '');

  const values = series.map((s) => data.map((row) => num(row[s.key])));
  const colors = series.map((s, i) => s.color ?? chartColor(i));
  const finite = values.flat().filter((v): v is number => v != null);
  const tickCount = Math.max(2, Math.round((height - 40) / 56));
  const { domain, ticks } = yDomain
    ? chartTicks(yDomain[0], yDomain[1], tickCount, true)
    : chartTicks(Math.min(0, ...finite), Math.max(0, ...finite, finite.length ? 0 : 1), tickCount);

  const valueText = (v: number | null) => formatChartValue(v, format?.value, locale);
  const axisText = (v: number) => formatChartValue(v, chartAxisFormat(format), locale);
  const xLabels = data.map((row) => formatChartX(row[x], format?.x, locale));
  const optionLabels = xLabels.map((label, i) => `${label}: ${series.map((s, j) => `${s.label} ${valueText(values[j]![i]!)}`).join(', ')}`);
  const hasHighlight = highlight !== undefined && data.some((row) => same(row[x], highlight));

  const label = rest['aria-label'] ?? '';
  const autoSummary =
    data.length > 0
      ? `${data.length} categories. ` +
        series
          .map((s, j) => {
            let lo = -1;
            let hi = -1;
            values[j]!.forEach((v, i) => {
              if (v == null) return;
              if (lo < 0 || v < values[j]![lo]!) lo = i;
              if (hi < 0 || v > values[j]![hi]!) hi = i;
            });
            if (hi < 0) return `${s.label}: no data.`;
            return `${s.label}: highest ${xLabels[hi]} (${valueText(values[j]![hi]!)}), lowest ${xLabels[lo]} (${valueText(values[j]![lo]!)}).`;
          })
          .join(' ')
      : 'No data.';

  const n = Math.max(1, series.length);
  const geometry = (plot: ChartPlot) => {
    const groupMax = plot.band * 0.72;
    const barW = Math.max(1, Math.min(MAX_BAR, (groupMax - GAP * (n - 1)) / n));
    const groupW = barW * n + GAP * (n - 1);
    /** Physical left edge of series j's bar at position i; series run from the inline start. */
    const left = (i: number, j: number) => {
      const offset = -groupW / 2 + j * (barW + GAP);
      return plot.isRtl ? plot.x(i) - offset - barW : plot.x(i) + offset;
    };
    return { barW, groupW, left };
  };

  return (
    <ChartFrame
      {...rest}
      className={cx(styles.root, className)}
      count={data.length}
      mode="band"
      height={height}
      domain={domain}
      ticks={ticks}
      tickLabel={axisText}
      xLabels={xLabels}
      optionLabels={optionLabels}
      showGrid={showGrid}
      showXAxis={showXAxis}
      showYAxis={showYAxis}
      summary={summary ?? autoSummary}
      legend={(showLegend ?? series.length > 1) ? <ChartLegend series={series.map((s, i) => ({ ...s, color: colors[i] }))} shape="square" /> : undefined}
      table={
        <ChartTable
          caption={label || series.map((s) => s.label).join(', ')}
          xLabel={xLabel}
          series={series}
          isVisible={showTable}
          rows={data.map((_, i) => ({ x: xLabels[i]!, values: series.map((__, j) => valueText(values[j]![i]!)) }))}
        />
      }
      underlay={(plot, i) => {
        if (i == null) return null;
        const { groupW } = geometry(plot);
        const pad = Math.min(plot.band * 0.14, 12);
        const w = Math.min(plot.band - 2, groupW + pad * 2);
        return <rect className={styles.column} x={plot.x(i) - w / 2} y={0} width={w} height={plot.height} />;
      }}
      marks={(plot) => {
        const { barW, left } = geometry(plot);
        const top = Math.min(0, plot.baseline) - 100;
        return (
          <>
            <defs>
              <clipPath id={`${uid}-up`}>
                <rect x={-plot.width} y={top} width={plot.width * 3} height={plot.baseline - top} />
              </clipPath>
              <clipPath id={`${uid}-down`}>
                <rect x={-plot.width} y={plot.baseline} width={plot.width * 3} height={plot.height + 100} />
              </clipPath>
            </defs>
            {series.map((s, j) => (
              <g key={s.key} className={styles.series} style={{ '--_c': colors[j] } as CSSProperties}>
                {values[j]!.map((v, i) => {
                  if (v == null || v === 0) return null;
                  const up = v > 0;
                  const vy = plot.y(v);
                  const y0 = up ? vy : plot.baseline - OVERHANG;
                  const h = up ? plot.baseline + OVERHANG - vy : vy - plot.baseline + OVERHANG;
                  const muted = hasHighlight && !same(data[i]![x], highlight);
                  return (
                    <g key={i} clipPath={`url(#${uid}-${up ? 'up' : 'down'})`}>
                      <rect
                        className={styles.bar}
                        data-direction={up ? 'up' : 'down'}
                        data-muted={muted ? '' : undefined}
                        style={{ '--_i': i } as CSSProperties}
                        x={left(i, j)}
                        y={y0}
                        width={barW}
                        height={Math.max(0, h)}
                      />
                    </g>
                  );
                })}
              </g>
            ))}
          </>
        );
      }}
      active={() => null}
      anchorY={(plot, i) => {
        const ys = values.map((v) => v[i]).filter((v): v is number => v != null).map(plot.y);
        return ys.length ? Math.min(plot.baseline, ...ys) : plot.baseline;
      }}
      tooltip={(i) => (
        <ChartTooltip
          title={xLabels[i]!}
          rows={series.map((s, j) => ({ key: s.key, label: s.label, value: valueText(values[j]![i]!), color: colors[j]! }))}
        />
      )}
    />
  );
}

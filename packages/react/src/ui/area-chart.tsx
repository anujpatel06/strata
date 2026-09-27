'use client';

import { useId, type CSSProperties, type HTMLAttributes, type JSX, type Ref } from 'react';
import { useLocale } from 'react-aria-components';
import {
  ChartFrame,
  ChartLegend,
  ChartTable,
  ChartTooltip,
  chartAreaPath,
  chartAxisFormat,
  chartColor,
  chartLinePath,
  chartTicks,
  formatChartValue,
  formatChartX,
  type ChartFormat,
  type ChartPlot,
  type ChartSeries,
} from './chart';
import styles from './area-chart.module.css';

const cx = (...c: Array<string | false | null | undefined>) => c.filter(Boolean).join(' ');

type ChartRow = Record<string, unknown>;

type ChartLabelling =
  | { 'aria-label': string; 'aria-labelledby'?: string }
  | { 'aria-label'?: string; 'aria-labelledby': string };

export type AreaChartProps<T extends ChartRow = ChartRow> = Omit<
  HTMLAttributes<HTMLDivElement>,
  'children' | 'aria-label' | 'aria-labelledby'
> &
  ChartLabelling & {
    /** One object per x position, in order. */
    data: T[];
    /** Key of the x value in each row (a date, month name, number…). */
    x: keyof T & string;
    /** What to plot, in palette order. Up to 4; past that, fold the tail into "Other". */
    series: ChartSeries[];
    format?: ChartFormat;
    /** Height of the plot and x axis, in px. */
    height?: number;
    /** `smooth` is monotone cubic: it never overshoots the data. */
    curve?: 'smooth' | 'linear';
    showGrid?: boolean;
    showXAxis?: boolean;
    showYAxis?: boolean;
    /** Fixes the y range. Default: nice round numbers around the data (from 0 for areas). */
    yDomain?: [number, number];
    /** Shows the legend above the plot. Default: when there are 2+ series. */
    showLegend?: boolean;
    /** Shows the data table under the chart instead of keeping it visually hidden. */
    showTable?: boolean;
    /** A soft halo in the series colour under each line. */
    glow?: boolean;
    /** Dots on every data point, ringed in the surface colour. */
    showDots?: boolean;
    /** Header of the table's first column, e.g. "Month". */
    xLabel?: string;
    /** One sentence describing the data for screen readers. Default: range and the low, high and last value of each series. */
    summary?: string;
    ref?: Ref<HTMLDivElement>;
  };

export type LineChartProps<T extends ChartRow = ChartRow> = AreaChartProps<T>;

const num = (v: unknown): number | null => (typeof v === 'number' && Number.isFinite(v) ? v : null);

function XYChart<T extends ChartRow>({
  kind,
  data,
  x,
  series,
  format,
  height = 240,
  curve = 'smooth',
  showGrid = true,
  showXAxis = true,
  showYAxis = true,
  yDomain,
  showLegend,
  showTable = false,
  glow = true,
  showDots = false,
  xLabel,
  summary,
  className,
  ...rest
}: AreaChartProps<T> & { kind: 'area' | 'line' }): JSX.Element {
  const { locale } = useLocale();
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '');

  const values = series.map((s) => data.map((row) => num(row[s.key])));
  const colors = series.map((s, i) => s.color ?? chartColor(i));
  const finite = values.flat().filter((v): v is number => v != null);
  const dataMin = finite.length ? Math.min(...finite) : 0;
  const dataMax = finite.length ? Math.max(...finite) : 1;
  const tickCount = Math.max(2, Math.round((height - 40) / 56));
  const { domain, ticks } = yDomain
    ? chartTicks(yDomain[0], yDomain[1], tickCount, true)
    : kind === 'area'
      ? chartTicks(Math.min(0, dataMin), Math.max(0, dataMax), tickCount)
      : chartTicks(dataMin, dataMax, tickCount);

  const valueText = (v: number | null) => formatChartValue(v, format?.value, locale);
  const axisText = (v: number) => formatChartValue(v, chartAxisFormat(format), locale);
  const xLabels = data.map((row) => formatChartX(row[x], format?.x, locale));
  const optionLabels = xLabels.map((label, i) => `${label}: ${series.map((s, j) => `${s.label} ${valueText(values[j]![i]!)}`).join(', ')}`);

  const label = rest['aria-label'] ?? '';
  const autoSummary =
    data.length > 0
      ? `${data.length} points, ${xLabels[0]} to ${xLabels[xLabels.length - 1]}. ` +
        series
          .map((s, j) => {
            const v = values[j]!.filter((n): n is number => n != null);
            if (!v.length) return `${s.label}: no data.`;
            return `${s.label}: low ${valueText(Math.min(...v))}, high ${valueText(Math.max(...v))}, last ${valueText(v[v.length - 1]!)}.`;
          })
          .join(' ')
      : 'No data.';

  const pointsFor = (plot: ChartPlot, j: number) =>
    values[j]!.map((v, i) => (v == null ? null : ([plot.isRtl ? plot.width - plot.x(i) : plot.x(i), plot.y(v)] as const)));
  const mirror = (plot: ChartPlot) => (plot.isRtl ? (px: number) => plot.width - px : undefined);

  const legendVisible = showLegend ?? series.length > 1;

  return (
    <ChartFrame
      {...rest}
      data-kind={kind}
      className={cx(styles.root, className)}
      count={data.length}
      mode="point"
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
      legend={legendVisible ? <ChartLegend series={series.map((s, i) => ({ ...s, color: colors[i] }))} shape={kind === 'line' ? 'line' : 'square'} /> : undefined}
      table={
        <ChartTable
          caption={label || series.map((s) => s.label).join(', ')}
          xLabel={xLabel}
          series={series}
          isVisible={showTable}
          rows={data.map((_, i) => ({ x: xLabels[i]!, values: series.map((__, j) => valueText(values[j]![i]!)) }))}
        />
      }
      marks={(plot) =>
        series.map((s, j) => {
          const pts = pointsFor(plot, j);
          const gradient = `${uid}-fill-${j}`;
          return (
            <g key={s.key} className={styles.series} style={{ '--_c': colors[j], '--_i': j } as CSSProperties}>
              {kind === 'area' && (
                <>
                  <defs>
                    <linearGradient id={gradient} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" className={styles.stopTop} />
                      <stop offset="100%" className={styles.stopBottom} />
                    </linearGradient>
                  </defs>
                  <path className={styles.area} d={chartAreaPath(pts, plot.baseline, curve, mirror(plot))} fill={`url(#${gradient})`} />
                </>
              )}
              <path className={styles.line} data-glow={glow ? '' : undefined} d={chartLinePath(pts, curve, mirror(plot))} pathLength={1} />
              {showDots &&
                values[j]!.map((v, i) =>
                  v == null ? null : <circle key={i} className={styles.dot} cx={plot.x(i)} cy={plot.y(v)} r={3.5} />,
                )}
            </g>
          );
        })
      }
      active={(plot, i) => (
        <>
          {/* From the highest point down to the baseline: the readout sits above it, so nothing pokes out. */}
          <line
            className={styles.crosshair}
            x1={0}
            x2={0}
            y1={Math.min(plot.height, ...values.map((v) => v[i]).filter((v): v is number => v != null).map(plot.y))}
            y2={plot.height}
            style={{ transform: `translate(${Math.round(plot.x(i)) + 0.5}px, 0)` }}
          />
          {series.map((s, j) => {
            const v = values[j]![i];
            if (v == null) return null;
            return (
              <g key={s.key} className={styles.point} style={{ '--_c': colors[j], transform: `translate(${plot.x(i)}px, ${plot.y(v)}px)` } as CSSProperties}>
                <circle className={styles.halo} r={10} />
                <circle className={styles.pointDot} r={4.5} />
              </g>
            );
          })}
        </>
      )}
      anchorY={(plot, i) => {
        const ys = values.map((v) => v[i]).filter((v): v is number => v != null).map(plot.y);
        return (ys.length ? Math.min(...ys) : plot.height / 2) - 6;
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

/**
 * A trend over time as a smooth line with a gradient fill fading to transparent. Hover, touch or arrow keys move
 * a crosshair and a readout of every series; the data is also a table for screen readers.
 */
export function AreaChart<T extends ChartRow>(props: AreaChartProps<T>): JSX.Element {
  return <XYChart {...props} kind="area" />;
}

/** AreaChart without the fill, and a y range fitted to the data rather than starting at 0. For comparing series. */
export function LineChart<T extends ChartRow>(props: LineChartProps<T>): JSX.Element {
  return <XYChart {...props} kind="line" />;
}

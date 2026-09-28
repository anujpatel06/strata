import { render, screen, within } from '@testing-library/react';
import { ChartLegend, ChartTable, ChartTooltip, chartColor, chartLinePath, chartTicks, formatChartValue } from '../src/ui/chart';

describe('chart helpers', () => {
  it('chartTicks returns round ticks covering the data', () => {
    expect(chartTicks(0, 38700, 4)).toEqual({ domain: [0, 40000], ticks: [0, 10000, 20000, 30000, 40000] });
    expect(chartTicks(-980, 1640, 4).ticks).toEqual([-1000, -500, 0, 500, 1000, 1500, 2000]);
    expect(chartTicks(5, 5).domain).toEqual([0, 5]);
  });

  it('the monotone curve never overshoots: flat data stays flat', () => {
    const d = chartLinePath([[0, 50], [10, 50], [20, 50], [30, 10]], 'smooth');
    // Every y control point of the first two segments equals 50.
    const firstTwo = d.split('C').slice(1, 3).join(',').split(',').filter((_, i) => i % 2 === 1).map(Number);
    expect(firstTwo.every((y) => y === 50)).toBe(true);
  });

  it('mirrors x for right-to-left', () => {
    expect(chartLinePath([[0, 1], [10, 2]], 'linear', (x) => 100 - x)).toBe('M100,1L90,2');
  });

  it('chartColor points at the engine palette with a fallback', () => {
    expect(chartColor(0)).toBe('var(--syntara-chart-1, var(--syntara-color-text-brand))');
    expect(chartColor(5)).toContain('--syntara-chart-2');
  });

  it('formats missing values as a dash', () => {
    expect(formatChartValue(null, undefined, 'en-US')).toBe('–');
    expect(formatChartValue(1234.567, undefined, 'en-US')).toBe('1,234.57');
  });
});

describe('ChartLegend', () => {
  it('is a list of series names with decorative swatches', () => {
    render(<ChartLegend aria-label="Series" series={[{ key: 'a', label: 'Income' }, { key: 'b', label: 'Spending' }]} shape="line" className="mine" />);
    const list = screen.getByRole('list', { name: 'Series' });
    expect(list).toHaveAttribute('data-shape', 'line');
    expect(list).toHaveClass('legend', 'mine');
    expect(within(list).getAllByRole('listitem').map((li) => li.textContent)).toEqual(['Income', 'Spending']);
    expect(list.querySelector('.swatch')).toHaveAttribute('aria-hidden', 'true');
  });
});

describe('ChartTooltip', () => {
  it('leads with the value for one series, and lists every series for several', () => {
    const { rerender, container } = render(<ChartTooltip title="Mar" rows={[{ key: 'a', label: 'Revenue', value: '$4,200', color: 'red' }]} />);
    expect(container.firstElementChild).toHaveAttribute('data-single');
    expect(container.firstElementChild!.textContent).toBe('$4,200Mar');
    rerender(
      <ChartTooltip
        title="Mar"
        rows={[
          { key: 'a', label: 'Revenue', value: '$4,200', color: 'red' },
          { key: 'b', label: 'Costs', value: '$3,100', color: 'blue' },
        ]}
      />,
    );
    expect(screen.getAllByRole('listitem').map((li) => li.textContent)).toEqual(['Revenue$4,200', 'Costs$3,100']);
  });
});

describe('ChartTable', () => {
  it('is visually hidden by default and captioned', () => {
    render(<ChartTable caption="Revenue" xLabel="Month" series={[{ key: 'r', label: 'Revenue' }]} rows={[{ x: 'Jan', values: ['$1'] }]} />);
    // The clip lives on a wrapper: browsers ignore width: 1px on a <table>, which widened the page at 320px.
    const table = screen.getByRole('table', { name: 'Revenue' });
    expect(table.parentElement).toHaveClass('srOnly');
    expect(table).not.toHaveClass('srOnly');
  });
});

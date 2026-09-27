import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { I18nProvider } from 'react-aria-components';
import { AreaChart, LineChart } from '../src/ui/area-chart';

const data = [
  { month: 'Jan', revenue: 18400, costs: 12000 },
  { month: 'Feb', revenue: 21200, costs: 13100 },
  { month: 'Mar', revenue: 19800, costs: null },
  { month: 'Apr', revenue: 24600, costs: 14200 },
];
const series = [
  { key: 'revenue', label: 'Revenue' },
  { key: 'costs', label: 'Costs' },
];
const usd = { value: { style: 'currency', currency: 'USD', maximumFractionDigits: 0 } as Intl.NumberFormatOptions };

function Chart(props: Partial<Parameters<typeof AreaChart>[0]>) {
  return <AreaChart aria-label="Revenue and costs" data={data} x="month" xLabel="Month" series={series} format={usd} {...props} />;
}

describe('AreaChart', () => {
  it('is a listbox of x positions, each named by its x and every series value', () => {
    render(<Chart />);
    const chart = screen.getByRole('listbox', { name: 'Revenue and costs' });
    const options = within(chart).getAllByRole('option');
    expect(options).toHaveLength(4);
    expect(options[0]).toHaveAccessibleName('Jan: Revenue $18,400, Costs $12,000');
    // A missing value is announced as a dash, never as zero.
    expect(options[2]).toHaveAccessibleName('Mar: Revenue $19,800, Costs –');
  });

  it('describes itself with a generated summary, or the one passed in', () => {
    const { rerender } = render(<Chart />);
    expect(screen.getByRole('listbox')).toHaveAccessibleDescription(
      '4 points, Jan to Apr. Revenue: low $18,400, high $24,600, last $24,600. Costs: low $12,000, high $14,200, last $14,200.',
    );
    rerender(<Chart summary="Revenue grew every quarter." />);
    expect(screen.getByRole('listbox')).toHaveAccessibleDescription('Revenue grew every quarter.');
  });

  it('renders the data as a table with a caption and headers', () => {
    render(<Chart />);
    const table = screen.getByRole('table', { name: 'Revenue and costs' });
    expect(within(table).getAllByRole('columnheader').map((c) => c.textContent)).toEqual(['Month', 'Revenue', 'Costs']);
    expect(within(table).getByRole('rowheader', { name: 'Feb' })).toBeInTheDocument();
    expect(within(table).getByRole('cell', { name: '$21,200' })).toBeInTheDocument();
  });

  it('moves between points with the arrow keys, Home and End, and shows the readout', async () => {
    const user = userEvent.setup();
    const { container } = render(<Chart />);
    await user.tab();
    const options = screen.getAllByRole('option');
    expect(options[0]).toHaveFocus();
    await user.keyboard('{ArrowRight}');
    expect(options[1]).toHaveFocus();
    const tooltip = container.querySelector('.tooltip')!;
    expect(tooltip).toHaveAttribute('data-visible');
    expect(tooltip).toHaveAttribute('aria-hidden', 'true');
    expect(tooltip).toHaveTextContent('Feb');
    expect(tooltip).toHaveTextContent('$21,200');
    await user.keyboard('{End}');
    expect(options[3]).toHaveFocus();
    await user.keyboard('{Home}');
    expect(options[0]).toHaveFocus();
  });

  it('dismisses the readout with Escape (WCAG 1.4.13) and brings it back on the next move', async () => {
    const user = userEvent.setup();
    const { container } = render(<Chart />);
    await user.tab();
    const tooltip = container.querySelector('.tooltip')!;
    expect(tooltip).toHaveAttribute('data-visible');
    await user.keyboard('{Escape}');
    expect(tooltip).not.toHaveAttribute('data-visible');
    await user.keyboard('{ArrowRight}');
    expect(tooltip).toHaveAttribute('data-visible');
  });

  it('mirrors the arrow keys in right-to-left locales', async () => {
    const user = userEvent.setup();
    render(
      <I18nProvider locale="ar-AE">
        <Chart />
      </I18nProvider>,
    );
    await user.tab();
    const options = screen.getAllByRole('option');
    await user.keyboard('{ArrowLeft}');
    expect(options[1]).toHaveFocus();
  });

  it('draws a gradient area and a line per series; a gap in the data breaks the line', () => {
    const { container } = render(<Chart />);
    expect(container.querySelectorAll('.area')).toHaveLength(2);
    const lines = container.querySelectorAll('.line');
    expect(lines).toHaveLength(2);
    // Costs has a null at Mar: two runs, two move-to commands.
    expect(lines[1]!.getAttribute('d')!.match(/M/g)).toHaveLength(2);
    expect(container.querySelectorAll('linearGradient')).toHaveLength(2);
  });

  it('shows a legend for two or more series only', () => {
    const { rerender } = render(<Chart />);
    expect(screen.getByRole('list')).toHaveTextContent('RevenueCosts');
    rerender(<Chart series={[series[0]!]} />);
    expect(screen.queryByRole('list')).toBeNull();
  });

  it('passes className and other props to the root', () => {
    const { container } = render(<Chart className="mine" data-testid="root" />);
    expect(container.firstElementChild).toHaveClass('chart', 'root', 'mine');
    expect(screen.getByTestId('root')).toBe(container.firstElementChild);
  });
});

describe('LineChart', () => {
  it('has no area fill, fits the y range to the data, and can show dots', () => {
    const { container } = render(
      <LineChart aria-label="Revenue" data={data} x="month" series={[series[0]!]} showDots />,
    );
    expect(container.querySelector('.area')).toBeNull();
    expect(container.querySelectorAll('.dot')).toHaveLength(4);
    // Not from zero: the lowest tick is near the data (18,400), not 0.
    expect(container.querySelector('.yTick')).not.toHaveTextContent(/^0$/);
  });

  it('is labelled by a visible heading via aria-labelledby', () => {
    render(
      <>
        <h2 id="h">Weekly revenue</h2>
        <LineChart aria-labelledby="h" data={data} x="month" series={[series[0]!]} />
      </>,
    );
    expect(screen.getByRole('listbox', { name: 'Weekly revenue' })).toBeInTheDocument();
  });
});

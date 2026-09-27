import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BarChart } from '../src/ui/bar-chart';

const data = [
  { month: 'May', spend: 2140, budget: 2500 },
  { month: 'Jun', spend: -300, budget: 2500 },
  { month: 'Jul', spend: 1920, budget: 2000 },
];

describe('BarChart', () => {
  it('is a listbox of categories named by category and values, with a summary', () => {
    render(<BarChart aria-label="Spending" data={data} x="month" series={[{ key: 'spend', label: 'Spending' }]} />);
    const chart = screen.getByRole('listbox', { name: 'Spending' });
    expect(within(chart).getAllByRole('option').map((o) => o.getAttribute('aria-label'))).toEqual([
      'May: Spending 2,140',
      'Jun: Spending -300',
      'Jul: Spending 1,920',
    ]);
    expect(chart).toHaveAccessibleDescription('3 categories. Spending: highest May (2,140), lowest Jun (-300).');
  });

  it('draws one bar per value, growing down for negatives', () => {
    const { container } = render(<BarChart aria-label="Spending" data={data} x="month" series={[{ key: 'spend', label: 'Spending' }]} />);
    const bars = container.querySelectorAll('.bar');
    expect(bars).toHaveLength(3);
    expect(bars[1]).toHaveAttribute('data-direction', 'down');
  });

  it('groups several series with a legend, and keys bars with a 2px surface gap', () => {
    const { container } = render(
      <BarChart
        aria-label="Spend vs budget"
        data={data}
        x="month"
        series={[
          { key: 'spend', label: 'Spending' },
          { key: 'budget', label: 'Budget' },
        ]}
      />,
    );
    expect(screen.getByRole('list')).toHaveTextContent('SpendingBudget');
    const [spend, budget] = [...container.querySelectorAll('.series')];
    const a = spend!.querySelector('.bar');
    const b = budget!.querySelector('.bar');
    const gap = Number(b!.getAttribute('x')) - (Number(a!.getAttribute('x')) + Number(a!.getAttribute('width')));
    // May's spend and budget bars sit side by side.
    expect(Math.round(gap)).toBe(2);
  });

  it('highlights one category and mutes the rest', () => {
    const { container } = render(
      <BarChart aria-label="Spending" data={data} x="month" highlight="Jul" series={[{ key: 'spend', label: 'Spending' }]} />,
    );
    const bars = container.querySelectorAll('.bar');
    expect(bars[0]).toHaveAttribute('data-muted');
    expect(bars[2]).not.toHaveAttribute('data-muted');
  });

  it('shows the hovered-by-keyboard category in the readout and moves with arrows', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <BarChart aria-label="Spending" data={data} x="month" series={[{ key: 'spend', label: 'Spending' }]} format={{ value: { style: 'currency', currency: 'GBP' } }} />,
    );
    await user.tab();
    await user.keyboard('{ArrowRight}');
    expect(screen.getAllByRole('option')[1]).toHaveFocus();
    expect(container.querySelector('.tooltip')).toHaveTextContent('-£300.00Jun');
    expect(container.querySelector('.column')).not.toBeNull();
  });

  it('can show its data table visibly', () => {
    render(<BarChart aria-label="Spending" data={data} x="month" xLabel="Month" showTable series={[{ key: 'spend', label: 'Spending' }]} />);
    const table = screen.getByRole('table', { name: 'Spending' });
    expect(table).toHaveClass('table');
    expect(within(table).getAllByRole('row')).toHaveLength(4);
  });

  it('passes className through', () => {
    const { container } = render(<BarChart aria-label="Spending" className="mine" data={data} x="month" series={[{ key: 'spend', label: 'Spending' }]} />);
    expect(container.firstElementChild).toHaveClass('mine');
  });
});

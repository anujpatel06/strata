import { render, screen, within } from '@testing-library/react';
import { I18nProvider } from 'react-aria-components';
import { StatTile, StatTileGroup, formatDelta } from '../src/ui/stat-tile';

const MINUS = '−';

describe('formatDelta', () => {
  it('formats fractions as signed percentages with a true minus', () => {
    expect(formatDelta(0.064, 'en-US')).toBe('+6.4%');
    expect(formatDelta(-0.032, 'en-US')).toBe(`${MINUS}3.2%`);
    expect(formatDelta(0, 'en-US')).toBe('0%');
    expect(formatDelta(0.1234, 'en-US', { maximumFractionDigits: 0 })).toBe('+12%');
  });
});

describe('StatTile', () => {
  it('renders a standalone <dl> with the label as the term', () => {
    const { container } = render(<StatTile label="Available balance" value="₹1,84,250" />);
    const dl = container.firstElementChild!;
    expect(dl.tagName).toBe('DL');
    expect(within(dl as HTMLElement).getByRole('term')).toHaveTextContent('Available balance');
    expect(screen.getByText('₹1,84,250').tagName).toBe('DD');
  });

  it('shows a rising delta as good news by default', () => {
    render(<StatTile label="Balance" value="₹1,84,250" delta={0.064} deltaLabel="vs last month" />);
    const pill = screen.getByText('+6.4%').closest('[data-tone]');
    expect(pill).toHaveAttribute('data-tone', 'success');
    expect(screen.getByText('vs last month')).toBeInTheDocument();
  });

  it('treats a rise as bad news when positiveIsGood is false, and a fall as good', () => {
    const { rerender } = render(<StatTile label="Churn" value="3%" delta={0.02} positiveIsGood={false} />);
    expect(screen.getByText('+2%').closest('[data-tone]')).toHaveAttribute('data-tone', 'danger');
    rerender(<StatTile label="Churn" value="3%" delta={-0.02} positiveIsGood={false} />);
    expect(screen.getByText(`${MINUS}2%`).closest('[data-tone]')).toHaveAttribute('data-tone', 'success');
  });

  it('is neutral for no change', () => {
    render(<StatTile label="Wallet" value="₹8,500" delta={0} />);
    expect(screen.getByText('0%').closest('[data-tone]')).toHaveAttribute('data-tone', 'neutral');
  });

  it('isolates the delta in the locale direction, so the sign stays put on RTL pages', () => {
    render(
      <div dir="rtl" lang="ar">
        <I18nProvider locale="en-US">
          <StatTile label="Balance" value="1,286" delta={-0.032} />
        </I18nProvider>
      </div>,
    );
    expect(screen.getByText(`${MINUS}3.2%`)).toHaveAttribute('dir', 'ltr');
  });

  it('formats in the locale and direction of an Arabic locale', () => {
    render(
      <I18nProvider locale="ar-EG">
        <StatTile label="الرصيد" value="١٬٢٨٦" delta={0.064} />
      </I18nProvider>,
    );
    const expected = formatDelta(0.064, 'ar-EG');
    expect(expected).not.toBe('+6.4%');
    expect(screen.getByText(expected)).toHaveAttribute('dir', 'rtl');
  });

  it('shows a caption instead of a delta', () => {
    render(<StatTile label="Members" value="4" caption="2 adults, 2 children" />);
    expect(screen.getByText('2 adults, 2 children')).toBeInTheDocument();
    expect(document.querySelector('[data-tone]')).toBeNull();
  });

  it('draws a decorative sparkline from finite values', () => {
    const { container } = render(<StatTile label="Paid" value="₹4,12,800" sparkline={[1, 3, Number.NaN, 2, 5]} />);
    const spark = container.querySelector('.spark')!;
    expect(spark).toHaveAttribute('aria-hidden', 'true');
    expect(spark.querySelector('polyline')!.getAttribute('points')!.split(' ')).toHaveLength(4);
    expect(container.firstElementChild).toHaveAttribute('data-sparkline');
  });

  it('skips the sparkline with fewer than two points', () => {
    const { container } = render(<StatTile label="Paid" value="1" sparkline={[4]} />);
    expect(container.querySelector('svg')).toBeNull();
  });

  it('becomes a <div> of dt/dd inside a StatTileGroup <dl>, and passes className through', () => {
    const { container } = render(
      <StatTileGroup>
        <StatTile label="Paid" value="10" className="mine" />
        <StatTile label="Rejected" value="2" />
      </StatTileGroup>,
    );
    const dl = container.firstElementChild!;
    expect(dl.tagName).toBe('DL');
    expect(dl.querySelectorAll('dl')).toHaveLength(0);
    expect(dl.children[0]!.tagName).toBe('DIV');
    expect(dl.children[0]).toHaveClass('tile', 'mine');
    expect(within(dl as HTMLElement).getAllByRole('term')).toHaveLength(2);
  });
});

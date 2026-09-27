import { render, screen } from '@testing-library/react';
import { Meter } from '../src/ui/meter';

describe('Meter', () => {
  it('is a meter named by its visible label, with range values', () => {
    render(<Meter label="Consultations" value={7400} maxValue={18000} />);
    const meter = screen.getByRole('meter', { name: 'Consultations' });
    expect(meter).toHaveAttribute('aria-valuenow', '7400');
    expect(meter).toHaveAttribute('aria-valuemin', '0');
    expect(meter).toHaveAttribute('aria-valuemax', '18000');
  });

  it('announces and shows the value label, and describes itself with the caption', () => {
    render(<Meter label="Consultations" value={7400} maxValue={18000} valueLabel="₹7,400 used" caption="of ₹18,000" />);
    const meter = screen.getByRole('meter', { name: 'Consultations' });
    expect(meter).toHaveAttribute('aria-valuetext', '₹7,400 used');
    expect(meter).toHaveAccessibleDescription('of ₹18,000');
    expect(screen.getByText('₹7,400 used')).toBeInTheDocument();
  });

  it('formats the value with formatOptions (percent by default)', () => {
    const { rerender } = render(<Meter label="Storage" value={64} />);
    expect(screen.getByText('64%')).toBeInTheDocument();
    rerender(
      <Meter label="Budget" value={1840} maxValue={2500} formatOptions={{ style: 'currency', currency: 'GBP', maximumFractionDigits: 0 }} />,
    );
    expect(screen.getByRole('meter')).toHaveAttribute('aria-valuetext', '£1,840');
  });

  it('sizes the fill from the percentage and clamps out-of-range values', () => {
    const { container, rerender } = render(<Meter label="Seats" value={7} maxValue={10} />);
    expect((container.querySelector('.fill') as HTMLElement).style.getPropertyValue('--_pct')).toBe('70%');
    rerender(<Meter label="Seats" value={14} maxValue={10} />);
    expect((container.querySelector('.fill') as HTMLElement).style.getPropertyValue('--_pct')).toBe('100%');
  });

  it('works without a visible label when given aria-label, and can hide the value', () => {
    const { container } = render(<Meter aria-label="Wallet used" value={0} maxValue={18000} showValue={false} />);
    expect(screen.getByRole('meter', { name: 'Wallet used' })).toBeInTheDocument();
    expect(container.querySelector('.value')).toBeNull();
  });

  it('is not focusable (a meter is read-only)', () => {
    render(<Meter label="Storage" value={40} />);
    expect(screen.getByRole('meter')).not.toHaveAttribute('tabindex');
  });

  it('reflects tone and variant, merges aria-describedby and passes className through', () => {
    render(
      <>
        <p id="note">Resets in April</p>
        <Meter aria-label="Usage" value={2} maxValue={4} caption="of 4" tone="warning" variant="card" className="mine" aria-describedby="note" />
      </>,
    );
    const meter = screen.getByRole('meter');
    expect(meter).toHaveAttribute('data-tone', 'warning');
    expect(meter).toHaveAttribute('data-variant', 'card');
    expect(meter).toHaveClass('meter', 'mine');
    expect(meter).toHaveAccessibleDescription('of 4 Resets in April');
  });
});

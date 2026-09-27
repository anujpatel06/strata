import { render, screen } from '@testing-library/react';
import { Sparkline } from '../src/ui/sparkline';

describe('Sparkline', () => {
  it('is decorative by default', () => {
    const { container } = render(<Sparkline data={[1, 3, 2, 5]} />);
    expect(container.firstElementChild).toHaveAttribute('aria-hidden', 'true');
    expect(screen.queryByRole('img')).toBeNull();
  });

  it('becomes a named image with aria-label', () => {
    render(<Sparkline data={[1, 3, 2, 5]} aria-label="Up 12% over 30 days" />);
    const img = screen.getByRole('img', { name: 'Up 12% over 30 days' });
    expect(img).not.toHaveAttribute('aria-hidden');
  });

  it('draws an area, a line and an end dot; line variant and showEndDot={false} drop them', () => {
    const { container, rerender } = render(<Sparkline data={[1, 3, 2, 5]} />);
    expect(container.querySelector('.area')).not.toBeNull();
    expect(container.querySelector('.line')).not.toBeNull();
    expect(container.querySelector('.dot')).not.toBeNull();
    rerender(<Sparkline data={[1, 3, 2, 5]} variant="line" showEndDot={false} />);
    expect(container.querySelector('.area')).toBeNull();
    expect(container.querySelector('.dot')).toBeNull();
  });

  it('colours by tone, or by palette slot', () => {
    const { container, rerender } = render(<Sparkline data={[1, 2]} tone="success" />);
    expect(container.firstElementChild).toHaveAttribute('data-tone', 'success');
    rerender(<Sparkline data={[1, 2]} series={2} />);
    expect(container.firstElementChild).not.toHaveAttribute('data-tone');
    expect((container.firstElementChild as HTMLElement).style.getPropertyValue('--_c')).toContain('--strata-chart-2');
  });

  it('draws nothing with fewer than two values, and leaves gaps for null', () => {
    const { container, rerender } = render(<Sparkline data={[4]} />);
    expect(container.querySelector('svg')).toBeNull();
    rerender(<Sparkline data={[1, 2, null, 3, 4]} />);
    expect(container.querySelector('.line')!.getAttribute('d')!.match(/M/g)).toHaveLength(2);
  });

  it('passes className through', () => {
    const { container } = render(<Sparkline data={[1, 2]} className="mine" />);
    expect(container.firstElementChild).toHaveClass('sparkline', 'mine');
  });
});

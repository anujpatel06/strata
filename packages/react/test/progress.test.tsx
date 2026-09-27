import { render, screen } from '@testing-library/react';
import { ProgressBar } from '../src/ui/progress';

describe('ProgressBar', () => {
  it('is a progressbar named by its visible label', () => {
    render(<ProgressBar label="Uploading receipts" value={64} />);
    const bar = screen.getByRole('progressbar', { name: 'Uploading receipts' });
    expect(bar).toHaveAttribute('aria-valuenow', '64');
    expect(bar).toHaveAttribute('aria-valuemin', '0');
    expect(bar).toHaveAttribute('aria-valuemax', '100');
  });

  it('shows the formatted value when asked, and sizes the fill', () => {
    const { container } = render(<ProgressBar label="Upload" value={64} showValue />);
    expect(screen.getByText('64%')).toBeInTheDocument();
    expect((container.querySelector('.fill') as HTMLElement).style.getPropertyValue('--_pct')).toBe('64%');
  });

  it('supports custom ranges and value labels', () => {
    render(<ProgressBar label="Storage" value={4} maxValue={5} showValue valueLabel="4 of 5 GB" />);
    const bar = screen.getByRole('progressbar', { name: 'Storage' });
    expect(bar).toHaveAttribute('aria-valuetext', '4 of 5 GB');
    expect(screen.getByText('4 of 5 GB')).toBeInTheDocument();
  });

  it('is indeterminate without aria-valuenow and hides the value', () => {
    const { container } = render(<ProgressBar aria-label="Loading claims" isIndeterminate showValue />);
    const bar = screen.getByRole('progressbar', { name: 'Loading claims' });
    expect(bar).not.toHaveAttribute('aria-valuenow');
    expect(container.querySelector('.fill')).toHaveAttribute('data-indeterminate', 'true');
    expect(container.querySelector('.value')).toBeNull();
  });

  it('reflects tone and size, and passes className through', () => {
    render(<ProgressBar label="Limit" value={96} tone="danger" size="sm" className="mine" />);
    const bar = screen.getByRole('progressbar');
    expect(bar).toHaveAttribute('data-tone', 'danger');
    expect(bar).toHaveAttribute('data-size', 'sm');
    expect(bar).toHaveClass('progress', 'mine');
  });
});

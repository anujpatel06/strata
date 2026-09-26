import { render, screen } from '@testing-library/react';
import { Spinner } from '../src/ui/spinner';

describe('Spinner', () => {
  it('announces "Loading" through a status region by default', () => {
    render(<Spinner />);
    const status = screen.getByRole('status');
    expect(status).toHaveTextContent('Loading');
    expect(status.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
    expect(status).toHaveAttribute('data-size', 'md');
  });

  it('takes a custom label, size and className', () => {
    render(<Spinner label="Checking eligibility" size="lg" className="mine" />);
    const status = screen.getByRole('status');
    expect(status).toHaveTextContent('Checking eligibility');
    expect(status).toHaveAttribute('data-size', 'lg');
    expect(status).toHaveClass('spinner', 'mine');
  });
});

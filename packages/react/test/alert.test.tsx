import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Alert } from '../src/ui/alert';

describe('Alert', () => {
  it('renders title and body without a live role by default', () => {
    render(<Alert title="Card expiring">Order a replacement.</Alert>);
    expect(screen.getByText('Card expiring')).toBeInTheDocument();
    expect(screen.getByText('Order a replacement.')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('is an assertive live region named by its title when `live` is set', () => {
    render(
      <Alert live tone="danger" title="Payment failed">
        Try another card.
      </Alert>,
    );
    const alert = screen.getByRole('alert', { name: 'Payment failed' });
    expect(alert).toHaveAttribute('data-tone', 'danger');
  });

  it('uses role="status" for polite announcements', () => {
    render(<Alert live="polite" title="Saved" />);
    expect(screen.getByRole('status', { name: 'Saved' })).toBeInTheDocument();
  });

  it('shows a decorative tone icon that can be replaced or removed', () => {
    const { container, rerender } = render(<Alert tone="success">Done</Alert>);
    const icon = container.querySelector('svg');
    expect(icon?.closest('[aria-hidden="true"]')).not.toBeNull();
    rerender(<Alert icon={<svg data-testid="custom" />}>Done</Alert>);
    expect(screen.getByTestId('custom')).toBeInTheDocument();
    rerender(<Alert icon={false}>Done</Alert>);
    expect(container.querySelector('svg')).toBeNull();
  });

  it('dismisses with a named button, by pointer and keyboard', async () => {
    const user = userEvent.setup();
    const onDismiss = vi.fn();
    render(
      <Alert title="Saved" onDismiss={onDismiss} dismissLabel="Close message">
        Draft saved.
      </Alert>,
    );
    const button = screen.getByRole('button', { name: 'Close message' });
    await user.tab();
    expect(button).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(onDismiss).toHaveBeenCalledTimes(1);
    await user.click(button);
    expect(onDismiss).toHaveBeenCalledTimes(2);
  });

  it('renders the action slot and passes className and DOM props through', () => {
    const { container } = render(
      <Alert className="mine" data-testid="alert" action={<a href="#fix">Fix it</a>}>
        Something needs attention.
      </Alert>,
    );
    expect(screen.getByRole('link', { name: 'Fix it' })).toBeInTheDocument();
    expect(screen.getByTestId('alert')).toHaveClass('mine', 'alert');
    expect(container.firstElementChild).toHaveAttribute('data-tone', 'neutral');
  });
});

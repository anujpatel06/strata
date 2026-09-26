import { render, screen } from '@testing-library/react';
import { Badge } from '../src/ui/badge';

describe('Badge', () => {
  it('renders its label with default tone, variant and size', () => {
    render(<Badge>Draft</Badge>);
    const badge = screen.getByText('Draft');
    expect(badge).toHaveAttribute('data-tone', 'neutral');
    expect(badge).toHaveAttribute('data-variant', 'soft');
    expect(badge).toHaveAttribute('data-size', 'md');
  });

  it('reflects tone, variant and size', () => {
    render(
      <Badge tone="brand" variant="solid" size="sm">
        New
      </Badge>,
    );
    const badge = screen.getByText('New');
    expect(badge).toHaveAttribute('data-tone', 'brand');
    expect(badge).toHaveAttribute('data-variant', 'solid');
    expect(badge).toHaveAttribute('data-size', 'sm');
  });

  it('keeps the dot and icon out of the accessibility tree', () => {
    const { container } = render(
      <Badge tone="success" dot icon={<svg data-testid="icon" />}>
        Active
      </Badge>,
    );
    expect(container.querySelector('.dot')).toHaveAttribute('aria-hidden', 'true');
    expect(screen.getByTestId('icon').parentElement).toHaveAttribute('aria-hidden', 'true');
    expect(screen.getByText('Active')).toHaveTextContent(/^Active$/);
  });

  it('passes className and DOM props through', () => {
    render(
      <Badge className="mine" title="3 unread" data-testid="b">
        3
      </Badge>,
    );
    const badge = screen.getByTestId('b');
    expect(badge).toHaveClass('badge', 'mine');
    expect(badge).toHaveAttribute('title', '3 unread');
  });
});

import { render, screen } from '@testing-library/react';
import { EmptyState } from '../src/ui/empty-state';

describe('EmptyState', () => {
  it('renders an h3 title, description and action', () => {
    render(
      <EmptyState
        icon={<svg data-testid="icon" />}
        title="No claims yet"
        description="Claims you submit show up here."
        action={<button type="button">Start a claim</button>}
      />,
    );
    expect(screen.getByRole('heading', { level: 3, name: 'No claims yet' })).toBeInTheDocument();
    expect(screen.getByText('Claims you submit show up here.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Start a claim' })).toBeInTheDocument();
    expect(screen.getByTestId('icon').parentElement).toHaveAttribute('aria-hidden', 'true');
  });

  it('takes a heading level, size and className', () => {
    const { container } = render(<EmptyState title="No results" level={2} size="sm" className="mine" />);
    expect(screen.getByRole('heading', { level: 2, name: 'No results' })).toBeInTheDocument();
    expect(container.firstElementChild).toHaveAttribute('data-size', 'sm');
    expect(container.firstElementChild).toHaveClass('empty', 'mine');
  });
});

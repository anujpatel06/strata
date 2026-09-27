import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SearchField } from '../src/ui/search-field';

describe('SearchField', () => {
  it('renders a searchbox named by its label or aria-label', () => {
    render(
      <>
        <SearchField label="Search transactions" />
        <SearchField aria-label="Search docs" placeholder="Search…" />
      </>,
    );
    expect(screen.getByRole('searchbox', { name: 'Search transactions' })).toBeInTheDocument();
    expect(screen.getByRole('searchbox', { name: 'Search docs' })).toHaveAttribute('placeholder', 'Search…');
  });

  it('Escape clears the value; Enter submits', async () => {
    const onSubmit = vi.fn();
    const onClear = vi.fn();
    const user = userEvent.setup();
    render(<SearchField aria-label="Search" onSubmit={onSubmit} onClear={onClear} />);
    await user.tab();
    await user.keyboard('rent');
    const input = screen.getByRole('searchbox', { name: 'Search' });
    expect(input).toHaveValue('rent');
    await user.keyboard('{Enter}');
    expect(onSubmit).toHaveBeenCalledWith('rent');
    await user.keyboard('{Escape}');
    expect(input).toHaveValue('');
    expect(onClear).toHaveBeenCalledTimes(1);
  });

  it('shows a clear button once there is text, which clears and keeps focus', async () => {
    const user = userEvent.setup();
    const { container } = render(<SearchField aria-label="Search" />);
    const root = container.firstElementChild as HTMLElement;
    expect(root).toHaveAttribute('data-empty');
    await user.click(screen.getByRole('searchbox'));
    await user.keyboard('fuel');
    expect(root).not.toHaveAttribute('data-empty');
    const clear = screen.getByRole('button', { name: 'Clear search' });
    expect(clear).toHaveAttribute('tabindex', '-1');
    await user.click(clear);
    expect(screen.getByRole('searchbox')).toHaveValue('');
    expect(screen.getByRole('searchbox')).toHaveFocus();
  });

  it('reflects disabled and invalid state', () => {
    render(
      <>
        <SearchField aria-label="Disabled search" isDisabled />
        <SearchField label="Code" isInvalid errorMessage="No match for that code." />
      </>,
    );
    expect(screen.getByRole('searchbox', { name: 'Disabled search' })).toBeDisabled();
    const code = screen.getByRole('searchbox', { name: 'Code' });
    expect(code).toHaveAttribute('aria-invalid', 'true');
    expect(code).toHaveAccessibleDescription('No match for that code.');
  });

  it('passes className through', () => {
    const { container } = render(<SearchField aria-label="Search" className="extra" />);
    expect(container.firstElementChild).toHaveClass('field', 'extra');
  });
});

describe('SearchField size', () => {
  it('marks the root with its size (md by default)', () => {
    render(
      <>
        <SearchField aria-label="Search" />
        <SearchField aria-label="Filter" size="sm" />
      </>,
    );
    expect(screen.getByRole('searchbox', { name: 'Search' }).closest('[data-field-size]')).toHaveAttribute('data-field-size', 'md');
    expect(screen.getByRole('searchbox', { name: 'Filter' }).closest('[data-field-size]')).toHaveAttribute('data-field-size', 'sm');
  });
});

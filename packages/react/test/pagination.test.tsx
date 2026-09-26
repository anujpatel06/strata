import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { Pagination, type PaginationProps } from '../src/ui/pagination';

function Controlled(props: Partial<PaginationProps>) {
  const [page, setPage] = useState(props.page ?? 1);
  return <Pagination pageCount={12} {...props} page={page} onPageChange={(p) => { setPage(p); props.onPageChange?.(p); }} />;
}

/** Visible page labels in order, "…" for ellipses. */
function pageItems() {
  return within(screen.getByRole('list'))
    .getAllByRole('listitem', { hidden: true })
    .map((li) => (li.getAttribute('aria-hidden') === 'true' ? '…' : li.textContent))
    .filter((t) => t && !/Previous|Next|Page \d+ of/.test(t));
}

describe('Pagination', () => {
  it('renders a navigation landmark named "Pagination"', () => {
    render(<Pagination page={1} pageCount={5} />);
    expect(screen.getByRole('navigation', { name: 'Pagination' })).toBeInTheDocument();
  });

  it('marks the current page with aria-current="page"', () => {
    render(<Pagination page={4} pageCount={12} />);
    expect(screen.getByRole('button', { name: 'Page 4' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('button', { name: 'Page 5' })).not.toHaveAttribute('aria-current');
  });

  it('shows boundary pages, siblings and ellipses with a constant item count', () => {
    const { rerender } = render(<Pagination page={1} pageCount={12} />);
    expect(pageItems()).toEqual(['1', '2', '3', '4', '5', '…', '12']);
    rerender(<Pagination page={6} pageCount={12} />);
    expect(pageItems()).toEqual(['1', '…', '5', '6', '7', '…', '12']);
    rerender(<Pagination page={12} pageCount={12} />);
    expect(pageItems()).toEqual(['1', '…', '8', '9', '10', '11', '12']);
    rerender(<Pagination page={2} pageCount={3} />);
    expect(pageItems()).toEqual(['1', '2', '3']);
  });

  it('changes page by pointer and keyboard', async () => {
    const user = userEvent.setup();
    const onPageChange = vi.fn();
    render(<Controlled page={3} onPageChange={onPageChange} />);

    await user.click(screen.getByRole('button', { name: 'Page 4' }));
    expect(onPageChange).toHaveBeenLastCalledWith(4);
    expect(screen.getByRole('button', { name: 'Page 4' })).toHaveAttribute('aria-current', 'page');

    const next = screen.getByRole('button', { name: 'Next' });
    next.focus();
    await user.keyboard('{Enter}');
    expect(onPageChange).toHaveBeenLastCalledWith(5);

    // Pressing the current page is a no-op.
    screen.getByRole('button', { name: 'Page 5' }).focus();
    await user.keyboard(' ');
    expect(onPageChange).toHaveBeenCalledTimes(2);
  });

  it('keeps previous focusable but aria-disabled on the first page', async () => {
    const user = userEvent.setup();
    const onPageChange = vi.fn();
    render(<Controlled page={2} onPageChange={onPageChange} />);
    const previous = screen.getByRole('button', { name: 'Previous' });
    await user.click(previous);
    expect(onPageChange).toHaveBeenCalledWith(1);
    expect(previous).toHaveAttribute('aria-disabled', 'true');
    expect(previous).toHaveFocus();
    await user.click(previous);
    expect(onPageChange).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('button', { name: 'Next' })).not.toHaveAttribute('aria-disabled');
  });

  it('compact variant shows "Page 3 of 12" between previous and next', () => {
    render(<Pagination variant="compact" page={3} pageCount={12} />);
    const nav = screen.getByRole('navigation');
    expect(nav).toHaveTextContent('Page 3 of 12');
    expect(screen.queryByRole('button', { name: 'Page 3' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Previous' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Next' })).toBeInTheDocument();
  });

  it('disables every button when isDisabled', () => {
    render(<Pagination page={2} pageCount={4} isDisabled />);
    for (const b of screen.getAllByRole('button')) expect(b).toBeDisabled();
  });

  it('accepts a custom label and className', () => {
    render(<Pagination page={1} pageCount={3} label="Results pages" className="custom" />);
    expect(screen.getByRole('navigation', { name: 'Results pages' })).toHaveClass('root', 'custom');
  });
});

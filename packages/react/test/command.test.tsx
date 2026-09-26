import { useState } from 'react';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from '../src/ui/button';
import { CommandDialog, CommandItem, CommandSection, useCommandShortcut } from '../src/ui/command';

function Example({ onAction = () => {} }: { onAction?: (key: React.Key) => void }) {
  const [open, setOpen] = useState(false);
  useCommandShortcut(() => setOpen(true));
  return (
    <>
      <Button onPress={() => setOpen(true)}>Search</Button>
      <CommandDialog isOpen={open} onOpenChange={setOpen} placeholder="Search docs…" onAction={onAction}>
        <CommandSection title="Components">
          <CommandItem id="button" textValue="Button">Button</CommandItem>
          <CommandItem id="dialog" textValue="Dialog modal" meta="Overlay">Dialog</CommandItem>
        </CommandSection>
        <CommandSection title="Guides">
          <CommandItem id="theming">Theming</CommandItem>
        </CommandSection>
      </CommandDialog>
    </>
  );
}

describe('CommandDialog', () => {
  it('opens from a button with the search field focused', async () => {
    const user = userEvent.setup();
    render(<Example />);
    await user.tab();
    await user.keyboard('{Enter}');
    const dialog = screen.getByRole('dialog', { name: 'Command menu' });
    const input = within(dialog).getByRole('searchbox');
    expect(input).toHaveAttribute('placeholder', 'Search docs…');
    await waitFor(() => expect(input).toHaveFocus());
    expect(within(dialog).getAllByRole('menuitem')).toHaveLength(3);
  });

  it('filters case-insensitively and hides empty sections', async () => {
    const user = userEvent.setup();
    render(<Example />);
    await user.click(screen.getByRole('button', { name: 'Search' }));
    await user.keyboard('MODAL');
    const items = screen.getAllByRole('menuitem');
    expect(items).toHaveLength(1);
    expect(items[0]).toHaveTextContent('Dialog');
    expect(screen.queryByText('Guides')).not.toBeInTheDocument();
  });

  it('fires onAction on Enter and closes', async () => {
    const onAction = vi.fn();
    const user = userEvent.setup();
    render(<Example onAction={onAction} />);
    const trigger = screen.getByRole('button', { name: 'Search' });
    await user.click(trigger);
    await user.keyboard('them');
    await user.keyboard('{Enter}');
    expect(onAction).toHaveBeenCalledWith('theming');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    await waitFor(() => expect(trigger).toHaveFocus());
  });

  it('moves the active result with arrow keys', async () => {
    const onAction = vi.fn();
    const user = userEvent.setup();
    render(<Example onAction={onAction} />);
    await user.click(screen.getByRole('button', { name: 'Search' }));
    await user.keyboard('{ArrowDown}{ArrowDown}{Enter}');
    expect(onAction).toHaveBeenCalledWith('dialog');
  });

  it('shows an empty state quoting the query', async () => {
    const user = userEvent.setup();
    render(<Example />);
    await user.click(screen.getByRole('button', { name: 'Search' }));
    await user.keyboard('zebra');
    expect(document.querySelectorAll('.item')).toHaveLength(0);
    expect(screen.getByText(/No results for/)).toHaveTextContent('No results for “zebra”');
  });

  it('clears the query on the first Escape and closes on the second', async () => {
    const user = userEvent.setup();
    render(<Example />);
    await user.click(screen.getByRole('button', { name: 'Search' }));
    await user.keyboard('but');
    await user.keyboard('{Escape}');
    expect(screen.getByRole('searchbox')).toHaveValue('');
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('opens with ⌘K and Ctrl+K via useCommandShortcut', () => {
    render(<Example />);
    fireEvent.keyDown(document, { key: 'k', metaKey: true });
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('opens with Ctrl+K and carries ThemeScope attributes', () => {
    render(
      <div data-strata-theme="qamar" data-strata-scheme="dark" dir="rtl" lang="ar">
        <Example />
      </div>,
    );
    fireEvent.keyDown(document, { key: 'K', ctrlKey: true });
    const overlay = screen.getByRole('dialog').closest('[data-strata-theme]')!;
    expect(overlay.parentElement).toBe(document.body);
    expect(overlay).toHaveAttribute('data-strata-theme', 'qamar');
    expect(overlay).toHaveAttribute('dir', 'rtl');
  });
});

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from '../src/ui/button';
import { DialogTrigger } from '../src/ui/dialog';
import { Sheet, type SheetProps } from '../src/ui/sheet';

function Example(props: Partial<SheetProps>) {
  return (
    <DialogTrigger>
      <Button>Filters</Button>
      <Sheet title="Filters" description="Narrow the list of claims." footer={({ close }) => <Button onPress={close}>Apply</Button>} {...props}>
        <input aria-label="Search claims" />
      </Sheet>
    </DialogTrigger>
  );
}

describe('Sheet', () => {
  it('opens from the keyboard as a named dialog on the end side by default', async () => {
    const user = userEvent.setup();
    render(<Example />);
    await user.tab();
    await user.keyboard('{Enter}');
    const dialog = screen.getByRole('dialog', { name: 'Filters' });
    expect(dialog).toHaveAccessibleDescription('Narrow the list of claims.');
    expect(dialog.parentElement).toHaveAttribute('data-side', 'end');
  });

  it('takes a logical side and a className for the panel', async () => {
    const user = userEvent.setup();
    render(<Example side="start" className="custom" />);
    await user.click(screen.getByRole('button', { name: 'Filters' }));
    const panel = screen.getByRole('dialog').parentElement!;
    expect(panel).toHaveAttribute('data-side', 'start');
    expect(panel).toHaveClass('custom');
  });

  it('closes on Escape and returns focus; traps focus while open', async () => {
    const user = userEvent.setup();
    render(<Example />);
    const trigger = screen.getByRole('button', { name: 'Filters' });
    await user.click(trigger);
    const dialog = screen.getByRole('dialog');
    for (let i = 0; i < 5; i++) {
      await user.tab();
      expect(dialog).toContainElement(document.activeElement as HTMLElement);
    }
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    await waitFor(() => expect(trigger).toHaveFocus());
  });

  it('closes from the Close button and footer render function', async () => {
    const user = userEvent.setup();
    render(<Example />);
    await user.click(screen.getByRole('button', { name: 'Filters' }));
    await user.click(screen.getByRole('button', { name: 'Close' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Filters' }));
    await user.click(screen.getByRole('button', { name: 'Apply' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('carries the ThemeScope attributes and direction into the portal', async () => {
    const user = userEvent.setup();
    render(
      <div data-strata-theme="qamar" data-strata-scheme="dark" dir="rtl">
        <Example />
      </div>,
    );
    await user.click(screen.getByRole('button', { name: 'Filters' }));
    const overlay = screen.getByRole('dialog').closest('[data-strata-theme]')!;
    expect(overlay.parentElement).toBe(document.body);
    expect(overlay).toHaveAttribute('data-strata-theme', 'qamar');
    expect(overlay).toHaveAttribute('data-strata-scheme', 'dark');
    expect(overlay).toHaveAttribute('dir', 'rtl');
  });
});

import { useState } from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from '../src/ui/button';
import { Dialog, DialogTrigger } from '../src/ui/dialog';

function Example(props: Partial<React.ComponentProps<typeof Dialog>>) {
  return (
    <DialogTrigger>
      <Button>Edit profile</Button>
      <Dialog
        title="Edit profile"
        description="Changes are visible to your team."
        footer={({ close }) => <Button onPress={close}>Save</Button>}
        {...props}
      >
        <input aria-label="Name" />
      </Dialog>
    </DialogTrigger>
  );
}

describe('Dialog', () => {
  it('opens from the keyboard with an accessible name and description', async () => {
    const user = userEvent.setup();
    render(<Example />);
    await user.tab();
    await user.keyboard('{Enter}');
    const dialog = screen.getByRole('dialog', { name: 'Edit profile' });
    expect(dialog).toHaveAccessibleDescription('Changes are visible to your team.');
    expect(within(dialog).getByRole('heading', { level: 2, name: 'Edit profile' })).toBeInTheDocument();
  });

  it('closes on Escape and returns focus to the trigger', async () => {
    const user = userEvent.setup();
    render(<Example />);
    const trigger = screen.getByRole('button', { name: 'Edit profile' });
    await user.click(trigger);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    await waitFor(() => expect(trigger).toHaveFocus());
  });

  it('traps focus inside the dialog', async () => {
    const user = userEvent.setup();
    render(<Example />);
    await user.click(screen.getByRole('button', { name: 'Edit profile' }));
    const dialog = screen.getByRole('dialog');
    for (let i = 0; i < 6; i++) {
      await user.tab();
      expect(dialog).toContainElement(document.activeElement as HTMLElement);
    }
  });

  it('has a Close button and passes close to render functions', async () => {
    const user = userEvent.setup();
    render(<Example />);
    await user.click(screen.getByRole('button', { name: 'Edit profile' }));
    await user.click(screen.getByRole('button', { name: 'Close' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Edit profile' }));
    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('supports controlled use and size/className on the panel', async () => {
    function Controlled() {
      const [open, setOpen] = useState(true);
      return (
        <Dialog title="Rename" isOpen={open} onOpenChange={setOpen} size="lg" className="custom">
          Body
        </Dialog>
      );
    }
    const user = userEvent.setup();
    render(<Controlled />);
    const dialog = screen.getByRole('dialog', { name: 'Rename' });
    const panel = dialog.parentElement!;
    expect(panel).toHaveClass('custom');
    expect(panel).toHaveAttribute('data-size', 'lg');
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('copies the ThemeScope attributes of its trigger onto the portalled overlay', async () => {
    const user = userEvent.setup();
    render(
      <div data-strata-theme="harbor" data-strata-scheme="dark" data-strata-density="compact" dir="rtl" lang="ar">
        <Example />
      </div>,
    );
    await user.click(screen.getByRole('button', { name: 'Edit profile' }));
    const overlay = screen.getByRole('dialog').closest('[data-strata-theme]')!;
    expect(overlay.parentElement).toBe(document.body);
    expect(overlay).toHaveAttribute('data-strata-theme', 'harbor');
    expect(overlay).toHaveAttribute('data-strata-scheme', 'dark');
    expect(overlay).toHaveAttribute('data-strata-density', 'compact');
    expect(overlay).toHaveAttribute('dir', 'rtl');
    expect(overlay).toHaveAttribute('lang', 'ar');
  });

  it('copies the ThemeScope attributes when controlled, without a trigger', () => {
    render(
      <div data-strata-theme="qamar" data-strata-scheme="light">
        <Dialog title="Controlled" isOpen>
          Body
        </Dialog>
      </div>,
    );
    const overlay = screen.getByRole('dialog').closest('[data-strata-theme]')!;
    expect(overlay).toHaveAttribute('data-strata-theme', 'qamar');
    expect(overlay.parentElement).toBe(document.body);
  });
});

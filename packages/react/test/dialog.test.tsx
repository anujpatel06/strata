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
      <div data-syntara-theme="harbor" data-syntara-scheme="dark" data-syntara-density="compact" dir="rtl" lang="ar">
        <Example />
      </div>,
    );
    await user.click(screen.getByRole('button', { name: 'Edit profile' }));
    const overlay = screen.getByRole('dialog').closest('[data-syntara-theme]')!;
    expect(overlay.parentElement).toBe(document.body);
    expect(overlay).toHaveAttribute('data-syntara-theme', 'harbor');
    expect(overlay).toHaveAttribute('data-syntara-scheme', 'dark');
    expect(overlay).toHaveAttribute('data-syntara-density', 'compact');
    expect(overlay).toHaveAttribute('dir', 'rtl');
    expect(overlay).toHaveAttribute('lang', 'ar');
  });

  it('creates the overlay with the scope attributes already set, so entry animations can resolve motion tokens', async () => {
    const user = userEvent.setup();
    render(
      <div data-syntara-theme="harbor" data-syntara-scheme="dark" dir="rtl" lang="ar">
        <Example />
      </div>,
    );
    const late: string[] = [];
    const observer = new MutationObserver((records) => {
      for (const r of records) if (r.attributeName && (r.target as Element).matches('.react-aria-ModalOverlay, [data-syntara-theme]')) late.push(r.attributeName);
    });
    observer.observe(document.body, { subtree: true, attributes: true, attributeFilter: ['data-syntara-theme', 'data-syntara-scheme', 'dir', 'lang'] });
    await user.click(screen.getByRole('button', { name: 'Edit profile' }));
    observer.disconnect();
    const overlay = screen.getByRole('dialog').closest('[data-syntara-theme]')!;
    expect(overlay.parentElement).toBe(document.body);
    expect(overlay).toHaveAttribute('data-syntara-theme', 'harbor');
    // Set as props when the element is created, not patched on afterwards.
    expect(late).toEqual([]);
  });

  it('looks each scope attribute up separately (theme on :root, scheme on a nested scope)', async () => {
    const user = userEvent.setup();
    render(
      <div data-syntara-theme="house">
        <div data-syntara-scheme="dark">
          <Example />
        </div>
      </div>,
    );
    await user.click(screen.getByRole('button', { name: 'Edit profile' }));
    const overlay = screen.getByRole('dialog').closest('[data-syntara-scheme]')!;
    expect(overlay.parentElement).toBe(document.body);
    expect(overlay).toHaveAttribute('data-syntara-scheme', 'dark');
    expect(overlay).toHaveAttribute('data-syntara-theme', 'house');
    expect(overlay).not.toHaveAttribute('data-syntara-density');
  });

  it('copies a scheme-only ancestor when the theme lives on the document root', async () => {
    document.documentElement.setAttribute('data-syntara-theme', 'house');
    try {
      const user = userEvent.setup();
      render(
        <div data-syntara-scheme="dark">
          <Example />
        </div>,
      );
      await user.click(screen.getByRole('button', { name: 'Edit profile' }));
      const overlay = screen.getByRole('dialog').closest('[data-syntara-scheme]')!;
      expect(overlay.parentElement).toBe(document.body);
      expect(overlay).toHaveAttribute('data-syntara-scheme', 'dark');
    } finally {
      document.documentElement.removeAttribute('data-syntara-theme');
    }
  });

  it('copies the ThemeScope attributes when controlled, without a trigger', () => {
    render(
      <div data-syntara-theme="qamar" data-syntara-scheme="light">
        <Dialog title="Controlled" isOpen>
          Body
        </Dialog>
      </div>,
    );
    const overlay = screen.getByRole('dialog').closest('[data-syntara-theme]')!;
    expect(overlay).toHaveAttribute('data-syntara-theme', 'qamar');
    expect(overlay.parentElement).toBe(document.body);
  });
});

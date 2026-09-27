import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from '../src/ui/button';
import { DialogTrigger } from '../src/ui/dialog';
import { AlertDialog, type AlertDialogProps } from '../src/ui/alert-dialog';

function Example(props: Partial<AlertDialogProps>) {
  return (
    <DialogTrigger>
      <Button tone="danger">Delete card</Button>
      <AlertDialog title="Delete this card?" actionLabel="Delete" tone="danger" {...props}>
        Payments on this card will stop immediately. This can’t be undone.
      </AlertDialog>
    </DialogTrigger>
  );
}

describe('AlertDialog', () => {
  it('renders an alertdialog named by its title and described by its message', async () => {
    const user = userEvent.setup();
    render(<Example />);
    await user.tab();
    await user.keyboard('{Enter}');
    const dialog = screen.getByRole('alertdialog', { name: 'Delete this card?' });
    expect(dialog).toHaveAccessibleDescription('Payments on this card will stop immediately. This can’t be undone.');
    expect(screen.queryByRole('button', { name: 'Close' })).not.toBeInTheDocument();
  });

  it('focuses Cancel first for destructive actions', async () => {
    const user = userEvent.setup();
    render(<Example />);
    await user.click(screen.getByRole('button', { name: 'Delete card' }));
    await waitFor(() => expect(screen.getByRole('button', { name: 'Cancel' })).toHaveFocus());
  });

  it('ignores outside clicks and cancels on Escape without acting', async () => {
    const onAction = vi.fn();
    const user = userEvent.setup();
    render(<Example onAction={onAction} />);
    const trigger = screen.getByRole('button', { name: 'Delete card' });
    await user.click(trigger);
    await user.click(document.querySelector('.overlay')!);
    const dialog = screen.getByRole('alertdialog');
    // Focus stays in (or returns to) the dialog, so Escape still works.
    await waitFor(() => expect(dialog).toContainElement(document.activeElement as HTMLElement));
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    expect(onAction).not.toHaveBeenCalled();
    await waitFor(() => expect(trigger).toHaveFocus());
  });

  it('runs onAction and closes; danger tone styles the action', async () => {
    const onAction = vi.fn();
    const user = userEvent.setup();
    render(<Example onAction={onAction} />);
    await user.click(screen.getByRole('button', { name: 'Delete card' }));
    const action = screen.getByRole('button', { name: 'Delete' });
    expect(action).toHaveAttribute('data-variant', 'primary');
    expect(action).toHaveAttribute('data-tone', 'danger');
    await user.click(action);
    expect(onAction).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
  });

  it('shows a pending action while an async onAction runs, then closes', async () => {
    let resolve!: () => void;
    const onAction = () => new Promise<void>((r) => (resolve = r));
    const user = userEvent.setup();
    render(<Example onAction={onAction} />);
    await user.click(screen.getByRole('button', { name: 'Delete card' }));
    await user.click(screen.getByRole('button', { name: 'Delete' }));
    expect(screen.getByRole('button', { name: 'Delete' })).toHaveAttribute('data-pending', 'true');
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();
    resolve();
    await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument());
  });

  it('uses a primary action and custom cancel label for the default tone', async () => {
    const user = userEvent.setup();
    render(<Example tone="default" actionLabel="Publish" cancelLabel="Keep editing" />);
    await user.click(screen.getByRole('button', { name: 'Delete card' }));
    expect(screen.getByRole('button', { name: 'Publish' })).toHaveAttribute('data-variant', 'primary');
    expect(screen.getByRole('button', { name: 'Keep editing' })).toBeInTheDocument();
  });
});

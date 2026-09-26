import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from '../src/ui/button';
import { DialogTrigger } from '../src/ui/dialog';
import { Popover, type PopoverProps } from '../src/ui/popover';

function Example(props: Partial<PopoverProps>) {
  return (
    <DialogTrigger>
      <Button>Details</Button>
      <Popover {...props}>
        <p>Submitted on 12 March.</p>
        <button type="button">Copy reference</button>
      </Popover>
    </DialogTrigger>
  );
}

describe('Popover', () => {
  it('opens from the keyboard as a dialog and closes on Escape, restoring focus', async () => {
    const user = userEvent.setup();
    render(<Example />);
    const trigger = screen.getByRole('button', { name: 'Details' });
    await user.tab();
    await user.keyboard('{Enter}');
    expect(screen.getByRole('dialog', { name: 'Details' })).toBeInTheDocument();
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    await waitFor(() => expect(trigger).toHaveFocus());
  });

  it('draws an arrow only when showArrow is set, and passes className through', async () => {
    const user = userEvent.setup();
    const { unmount } = render(<Example className="custom" />);
    await user.click(screen.getByRole('button', { name: 'Details' }));
    const popover = screen.getByRole('dialog');
    expect(popover).toHaveClass('popover', 'custom');
    expect(popover.querySelector('.arrow')).toBeNull();
    unmount();

    render(<Example showArrow />);
    await user.click(screen.getByRole('button', { name: 'Details' }));
    expect(screen.getByRole('dialog').querySelector('.arrow svg')).not.toBeNull();
  });

  it('carries the ThemeScope attributes of its trigger', async () => {
    const user = userEvent.setup();
    render(
      <div data-strata-theme="harbor" data-strata-scheme="dark" lang="en-GB">
        <Example />
      </div>,
    );
    await user.click(screen.getByRole('button', { name: 'Details' }));
    const popover = screen.getByRole('dialog');
    expect(popover).toHaveAttribute('data-strata-theme', 'harbor');
    expect(popover).toHaveAttribute('data-strata-scheme', 'dark');
    expect(popover).toHaveAttribute('lang', 'en-GB');
  });
});

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { IconPlus } from '@strata/icons';
import { Button } from '../src/ui/button';

describe('Button', () => {
  it('renders a button named by its text, primary + md by default', () => {
    render(<Button>Save changes</Button>);
    const button = screen.getByRole('button', { name: 'Save changes' });
    expect(button).toHaveAttribute('data-variant', 'primary');
    expect(button).toHaveAttribute('data-size', 'md');
    expect(button).toHaveAttribute('type', 'button');
  });

  it('fires onPress from Enter and Space', async () => {
    const onPress = vi.fn();
    const user = userEvent.setup();
    render(<Button onPress={onPress}>Save</Button>);
    await user.tab();
    expect(screen.getByRole('button')).toHaveFocus();
    await user.keyboard('{Enter}');
    await user.keyboard(' ');
    expect(onPress).toHaveBeenCalledTimes(2);
  });

  it('shows the focus-visible state only for keyboard focus', async () => {
    const user = userEvent.setup();
    render(<Button>Save</Button>);
    await user.tab();
    expect(screen.getByRole('button')).toHaveAttribute('data-focus-visible');
  });

  it('is disabled for assistive tech and ignores presses', async () => {
    const onPress = vi.fn();
    const user = userEvent.setup();
    render(
      <Button isDisabled onPress={onPress}>
        Save
      </Button>,
    );
    const button = screen.getByRole('button', { name: 'Save' });
    expect(button).toBeDisabled();
    await user.click(button);
    expect(onPress).not.toHaveBeenCalled();
  });

  it('when pending: stays focusable, is busy + aria-disabled, blocks presses and swaps the leading icon for a spinner', async () => {
    const onPress = vi.fn();
    const user = userEvent.setup();
    const { container } = render(
      <Button isPending onPress={onPress}>
        <IconPlus aria-hidden />
        Add payee
      </Button>,
    );
    const button = screen.getByRole('button', { name: 'Add payee' });
    expect(button).toHaveAttribute('aria-busy', 'true');
    expect(button).toHaveAttribute('aria-disabled', 'true');
    expect(button).toHaveAttribute('data-pending');
    await user.tab();
    expect(button).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(onPress).not.toHaveBeenCalled();
    expect(container.querySelector('.tabler-icon-plus')).toBeNull();
    expect(container.querySelector('.spinner')).not.toBeNull();
  });

  it('when pending without a leading icon, overlays the spinner and keeps the label in the name', () => {
    const { container } = render(<Button isPending>Save</Button>);
    expect(container.querySelector('.spinnerOverlay')).not.toBeNull();
    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
  });

  it('icon size is named by aria-label', () => {
    render(
      <Button size="icon" variant="ghost" aria-label="Add payee">
        <IconPlus aria-hidden />
      </Button>,
    );
    expect(screen.getByRole('button', { name: 'Add payee' })).toHaveAttribute('data-size', 'icon');
  });

  it('passes className through (string and function forms)', () => {
    render(
      <>
        <Button className="w-full">One</Button>
        <Button className={({ isPending }) => (isPending ? 'busy' : 'idle')}>Two</Button>
      </>,
    );
    expect(screen.getByRole('button', { name: 'One' })).toHaveClass('root', 'w-full');
    expect(screen.getByRole('button', { name: 'Two' })).toHaveClass('root', 'idle');
  });

  it('renders the contrast variant as a named, pressable button that respects isDisabled', async () => {
    const user = userEvent.setup();
    const onPress = vi.fn();
    const { rerender } = render(
      <Button variant="contrast" size="lg" onPress={onPress}>
        Review transfer
      </Button>,
    );
    const button = screen.getByRole('button', { name: 'Review transfer' });
    expect(button).toHaveAttribute('data-variant', 'contrast');
    expect(button).toHaveAttribute('data-size', 'lg');
    await user.tab();
    expect(button).toHaveFocus();
    await user.keyboard('{Enter}');
    await user.keyboard(' ');
    expect(onPress).toHaveBeenCalledTimes(2);
    rerender(
      <Button variant="contrast" size="lg" onPress={onPress} isDisabled>
        Review transfer
      </Button>,
    );
    expect(screen.getByRole('button', { name: 'Review transfer' })).toBeDisabled();
  });
});

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Switch } from '../src/ui/switch';

describe('Switch', () => {
  it('renders a switch named by its label and described by its description', () => {
    render(<Switch description="Blocks card payments abroad.">Freeze card</Switch>);
    const toggle = screen.getByRole('switch', { name: 'Freeze card' });
    expect(toggle).not.toBeChecked();
    expect(toggle).toHaveAccessibleDescription('Blocks card payments abroad.');
  });

  it('toggles with Space and reports the value', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<Switch onChange={onChange}>Dark mode</Switch>);
    await user.tab();
    const toggle = screen.getByRole('switch', { name: 'Dark mode' });
    expect(toggle).toHaveFocus();
    expect(toggle.closest('label')).toHaveAttribute('data-focus-visible');
    await user.keyboard(' ');
    expect(toggle).toBeChecked();
    expect(onChange).toHaveBeenLastCalledWith(true);
  });

  it('can be controlled and disabled', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(
      <Switch isSelected isDisabled onChange={onChange}>
        Autopay
      </Switch>,
    );
    const toggle = screen.getByRole('switch', { name: 'Autopay' });
    expect(toggle).toBeChecked();
    expect(toggle).toBeDisabled();
    await user.click(toggle);
    expect(onChange).not.toHaveBeenCalled();
  });

  it('works with aria-label only and passes className through', () => {
    const { container } = render(<Switch aria-label="Notifications" className="extra" />);
    expect(screen.getByRole('switch', { name: 'Notifications' })).toBeInTheDocument();
    expect(container.firstElementChild).toHaveClass('switch', 'extra');
  });
});

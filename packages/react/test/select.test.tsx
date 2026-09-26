import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Select, SelectItem, SelectSection } from '../src/ui/select';

function Plans(props: Partial<Parameters<typeof Select>[0]>) {
  return (
    <Select label="Plan" placeholder="Choose a plan" {...props}>
      <SelectItem id="starter">Starter</SelectItem>
      <SelectItem id="team" description="Up to 20 seats">
        Team
      </SelectItem>
      <SelectItem id="business" isDisabled>
        Business
      </SelectItem>
    </Select>
  );
}

describe('Select', () => {
  it('renders a labelled trigger with the placeholder', () => {
    render(<Plans />);
    const trigger = screen.getByRole('button', { name: /Plan/ });
    expect(trigger).toHaveTextContent('Choose a plan');
    expect(trigger).toHaveAttribute('aria-haspopup', 'listbox');
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });

  it('opens with the keyboard, moves with arrows, selects with Enter and closes', async () => {
    const user = userEvent.setup();
    const onSelectionChange = vi.fn();
    render(<Plans onSelectionChange={onSelectionChange} />);
    await user.tab();
    await user.keyboard('{ArrowDown}');
    const listbox = await screen.findByRole('listbox');
    const options = within(listbox).getAllByRole('option');
    expect(options).toHaveLength(3);
    expect(options[2]).toHaveAttribute('aria-disabled', 'true');
    await user.keyboard('{ArrowDown}{Enter}');
    expect(onSelectionChange).toHaveBeenCalledWith('team');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    const trigger = screen.getByRole('button', { name: /Plan/ });
    expect(trigger).toHaveTextContent('Team');
    // The description line is only for the list, not the trigger.
    expect(trigger).not.toHaveTextContent('Up to 20 seats');
  });

  it('links the item description to the option', async () => {
    const user = userEvent.setup();
    render(<Plans />);
    await user.click(screen.getByRole('button', { name: /Plan/ }));
    const team = screen.getByRole('option', { name: 'Team' });
    expect(team).toHaveAccessibleDescription('Up to 20 seats');
  });

  it('closes on Escape without changing the value', async () => {
    const user = userEvent.setup();
    render(<Plans defaultSelectedKey="starter" />);
    await user.click(screen.getByRole('button', { name: /Plan/ }));
    expect(screen.getByRole('listbox')).toBeInTheDocument();
    await user.keyboard('{ArrowDown}{Escape}');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Plan/ })).toHaveTextContent('Starter');
  });

  it('marks the selected option', async () => {
    const user = userEvent.setup();
    render(<Plans defaultSelectedKey="team" />);
    await user.click(screen.getByRole('button', { name: /Plan/ }));
    expect(screen.getByRole('option', { name: 'Team' })).toHaveAttribute('aria-selected', 'true');
  });

  it('renders sections as labelled groups', async () => {
    const user = userEvent.setup();
    render(
      <Select label="Time zone">
        <SelectSection title="Europe">
          <SelectItem id="london">London</SelectItem>
        </SelectSection>
        <SelectSection title="Asia">
          <SelectItem id="kolkata">Kolkata</SelectItem>
        </SelectSection>
      </Select>,
    );
    await user.click(screen.getByRole('button', { name: /Time zone/ }));
    expect(screen.getByRole('group', { name: 'Europe' })).toBeInTheDocument();
    expect(within(screen.getByRole('group', { name: 'Asia' })).getByRole('option')).toHaveTextContent('Kolkata');
  });

  it('supports dynamic items', async () => {
    const user = userEvent.setup();
    const items = [
      { id: 'a', name: 'Open' },
      { id: 'b', name: 'Closed' },
    ];
    render(
      <Select label="Status" items={items}>
        {(item) => <SelectItem id={item.id}>{item.name}</SelectItem>}
      </Select>,
    );
    await user.click(screen.getByRole('button', { name: /Status/ }));
    expect(screen.getAllByRole('option').map((o) => o.textContent)).toEqual(['Open', 'Closed']);
  });

  it('shows the error message and marks the field invalid', () => {
    const { container } = render(<Plans isInvalid errorMessage="Choose a plan to continue." />);
    expect(screen.getByText('Choose a plan to continue.')).toBeInTheDocument();
    expect(container.querySelector('[data-invalid]')).not.toBeNull();
    const trigger = screen.getByRole('button', { name: /Plan/ });
    expect(trigger.getAttribute('aria-describedby') ?? '').not.toBe('');
  });

  it('is disabled', async () => {
    const user = userEvent.setup();
    render(<Plans isDisabled />);
    const trigger = screen.getByRole('button', { name: /Plan/ });
    expect(trigger).toBeDisabled();
    await user.click(trigger);
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('passes className to the root', () => {
    const { container } = render(<Plans className="custom" />);
    const root = container.querySelector('.custom');
    expect(root).not.toBeNull();
    expect(root).toContainElement(screen.getByRole('button', { name: /Plan/ }));
  });
});

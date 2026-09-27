import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { PersonChip, PersonChipGroup } from '../src/ui/person-chip';

describe('PersonChip', () => {
  it('shows the name once; the avatar is decorative', () => {
    render(<PersonChip name="Priya Shah" data-testid="c" />);
    const chip = screen.getByTestId('c');
    expect(chip).toHaveAttribute('data-size', 'md');
    expect(within(chip).queryByRole('img')).not.toBeInTheDocument();
    // Initials are aria-hidden, so the readable text is the name alone.
    expect(within(chip).getByText('Priya Shah')).toBeInTheDocument();
    expect(chip.querySelector('[aria-hidden="true"]')).toHaveTextContent('PS');
  });

  it('placeholder: "?" avatar and a data attribute for styling', () => {
    render(<PersonChip name="Father" placeholder data-testid="c" />);
    const chip = screen.getByTestId('c');
    expect(chip).toHaveAttribute('data-placeholder', 'true');
    expect(chip.querySelector('[data-placeholder="unknown"]')).toHaveTextContent('?');
  });

  it('passes className and size through', () => {
    render(<PersonChip name="Mei Lin" size="sm" className="mine" data-testid="c" />);
    const chip = screen.getByTestId('c');
    expect(chip).toHaveClass('chip', 'mine');
    expect(chip).toHaveAttribute('data-size', 'sm');
  });
});

describe('PersonChipGroup', () => {
  it('is a list of chips, sized by the group', () => {
    render(
      <PersonChipGroup aria-label="Covered members" size="sm">
        <PersonChip name="Arjun Shah" />
        <PersonChip name="Father" placeholder />
      </PersonChipGroup>,
    );
    const list = screen.getByRole('list', { name: 'Covered members' });
    const items = within(list).getAllByRole('listitem');
    expect(items).toHaveLength(2);
    expect(items[0]).toHaveAttribute('data-size', 'sm');
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  function Removable({ disabled }: { disabled?: string[] }) {
    const [people, setPeople] = useState(['Arjun Shah', 'Priya Shah', 'Aarav Shah']);
    return (
      <PersonChipGroup
        aria-label="Claim for"
        disabledKeys={disabled}
        onRemove={(keys) => setPeople((list) => list.filter((n) => !keys.has(n)))}
      >
        {people.map((name) => (
          <PersonChip key={name} name={name} />
        ))}
      </PersonChipGroup>
    );
  }

  it('removable: one tab stop, arrows move, Delete removes', async () => {
    const user = userEvent.setup();
    render(<Removable />);
    const grid = screen.getByRole('grid', { name: 'Claim for' });
    expect(within(grid).getAllByRole('row')).toHaveLength(3);

    await user.tab();
    expect(within(grid).getAllByRole('row')[0]).toHaveFocus();
    await user.keyboard('{ArrowRight}');
    expect(within(grid).getAllByRole('row')[1]).toHaveFocus();
    expect(within(grid).getAllByRole('row')[1]).toHaveAttribute('data-focus-visible', 'true');
    await user.keyboard('{Delete}');
    expect(within(grid).queryByText('Priya Shah')).not.toBeInTheDocument();
    expect(within(grid).getAllByRole('row')).toHaveLength(2);
  });

  it('removable: Tab reaches the focused chip\'s named remove button, then leaves the group', async () => {
    const user = userEvent.setup();
    render(
      <>
        <Removable />
        <button type="button">Next</button>
      </>,
    );
    await user.tab();
    expect(screen.getAllByRole('row')[0]).toHaveFocus();
    await user.tab();
    const remove = screen.getAllByRole('button')[0]!;
    expect(remove).toHaveFocus();
    await user.tab();
    expect(screen.getByRole('button', { name: 'Next' })).toHaveFocus();
    // React Aria names it "Remove" + the chip.
    expect(remove).toHaveAccessibleName(/Remove.*Arjun Shah/);
    await user.click(remove);
    expect(screen.queryByText('Arjun Shah')).not.toBeInTheDocument();
  });

  it('removable: disabled chips are marked and cannot be removed', async () => {
    const user = userEvent.setup();
    render(<Removable disabled={['Arjun Shah']} />);
    const row = screen.getAllByRole('row')[0]!;
    expect(row).toHaveAttribute('aria-disabled', 'true');
    expect(row).toHaveAttribute('data-disabled', 'true');
    await user.click(within(row).getByRole('button'));
    expect(screen.getByText('Arjun Shah')).toBeInTheDocument();
  });
});

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Radio, RadioGroup } from '../src/ui/radio-group';

function Delivery(props: { onChange?: (v: string) => void; variant?: 'default' | 'card'; isInvalid?: boolean; isDisabled?: boolean }) {
  return (
    <RadioGroup label="Delivery" defaultValue="standard" errorMessage="Choose a delivery option." {...props}>
      <Radio value="standard" description="3–5 working days">
        Standard
      </Radio>
      <Radio value="express" description="Next working day">
        Express
      </Radio>
      <Radio value="pickup" isDisabled>
        Pick up
      </Radio>
    </RadioGroup>
  );
}

describe('RadioGroup', () => {
  it('renders a labelled radiogroup; each radio is named by its title and described by its description', () => {
    render(<Delivery />);
    expect(screen.getByRole('radiogroup', { name: 'Delivery' })).toBeInTheDocument();
    const standard = screen.getByRole('radio', { name: 'Standard' });
    expect(standard).toBeChecked();
    expect(standard).toHaveAccessibleDescription('3–5 working days');
  });

  it('arrow keys move and select, skipping disabled options', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<Delivery onChange={onChange} />);
    await user.tab();
    expect(screen.getByRole('radio', { name: 'Standard' })).toHaveFocus();
    await user.keyboard('{ArrowDown}');
    expect(screen.getByRole('radio', { name: 'Express' })).toBeChecked();
    expect(onChange).toHaveBeenLastCalledWith('express');
    await user.keyboard('{ArrowDown}');
    // "Pick up" is disabled, so focus wraps to the first option.
    expect(screen.getByRole('radio', { name: 'Standard' })).toBeChecked();
    expect(screen.getByRole('radio', { name: 'Pick up' })).toBeDisabled();
  });

  it('card variant: the whole card is the label, and the name stays the title only', async () => {
    const user = userEvent.setup();
    const { container } = render(<Delivery variant="card" />);
    const cards = container.querySelectorAll('.card');
    expect(cards).toHaveLength(3);
    expect(screen.getByRole('radio', { name: 'Express' })).toHaveAccessibleDescription('Next working day');
    await user.click(screen.getByText('Express'));
    expect(screen.getByRole('radio', { name: 'Express' })).toBeChecked();
    expect(cards[1]).toHaveAttribute('data-selected');
  });

  it('marks the description of a disabled option as disabled (so contrast checkers exempt it)', () => {
    render(<Delivery variant="card" />);
    const pickup = screen.getByRole('radio', { name: 'Pick up' });
    expect(pickup).toBeDisabled();
    const express = screen.getByRole('radio', { name: 'Express' });
    const describedBy = (el: HTMLElement) => document.getElementById(el.getAttribute('aria-describedby') ?? '');
    expect(describedBy(express)).not.toHaveAttribute('aria-disabled');
    render(
      <RadioGroup label="Payout">
        <Radio value="cheque" description="Posted to your address." isDisabled>
          Cheque
        </Radio>
      </RadioGroup>,
    );
    const cheque = screen.getByRole('radio', { name: 'Cheque' });
    expect(cheque).toHaveAccessibleDescription('Posted to your address.');
    expect(describedBy(cheque)).toHaveAttribute('aria-disabled', 'true');
  });

  it('reflects invalid and disabled state', () => {
    const { rerender } = render(<Delivery isInvalid />);
    expect(screen.getByRole('radiogroup')).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByRole('radiogroup')).toHaveAccessibleDescription('Choose a delivery option.');
    rerender(<Delivery isDisabled />);
    expect(screen.getByRole('radiogroup')).toHaveAttribute('aria-disabled', 'true');
    for (const r of screen.getAllByRole('radio')) expect(r).toBeDisabled();
  });

  it('passes className through and exposes orientation', () => {
    render(
      <RadioGroup label="Size" orientation="horizontal" className="extra">
        <Radio value="s" className="item">
          S
        </Radio>
      </RadioGroup>,
    );
    const group = screen.getByRole('radiogroup', { name: 'Size' });
    expect(group).toHaveClass('group', 'extra');
    expect(group).toHaveAttribute('aria-orientation', 'horizontal');
    expect(screen.getByRole('radio', { name: 'S' }).closest('.radio')).toHaveClass('item');
  });
});

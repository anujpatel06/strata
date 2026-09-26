import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TextField as RACTextField } from 'react-aria-components';
import { Description, FieldError, FieldGroup, Input, Label, TextField } from '../src/ui/text-field';

describe('TextField', () => {
  it('links label and description to the input', () => {
    render(<TextField label="Email" description="We only use it for receipts." type="email" placeholder="you@example.com" />);
    const input = screen.getByRole('textbox', { name: 'Email' });
    expect(input).toHaveAttribute('type', 'email');
    expect(input).toHaveAttribute('placeholder', 'you@example.com');
    expect(input).toHaveAccessibleDescription('We only use it for receipts.');
  });

  it('accepts typing and reports changes', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<TextField label="Name" onChange={onChange} />);
    await user.tab();
    const input = screen.getByRole('textbox', { name: 'Name' });
    expect(input).toHaveFocus();
    expect(input).toHaveAttribute('data-focused');
    await user.keyboard('Asha');
    expect(input).toHaveValue('Asha');
    expect(onChange).toHaveBeenLastCalledWith('Asha');
  });

  it('shows the error message with an icon, marks the input invalid and describes it', () => {
    const { container } = render(<TextField label="Email" isInvalid errorMessage="Enter a valid email address." />);
    const input = screen.getByRole('textbox', { name: 'Email' });
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAccessibleDescription('Enter a valid email address.');
    expect(container.querySelector('.error svg[aria-hidden="true"]')).not.toBeNull();
  });

  it('shows native validation after a failed submit and marks required visually', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <form onSubmit={(e) => e.preventDefault()}>
        <TextField label="Account name" isRequired />
        <button type="submit">Submit</button>
      </form>,
    );
    const input = screen.getByRole('textbox', { name: 'Account name' });
    expect(input).toBeRequired();
    expect(screen.getByText('*')).toHaveAttribute('aria-hidden', 'true');
    await user.click(screen.getByRole('button', { name: 'Submit' }));
    expect(input.closest('.field')).toHaveAttribute('data-invalid');
    expect(container.querySelector('.error')).not.toBeNull();
  });

  it('reflects disabled state', () => {
    render(<TextField label="Reference" isDisabled defaultValue="REF-2041" />);
    expect(screen.getByRole('textbox', { name: 'Reference' })).toBeDisabled();
  });

  it('renders prefix and suffix inside the box, and a click on the prefix focuses the input', async () => {
    const user = userEvent.setup();
    render(<TextField label="Amount" prefix="₹" suffix="INR" inputMode="decimal" />);
    const input = screen.getByRole('textbox', { name: 'Amount' });
    const group = input.closest('.group');
    expect(group).not.toBeNull();
    expect(group).toHaveTextContent('₹INR');
    await user.click(screen.getByText('₹'));
    expect(input).toHaveFocus();
  });

  it('passes className through to the root', () => {
    const { container } = render(<TextField label="City" className="extra" />);
    expect(container.firstElementChild).toHaveClass('field', 'extra');
  });
});

describe('field primitives', () => {
  it('compose inside any React Aria field', () => {
    render(
      <RACTextField isInvalid>
        <Label isRequired>Postcode</Label>
        <FieldGroup>
          <Input />
        </FieldGroup>
        <Description>Six digits.</Description>
        <FieldError>Enter a six-digit postcode.</FieldError>
      </RACTextField>,
    );
    const input = screen.getByRole('textbox', { name: 'Postcode' });
    expect(input).toHaveAccessibleDescription('Six digits. Enter a six-digit postcode.');
    expect(input).toHaveClass('input');
  });

  it('FieldError renders nothing while valid', () => {
    const { container } = render(
      <RACTextField aria-label="x">
        <Input />
        <FieldError>Never shown</FieldError>
      </RACTextField>,
    );
    expect(container.querySelector('.error')).toBeNull();
  });
});

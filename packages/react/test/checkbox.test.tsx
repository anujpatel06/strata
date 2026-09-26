import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Checkbox, CheckboxGroup } from '../src/ui/checkbox';

describe('Checkbox', () => {
  it('renders a checkbox named by its label and described by its description', () => {
    render(<Checkbox description="We'll email you when a claim changes status.">Email updates</Checkbox>);
    const checkbox = screen.getByRole('checkbox', { name: 'Email updates' });
    expect(checkbox).not.toBeChecked();
    expect(checkbox).toHaveAccessibleDescription("We'll email you when a claim changes status.");
  });

  it('toggles with Space', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<Checkbox onChange={onChange}>Remember this device</Checkbox>);
    await user.tab();
    const checkbox = screen.getByRole('checkbox', { name: 'Remember this device' });
    expect(checkbox).toHaveFocus();
    await user.keyboard(' ');
    expect(checkbox).toBeChecked();
    expect(onChange).toHaveBeenLastCalledWith(true);
    await user.keyboard(' ');
    expect(checkbox).not.toBeChecked();
  });

  it('supports the indeterminate state', () => {
    render(<Checkbox isIndeterminate>Select all</Checkbox>);
    const checkbox = screen.getByRole('checkbox', { name: 'Select all' }) as HTMLInputElement;
    expect(checkbox.indeterminate).toBe(true);
    expect(checkbox.closest('label')).toHaveAttribute('data-indeterminate');
  });

  it('reflects disabled and invalid state, with a standalone error message', () => {
    render(
      <>
        <Checkbox isDisabled>Locked option</Checkbox>
        <Checkbox isInvalid errorMessage="Accept the terms to continue.">
          I accept the terms
        </Checkbox>
      </>,
    );
    expect(screen.getByRole('checkbox', { name: 'Locked option' })).toBeDisabled();
    const terms = screen.getByRole('checkbox', { name: 'I accept the terms' });
    expect(terms).toHaveAttribute('aria-invalid', 'true');
    expect(terms).toHaveAccessibleDescription('Accept the terms to continue.');
  });

  it('passes className through to the root', () => {
    const { container } = render(<Checkbox className="extra">Option</Checkbox>);
    expect(container.firstElementChild).toHaveClass('checkbox', 'extra');
  });
});

describe('CheckboxGroup', () => {
  function Channels(props: { onChange?: (v: string[]) => void; isInvalid?: boolean; isDisabled?: boolean }) {
    return (
      <CheckboxGroup
        label="Notify me by"
        description="Choose at least one."
        errorMessage="Pick at least one channel."
        defaultValue={['email']}
        {...props}
      >
        <Checkbox value="email">Email</Checkbox>
        <Checkbox value="sms">SMS</Checkbox>
        <Checkbox value="push">Push notification</Checkbox>
      </CheckboxGroup>
    );
  }

  it('renders a labelled, described group and collects values', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<Channels onChange={onChange} />);
    const group = screen.getByRole('group', { name: 'Notify me by' });
    expect(group).toHaveAccessibleDescription('Choose at least one.');
    expect(screen.getByRole('checkbox', { name: 'Email' })).toBeChecked();
    await user.tab();
    await user.tab();
    expect(screen.getByRole('checkbox', { name: 'SMS' })).toHaveFocus();
    await user.keyboard(' ');
    expect(onChange).toHaveBeenLastCalledWith(['email', 'sms']);
  });

  it('shows the group error and disables all items', () => {
    const { rerender } = render(<Channels isInvalid />);
    expect(screen.getByRole('group', { name: 'Notify me by' })).toHaveAccessibleDescription(
      'Choose at least one. Pick at least one channel.',
    );
    for (const cb of screen.getAllByRole('checkbox')) expect(cb).toHaveAttribute('aria-invalid', 'true');
    rerender(<Channels isDisabled />);
    for (const cb of screen.getAllByRole('checkbox')) expect(cb).toBeDisabled();
  });

  it('sets orientation for layout', () => {
    const { container } = render(
      <CheckboxGroup label="Days" orientation="horizontal" className="extra">
        <Checkbox value="mon">Mon</Checkbox>
      </CheckboxGroup>,
    );
    expect(container.firstElementChild).toHaveClass('group', 'extra');
    expect(container.querySelector('.items')).toHaveAttribute('data-orientation', 'horizontal');
  });
});

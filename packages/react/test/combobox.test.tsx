import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Combobox, ComboboxItem, ComboboxSection } from '../src/ui/combobox';

function Countries(props: Partial<Parameters<typeof Combobox>[0]>) {
  return (
    <Combobox label="Country" placeholder="Search countries…" {...props}>
      <ComboboxItem id="ca">Canada</ComboboxItem>
      <ComboboxItem id="in">India</ComboboxItem>
      <ComboboxItem id="id">Indonesia</ComboboxItem>
      <ComboboxItem id="jp">Japan</ComboboxItem>
    </Combobox>
  );
}

describe('Combobox', () => {
  it('renders a labelled combobox input and a trigger button', () => {
    render(<Countries />);
    const input = screen.getByRole('combobox', { name: 'Country' });
    expect(input).toHaveAttribute('placeholder', 'Search countries…');
    expect(input).toHaveAttribute('aria-expanded', 'false');
    // RAC names the chevron button and keeps it out of the tab order.
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('tabindex', '-1');
  });

  it('filters as you type and selects with the keyboard', async () => {
    const user = userEvent.setup();
    const onSelectionChange = vi.fn();
    render(<Countries onSelectionChange={onSelectionChange} />);
    const input = screen.getByRole('combobox', { name: 'Country' });
    await user.type(input, 'ind');
    const listbox = await screen.findByRole('listbox');
    expect(within(listbox).getAllByRole('option').map((o) => o.textContent)).toEqual(['India', 'Indonesia']);
    await user.keyboard('{ArrowDown}{ArrowDown}{Enter}');
    expect(onSelectionChange).toHaveBeenCalledWith('id');
    expect(input).toHaveValue('Indonesia');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('opens with ArrowDown and closes with Escape', async () => {
    const user = userEvent.setup();
    render(<Countries />);
    await user.tab();
    await user.keyboard('{ArrowDown}');
    expect(await screen.findByRole('listbox')).toBeInTheDocument();
    expect(screen.getByRole('combobox')).toHaveAttribute('aria-expanded', 'true');
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('shows an empty state when nothing matches', async () => {
    const user = userEvent.setup();
    render(<Countries emptyState="No countries found" />);
    await user.type(screen.getByRole('combobox'), 'zz');
    const listbox = await screen.findByRole('listbox');
    expect(listbox).toHaveTextContent('No countries found');
    expect(within(listbox).queryByRole('option', { name: /Canada|India|Japan/ })).toBeNull();
  });

  it('defaults the empty state to "No results"', async () => {
    const user = userEvent.setup();
    render(<Countries />);
    await user.type(screen.getByRole('combobox'), 'zz');
    expect(await screen.findByText('No results')).toBeInTheDocument();
  });

  it('keeps free text with allowsCustomValue', async () => {
    const user = userEvent.setup();
    const onInputChange = vi.fn();
    render(<Countries allowsCustomValue onInputChange={onInputChange} />);
    const input = screen.getByRole('combobox');
    await user.type(input, 'Atlantis');
    await user.tab();
    expect(input).toHaveValue('Atlantis');
    expect(onInputChange).toHaveBeenLastCalledWith('Atlantis');
  });

  it('renders sections as labelled groups', async () => {
    const user = userEvent.setup();
    render(
      <Combobox label="Account">
        <ComboboxSection title="Bank">
          <ComboboxItem id="current">Current</ComboboxItem>
        </ComboboxSection>
        <ComboboxSection title="Cards">
          <ComboboxItem id="debit">Debit</ComboboxItem>
        </ComboboxSection>
      </Combobox>,
    );
    await user.click(screen.getByRole('button'));
    expect(screen.getByRole('group', { name: 'Cards' })).toBeInTheDocument();
  });

  it('shows the error and sets aria-invalid when invalid', () => {
    render(<Countries isInvalid errorMessage="Choose a country." />);
    expect(screen.getByText('Choose a country.')).toBeInTheDocument();
    const input = screen.getByRole('combobox');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAccessibleDescription('Choose a country.');
  });

  it('is disabled', () => {
    render(<Countries isDisabled />);
    expect(screen.getByRole('combobox')).toBeDisabled();
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('passes className to the root', () => {
    const { container } = render(<Countries className="custom" />);
    expect(container.querySelector('.custom')).toContainElement(screen.getByRole('combobox'));
  });
});

describe('Combobox size', () => {
  it('marks the root with its size (md by default)', () => {
    render(
      <Combobox label="Country" size="lg">
        <ComboboxItem id="in">India</ComboboxItem>
      </Combobox>,
    );
    expect(screen.getByRole('combobox', { name: 'Country' }).closest('[data-field-size]')).toHaveAttribute('data-field-size', 'lg');
  });
});

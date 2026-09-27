import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ToggleButton, ToggleButtonGroup } from '../src/ui/toggle-group';

// React Aria's SelectionIndicator (a SharedElement) calls element.getAnimations(), which jsdom doesn't implement.
beforeAll(() => {
  if (!('getAnimations' in Element.prototype)) {
    Object.defineProperty(Element.prototype, 'getAnimations', { value: () => [], configurable: true });
  }
});

function Period(props: { onSelectionChange?: (keys: Set<string | number>) => void; isDisabled?: boolean }) {
  return (
    <ToggleButtonGroup aria-label="Period" defaultSelectedKeys={['month']} onSelectionChange={props.onSelectionChange} isDisabled={props.isDisabled}>
      <ToggleButton id="week">Week</ToggleButton>
      <ToggleButton id="month">Month</ToggleButton>
      <ToggleButton id="year">Year</ToggleButton>
    </ToggleButtonGroup>
  );
}

describe('ToggleButtonGroup', () => {
  it('renders a single-select radiogroup with the default selection', () => {
    render(<Period />);
    expect(screen.getByRole('radiogroup', { name: 'Period' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Month' })).toBeChecked();
    expect(screen.getByRole('radio', { name: 'Week' })).not.toBeChecked();
  });

  it('moves with arrow keys and selects with Space', async () => {
    const onSelectionChange = vi.fn();
    const user = userEvent.setup();
    render(<Period onSelectionChange={onSelectionChange} />);
    await user.tab();
    expect(screen.getByRole('radio', { name: 'Week' })).toHaveFocus();
    await user.keyboard('{ArrowRight}{ArrowRight}');
    expect(screen.getByRole('radio', { name: 'Year' })).toHaveFocus();
    await user.keyboard(' ');
    expect(screen.getByRole('radio', { name: 'Year' })).toBeChecked();
    expect(onSelectionChange).toHaveBeenLastCalledWith(new Set(['year']));
  });

  it('multiple selection renders a toolbar of pressed buttons', async () => {
    const user = userEvent.setup();
    render(
      <ToggleButtonGroup aria-label="Days" selectionMode="multiple" defaultSelectedKeys={['mon']}>
        <ToggleButton id="mon">Mon</ToggleButton>
        <ToggleButton id="tue">Tue</ToggleButton>
      </ToggleButtonGroup>,
    );
    expect(screen.getByRole('toolbar', { name: 'Days' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Mon' })).toHaveAttribute('aria-pressed', 'true');
    await user.click(screen.getByRole('button', { name: 'Tue' }));
    expect(screen.getByRole('button', { name: 'Tue' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Mon' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('renders the sliding selection pill only in the selected segment, and moves it with the selection', async () => {
    const user = userEvent.setup();
    const { container } = render(<Period />);
    const month = screen.getByRole('radio', { name: 'Month' });
    const year = screen.getByRole('radio', { name: 'Year' });
    expect(container.querySelectorAll('.indicator')).toHaveLength(1);
    expect(month.querySelector('.indicator')).not.toBeNull();
    await user.click(year);
    expect(year.querySelector('.indicator')).not.toBeNull();
    expect(month.querySelector('.indicator')).toBeNull();
    // Decorative: the pill adds nothing to the accessible name.
    expect(year).toHaveAccessibleName('Year');
  });

  it('disables every item when the group is disabled', () => {
    render(<Period isDisabled />);
    for (const radio of screen.getAllByRole('radio')) expect(radio).toBeDisabled();
  });

  it('applies the segment style and the group size to items', () => {
    render(
      <ToggleButtonGroup aria-label="View" size="sm" className="extra">
        <ToggleButton id="list">List</ToggleButton>
      </ToggleButtonGroup>,
    );
    expect(screen.getByRole('radiogroup')).toHaveClass('group', 'extra');
    const item = screen.getByRole('radio', { name: 'List' });
    expect(item).toHaveClass('segment');
    expect(item).toHaveAttribute('data-size', 'sm');
  });
});

describe('ToggleButton (standalone)', () => {
  it('is a pressed-state button toggled by Enter/Space', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(
      <ToggleButton aria-label="Pin" onChange={onChange} className="extra">
        P
      </ToggleButton>,
    );
    const button = screen.getByRole('button', { name: 'Pin' });
    expect(button).toHaveAttribute('aria-pressed', 'false');
    expect(button).toHaveClass('standalone', 'extra');
    await user.tab();
    await user.keyboard(' ');
    expect(button).toHaveAttribute('aria-pressed', 'true');
    await user.keyboard('{Enter}');
    expect(button).toHaveAttribute('aria-pressed', 'false');
    expect(onChange).toHaveBeenCalledTimes(2);
  });
});

describe('ToggleButton labels', () => {
  it('wraps a plain-text label so its medium-weight width is reserved, without changing the accessible name', () => {
    render(
      <ToggleButtonGroup aria-label="View">
        <ToggleButton id="list">List</ToggleButton>
        <ToggleButton id="grid" aria-label="Grid">
          <svg aria-hidden="true" />
        </ToggleButton>
      </ToggleButtonGroup>,
    );
    const list = screen.getByRole('radio', { name: 'List' });
    const label = list.querySelector('[data-label]');
    expect(label).toHaveAttribute('data-label', 'List');
    expect(label).toHaveClass('label');
    expect(label).toHaveTextContent('List');
    // Non-string content is left alone.
    expect(screen.getByRole('radio', { name: 'Grid' }).querySelector('[data-label]')).toBeNull();
  });
});

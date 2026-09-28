import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { I18nProvider } from 'react-aria-components';
import { ToggleButton, ToggleButtonGroup } from '../src/ui/toggle-group';
import { readUiCss } from './status-icon-contrast';

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

describe('ToggleButtonGroup in a narrow container (reflow, WCAG 1.4.10)', () => {
  // jsdom has no layout, so the wrapping itself is measured in a browser (playground, 320 and 390px wide, every
  // tenant and density, LTR and RTL). These tests pin the CSS that makes it wrap, and the behaviour around it.
  const css = readUiCss('toggle-group.module.css');
  const rule = (selector: string) => {
    const at = css.indexOf(`\n${selector} {`);
    expect(at, `${selector} rule`).toBeGreaterThan(-1);
    return css.slice(at, css.indexOf('}', at));
  };

  it('wraps segments onto more rows inside the track instead of spilling out of it', () => {
    const group = rule('.group');
    expect(group).toMatch(/flex-wrap: wrap;/);
    expect(group).toMatch(/max-inline-size: 100%;/);
    // A minimum, not a fixed height, so a second row can grow the track.
    expect(group).toMatch(/min-block-size: var\(--_h\);/);
    expect(group).not.toMatch(/(^|[^-])block-size:/m);
    const segment = rule('.segment');
    // Can shrink (only happens to a segment alone on its row), and its label can then wrap: never cut off.
    expect(segment).toMatch(/flex: 1 1 auto;/);
    expect(segment).toMatch(/white-space: normal;/);
    expect(segment).toMatch(/overflow-wrap: anywhere;/);
    expect(segment).not.toMatch(/overflow: hidden|text-overflow/);
    // Each row keeps the control height.
    expect(segment).toMatch(/min-block-size: calc\(var\(--_h\) - 2 \* var\(--_pad\)\);/);
  });

  it('keeps a long label whole, as text and as the accessible name', () => {
    render(
      <ToggleButtonGroup aria-label="Show">
        <ToggleButton id="all">All</ToggleButton>
        <ToggleButton id="scheduled">Includes scheduled transfers</ToggleButton>
      </ToggleButtonGroup>,
    );
    const long = screen.getByRole('radio', { name: 'Includes scheduled transfers' });
    expect(long).toHaveTextContent('Includes scheduled transfers');
    expect(long).not.toHaveAttribute('title');
  });

  it('moves through all five options with the arrow keys, in both directions and in RTL', async () => {
    const user = userEvent.setup();
    render(
      <I18nProvider locale="ar-AE">
        <div dir="rtl">
          <ToggleButtonGroup aria-label="Range" defaultSelectedKeys={['day']} disallowEmptySelection>
            {['day', 'week', 'month', 'quarter', 'year'].map((id) => (
              <ToggleButton key={id} id={id}>
                {id}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        </div>
      </I18nProvider>,
    );
    await user.tab();
    expect(screen.getByRole('radio', { name: 'day' })).toHaveFocus();
    // Right-to-left: ArrowLeft moves forward in reading order, ArrowRight back.
    await user.keyboard('{ArrowLeft}{ArrowLeft}{ArrowLeft}{ArrowLeft}');
    expect(screen.getByRole('radio', { name: 'year' })).toHaveFocus();
    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('radio', { name: 'quarter' })).toHaveFocus();
    await user.keyboard(' ');
    expect(screen.getByRole('radio', { name: 'quarter' })).toBeChecked();
    expect(screen.getByRole('radio', { name: 'quarter' }).querySelector('.indicator')).not.toBeNull();
  });
});

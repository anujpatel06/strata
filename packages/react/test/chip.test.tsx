import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { I18nProvider, type Key, type Selection } from 'react-aria-components';
import { IconMapPin } from '@syntara/icons';
import { Avatar } from '../src/ui/avatar';
import { Chip, ChipGroup } from '../src/ui/chip';

const rows = (grid: HTMLElement) => within(grid).getAllByRole('row');

describe('ChipGroup — filter', () => {
  function Filters({ onChange }: { onChange?: (keys: Selection) => void }) {
    return (
      <ChipGroup label="Show" onSelectionChange={onChange} defaultSelectedKeys={['sponsored']}>
        <Chip id="sponsored" count={3}>
          Sponsored
        </Chip>
        <Chip id="discounted" count={2}>
          Discounted
        </Chip>
        <Chip id="consults" count={1200}>
          Consults
        </Chip>
      </ChipGroup>
    );
  }

  it('is a grid named by its visible label; each chip is named with its count', () => {
    render(<Filters />);
    const grid = screen.getByRole('grid', { name: 'Show' });
    expect(grid).toHaveAttribute('aria-multiselectable', 'true');
    expect(within(grid).getByRole('row', { name: 'Sponsored 3' })).toBeInTheDocument();
    // The count is formatted for the locale.
    expect(within(grid).getByRole('row', { name: 'Consults 1,200' })).toBeInTheDocument();
  });

  it('formats the count in the locale (Arabic digits in ar-EG)', () => {
    render(
      <I18nProvider locale="ar-EG">
        <ChipGroup aria-label="تصفية">
          <Chip id="a" count={12}>
            الكل
          </Chip>
        </ChipGroup>
      </I18nProvider>,
    );
    expect(screen.getByRole('row')).toHaveAccessibleName('الكل ١٢');
  });

  it('Space toggles several on; arrows move focus', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Filters onChange={onChange} />);
    const grid = screen.getByRole('grid');
    const [sponsored, discounted, consults] = rows(grid);
    expect(sponsored).toHaveAttribute('aria-selected', 'true');
    expect(sponsored).toHaveAttribute('data-selected', 'true');

    await user.tab();
    expect(sponsored).toHaveFocus();
    await user.keyboard('{ArrowRight}');
    expect(discounted).toHaveFocus();
    expect(discounted).toHaveAttribute('data-focus-visible', 'true');
    await user.keyboard(' ');
    expect(discounted).toHaveAttribute('aria-selected', 'true');
    expect(sponsored).toHaveAttribute('aria-selected', 'true');
    expect([...(onChange.mock.lastCall![0] as Set<Key>)].sort()).toEqual(['discounted', 'sponsored']);

    await user.keyboard('{End}');
    expect(consults).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(consults).toHaveAttribute('aria-selected', 'true');
    // Space again turns it off: filters can all be off.
    await user.keyboard('{ArrowLeft}{ArrowLeft} ');
    expect(sponsored).toHaveAttribute('aria-selected', 'false');
  });

  it('draws a check in filter mode (decorative) and none in choice mode', () => {
    const { rerender } = render(
      <ChipGroup aria-label="f">
        <Chip id="a">A</Chip>
      </ChipGroup>,
    );
    const svg = screen.getByRole('row').querySelector('svg');
    expect(svg?.closest('[aria-hidden="true"]')).not.toBeNull();
    rerender(
      <ChipGroup aria-label="f" mode="choice">
        <Chip id="a">A</Chip>
      </ChipGroup>,
    );
    expect(screen.getByRole('row').querySelector('svg')).toBeNull();
  });

  it('pointer: clicking toggles', async () => {
    const user = userEvent.setup();
    render(<Filters />);
    const [, discounted] = rows(screen.getByRole('grid'));
    await user.click(discounted!);
    expect(discounted).toHaveAttribute('aria-selected', 'true');
    await user.click(discounted!);
    expect(discounted).toHaveAttribute('aria-selected', 'false');
  });
});

describe('ChipGroup — choice', () => {
  function Period() {
    const [period, setPeriod] = useState<Selection>(new Set(['month']));
    return (
      <ChipGroup mode="choice" aria-label="Period" selectedKeys={period} onSelectionChange={setPeriod}>
        <Chip id="week">This week</Chip>
        <Chip id="month">This month</Chip>
        <Chip id="year">This year</Chip>
      </ChipGroup>
    );
  }

  it('selects exactly one and never none', async () => {
    const user = userEvent.setup();
    render(<Period />);
    const grid = screen.getByRole('grid', { name: 'Period' });
    expect(grid).not.toHaveAttribute('aria-multiselectable', 'true');
    const [week, month] = rows(grid);
    expect(month).toHaveAttribute('aria-selected', 'true');

    await user.tab();
    await user.keyboard('{Home} ');
    expect(week).toHaveAttribute('aria-selected', 'true');
    expect(month).toHaveAttribute('aria-selected', 'false');
    // Pressing the selected chip again keeps it (disallowEmptySelection).
    await user.keyboard(' ');
    expect(week).toHaveAttribute('aria-selected', 'true');
  });
});

describe('ChipGroup — input', () => {
  function Cities({ disabled }: { disabled?: string[] }) {
    const [cities, setCities] = useState(['Delhi', 'Pune', 'Kochi']);
    return (
      <ChipGroup
        mode="input"
        label="Cities"
        disabledKeys={disabled}
        onRemove={(keys) => setCities((list) => list.filter((c) => !keys.has(c)))}
      >
        {cities.map((c) => (
          <Chip key={c} id={c} icon={<IconMapPin />}>
            {c}
          </Chip>
        ))}
      </ChipGroup>
    );
  }

  it('Delete and Backspace remove the focused chip; chips are not selectable', async () => {
    const user = userEvent.setup();
    render(<Cities />);
    const grid = screen.getByRole('grid', { name: 'Cities' });
    expect(rows(grid)[0]).not.toHaveAttribute('aria-selected');

    await user.tab();
    await user.keyboard('{ArrowRight}{Delete}');
    expect(within(grid).queryByRole('row', { name: 'Pune' })).not.toBeInTheDocument();
    expect(rows(grid)).toHaveLength(2);

    await user.keyboard('{Backspace}');
    expect(rows(grid)).toHaveLength(1);
  });

  it('each chip has a remove button named "Remove <label>"', async () => {
    const user = userEvent.setup();
    render(<Cities />);
    const button = screen.getByRole('button', { name: 'Remove Delhi' });
    await user.click(button);
    expect(screen.queryByRole('row', { name: 'Delhi' })).not.toBeInTheDocument();
  });

  it('disabled chips can\'t be removed or focused', async () => {
    const user = userEvent.setup();
    render(<Cities disabled={['Pune']} />);
    const grid = screen.getByRole('grid');
    const pune = within(grid).getByRole('row', { name: 'Pune' });
    expect(pune).toHaveAttribute('aria-disabled', 'true');
    expect(pune).toHaveAttribute('data-disabled', 'true');
    expect(within(pune).getByRole('button', { name: 'Remove Pune' })).toBeDisabled();

    await user.tab();
    await user.keyboard('{ArrowRight}');
    // Focus skips the disabled chip.
    expect(within(grid).getByRole('row', { name: 'Kochi' })).toHaveFocus();
  });
});

describe('Chip', () => {
  it('disabled filter chips can\'t be toggled', async () => {
    const user = userEvent.setup();
    render(
      <ChipGroup aria-label="Show" disabledKeys={['b']}>
        <Chip id="a">A</Chip>
        <Chip id="b">B</Chip>
      </ChipGroup>,
    );
    const b = screen.getByRole('row', { name: 'B' });
    expect(b).toHaveAttribute('aria-disabled', 'true');
    await user.click(b);
    expect(b).not.toHaveAttribute('aria-selected', 'true');
    expect(b).not.toHaveAttribute('data-selected');
  });

  it('avatar and icon are decorative; textValue names non-string labels; size and className pass through', () => {
    render(
      <ChipGroup aria-label="Members" size="sm">
        <Chip id="p" avatar={<Avatar name="Priya Shah" alt="" />} className="mine">
          Priya
        </Chip>
        <Chip id="q" textValue="Pharmacy" count={4}>
          <strong>Pharmacy</strong>
        </Chip>
      </ChipGroup>,
    );
    const [p, q] = screen.getAllByRole('row');
    expect(p).toHaveAccessibleName('Priya');
    expect(p).toHaveClass('chip', 'mine');
    expect(p).toHaveAttribute('data-size', 'sm');
    expect(within(p!).queryByRole('img')).not.toBeInTheDocument();
    expect(q).toHaveAccessibleName('Pharmacy 4');
  });

  it('wrap={false} marks the list for the single scrolling row', () => {
    render(
      <ChipGroup aria-label="Show" wrap={false} className="outer">
        <Chip id="a">A</Chip>
      </ChipGroup>,
    );
    const grid = screen.getByRole('grid');
    expect(grid).toHaveAttribute('data-wrap', 'false');
    expect(grid.closest('.outer')).not.toBeNull();
  });
});

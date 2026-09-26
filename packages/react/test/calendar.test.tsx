import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CalendarDate, isWeekend } from '@internationalized/date';
import { Calendar, RangeCalendar } from '../src/ui/calendar';

const day = (n: number) => new CalendarDate(2026, 9, n);

describe('Calendar', () => {
  it('renders a labelled grid with the month heading and nav buttons', () => {
    const { container } = render(<Calendar aria-label="Appointment date" defaultValue={day(15)} />);
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('September 2026');
    expect(screen.getByRole('grid')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Previous' })).toBeInTheDocument();
    // RAC also renders a visually hidden "Next" after the grid for screen readers.
    expect(screen.getAllByRole('button', { name: 'Next' })[0]).toHaveAttribute('slot', 'next');
    // Weekday names are visual only (RAC hides the header row; each cell has a full date label).
    expect(container.querySelectorAll('th')).toHaveLength(7);
  });

  it('moves with arrow keys and selects with Enter', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Calendar aria-label="Date" defaultFocusedValue={day(15)} onChange={onChange} />);
    await user.tab(); // previous
    await user.tab(); // next
    await user.tab(); // grid: focused date
    expect(document.activeElement).toHaveTextContent('15');
    await user.keyboard('{ArrowRight}{ArrowDown}{Enter}');
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange.mock.calls[0]?.[0].toString()).toBe('2026-09-23');
    const selected = screen.getByRole('gridcell', { selected: true });
    expect(selected).toHaveTextContent('23');
  });

  it('pages months with the next button', async () => {
    const user = userEvent.setup();
    render(<Calendar aria-label="Date" defaultFocusedValue={day(15)} />);
    await user.click(screen.getAllByRole('button', { name: 'Next' })[0]!);
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('October 2026');
  });

  it('disables dates outside min/max and marks unavailable dates', () => {
    render(
      <Calendar
        aria-label="Delivery"
        defaultFocusedValue={day(15)}
        minValue={day(10)}
        isDateUnavailable={(d) => isWeekend(d, 'en-US')}
      />,
    );
    const grid = screen.getByRole('grid');
    const cell = (label: RegExp) => within(grid).getByRole('button', { name: label });
    expect(cell(/September 9, 2026/)).toHaveAttribute('aria-disabled', 'true');
    // 2026-09-12 is a Saturday: unavailable, still focusable.
    expect(cell(/September 12, 2026/)).toHaveAttribute('aria-disabled', 'true');
    expect(cell(/September 14, 2026/)).not.toHaveAttribute('aria-disabled');
  });

  it('shows an error message when invalid', () => {
    render(<Calendar aria-label="Date" value={day(12)} isInvalid errorMessage="Pick a weekday." />);
    expect(screen.getByText('Pick a weekday.')).toBeInTheDocument();
  });

  it('is disabled', () => {
    const { container } = render(<Calendar aria-label="Date" isDisabled defaultFocusedValue={day(15)} />);
    expect(container.querySelector('[data-disabled]')).not.toBeNull();
    expect(screen.getAllByRole('button', { name: 'Next' })[0]).toBeDisabled();
  });

  it('renders one grid per visible month', () => {
    render(<Calendar aria-label="Date" defaultFocusedValue={day(15)} visibleDuration={{ months: 2 }} />);
    expect(screen.getAllByRole('grid')).toHaveLength(2);
  });

  it('passes className to the root', () => {
    const { container } = render(<Calendar aria-label="Date" className="custom" />);
    expect(container.querySelector('.custom')).toContainElement(screen.getByRole('grid'));
  });
});

describe('RangeCalendar', () => {
  it('selects a start and end date', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<RangeCalendar aria-label="Trip" defaultFocusedValue={day(10)} onChange={onChange} />);
    await user.click(screen.getByRole('button', { name: /September 10, 2026/ }));
    await user.click(screen.getByRole('button', { name: /September 13, 2026/ }));
    expect(onChange).toHaveBeenCalledTimes(1);
    const range = onChange.mock.calls[0]?.[0];
    expect(range.start.toString()).toBe('2026-09-10');
    expect(range.end.toString()).toBe('2026-09-13');
    expect(screen.getAllByRole('gridcell', { selected: true })).toHaveLength(4);
  });
});

import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CalendarDate } from '@internationalized/date';
import { DatePicker, DateRangePicker } from '../src/ui/date-picker';

const day = (n: number) => new CalendarDate(2026, 9, n);

describe('DatePicker', () => {
  it('renders labelled date segments and a calendar button', () => {
    render(<DatePicker label="Date of incident" description="The day it happened." />);
    const group = screen.getByRole('group', { name: 'Date of incident' });
    const segments = within(group).getAllByRole('spinbutton');
    expect(segments).toHaveLength(3);
    expect(within(group).getByRole('button', { name: /Calendar/ })).toBeInTheDocument();
    expect(segments[0]).toHaveAccessibleDescription(/The day it happened\./);
  });

  it('pads months and days to two digits by default', () => {
    render(<DatePicker label="Date" defaultValue={day(5)} />);
    expect(screen.getAllByRole('spinbutton').map((s) => s.textContent)).toEqual(['09', '05', '2026']);
  });

  it('accepts typed digits segment by segment', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<DatePicker label="Date" onChange={onChange} />);
    await user.click(screen.getAllByRole('spinbutton')[0]!);
    await user.keyboard('09152026');
    expect(onChange).toHaveBeenLastCalledWith(day(15));
  });

  it('opens the calendar from the button, picks a date and closes', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<DatePicker label="Date" defaultValue={day(10)} onChange={onChange} />);
    await user.click(screen.getByRole('button', { name: /Calendar/ }));
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByRole('grid')).toBeInTheDocument();
    // The calendar knows it sits on the glass popover (its CSS swaps text.disabled days for text.subtle there).
    expect(dialog.querySelector('[data-in-picker]')).not.toBeNull();
    await user.click(within(dialog).getByRole('button', { name: /September 20, 2026/ }));
    expect(onChange).toHaveBeenCalledWith(day(20));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('opens the calendar with Alt+ArrowDown and closes with Escape', async () => {
    const user = userEvent.setup();
    render(<DatePicker label="Date" defaultValue={day(10)} />);
    await user.click(screen.getAllByRole('spinbutton')[0]!);
    await user.keyboard('{Alt>}{ArrowDown}{/Alt}');
    expect(await screen.findByRole('dialog')).toBeInTheDocument();
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('shows the error for an out-of-range value', () => {
    render(
      <DatePicker
        label="Start date"
        minValue={day(20)}
        defaultValue={day(10)}
        validationBehavior="aria"
        errorMessage="Start date can't be in the past."
      />,
    );
    expect(screen.getByText("Start date can't be in the past.")).toBeInTheDocument();
    expect(screen.getAllByRole('spinbutton')[0]).toHaveAttribute('aria-invalid', 'true');
  });

  it('is disabled', () => {
    render(<DatePicker label="Date" isDisabled defaultValue={day(10)} />);
    for (const s of screen.getAllByRole('spinbutton')) expect(s).toHaveAttribute('aria-disabled', 'true');
    expect(screen.getByRole('button', { name: /Calendar/ })).toBeDisabled();
  });

  it('passes className to the root', () => {
    const { container } = render(<DatePicker label="Date" className="custom" />);
    expect(container.querySelector('.custom')).toContainElement(screen.getByRole('group', { name: 'Date' }));
  });
});

describe('DateRangePicker', () => {
  it('renders start and end segments and picks a range in the calendar', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<DateRangePicker label="Stay" defaultValue={{ start: day(3), end: day(5) }} onChange={onChange} />);
    const group = screen.getByRole('group', { name: 'Stay' });
    expect(within(group).getAllByRole('spinbutton')).toHaveLength(6);
    await user.click(screen.getByRole('button', { name: /Calendar/ }));
    const dialog = await screen.findByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: /September 10, 2026/ }));
    await user.click(within(dialog).getByRole('button', { name: /September 12, 2026/ }));
    expect(onChange).toHaveBeenCalledWith({ start: day(10), end: day(12) });
  });

  it('shows two months when asked', async () => {
    const user = userEvent.setup();
    render(<DateRangePicker label="Stay" visibleMonths={2} />);
    await user.click(screen.getByRole('button', { name: /Calendar/ }));
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getAllByRole('grid')).toHaveLength(2);
  });
});

'use client';

import { useContext, useState, type JSX } from 'react';
import {
  Button as RACButton,
  Calendar as RACCalendar,
  CalendarCell,
  CalendarGrid,
  CalendarGridBody,
  CalendarGridHeader,
  CalendarHeaderCell,
  CalendarStateContext,
  DatePickerStateContext,
  DateRangePickerStateContext,
  Heading,
  RangeCalendar as RACRangeCalendar,
  RangeCalendarStateContext,
  Text,
  composeRenderProps,
  type CalendarProps as RACCalendarProps,
  type DateValue,
  type RangeCalendarProps as RACRangeCalendarProps,
} from 'react-aria-components';
import type { DateDuration } from '@internationalized/date';
import { IconChevronLeft, IconChevronRight } from '@syntara/icons';
import styles from './calendar.module.css';

const cx = (...c: Array<string | false | null | undefined>) => c.filter(Boolean).join(' ');

export interface CalendarProps<T extends DateValue> extends RACCalendarProps<T> {
  /** Shown under the grid when `isInvalid` is true, e.g. "Pick a weekday." */
  errorMessage?: string;
}

export interface RangeCalendarProps<T extends DateValue> extends RACRangeCalendarProps<T> {
  /** Shown under the grid when `isInvalid` is true. */
  errorMessage?: string;
}

/**
 * Which way the last page turn went, so the new month can slide in from that side. Derived during render from the
 * visible month (React's "store information from previous renders" pattern), no effects. `page` flips 0/1 on every
 * turn: the CSS swaps between two identical keyframes, which restarts the animation without remounting the grid
 * (remounting would drop the focused cell).
 */
function usePageTurn(): { direction: 'next' | 'prev' | undefined; page: 0 | 1 } {
  const single = useContext(CalendarStateContext);
  const range = useContext(RangeCalendarStateContext);
  const start = (single ?? range)?.visibleRange.start;
  const month = start ? start.year * 12 + start.month : 0;
  const [turn, setTurn] = useState<{ month: number; direction: 'next' | 'prev' | undefined; page: 0 | 1 }>({
    month,
    direction: undefined,
    page: 0,
  });
  if (turn.month !== month) {
    setTurn({ month, direction: month > turn.month ? 'next' : 'prev', page: turn.page ? 0 : 1 });
  }
  return { direction: turn.direction, page: turn.page };
}

/**
 * True inside a DatePicker/DateRangePicker popover. That popover is glass, where only text.default and text.subtle
 * are guaranteed legible, so the CSS swaps the calendar's text.disabled days for text.subtle (see calendar.module.css).
 */
function useInPicker(): boolean {
  const single = useContext(DatePickerStateContext);
  const range = useContext(DateRangePickerStateContext);
  return single != null || range != null;
}

/** Header + one grid per visible month. Shared by Calendar and RangeCalendar. */
function CalendarBody({ visibleDuration, errorMessage, isInvalid }: {
  visibleDuration?: DateDuration;
  errorMessage?: string;
  isInvalid: boolean;
}): JSX.Element {
  const months = Math.max(1, visibleDuration?.months ?? 1);
  const { direction, page } = usePageTurn();
  return (
    <>
      <header className={styles.header}>
        <RACButton slot="previous" className={styles.navButton}>
          <IconChevronLeft aria-hidden className={styles.navIcon} />
        </RACButton>
        {/* Node's and the browser's ICU put different spaces around the range dash ("October – November"), so SSR text can
            differ invisibly from the client's. */}
        <Heading className={styles.heading} suppressHydrationWarning />
        <RACButton slot="next" className={styles.navButton}>
          <IconChevronRight aria-hidden className={styles.navIcon} />
        </RACButton>
      </header>
      <div className={styles.months} data-direction={direction} data-page={page}>
        {Array.from({ length: months }, (_, i) => (
          <CalendarGrid key={i} offset={i ? { months: i } : undefined} className={styles.grid}>
            <CalendarGridHeader>
              {(day) => <CalendarHeaderCell className={styles.weekday}>{day}</CalendarHeaderCell>}
            </CalendarGridHeader>
            <CalendarGridBody>{(date) => <CalendarCell date={date} className={styles.cell} />}</CalendarGridBody>
          </CalendarGrid>
        ))}
      </div>
      {isInvalid && errorMessage ? (
        <Text slot="errorMessage" className={styles.error}>
          {errorMessage}
        </Text>
      ) : null}
    </>
  );
}

/**
 * A month grid for picking one date. Keyboard: arrows move by day/week, Page Up/Down by month,
 * Home/End to the start/end of the week. First day of week follows the locale.
 */
export function Calendar<T extends DateValue>({ className, errorMessage, ...props }: CalendarProps<T>): JSX.Element {
  const inPicker = useInPicker();
  return (
    <RACCalendar<T> {...props} data-in-picker={inPicker || undefined} className={composeRenderProps(className, (c) => cx(styles.calendar, c))}>
      {({ isInvalid }) => (
        <CalendarBody visibleDuration={props.visibleDuration} errorMessage={errorMessage} isInvalid={isInvalid} />
      )}
    </RACCalendar>
  );
}

/** A month grid for picking a contiguous range of dates (start and end). */
export function RangeCalendar<T extends DateValue>({ className, errorMessage, ...props }: RangeCalendarProps<T>): JSX.Element {
  const inPicker = useInPicker();
  return (
    <RACRangeCalendar<T> {...props} data-in-picker={inPicker || undefined} className={composeRenderProps(className, (c) => cx(styles.calendar, styles.range, c))}>
      {({ isInvalid }) => (
        <CalendarBody visibleDuration={props.visibleDuration} errorMessage={errorMessage} isInvalid={isInvalid} />
      )}
    </RACRangeCalendar>
  );
}

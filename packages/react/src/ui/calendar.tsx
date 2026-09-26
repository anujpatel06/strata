'use client';

import type { JSX } from 'react';
import {
  Button as RACButton,
  Calendar as RACCalendar,
  CalendarCell,
  CalendarGrid,
  CalendarGridBody,
  CalendarGridHeader,
  CalendarHeaderCell,
  Heading,
  RangeCalendar as RACRangeCalendar,
  Text,
  composeRenderProps,
  type CalendarProps as RACCalendarProps,
  type DateValue,
  type RangeCalendarProps as RACRangeCalendarProps,
} from 'react-aria-components';
import type { DateDuration } from '@internationalized/date';
import { IconChevronLeft, IconChevronRight } from '@tabler/icons-react';
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

/** Header + one grid per visible month. Shared by Calendar and RangeCalendar. */
function CalendarBody({ visibleDuration, errorMessage, isInvalid }: {
  visibleDuration?: DateDuration;
  errorMessage?: string;
  isInvalid: boolean;
}): JSX.Element {
  const months = Math.max(1, visibleDuration?.months ?? 1);
  return (
    <>
      <header className={styles.header}>
        <RACButton slot="previous" className={styles.navButton}>
          <IconChevronLeft aria-hidden className={styles.navIcon} />
        </RACButton>
        <Heading className={styles.heading} />
        <RACButton slot="next" className={styles.navButton}>
          <IconChevronRight aria-hidden className={styles.navIcon} />
        </RACButton>
      </header>
      <div className={styles.months}>
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
  return (
    <RACCalendar<T> {...props} className={composeRenderProps(className, (c) => cx(styles.calendar, c))}>
      {({ isInvalid }) => (
        <CalendarBody visibleDuration={props.visibleDuration} errorMessage={errorMessage} isInvalid={isInvalid} />
      )}
    </RACCalendar>
  );
}

/** A month grid for picking a contiguous range of dates (start and end). */
export function RangeCalendar<T extends DateValue>({ className, errorMessage, ...props }: RangeCalendarProps<T>): JSX.Element {
  return (
    <RACRangeCalendar<T> {...props} className={composeRenderProps(className, (c) => cx(styles.calendar, styles.range, c))}>
      {({ isInvalid }) => (
        <CalendarBody visibleDuration={props.visibleDuration} errorMessage={errorMessage} isInvalid={isInvalid} />
      )}
    </RACRangeCalendar>
  );
}

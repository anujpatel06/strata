'use client';

import { useRef, type JSX, type ReactNode } from 'react';
import {
  Button as RACButton,
  DateInput,
  DatePicker as RACDatePicker,
  DateRangePicker as RACDateRangePicker,
  DateSegment,
  Dialog,
  Popover,
  composeRenderProps,
  type DatePickerProps as RACDatePickerProps,
  type DateRangePickerProps as RACDateRangePickerProps,
  type DateValue,
  type ValidationResult,
} from 'react-aria-components';
import { IconCalendar } from '@syntara/icons';
import { Calendar, RangeCalendar } from './calendar';
import { Description, FieldError, FieldGroup, Label } from './text-field';
import styles from './date-picker.module.css';

const cx = (...c: Array<string | false | null | undefined>) => c.filter(Boolean).join(' ');

/**
 * Overlays portal to <body>, outside any ThemeScope. When the popover mounts, copy the trigger's scope
 * attributes (theme, scheme, density — and dir/lang if React Aria hasn't set them) onto it, so the popover
 * is a scope of its own and renders with the same tokens. Same approach as dialog.tsx.
 */
const SCOPE_ATTRS = ['data-syntara-theme', 'data-syntara-scheme', 'data-syntara-density'] as const;
function mirrorScope(overlay: HTMLElement | null, source: Element | null): void {
  if (!overlay || !source || overlay.contains(source)) return;
  for (const name of SCOPE_ATTRS) {
    // Look each attribute up on its own: a single-tenant app themes :root and scopes only the scheme.
    const value = source.closest(`[${name}]`)?.getAttribute(name);
    if (value) overlay.setAttribute(name, value);
  }
  for (const name of ['dir', 'lang']) {
    const value = source.closest(`[${name}]`)?.getAttribute(name);
    if (value && !overlay.hasAttribute(name)) overlay.setAttribute(name, value);
  }
}

interface FieldTextProps {
  /** Visible label. Pass `aria-label` instead only when a visible label is truly impossible. */
  label?: ReactNode;
  /** Help text under the field, e.g. the expected format or allowed range. */
  description?: ReactNode;
  /** Shown when the field is invalid. A string, or a function of RAC's validation result. */
  errorMessage?: string | ((validation: ValidationResult) => string);
}

export interface DatePickerProps<T extends DateValue> extends RACDatePickerProps<T>, FieldTextProps {}

function renderDateInput(slot?: 'start' | 'end'): JSX.Element {
  return (
    <DateInput slot={slot} className={styles.input}>
      {(segment) => <DateSegment segment={segment} className={styles.segment} />}
    </DateInput>
  );
}

/**
 * A date field typed segment by segment (locale order), with a button that opens a calendar.
 * Keyboard: ←/→ move between segments, ↑/↓ change the value, type digits to fill,
 * Alt+↓ opens the calendar.
 */
export function DatePicker<T extends DateValue>({
  label,
  description,
  errorMessage,
  shouldForceLeadingZeros = true,
  className,
  ...props
}: DatePickerProps<T>): JSX.Element {
  const groupRef = useRef<HTMLDivElement>(null);
  return (
    <RACDatePicker<T>
      {...props}
      shouldForceLeadingZeros={shouldForceLeadingZeros}
      className={composeRenderProps(className, (c) => cx(styles.field, c))}
    >
      {label != null && <Label isRequired={props.isRequired}>{label}</Label>}
      <FieldGroup ref={groupRef} className={styles.control}>
        {renderDateInput()}
        <RACButton className={styles.button}>
          <IconCalendar aria-hidden className={styles.buttonIcon} />
        </RACButton>
      </FieldGroup>
      {description != null && <Description>{description}</Description>}
      <FieldError>{errorMessage}</FieldError>
      <Popover offset={4} ref={(node) => mirrorScope(node, groupRef.current)} className={styles.popover}>
        <Dialog className={styles.dialog}>
          <Calendar />
        </Dialog>
      </Popover>
    </RACDatePicker>
  );
}

export interface DateRangePickerProps<T extends DateValue> extends RACDateRangePickerProps<T>, FieldTextProps {
  /** How many months the calendar shows side by side. */
  visibleMonths?: number;
}

/** Two date fields (start and end) sharing one calendar popover for picking a range. */
export function DateRangePicker<T extends DateValue>({
  label,
  description,
  errorMessage,
  visibleMonths = 1,
  shouldForceLeadingZeros = true,
  className,
  ...props
}: DateRangePickerProps<T>): JSX.Element {
  const groupRef = useRef<HTMLDivElement>(null);
  return (
    <RACDateRangePicker<T>
      {...props}
      shouldForceLeadingZeros={shouldForceLeadingZeros}
      className={composeRenderProps(className, (c) => cx(styles.field, c))}
    >
      {label != null && <Label isRequired={props.isRequired}>{label}</Label>}
      <FieldGroup ref={groupRef} className={styles.control}>
        {renderDateInput('start')}
        <span aria-hidden className={styles.dash}>
          –
        </span>
        {renderDateInput('end')}
        <RACButton className={styles.button}>
          <IconCalendar aria-hidden className={styles.buttonIcon} />
        </RACButton>
      </FieldGroup>
      {description != null && <Description>{description}</Description>}
      <FieldError>{errorMessage}</FieldError>
      <Popover offset={4} ref={(node) => mirrorScope(node, groupRef.current)} className={styles.popover}>
        <Dialog className={styles.dialog}>
          <RangeCalendar visibleDuration={{ months: visibleMonths }} />
        </Dialog>
      </Popover>
    </RACDateRangePicker>
  );
}

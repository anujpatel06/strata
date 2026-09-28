'use client';

import { useMemo, useRef, type JSX, type ReactNode } from 'react';
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
  useLocale,
  type DateSegmentProps,
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

/**
 * React Aria ships segment placeholders ("dd", "mm", "yyyy") for 34 locales. A locale outside that list falls back
 * to the English ones, so a Hindi field reads "dd/mm/yyyy" — Latin letters in a Devanagari interface. Intl knows the
 * field names for every locale, so fill the gap from there: `Intl.DisplayNames(locale, {type: 'dateTimeField'})`
 * gives "दिन", "माह", "वर्ष".
 *
 * Only the gap. Where React Aria has strings they are better than Intl's, because a date input wants the shape of
 * the value ("dd") and not the name of the field ("day"). The test is the locale's script: a non-Latin locale whose
 * placeholder came back as plain ASCII got the English fallback, and nothing else does.
 */
const FIELD_OF: Partial<Record<string, 'day' | 'month' | 'year' | 'hour' | 'minute' | 'second'>> = {
  day: 'day',
  month: 'month',
  year: 'year',
  hour: 'hour',
  minute: 'minute',
  second: 'second',
};

function localePlaceholders(locale: string): ((type: string) => string | undefined) | undefined {
  let script: string | undefined;
  try {
    script = new Intl.Locale(locale).maximize().script;
  } catch {
    return undefined;
  }
  if (!script || script === 'Latn') return undefined;
  let names: Intl.DisplayNames;
  try {
    names = new Intl.DisplayNames([locale], { type: 'dateTimeField' });
  } catch {
    return undefined;
  }
  return (type) => {
    const field = FIELD_OF[type];
    if (!field) return undefined;
    try {
      return names.of(field);
    } catch {
      return undefined;
    }
  };
}

/** True when the placeholder is plain ASCII, i.e. React Aria had no strings for this locale. */
const isAsciiFallback = (s: string) => /^[\x20-\x7E]+$/.test(s);

function renderDateInput(slot?: 'start' | 'end'): JSX.Element {
  return (
    <DateInput slot={slot} className={styles.input}>
      {(segment) => <LocalizedSegment segment={segment} />}
    </DateInput>
  );
}

/** One segment, with the placeholder filled in from Intl when React Aria had none for this locale. */
function LocalizedSegment({ segment }: { segment: DateSegmentProps['segment'] }): JSX.Element {
  const { locale } = useLocale();
  const names = useMemo(() => localePlaceholders(locale), [locale]);
  return (
    <DateSegment segment={segment} className={styles.segment}>
      {({ isPlaceholder, text, type }) => (!isPlaceholder || !names || !isAsciiFallback(text) ? text : (names(type) ?? text))}
    </DateSegment>
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

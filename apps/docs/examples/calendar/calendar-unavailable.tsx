'use client';

import { isWeekend, parseDate, type DateValue } from '@internationalized/date';
import { useLocale } from 'react-aria-components';
import { Calendar } from '@strata/react';

export default function Example() {
  const { locale } = useLocale();
  // A fixed date keeps the statically built page identical to what the browser renders.
  const now = parseDate('2026-10-05');
  return (
    <Calendar
      aria-label="Delivery date"
      defaultFocusedValue={now}
      minValue={now}
      maxValue={now.add({ weeks: 6 })}
      isDateUnavailable={(date: DateValue) => isWeekend(date, locale)}
    />
  );
}

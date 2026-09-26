'use client';

import { getLocalTimeZone, isWeekend, today, type DateValue } from '@internationalized/date';
import { useLocale } from 'react-aria-components';
import { Calendar } from '@strata/react';

export default function Example() {
  const { locale } = useLocale();
  const now = today(getLocalTimeZone());
  return (
    <Calendar
      aria-label="Delivery date"
      minValue={now}
      maxValue={now.add({ weeks: 6 })}
      isDateUnavailable={(date: DateValue) => isWeekend(date, locale)}
    />
  );
}

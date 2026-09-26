'use client';

import { getLocalTimeZone, today } from '@internationalized/date';
import { RangeCalendar } from '@strata/react';

export default function Example() {
  const start = today(getLocalTimeZone());
  return <RangeCalendar aria-label="Trip dates" defaultValue={{ start, end: start.add({ days: 5 }) }} />;
}

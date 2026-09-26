'use client';

import { parseDate } from '@internationalized/date';
import { RangeCalendar } from '@strata/react';

export default function Example() {
  // A fixed date keeps the statically built page identical to what the browser renders.
  const start = parseDate('2026-10-12');
  return <RangeCalendar aria-label="Trip dates" defaultValue={{ start, end: start.add({ days: 5 }) }} />;
}

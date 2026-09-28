'use client';

import { parseDate } from '@internationalized/date';
import { RangeCalendar } from '@syntara/react';

export default function Example() {
  // A fixed date keeps the statically built page identical to what the browser renders.
  return <RangeCalendar aria-label="Reporting period" visibleDuration={{ months: 2 }} defaultFocusedValue={parseDate('2026-10-05')} />;
}

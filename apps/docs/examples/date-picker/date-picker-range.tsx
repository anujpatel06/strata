'use client';

import { parseDate } from '@internationalized/date';
import { DateRangePicker } from '@syntara/react';

export default function Example() {
  // A fixed date keeps the statically built page identical to what the browser renders.
  const start = parseDate('2026-10-12');
  return (
    <DateRangePicker
      label="Stay"
      defaultValue={{ start, end: start.add({ days: 4 }) }}
      minValue={start}
      visibleMonths={2}
      style={{ inlineSize: '100%', maxInlineSize: 320 }}
    />
  );
}

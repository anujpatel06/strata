'use client';

import { getLocalTimeZone, today } from '@internationalized/date';
import { DateRangePicker } from '@strata/react';

export default function Example() {
  const start = today(getLocalTimeZone());
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

'use client';

import { getLocalTimeZone, now } from '@internationalized/date';
import { DatePicker } from '@strata/react';

export default function Example() {
  return (
    <DatePicker
      label="Send at"
      granularity="minute"
      hideTimeZone
      defaultValue={now(getLocalTimeZone()).add({ days: 1 }).set({ hour: 9, minute: 30, second: 0, millisecond: 0 })}
      style={{ inlineSize: '100%', maxInlineSize: 320 }}
    />
  );
}

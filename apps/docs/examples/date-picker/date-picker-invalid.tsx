'use client';

import { parseDate } from '@internationalized/date';
import { DatePicker } from '@syntara/react';

export default function Example() {
  // A fixed date keeps the statically built page identical to what the browser renders.
  const now = parseDate('2026-10-05');
  return (
    <div style={{ display: 'grid', gap: 24, inlineSize: '100%', maxInlineSize: 320 }}>
      <DatePicker
        label="Start date"
        isRequired
        minValue={now}
        defaultValue={now.subtract({ days: 2 })}
        validationBehavior="aria"
        errorMessage="Start date can't be in the past."
      />
      <DatePicker label="Policy renewal" defaultValue={now.add({ years: 1 })} isDisabled />
    </div>
  );
}

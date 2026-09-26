'use client';

import { getLocalTimeZone, today } from '@internationalized/date';
import { DatePicker } from '@strata/react';

export default function Example() {
  const now = today(getLocalTimeZone());
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

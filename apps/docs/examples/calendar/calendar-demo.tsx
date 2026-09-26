'use client';

import { getLocalTimeZone, today } from '@internationalized/date';
import { Calendar } from '@strata/react';

export default function Example() {
  return <Calendar aria-label="Appointment date" defaultValue={today(getLocalTimeZone()).add({ days: 3 })} />;
}

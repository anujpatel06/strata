'use client';

import { parseDate } from '@internationalized/date';
import { Calendar } from '@strata/react';

export default function Example() {
  // A fixed date keeps the statically built page identical to what the browser renders.
  return <Calendar aria-label="Appointment date" defaultValue={parseDate('2026-10-08')} />;
}

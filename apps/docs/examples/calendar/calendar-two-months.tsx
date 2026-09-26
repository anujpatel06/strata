'use client';

import { RangeCalendar } from '@strata/react';

export default function Example() {
  return <RangeCalendar aria-label="Reporting period" visibleDuration={{ months: 2 }} />;
}

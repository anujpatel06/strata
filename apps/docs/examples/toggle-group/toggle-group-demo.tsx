'use client';

import { ToggleButton, ToggleButtonGroup } from '@syntara/react';

export default function Example() {
  return (
    <ToggleButtonGroup aria-label="Reporting period" defaultSelectedKeys={['month']} disallowEmptySelection>
      <ToggleButton id="week">Week</ToggleButton>
      <ToggleButton id="month">Month</ToggleButton>
      <ToggleButton id="year">Year</ToggleButton>
    </ToggleButtonGroup>
  );
}

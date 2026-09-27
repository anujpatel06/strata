'use client';

import { useState } from 'react';
import { Chip, ChipGroup, type Selection } from '@strata/react';

// Choice chips: exactly one is on, like a segmented control that wraps.
export default function Example() {
  const [period, setPeriod] = useState<Selection>(new Set(['month']));
  return (
    <ChipGroup mode="choice" label="Period" selectedKeys={period} onSelectionChange={setPeriod}>
      <Chip id="week">This week</Chip>
      <Chip id="month">This month</Chip>
      <Chip id="quarter">This quarter</Chip>
      <Chip id="year">This year</Chip>
      <Chip id="custom">Custom range</Chip>
    </ChipGroup>
  );
}

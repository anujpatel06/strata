'use client';

import { ToggleButton, ToggleButtonGroup } from '@strata/react';
import { IconLayoutGrid, IconLayoutList, IconTable } from '@tabler/icons-react';

export default function Example() {
  return (
    <ToggleButtonGroup aria-label="Layout" defaultSelectedKeys={['list']} disallowEmptySelection>
      <ToggleButton id="list" aria-label="List">
        <IconLayoutList aria-hidden />
      </ToggleButton>
      <ToggleButton id="grid" aria-label="Grid">
        <IconLayoutGrid aria-hidden />
      </ToggleButton>
      <ToggleButton id="table" aria-label="Table">
        <IconTable aria-hidden />
      </ToggleButton>
    </ToggleButtonGroup>
  );
}

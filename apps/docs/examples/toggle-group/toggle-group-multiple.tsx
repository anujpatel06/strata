'use client';

import { ToggleButton, ToggleButtonGroup } from '@syntara/react';

const DAYS = [
  ['mon', 'M', 'Monday'],
  ['tue', 'T', 'Tuesday'],
  ['wed', 'W', 'Wednesday'],
  ['thu', 'T', 'Thursday'],
  ['fri', 'F', 'Friday'],
  ['sat', 'S', 'Saturday'],
  ['sun', 'S', 'Sunday'],
] as const;

export default function Example() {
  return (
    <ToggleButtonGroup size="sm" aria-label="Repeat on" selectionMode="multiple" defaultSelectedKeys={['mon', 'wed', 'fri']}>
      {DAYS.map(([id, short, name]) => (
        <ToggleButton key={id} id={id} aria-label={name}>
          {short}
        </ToggleButton>
      ))}
    </ToggleButtonGroup>
  );
}

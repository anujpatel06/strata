'use client';

import { useState } from 'react';
import { PersonChip, PersonChipGroup } from '@strata/react';

export default function Example() {
  const [people, setPeople] = useState(['Arjun Shah', 'Priya Shah', 'Aarav Shah', 'Meera Iyer']);
  return (
    <PersonChipGroup
      aria-label="Who is this claim for?"
      onRemove={(keys) => setPeople((list) => list.filter((name) => !keys.has(name)))}
    >
      {people.map((name) => (
        <PersonChip key={name} name={name} />
      ))}
    </PersonChipGroup>
  );
}

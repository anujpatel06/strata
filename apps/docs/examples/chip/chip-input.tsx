'use client';

import { useState, type FormEvent } from 'react';
import { Button, Chip, ChipGroup, TextField } from '@strata/react';
import { IconMapPin } from '@strata/icons';

// Input chips: values the user entered, each with a remove button. Delete or Backspace removes the focused one.
export default function Example() {
  const [cities, setCities] = useState(['Delhi', 'Pune', 'Kochi']);
  const [draft, setDraft] = useState('');
  const add = (e: FormEvent) => {
    e.preventDefault();
    const city = draft.trim();
    if (city && !cities.includes(city)) setCities([...cities, city]);
    setDraft('');
  };
  return (
    <div style={{ display: 'grid', gap: 'var(--strata-space-4)', inlineSize: '100%', maxInlineSize: '24rem' }}>
      <form onSubmit={add} style={{ display: 'flex', gap: 'var(--strata-space-2)', alignItems: 'flex-end' }}>
        <TextField label="Add a city" value={draft} onChange={setDraft} style={{ flex: 1 }} />
        <Button type="submit" variant="outline">Add</Button>
      </form>
      <ChipGroup
        mode="input"
        aria-label="Cities"
        onRemove={(keys) => setCities((list) => list.filter((c) => !keys.has(c)))}
        renderEmptyState={() => <span style={{ color: 'var(--strata-color-text-subtle)', fontSize: 'var(--strata-font-size-sm)' }}>No cities yet.</span>}
      >
        {cities.map((city) => (
          <Chip key={city} id={city} icon={<IconMapPin />}>{city}</Chip>
        ))}
      </ChipGroup>
    </div>
  );
}

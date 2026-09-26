'use client';

import { SearchField } from '@strata/react';

export default function Example() {
  return (
    <SearchField
      label="Find a provider"
      placeholder="Name, speciality or city"
      description="Press Enter to search, Escape to clear."
      defaultValue="Cardiology"
      style={{ inlineSize: '100%', maxInlineSize: 360 }}
    />
  );
}

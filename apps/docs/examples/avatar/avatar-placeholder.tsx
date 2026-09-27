'use client';

import { Avatar, Button } from '@strata/react';

const family = ['Arjun Shah', 'Priya Shah', 'Aarav Shah', 'Rajiv Shah'];

export default function Example() {
  return (
    <div role="list" aria-label="Family on this plan" style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--strata-space-4)' }}>
      {family.map((name) => (
        <figure key={name} role="listitem" style={{ display: 'grid', justifyItems: 'center', gap: 'var(--strata-space-2)', margin: 0 }}>
          <Avatar name={name} alt="" size="lg" />
          <figcaption style={{ fontSize: 'var(--strata-font-size-sm)' }}>{name.split(' ')[0]}</figcaption>
        </figure>
      ))}
      {/* A not-yet-added member: "?" and the relationship. */}
      <figure role="listitem" style={{ display: 'grid', justifyItems: 'center', gap: 'var(--strata-space-2)', margin: 0 }}>
        <Avatar name="Father, not added yet" placeholder="unknown" size="lg" />
        <figcaption style={{ fontSize: 'var(--strata-font-size-sm)', color: 'var(--strata-color-text-subtle)' }}>Father</figcaption>
      </figure>
      {/* A list may only hold list items, so the action gets its own item. */}
      <div role="listitem">
        <Button variant="ghost" aria-label="Add member" style={{ blockSize: 'auto', paddingBlock: 0, paddingInline: 0 }}>
          <span style={{ display: 'grid', justifyItems: 'center', gap: 'var(--strata-space-2)' }}>
            <Avatar placeholder="add" alt="" size="lg" />
            <span style={{ fontSize: 'var(--strata-font-size-sm)', color: 'var(--strata-color-text-subtle)' }}>Add</span>
          </span>
        </Button>
      </div>
    </div>
  );
}

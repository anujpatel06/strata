'use client';

import { Spinner } from '@syntara/react';

export default function Example() {
  return (
    <p
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--syntara-space-2)',
        margin: 0,
        color: 'var(--syntara-color-text-subtle)',
        fontSize: 'var(--syntara-font-size-sm)',
      }}
    >
      {/* The spinner announces its label; the visible text repeats it for sighted users. */}
      <Spinner size="sm" label="Checking eligibility" />
      <span aria-hidden="true">Checking eligibility…</span>
    </p>
  );
}

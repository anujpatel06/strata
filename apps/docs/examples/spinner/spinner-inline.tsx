'use client';

import { Spinner } from '@strata/react';

export default function Example() {
  return (
    <p
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--strata-space-2)',
        margin: 0,
        color: 'var(--strata-color-text-subtle)',
        fontSize: 'var(--strata-font-size-sm)',
      }}
    >
      {/* The spinner announces its label; the visible text repeats it for sighted users. */}
      <Spinner size="sm" label="Checking eligibility" />
      <span aria-hidden="true">Checking eligibility…</span>
    </p>
  );
}

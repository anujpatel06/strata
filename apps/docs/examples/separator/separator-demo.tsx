'use client';

import { Separator } from '@strata/react';

const subtle = { color: 'var(--strata-color-text-subtle)', fontSize: 'var(--strata-font-size-sm)' };

export default function Example() {
  return (
    <div style={{ inlineSize: '100%', maxInlineSize: 360 }}>
      <div style={{ display: 'grid', gap: 'var(--strata-space-1)' }}>
        <strong style={{ fontSize: 'var(--strata-font-size-md)', fontWeight: 'var(--strata-font-weight-semibold)' }}>Claim CLM-20931</strong>
        <span style={subtle}>Outpatient · Submitted 12 Sept</span>
      </div>
      <Separator style={{ marginBlock: 'var(--strata-space-4)' }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--strata-space-3)', blockSize: 20, ...subtle }}>
        <span>Details</span>
        <Separator orientation="vertical" />
        <span>Documents</span>
        <Separator orientation="vertical" />
        <span>Payments</span>
      </div>
    </div>
  );
}

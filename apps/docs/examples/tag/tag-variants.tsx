'use client';

import { Tag } from '@strata/react';

const tones = ['neutral', 'brand', 'accent', 'info', 'success', 'warning', 'danger'] as const;
const label = { neutral: 'Diagnostics', brand: 'In network', accent: 'Wellness', info: 'Teleconsult', success: 'Covered', warning: 'Waiting period', danger: 'Excluded' };

export default function Example() {
  return (
    <div style={{ display: 'grid', gap: 'var(--strata-space-3)' }}>
      {(['soft', 'outline', 'dashed'] as const).map((variant) => (
        <div key={variant} style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--strata-space-2)' }}>
          {tones.map((tone) => (
            <Tag key={tone} variant={variant} tone={tone}>
              {label[tone]}
            </Tag>
          ))}
        </div>
      ))}
    </div>
  );
}

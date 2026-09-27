'use client';

import { Sparkline } from '@strata/react';

export default function Example() {
  return (
    <div style={{ display: 'grid', gap: 'var(--strata-space-4)', inlineSize: '100%', maxInlineSize: 240 }}>
      <Sparkline variant="line" series={2} data={[8, 9, 7, 10, 12, 11, 13, 12, 15]} />
      <Sparkline variant="line" curve="linear" showEndDot={false} series={3} data={[5, 7, null, 6, 8, 9, 7, 10]} />
    </div>
  );
}

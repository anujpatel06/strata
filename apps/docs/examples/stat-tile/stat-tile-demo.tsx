'use client';

import { StatTile } from '@strata/react';

export default function Example() {
  return (
    <div style={{ inlineSize: '100%', maxInlineSize: 300 }}>
      <StatTile label="Available balance" value="₹1,84,250" delta={0.064} deltaLabel="vs last month" />
    </div>
  );
}

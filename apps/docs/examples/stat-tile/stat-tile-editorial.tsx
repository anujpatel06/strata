'use client';

import { StatTile, StatTileGroup } from '@syntara/react';

export default function Example() {
  return (
    <div style={{ inlineSize: '100%', maxInlineSize: 520 }}>
      <StatTileGroup>
        <StatTile variant="editorial" value="12k+" label="renewals a month" />
        <StatTile variant="editorial" value="45s" label="to a quote" />
        <StatTile variant="editorial" value="2 yrs" label="in use" />
      </StatTileGroup>
    </div>
  );
}

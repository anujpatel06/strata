'use client';

import { IconUsers, IconWallet } from '@syntara/icons';
import { StatTile, StatTileGroup } from '@syntara/react';

export default function Example() {
  return (
    <StatTileGroup>
      <StatTile label="Members covered" value="4" caption="2 adults, 2 children" icon={<IconUsers />} />
      <StatTile label="Wallet balance" value="₹8,500" delta={0} deltaLabel="no change this month" icon={<IconWallet />} />
      <StatTile label="Open requests" value="0" caption="Updated 5 min ago" size="sm" variant="outline" />
    </StatTileGroup>
  );
}

'use client';

import { Marquee } from '@syntara/react';
import { IconAnchor, IconBolt, IconCompass, IconLeaf, IconMountain, IconRoute, IconTree, IconWind } from '@syntara/icons';

// Made-up companies: a logo strip should never borrow real brands for a demo.
const COMPANIES = [
  { name: 'Northwind', Icon: IconCompass },
  { name: 'Fernhill', Icon: IconLeaf },
  { name: 'Brightline', Icon: IconBolt },
  { name: 'Saltmarsh', Icon: IconAnchor },
  { name: 'Ridgeway', Icon: IconMountain },
  { name: 'Oakhurst', Icon: IconTree },
  { name: 'Waypoint', Icon: IconRoute },
  { name: 'Galeforce', Icon: IconWind },
];

export default function Example() {
  return (
    <Marquee label="Teams building with Syntara">
      {COMPANIES.map(({ name, Icon }) => (
        <span
          key={name}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 'var(--syntara-space-2)',
            fontFamily: 'var(--syntara-font-heading)',
            fontSize: 'var(--syntara-font-size-xl)',
            fontWeight: 'var(--syntara-font-weight-semibold)',
            letterSpacing: 'var(--syntara-font-heading-tracking)',
            whiteSpace: 'nowrap',
          }}
        >
          <Icon aria-hidden />
          {name}
        </span>
      ))}
    </Marquee>
  );
}

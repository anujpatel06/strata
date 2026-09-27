'use client';

import { Badge, Chip, ChipGroup, PersonChip, Tag } from '@strata/react';
import { IconHome } from '@strata/icons';

// The caption sits beside the items, and above them when the box is narrow.
const row = { display: 'flex', flexWrap: 'wrap', columnGap: 'var(--strata-space-3)', rowGap: 'var(--strata-space-2)', alignItems: 'center' } as const;
const caption = { margin: 0, flex: '0 0 7rem', color: 'var(--strata-color-text-subtle)', fontSize: 'var(--strata-font-size-sm)' } as const;

// One family, four jobs. Badge = a state or count. Tag = a static attribute. PersonChip = a person. Chip = something you pick or remove.
export default function Example() {
  return (
    <div style={{ display: 'grid', gap: 'var(--strata-space-4)', inlineSize: '100%', maxInlineSize: '36rem' }}>
      <div style={row}>
        <p style={caption}>State or count</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--strata-space-2)', alignItems: 'center' }}>
          <Badge tone="success">Paid</Badge>
          <Badge tone="warning" dot>Pending</Badge>
          <Badge variant="status" tone="info">In review</Badge>
        </div>
      </div>
      <div style={row}>
        <p style={caption}>Attribute</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--strata-space-2)', alignItems: 'center' }}>
          <Tag tone="success" uppercase>Cashless</Tag>
          <Tag leading={<IconHome />}>Home collection</Tag>
        </div>
      </div>
      <div style={row}>
        <p style={caption}>A person</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--strata-space-2)', alignItems: 'center' }}>
          <PersonChip name="Priya Shah" />
          <PersonChip name="Father" placeholder />
        </div>
      </div>
      <div style={row}>
        <p style={caption}>Pick or remove</p>
        <ChipGroup aria-label="Show" size="sm" defaultSelectedKeys={['sponsored']}>
          <Chip id="sponsored" count={3}>Sponsored</Chip>
          <Chip id="discounted" count={2}>Discounted</Chip>
        </ChipGroup>
      </div>
    </div>
  );
}

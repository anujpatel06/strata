'use client';

import { Avatar, Tag } from '@strata/react';
import { IconFileText, IconHome, IconShieldCheck } from '@strata/icons';

export default function Example() {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 'var(--strata-space-2)' }}>
      <Tag tone="brand" leading={<IconShieldCheck />}>
        Covered by employer
      </Tag>
      <Tag leading={<IconHome />}>Home collection</Tag>
      <Tag leading={<IconFileText />}>Prescription required</Tag>
      <Tag leading={<Avatar name="Priya Shah" />}>Priya</Tag>
    </div>
  );
}

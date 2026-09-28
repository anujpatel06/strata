'use client';

import { Avatar, AvatarGroup } from '@syntara/react';

const people = ['Priya Raman', 'Daniel Okafor', 'Mei Lin', 'Omar Haddad', 'Sofia Duarte', 'Arjun Mehta', 'Lena Fischer'];

export default function Example() {
  return (
    <div style={{ display: 'grid', gap: 'var(--syntara-space-4)', justifyItems: 'center' }}>
      <AvatarGroup aria-label="Members on this plan" max={4}>
        {people.map((name) => (
          <Avatar key={name} name={name} />
        ))}
      </AvatarGroup>
      <AvatarGroup aria-label="Reviewers" size="sm">
        {people.slice(0, 3).map((name) => (
          <Avatar key={name} name={name} />
        ))}
      </AvatarGroup>
    </div>
  );
}

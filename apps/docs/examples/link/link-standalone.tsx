'use client';

import { Link } from '@syntara/react';
import { IconArrowRight } from '@syntara/icons';

export default function Example() {
  return (
    <div style={{ display: 'grid', gap: 12, justifyItems: 'start' }}>
      <Link variant="standalone" href="#claims">
        View all claims
        <IconArrowRight aria-hidden />
      </Link>
      <Link variant="standalone" href="#statements">
        Download statements
      </Link>
    </div>
  );
}

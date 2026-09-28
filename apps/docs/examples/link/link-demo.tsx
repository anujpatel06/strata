'use client';

import { Link } from '@syntara/react';

export default function Example() {
  return (
    <p style={{ margin: 0, maxInlineSize: 480 }}>
      Refunds usually reach your account within five working days. If yours hasn’t arrived, read{' '}
      <Link href="#refunds">how refunds are processed</Link> or <Link href="#contact">contact support</Link>.
    </p>
  );
}

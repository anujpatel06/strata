'use client';

import { PersonChip } from '@strata/react';

// A single chip sits in running text, e.g. an activity line.
export default function Example() {
  return (
    <p style={{ margin: 0, lineHeight: 'var(--strata-line-height-normal)', maxInlineSize: '28rem' }}>
      <PersonChip name="Priya Shah" size="sm" /> booked a consultation for{' '}
      <PersonChip name="Aarav Shah" size="sm" /> on Thursday at 10:30.
    </p>
  );
}

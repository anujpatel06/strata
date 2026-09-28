'use client';

import { TextArea } from '@syntara/react';

export default function Example() {
  return (
    <TextArea
      label="Note to recipient"
      description="Shown on their statement."
      maxLength={140}
      defaultValue="Rent for March, flat 4B"
      style={{ inlineSize: '100%', maxInlineSize: 420 }}
    />
  );
}

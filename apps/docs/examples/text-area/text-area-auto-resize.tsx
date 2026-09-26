'use client';

import { TextArea } from '@strata/react';

export default function Example() {
  return (
    <TextArea
      label="Message"
      placeholder="Write a reply…"
      rows={2}
      autoResize
      maxRows={8}
      style={{ inlineSize: '100%', maxInlineSize: 420 }}
    />
  );
}

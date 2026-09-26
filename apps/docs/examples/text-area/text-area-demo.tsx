'use client';

import { TextArea } from '@strata/react';

export default function Example() {
  return (
    <TextArea
      label="What happened?"
      placeholder="Describe the incident in your own words"
      description="Include dates, places and anyone involved."
      style={{ inlineSize: '100%', maxInlineSize: 420 }}
    />
  );
}

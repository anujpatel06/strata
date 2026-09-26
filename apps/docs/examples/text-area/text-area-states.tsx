'use client';

import { TextArea } from '@strata/react';

export default function Example() {
  return (
    <div style={{ display: 'grid', gap: 20, inlineSize: '100%', maxInlineSize: 420 }}>
      <TextArea label="Reason for dispute" isRequired isInvalid errorMessage="Tell us why you’re disputing this charge." />
      <TextArea label="Internal notes" defaultValue="Reviewed by the claims team on 12 March." isDisabled />
    </div>
  );
}

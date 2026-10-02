'use client';

import { StreamingResponse } from '@syntara/react';

export default function Example() {
  return (
    <div style={{ display: 'grid', gap: 'var(--syntara-space-6)', maxInlineSize: '36rem' }}>
      <StreamingResponse status="streaming" text="Your statement for September is ready. The largest change since" />
      <StreamingResponse status="stopped" text="Three plans match what you asked for. The first" />
      <StreamingResponse
        status="error"
        text="Here is a summary of the"
        errorMessage="The connection dropped. Try again."
      />
      <StreamingResponse status="complete" text="Your password was changed. You'll be asked to sign in again on other devices." />
    </div>
  );
}

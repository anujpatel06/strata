'use client';

import { Button, Separator, TextField } from '@syntara/react';

export default function Example() {
  return (
    <div style={{ display: 'grid', gap: 'var(--syntara-space-4)', inlineSize: '100%', maxInlineSize: 320 }}>
      <Button variant="outline">Continue with single sign-on</Button>
      <Separator label="or" />
      <TextField label="Work email" type="email" autoComplete="email" />
      <Button>Send sign-in link</Button>
    </div>
  );
}

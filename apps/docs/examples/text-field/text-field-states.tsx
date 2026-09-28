'use client';

import { TextField } from '@syntara/react';

export default function Example() {
  return (
    <div style={{ display: 'grid', gap: 20, inlineSize: '100%', maxInlineSize: 320 }}>
      <TextField label="Full name" placeholder="As on your ID" />
      <TextField label="Policy number" description="Printed on the front of your card." isRequired />
      <TextField label="Phone" type="tel" defaultValue="98450" isInvalid errorMessage="Enter a 10-digit mobile number." />
      <TextField label="Member ID" defaultValue="MB-204118" isDisabled />
    </div>
  );
}

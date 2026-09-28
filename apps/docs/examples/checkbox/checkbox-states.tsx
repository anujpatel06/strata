'use client';

import { Checkbox } from '@syntara/react';

export default function Example() {
  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <Checkbox isRequired isInvalid errorMessage="Accept the terms to continue.">
        I accept the terms and conditions
      </Checkbox>
      <Checkbox isDisabled>Unavailable option</Checkbox>
      <Checkbox isDisabled defaultSelected>
        Included in your plan
      </Checkbox>
    </div>
  );
}

'use client';

import { Checkbox } from '@strata/react';

export default function Example() {
  return (
    <Checkbox defaultSelected description="We’ll email you when a claim changes status.">
      Email me about updates
    </Checkbox>
  );
}

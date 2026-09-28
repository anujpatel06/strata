'use client';

import { Radio, RadioGroup } from '@syntara/react';

export default function Example() {
  return (
    <RadioGroup label="Account type" orientation="horizontal" defaultValue="individual">
      <Radio value="individual">Individual</Radio>
      <Radio value="joint">Joint</Radio>
      <Radio value="business">Business</Radio>
    </RadioGroup>
  );
}

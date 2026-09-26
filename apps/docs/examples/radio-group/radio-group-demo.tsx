'use client';

import { Radio, RadioGroup } from '@strata/react';

export default function Example() {
  return (
    <RadioGroup label="Statement frequency" defaultValue="monthly">
      <Radio value="weekly">Weekly</Radio>
      <Radio value="monthly">Monthly</Radio>
      <Radio value="quarterly">Quarterly</Radio>
    </RadioGroup>
  );
}

'use client';

import { Radio, RadioGroup } from '@syntara/react';

export default function Example() {
  return (
    <RadioGroup variant="card" orientation="horizontal" label="Plan" defaultValue="plus" style={{ inlineSize: '100%' }}>
      <Radio value="basic" description="Up to 3 claims a year">
        Basic
      </Radio>
      <Radio value="plus" description="Unlimited claims, priority review">
        Plus
      </Radio>
      <Radio value="family" description="Everything in Plus for up to 5 people">
        Family
      </Radio>
    </RadioGroup>
  );
}

'use client';

import { Slider } from '@syntara/react';

export default function Example() {
  return (
    <Slider
      label="Amount"
      defaultValue={[2000, 8000]}
      minValue={0}
      maxValue={10000}
      step={500}
      thumbLabels={['Minimum', 'Maximum']}
      formatOptions={{ style: 'currency', currency: 'INR', maximumFractionDigits: 0 }}
      style={{ maxInlineSize: 360 }}
    />
  );
}

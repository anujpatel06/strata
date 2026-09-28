'use client';

import { Slider } from '@syntara/react';

export default function Example() {
  return <Slider label="Credit limit usage" defaultValue={40} isDisabled formatOptions={{ style: 'unit', unit: 'percent' }} style={{ maxInlineSize: 320 }} />;
}

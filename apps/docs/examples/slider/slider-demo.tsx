'use client';

import { Slider } from '@syntara/react';

export default function Example() {
  return <Slider label="Monthly budget" defaultValue={60} style={{ maxInlineSize: 320 }} />;
}

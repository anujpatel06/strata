'use client';

import { DatePicker } from '@strata/react';

export default function Example() {
  return <DatePicker label="Date of incident" description="The day the loss or damage happened." style={{ inlineSize: '100%', maxInlineSize: 320 }} />;
}

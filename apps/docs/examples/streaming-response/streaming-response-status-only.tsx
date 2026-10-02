'use client';

import { StreamingResponse } from '@syntara/react';

/** For long answers people would rather read at their own pace: only "Writing response" and "Response complete" are spoken. */
export default function Example() {
  return (
    <div style={{ maxInlineSize: '36rem' }}>
      <StreamingResponse
        announce="status"
        status="streaming"
        label="Report summary"
        text="Spending rose in groceries and travel this quarter, while subscriptions fell after two were cancelled. The full breakdown by"
      />
    </div>
  );
}

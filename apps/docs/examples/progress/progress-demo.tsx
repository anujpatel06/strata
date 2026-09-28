'use client';

import { ProgressBar } from '@syntara/react';

export default function Example() {
  return (
    <div style={{ inlineSize: '100%', maxInlineSize: 360 }}>
      <ProgressBar label="Uploading receipts" value={64} showValue />
    </div>
  );
}

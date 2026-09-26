'use client';

import { useState } from 'react';
import { Alert, Button } from '@strata/react';

export default function Example() {
  const [visible, setVisible] = useState(true);
  return (
    <div style={{ display: 'grid', gap: 'var(--strata-space-3)', inlineSize: '100%', maxInlineSize: 560 }}>
      <Alert
        tone="warning"
        title="Verify your email"
        action={<Button size="sm" variant="outline">Resend link</Button>}
      >
        We sent a link to priya@example.com. It expires in 24 hours.
      </Alert>
      {visible ? (
        <Alert tone="success" title="Documents uploaded" onDismiss={() => setVisible(false)} action={<a href="#claims">View claim</a>}>
          3 files were added to your claim.
        </Alert>
      ) : (
        <Button variant="ghost" size="sm" onPress={() => setVisible(true)}>Show dismissed alert</Button>
      )}
      <Alert tone="danger" icon={false} live>
        Your session expired. Sign in again to continue.
      </Alert>
    </div>
  );
}

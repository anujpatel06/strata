'use client';

import { useState } from 'react';
import { Alert, Button } from '@syntara/react';

export default function Example() {
  const [visible, setVisible] = useState(true);
  return (
    <div style={{ display: 'grid', gap: 'var(--syntara-space-3)', inlineSize: '100%', maxInlineSize: 560 }}>
      {/* Action weight follows severity: contrast when something needs fixing, outline otherwise. */}
      <Alert tone="danger" title="Payment failed" action={<Button size="sm" variant="contrast">Update card</Button>}>
        We couldn't charge your card ending 4821.
      </Alert>
      {visible ? (
        <Alert
          tone="success"
          title="Documents uploaded"
          onDismiss={() => setVisible(false)}
          action={<Button size="sm" variant="outline">View claim</Button>}
        >
          3 files were added to your claim.
        </Alert>
      ) : (
        <Button variant="ghost" size="sm" onPress={() => setVisible(true)}>Show dismissed alert</Button>
      )}
      <Alert tone="warning" icon={false} live action={<a href="#sign-in">Sign in</a>}>
        Your session expired. Sign in again to continue.
      </Alert>
    </div>
  );
}

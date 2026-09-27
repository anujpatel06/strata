'use client';

import { Button, ToastRegion, toast } from '@strata/react';

/* The action's weight follows the tone: a quiet secondary button for good news, a high-contrast one when something needs you. */
export default function Example() {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--strata-space-2)', justifyContent: 'center' }}>
      <ToastRegion />
      <Button
        variant="outline"
        onPress={() =>
          toast({ title: 'Claim approved', description: '₹12,400 reaches your account in 3 days.', tone: 'success', action: { label: 'Got it', onAction: () => {} } })
        }
      >
        Success with action
      </Button>
      <Button
        variant="outline"
        onPress={() =>
          toast({ title: 'Payment failed', description: 'Your card was declined by the bank.', tone: 'danger', action: { label: 'Retry', onAction: () => {} } })
        }
      >
        Error with action
      </Button>
    </div>
  );
}

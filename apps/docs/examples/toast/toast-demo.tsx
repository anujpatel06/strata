'use client';

import { Button, ToastRegion, toast } from '@strata/react';

export default function Example() {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--strata-space-2)', justifyContent: 'center' }}>
      {/* Mount one ToastRegion per app, inside your ThemeScope. Extra regions are ignored. */}
      <ToastRegion />
      <Button variant="outline" onPress={() => toast({ title: 'Draft saved' })}>
        Neutral
      </Button>
      <Button variant="outline" onPress={() => toast({ title: 'New benefit available', description: 'Annual check-ups are now covered.', tone: 'info' })}>
        Info
      </Button>
      <Button variant="outline" onPress={() => toast({ title: 'Claim submitted', description: 'Reference CLM-20931', tone: 'success' })}>
        Success
      </Button>
      <Button variant="outline" onPress={() => toast({ title: 'Upload is taking longer than usual', tone: 'warning' })}>
        Warning
      </Button>
      <Button variant="outline" onPress={() => toast({ title: 'Payment failed', description: 'Your card was declined.', tone: 'danger' })}>
        Danger
      </Button>
    </div>
  );
}

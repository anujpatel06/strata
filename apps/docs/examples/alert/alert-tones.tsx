'use client';

import { Alert } from '@strata/react';

export default function Example() {
  return (
    <div style={{ display: 'grid', gap: 'var(--strata-space-3)', inlineSize: '100%', maxInlineSize: 560 }}>
      <Alert tone="neutral" title="Draft saved">You can finish this claim later from your dashboard.</Alert>
      <Alert tone="info" title="New benefit available">Annual health check-ups are now covered in full.</Alert>
      <Alert tone="success" title="Claim approved">₹12,400 will reach your account within 3 working days.</Alert>
      <Alert tone="warning" title="Card expiring soon">Your card ending 4821 expires next month. Order a replacement.</Alert>
      <Alert tone="danger" title="Payment failed">We couldn't charge your card. Check the details and try again.</Alert>
    </div>
  );
}

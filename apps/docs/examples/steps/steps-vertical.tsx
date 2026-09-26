'use client';

import { Steps } from '@strata/react';

const steps = [
  { id: 'details', label: 'Incident details', description: 'Date, place and what happened' },
  { id: 'treatment', label: 'Treatment', description: 'Hospital or clinic and doctor' },
  { id: 'upload', label: 'Documents', description: 'Invoices, prescriptions, reports' },
  { id: 'bank', label: 'Bank account', description: 'Where we send the payment' },
  { id: 'review', label: 'Review and submit' },
];

export default function Example() {
  return (
    <div style={{ inlineSize: '100%', maxInlineSize: 360 }}>
      <Steps orientation="vertical" current="upload" steps={steps} aria-label="Claim progress" />
    </div>
  );
}

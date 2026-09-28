'use client';

import { Steps } from '@syntara/react';

const steps = [
  { id: 'details', label: 'Details' },
  { id: 'upload', label: 'Upload' },
  { id: 'review', label: 'Review' },
];

export default function Example() {
  return <Steps current="upload" steps={steps} />;
}

'use client';

import { Badge, Marquee } from '@syntara/react';

const FEATURES = [
  'WCAG 2.2 AA',
  'Right-to-left',
  'Dark mode',
  'Server-driven UI',
  'Hindi and Arabic',
  'Design tokens',
  'Figma variables',
  'Reduced motion',
];

export default function Example() {
  return (
    <Marquee label="What's included" speed="fast" pauseOnHover={false}>
      {FEATURES.map((feature) => (
        <Badge key={feature} tone="brand" size="md">
          {feature}
        </Badge>
      ))}
    </Marquee>
  );
}

'use client';

import { Card, Marquee } from '@syntara/react';

const QUOTES = [
  { quote: 'Our Arabic app finally looks like it was designed in Arabic.', who: 'Product designer, Dubai' },
  { quote: 'We swapped six brand inputs and every screen passed contrast.', who: 'Design lead, Pune' },
  { quote: 'Dark mode stopped being a second project.', who: 'Front-end engineer, Leeds' },
  { quote: 'The focus states are better than the ones we drew ourselves.', who: 'Accessibility lead, Bengaluru' },
  { quote: 'Hindi labels no longer clip. That alone was worth it.', who: 'Engineering manager, Delhi' },
  { quote: 'One system, five brands, no forks.', who: 'Platform team, Manchester' },
];

function Quote({ quote, who }: { quote: string; who: string }) {
  return (
    <Card style={{ inlineSize: '18rem', padding: 'var(--syntara-space-5)', whiteSpace: 'normal' }}>
      <p style={{ margin: 0, color: 'var(--syntara-color-text-default)', fontSize: 'var(--syntara-font-size-md)' }}>
        “{quote}”
      </p>
      <p style={{ margin: 0, marginBlockStart: 'var(--syntara-space-3)', fontSize: 'var(--syntara-font-size-sm)' }}>{who}</p>
    </Card>
  );
}

export default function Example() {
  return (
    <div style={{ display: 'grid', gap: 'var(--syntara-space-4)' }}>
      <Marquee label="What teams say, row one" speed="slow">
        {QUOTES.slice(0, 3).map((q) => (
          <Quote key={q.who} {...q} />
        ))}
      </Marquee>
      <Marquee label="What teams say, row two" speed="slow" reverse>
        {QUOTES.slice(3).map((q) => (
          <Quote key={q.who} {...q} />
        ))}
      </Marquee>
    </div>
  );
}

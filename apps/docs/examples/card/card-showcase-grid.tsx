'use client';

import { Card, CardDescription, CardFooter, CardHeader, CardMedia, CardTitle } from '@strata/react';
import type { CSSProperties } from 'react';

const studies = [
  { id: 'renewals', glow: 'brand', title: 'Renewals in one tap', text: 'A reminder that opens straight on the renewal, already filled in.', year: '2025' },
  { id: 'wallet', glow: 'accent', title: 'One wallet for the family', text: 'Shared limits that every member can see, with nobody asking who spent what.', year: '2024' },
  { id: 'support', glow: 'none', title: 'Answers before a ticket', text: 'Search that reads the policy, so most questions end on the first screen.', year: '2023' },
] as const;

const bar = (inlineSize: string): CSSProperties => ({ display: 'block', inlineSize, blockSize: 'var(--strata-space-1)', borderRadius: 'var(--strata-radius-pill)', background: 'var(--strata-color-border-default)' });
const phone: CSSProperties = { display: 'grid', alignContent: 'start', gap: 'var(--strata-space-2)', inlineSize: 'calc(var(--strata-space-16) * 1.5)', blockSize: 'calc(var(--strata-space-16) * 2.5)', padding: 'var(--strata-space-3)', boxSizing: 'border-box', borderRadius: 'var(--strata-space-5)', background: 'var(--strata-color-surface-raised)', boxShadow: '0 0 0 1px var(--strata-color-border-default), var(--strata-shadow-raised)' };

export default function Example() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))', gap: 'var(--strata-space-6)', inlineSize: '100%' }}>
      {studies.map((s) => (
        <Card key={s.id} variant="showcase" interactive>
          <CardMedia glow={s.glow}>
            <div role="img" aria-label={`${s.title} on a phone`} style={phone}>
              <span style={{ ...bar('40%'), background: 'var(--strata-color-text-brand)' }} />
              <span style={bar('90%')} />
              <span style={bar('70%')} />
            </div>
          </CardMedia>
          <CardHeader>
            <CardTitle>
              <a href={`#${s.id}`}>{s.title}</a>
            </CardTitle>
            <CardDescription>{s.text}</CardDescription>
          </CardHeader>
          <CardFooter divider>{s.year}</CardFooter>
        </Card>
      ))}
    </div>
  );
}

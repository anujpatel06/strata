'use client';

import { Button } from '@syntara/react';
import { IconArrowRight } from '@syntara/icons';

/* Contrast is the monochrome strong action: near-black in light schemes, near-white in dark. Pair it with a
   quiet secondary, and keep the brand colour for the page's one hero action. */
export default function Example() {
  return (
    <div style={{ display: 'grid', gap: 'var(--syntara-space-3)', inlineSize: '100%', maxInlineSize: 360 }}>
      <Button variant="contrast" size="lg">
        Review changes
        <IconArrowRight aria-hidden />
      </Button>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--syntara-space-2)' }}>
        <Button variant="contrast">Publish</Button>
        <Button variant="outline">Save draft</Button>
        <Button variant="contrast" isDisabled>
          Archived
        </Button>
      </div>
    </div>
  );
}

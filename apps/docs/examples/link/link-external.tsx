'use client';

import { Link } from '@strata/react';
import { IconExternalLink } from '@tabler/icons-react';

export default function Example() {
  return (
    <div style={{ display: 'grid', gap: 12, justifyItems: 'start' }}>
      <Link variant="standalone" href="https://www.w3.org/WAI/standards-guidelines/wcag/" target="_blank" rel="noreferrer">
        Accessibility guidelines
        <IconExternalLink aria-hidden />
      </Link>
      <Link variant="standalone" isDisabled>
        Archived reports
      </Link>
    </div>
  );
}

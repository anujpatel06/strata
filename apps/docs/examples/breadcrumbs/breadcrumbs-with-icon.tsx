'use client';

import { IconHome } from '@tabler/icons-react';
import { Breadcrumb, Breadcrumbs } from '@strata/react';

export default function Example() {
  return (
    <Breadcrumbs>
      <Breadcrumb href="#">
        <IconHome aria-hidden="true" stroke={1.75} />
        Home
      </Breadcrumb>
      <Breadcrumb href="#">Documents</Breadcrumb>
      <Breadcrumb href="#">2026</Breadcrumb>
      <Breadcrumb>Annual statement</Breadcrumb>
    </Breadcrumbs>
  );
}

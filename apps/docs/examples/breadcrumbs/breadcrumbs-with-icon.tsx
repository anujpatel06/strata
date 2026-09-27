'use client';

import { IconHome } from '@strata/icons';
import { Breadcrumb, Breadcrumbs } from '@strata/react';

export default function Example() {
  return (
    <Breadcrumbs aria-label="Document breadcrumbs">
      <Breadcrumb href="#">
        <IconHome aria-hidden="true" />
        Home
      </Breadcrumb>
      <Breadcrumb href="#">Documents</Breadcrumb>
      <Breadcrumb href="#">2026</Breadcrumb>
      <Breadcrumb>Annual statement</Breadcrumb>
    </Breadcrumbs>
  );
}

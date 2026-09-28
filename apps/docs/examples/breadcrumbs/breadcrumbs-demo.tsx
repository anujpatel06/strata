'use client';

import { Breadcrumb, Breadcrumbs } from '@syntara/react';

export default function Example() {
  return (
    <Breadcrumbs aria-label="Claim breadcrumbs">
      <Breadcrumb href="#">Home</Breadcrumb>
      <Breadcrumb href="#">Claims</Breadcrumb>
      <Breadcrumb>CLM-20481</Breadcrumb>
    </Breadcrumbs>
  );
}

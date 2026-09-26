'use client';

import { Breadcrumb, Breadcrumbs } from '@strata/react';

export default function Example() {
  return (
    <Breadcrumbs maxItems={3}>
      <Breadcrumb href="#">Home</Breadcrumb>
      <Breadcrumb href="#">Settings</Breadcrumb>
      <Breadcrumb href="#">Team</Breadcrumb>
      <Breadcrumb href="#">Roles</Breadcrumb>
      <Breadcrumb href="#">Reviewer</Breadcrumb>
      <Breadcrumb>Permissions</Breadcrumb>
    </Breadcrumbs>
  );
}

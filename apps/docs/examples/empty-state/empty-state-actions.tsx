'use client';

import { IconUsers } from '@syntara/icons';
import { Button, EmptyState, Link } from '@syntara/react';

export default function Example() {
  return (
    <EmptyState
      icon={<IconUsers />}
      title="Add your family"
      description="Dependants you add can use your benefits and submit their own claims."
      action={
        <>
          <Button>Add a dependant</Button>
          <Link href="#who-can-be-added" variant="standalone">Who can be added?</Link>
        </>
      }
    />
  );
}

import { Button, Badge } from '@strata/react';
import { Button as Renamed } from '@strata/react';
import * as Strata from '@strata/react';
import { Button as Other } from 'some-library';

export function Fires({ props }: { props: object }) {
  return (
    <div>
      <Button variant="danger">Delete</Button> {/* expect: deprecated-api */}
      <Button variant={'danger'}>Delete</Button> {/* expect: deprecated-api */}
      <Button variant={`danger`}>Delete</Button> {/* expect: deprecated-api */}
      <Renamed variant="danger">Delete</Renamed> {/* expect: deprecated-api */}
      <Strata.Button variant="danger">Delete</Strata.Button> {/* expect: deprecated-api */}
      <Button variant="danger" tone="neutral">Delete</Button> {/* expect: deprecated-api */}
      <Button variant="danger" {...props}>Delete</Button> {/* expect: deprecated-api */}
    </div>
  );
}

export function Passes({ bad }: { bad: boolean }) {
  return (
    <div>
      <Button tone="danger">Delete</Button>
      <Button variant="primary">Save</Button>
      <Button variant={bad ? 'danger' : 'primary'}>Maybe</Button>
      <Other variant="danger">Delete</Other>
      <Badge variant="danger">3</Badge>
    </div>
  );
}

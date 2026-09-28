import { Button, Badge } from '@syntara/react';
import { Button as Renamed } from '@syntara/react';
import * as Syntara from '@syntara/react';
import { Button as Other } from 'some-library';

export function Fires({ props }: { props: object }) {
  return (
    <div>
      <Button variant="danger">Delete</Button> {/* expect: deprecated-api */}
      <Button variant={'danger'}>Delete</Button> {/* expect: deprecated-api */}
      <Button variant={`danger`}>Delete</Button> {/* expect: deprecated-api */}
      <Renamed variant="danger">Delete</Renamed> {/* expect: deprecated-api */}
      <Syntara.Button variant="danger">Delete</Syntara.Button> {/* expect: deprecated-api */}
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

import { Button } from '@strata/react';

export function Actions() {
  return (
    <div>
      <Button variant="danger">Delete card</Button>
      <Button variant={'danger'} size="sm" onPress={() => {}}>
        Remove
      </Button>
      <Button variant={`danger`}>Close account</Button>
      <Button variant="primary">Save</Button>
      <Button>Continue</Button>
    </div>
  );
}

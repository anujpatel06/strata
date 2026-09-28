import { Button } from '@syntara/react';

export function Actions() {
  return (
    <div>
      <Button tone="danger">Delete card</Button>
      <Button tone="danger" size="sm" onPress={() => {}}>
        Remove
      </Button>
      <Button tone="danger">Close account</Button>
      <Button variant="primary">Save</Button>
      <Button>Continue</Button>
    </div>
  );
}

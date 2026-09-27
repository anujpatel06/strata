import { createElement } from 'react';
import { Button, type ButtonProps } from '@strata/react';

export function Row({ isBad, ...props }: ButtonProps & { isBad: boolean }) {
  const variant = isBad ? 'danger' : 'primary';
  return (
    <>
      <Button variant={isBad ? 'danger' : 'outline'}>Conditional</Button>
      <Button variant={variant}>Identifier</Button>
      <Button {...props}>Spread only</Button>
      <Button variant="danger" {...props}>
        Spread after
      </Button>
      <Button variant="danger" tone="neutral">
        Has a tone
      </Button>
      {createElement(Button, { variant: 'danger' }, 'Object props')}
    </>
  );
}

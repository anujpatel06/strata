import { Button } from '@strata/react';

export function Row({ props }: { props: object }) {
  return (
    <div style={{ marginLeft: 8, 'paddingRight': '12px', color: '#5a5a5d', background: '#fff', fontWeight: 500, top: -4, textAlign: 'left' }}>
      <Button variant="danger">Delete</Button>
      <Button size="sm" variant={'danger'} isPending>
        Delete
      </Button>
      <Button variant="danger" {...props}>Delete</Button>
      <button type="button">Native</button>
    </div>
  );
}

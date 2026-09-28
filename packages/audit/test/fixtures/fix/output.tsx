import { Button } from '@syntara/react';

export function Row({ props }: { props: object }) {
  return (
    <div style={{ marginInlineStart: 'var(--syntara-space-2)', 'paddingInlineEnd': 'var(--syntara-space-3)', color: 'var(--syntara-color-text-subtle)', background: '#fff', fontWeight: 'var(--syntara-font-weight-medium)', insetBlockStart: 'calc(var(--syntara-space-1) * -1)', textAlign: 'start' }}>
      <Button tone="danger">Delete</Button>
      <Button size="sm" tone="danger" isPending>
        Delete
      </Button>
      <Button variant="danger" {...props}>Delete</Button>
      <button type="button">Native</button>
    </div>
  );
}

import { Button } from '@strata/react';

export function Row({ props }: { props: object }) {
  return (
    <div style={{ marginInlineStart: 'var(--strata-space-2)', 'paddingInlineEnd': 'var(--strata-space-3)', color: 'var(--strata-color-text-subtle)', background: '#fff', fontWeight: 'var(--strata-font-weight-medium)', insetBlockStart: 'calc(var(--strata-space-1) * -1)', textAlign: 'start' }}>
      <Button tone="danger">Delete</Button>
      <Button size="sm" tone="danger" isPending>
        Delete
      </Button>
      <Button variant="danger" {...props}>Delete</Button>
      <button type="button">Native</button>
    </div>
  );
}

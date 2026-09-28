import { Button } from '@syntara/react';

export function Footer({ busy, ...rest }: { busy: boolean }) {
  return (
    <footer>
      <Button {...rest} variant="danger" isPending={busy}>
        Delete account
      </Button>
      <Button variant={busy ? 'ghost' : 'danger'}>Maybe</Button>
    </footer>
  );
}

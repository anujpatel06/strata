import { Button } from '@strata/react';

export function Toolbar({ count, quiet, fallback }: { count: number; quiet?: 'ghost'; fallback: 'outline' | 'danger' }) {
  return (
    <>
      <Button variant={count ? 'primary' : 'outline'}>Approve</Button>
      <Button variant={count > 3 ? 'primary' : count ? 'secondary' : ('ghost' as const)}>Nested</Button>
      <Button variant={count ? 'contrast' : 'link'} size="sm">
        Small
      </Button>
      <Button variant={quiet ?? fallback}>Could be danger</Button>
    </>
  );
}

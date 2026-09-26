import { PageShell } from '@/components/page/page-shell';
import { ButtonLink } from '@/components/page/button-link';

export default function NotFound() {
  return (
    <PageShell
      eyebrow="404"
      title="This page doesn’t exist"
      description="It may have moved, or the link has a typo. Search with ⌘K, or start from the docs."
      actions={
        <>
          <ButtonLink href="/docs">Go to the docs</ButtonLink>
          <ButtonLink href="/" variant="ghost">
            Home
          </ButtonLink>
        </>
      }
    />
  );
}

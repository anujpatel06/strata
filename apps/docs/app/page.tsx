import { PageShell } from '@/components/page/page-shell';
import { ButtonLink } from '@/components/page/button-link';

export default function Home() {
  return (
    <PageShell
      title="One design system. Every brand."
      description="Strata turns six brand inputs into an accessible theme and renders it through one React library — for people and for AI agents."
      actions={
        <>
          <ButtonLink href="/docs">Get started</ButtonLink>
          <ButtonLink href="/docs/components" variant="outline">
            Components
          </ButtonLink>
        </>
      }
    />
  );
}

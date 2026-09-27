import { Card, CardAction, CardDescription, CardHeader, CardTitle } from '@strata/react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { DocsPage } from '@/components/docs/docs-page';
import { H2, P } from '@/components/mdx/prose';
import { getAllMeta, getComponentGroups } from '@/lib/meta';
import { slugify } from '@/lib/slug';
import { MaturityBadge } from '@/components/docs/maturity-badge';
import styles from './components-index.module.css';

export const metadata: Metadata = {
  title: 'Components',
  description: 'Every Strata component, grouped by what it does.',
};

export default function ComponentsIndex() {
  const groups = getComponentGroups();
  const total = getAllMeta().length;
  return (
    <DocsPage
      href="/docs/components"
      crumbs={[{ href: '/docs', label: 'Docs' }, { label: 'Reference' }]}
      title="Components"
      description="Built on React Aria, styled only with Strata tokens, so each one renders every brand, scheme, density and direction from the same code."
      toc={groups.map((g) => ({ id: slugify(g.label), title: g.label, depth: 2 as const }))}
      wide
    >
      <P>
        {total} {total === 1 ? 'component has' : 'components have'} a metadata file today. Each page below is generated
        from that file — the same one the registry and the MCP server read.
      </P>
      {groups.map((group) => (
        <section key={group.category} className={styles.section} aria-labelledby={slugify(group.label)}>
          <H2 id={slugify(group.label)}>{group.label}</H2>
          <ul className={styles.grid}>
            {group.items.map((m) => (
              <li key={m.name}>
                <Card variant="outline" className={styles.card}>
                  <CardHeader className={styles.header}>
                    <CardTitle level={3} className={styles.title}>
                      <Link href={`/docs/components/${m.name}`} className={styles.link}>
                        {m.title}
                      </Link>
                    </CardTitle>
                    <CardAction className={styles.action}>
                      <MaturityBadge maturity={m.maturity} />
                    </CardAction>
                    <CardDescription className={styles.description}>{m.description}</CardDescription>
                  </CardHeader>
                </Card>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </DocsPage>
  );
}

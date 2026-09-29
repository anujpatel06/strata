import { Card, CardAction, CardDescription, CardHeader, CardTitle } from '@syntara/react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { DocsPage } from '@/components/docs/docs-page';
import { H2, P } from '@/components/mdx/prose';
import { getAllMeta, getComponentGroups } from '@/lib/meta';
import { ExampleThumb } from '@/components/preview/example-thumb';
import { slugify } from '@/lib/slug';
import { MATURITY_HREF, MATURITY_SHORT, MaturityBadge, type Maturity } from '@/components/docs/maturity-badge';
import styles from './components-index.module.css';

export const metadata: Metadata = {
  title: 'Components',
  description: 'Every Syntara component, grouped by what it does.',
};

export default function ComponentsIndex() {
  const groups = getComponentGroups();
  const all = getAllMeta();
  const total = all.length;
  // Counts per level, read from every meta.json at build time (never typed in).
  const levels: Maturity[] = ['alpha', 'beta', 'stable'];
  const count = (l: Maturity) => all.filter((m) => m.maturity === l).length;
  return (
    <DocsPage
      href="/docs/components"
      crumbs={[{ href: '/docs', label: 'Docs' }, { label: 'Reference' }]}
      title="Components"
      description="Built on React Aria, styled only with Syntara tokens, so each one renders every brand, scheme, density and direction from the same code."
      toc={groups.map((g) => ({ id: slugify(g.label), title: g.label, depth: 2 as const }))}
      wide
    >
      <P>
        {total} {total === 1 ? 'component has' : 'components have'} a metadata file today. Each page below is generated
        from that file — the same one the registry and the MCP server read.
      </P>
      <div className={styles.legend}>
        <span className={styles.legendLabel} id="maturity-legend">
          Maturity
        </span>
        <ul className={styles.legendList} aria-labelledby="maturity-legend">
          {levels.map((l) => (
            <li key={l} className={styles.legendItem}>
              <MaturityBadge maturity={l} />
              <span>
                <span className={styles.legendCount}>{count(l)}</span> · {MATURITY_SHORT[l]}
              </span>
            </li>
          ))}
        </ul>
        <Link href={MATURITY_HREF} className={styles.legendLink}>
          <span className="visually-hidden">Maturity </span>Criteria
        </Link>
      </div>
      {groups.map((group) => (
        <section key={group.category} className={styles.section} aria-labelledby={slugify(group.label)}>
          <H2 id={slugify(group.label)}>{group.label}</H2>
          <ul className={styles.grid}>
            {group.items.map((m) => (
              <li key={m.name}>
                <Card variant="outline" className={styles.card}>
                  {/* The same example the component page opens with, as a still: what the card links to, pictured. */}
                  <div className={styles.media}>
                    <ExampleThumb name={m.example} caption={m.opens} />
                  </div>
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

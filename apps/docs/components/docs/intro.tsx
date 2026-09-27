/**
 * Editorial pieces for the /docs introduction (imported by content/docs/index.mdx). Server components: every
 * number is read from its source at build time (engine, meta files, tenant folders), never typed in.
 */
import { IconArrowRight } from '@strata/icons';
import { ROLES, countTokens } from '@strata/theme-engine';
import Link from 'next/link';
import type { CSSProperties, ReactNode } from 'react';
import { DOC_PAGES } from '@/lib/docs';
import { getAllMeta } from '@/lib/meta';
import { getTenants } from '@/lib/tenants';
import styles from './intro.module.css';

/** Wraps the MDX principles list: numbers become display figures, statements get room to breathe. */
export function Principles({ children }: { children?: ReactNode }) {
  return <div className={styles.principles}>{children}</div>;
}

interface Layer {
  name: string;
  what: string;
  figure: string;
  unit: string;
}

/**
 * "What's in the box" as the stack it is: a brand file at the top, each package a stratum below it, and the one
 * number that describes each layer at the end of its row.
 */
export function Layers() {
  const tenants = getTenants();
  const sample = tenants[0]?.brand as unknown as Record<string, unknown> | undefined;
  const inputs = sample ? Object.keys(sample).filter((k) => k !== 'name').length : 0;
  const layers: Layer[] = [
    { name: 'brand.json', what: 'A brand, as data. One file per tenant; nothing else changes.', figure: String(inputs), unit: 'inputs' },
    {
      name: '@strata/theme-engine',
      what: 'OKLCH ramps, semantic roles for light and dark, and a contrast solver that explains each change. No runtime dependencies.',
      figure: String(ROLES.length),
      unit: 'colour roles',
    },
    {
      name: '@strata/tokens',
      what: 'The built token files for every tenant: CSS variables, DTCG JSON and Figma variables.',
      figure: String(countTokens()),
      unit: 'tokens per theme',
    },
    {
      name: '@strata/react',
      what: 'Components on React Aria Components, styled with CSS Modules and tokens only.',
      figure: String(getAllMeta().length),
      unit: 'components',
    },
    {
      name: 'Your product',
      what: 'Your app, and this site: the chrome wears the monochrome house brand and every preview is a ThemeScope.',
      figure: String(tenants.length + 1),
      unit: 'brands on this site',
    },
  ];
  return (
    <ol className={styles.layers} aria-label="From brand file to product">
      {layers.map((l, i) => (
        <li key={l.name} className={styles.layer} style={{ '--_depth': i } as CSSProperties}>
          <span className={styles.layerName}>{l.name}</span>
          <span className={styles.layerWhat}>{l.what}</span>
          <span className={styles.layerFigure}>
            <span className={styles.layerNumber}>{l.figure}</span>
            <span className={styles.layerUnit}>{l.unit}</span>
          </span>
        </li>
      ))}
    </ol>
  );
}

/** Where to go next: doc pages by slug, with their own descriptions from lib/docs.ts. */
export function NextSteps({ slugs, extra = [] }: { slugs: string[]; extra?: Array<{ href: string; title: string; description: string }> }) {
  const pages = [
    ...slugs.map((s) => DOC_PAGES.find((p) => p.slug === s)).filter((p): p is (typeof DOC_PAGES)[number] => p != null),
    ...extra,
  ];
  return (
    <ul className={styles.next}>
      {pages.map((p) => (
        <li key={p.href}>
          <Link href={p.href} className={styles.nextLink}>
            <span className={styles.nextTitle}>{p.title}</span>
            <span className={styles.nextDescription}>{p.description}</span>
            <IconArrowRight aria-hidden className={styles.nextIcon} />
          </Link>
        </li>
      ))}
    </ul>
  );
}

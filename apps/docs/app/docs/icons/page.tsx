import { ThemeScope, ToastRegion } from '@strata/react';
import type { Metadata } from 'next';
import { DocsPage } from '@/components/docs/docs-page';
import { getIconGroups, getIconSpec } from '@/components/icons/icon-data';
import { IconGallery } from '@/components/icons/icon-gallery';
import { IconSpecimen } from '@/components/icons/icon-specimen';
import styles from '@/components/icons/icons.module.css';
import { CodeBlock } from '@/components/mdx/code-block';
import { AdrLink } from '@/components/mdx/data';
import { H2, P } from '@/components/mdx/prose';
import { getDocPage } from '@/lib/docs';
import { githubBlob } from '@/lib/site';

const page = getDocPage('icons')!;
export const metadata: Metadata = { title: page.title, description: page.description };

const USAGE = `import { IconBell } from '@strata/icons';

// Decorative next to text (the default): hidden from assistive tech, sized to the text.
<Button><IconBell aria-hidden /> Notify me</Button>

// On its own, it needs a name.
<IconBell aria-label="Notifications" size={20} />`;

export default function IconsPage() {
  const groups = getIconGroups();
  const spec = getIconSpec();
  const total = groups.reduce((n, g) => n + g.names.length, 0);
  return (
    <DocsPage
      href={page.href}
      crumbs={[{ href: '/docs', label: 'Docs' }, { label: 'Foundations' }]}
      title="Icons"
      description={
        <>
          Strata draws its own icons: <em className={styles.leadEm}>curvy and minimal</em>, one stroke weight, colour from
          the text around them. {total} of them, each a React component in <code>@strata/icons</code>.
        </>
      }
      toc={[
        { id: 'the-style', title: 'The style', depth: 2 },
        { id: 'usage', title: 'Usage', depth: 2 },
        { id: 'all-icons', title: 'All icons', depth: 2 },
        ...groups.map((g) => ({ id: `icons-${g.id}`, title: g.label, depth: 3 as const })),
      ]}
      editUrl={githubBlob('apps/docs/app/docs/icons/page.tsx')}
      wide
    >
      <IconSpecimen spec={spec} />

      <H2 id="the-style">The style</H2>
      <dl className={styles.facts}>
        <div className={styles.fact}>
          <dt>Grid</dt>
          <dd>
            <span className={styles.factNumber}>{spec.grid}</span>
            <span className={styles.factUnit}>px, drawing inside the central {spec.live}</span>
          </dd>
        </div>
        <div className={styles.fact}>
          <dt>Stroke</dt>
          <dd>
            <span className={styles.factNumber}>{spec.stroke}</span>
            <span className={styles.factUnit}>
              round caps and joins, from <code>--strata-icon-stroke</code>
            </span>
          </dd>
        </div>
        <div className={styles.fact}>
          <dt>Set</dt>
          <dd>
            <span className={styles.factNumber}>{total}</span>
            <span className={styles.factUnit}>icons in {groups.length} groups</span>
          </dd>
        </div>
      </dl>
      <ul className={styles.rules}>
        <li>
          <strong>Curves over corners.</strong> An arc or a curve wherever a corner would do: rounded chevron tips, arc
          shoulders and handles, scalloped mechanical shapes.
        </li>
        <li>
          <strong>Only the strokes you need.</strong> No inner detail lines, decorative ticks or shading. Most icons are
          three paths or fewer.
        </li>
        <li>
          <strong>Colour follows the text.</strong> Every icon draws in <code>currentColor</code> and sizes to{' '}
          <code>1.25em</code>, so it matches the label beside it.
        </li>
        <li>
          <strong>Quiet by default.</strong> Icons are <code>aria-hidden</code> unless you give one an{' '}
          <code>aria-label</code>; then it’s announced as an image.
        </li>
      </ul>
      <P>
        Why Strata draws its own instead of using an off-the-shelf set: <AdrLink n="014" />. The full spec sits at the top
        of{' '}
        <a href={githubBlob('packages/icons/src/create-icon.tsx')} className={styles.inlineLink}>
          create-icon.tsx
        </a>
        .
      </P>

      <H2 id="usage">Usage</H2>
      <CodeBlock code={USAGE} lang="tsx" />

      <H2 id="all-icons">All icons</H2>
      {/* The page's own scope, so the toast region copies the house theme and the site's scheme. */}
      <ThemeScope theme="house" data-strata-scheme="site">
        <IconGallery groups={groups} defaultStroke={spec.stroke} />
        <ToastRegion placement="bottom-end" />
      </ThemeScope>
    </DocsPage>
  );
}

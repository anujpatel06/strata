import Link from 'next/link';
import { readRepoFile } from '@/lib/repo';
import { GITHUB_URL, githubTree } from '@/lib/site';
import { LogoMark } from './logo';
import styles from './site-footer.module.css';

const COLUMNS: ReadonlyArray<{ title: string; links: ReadonlyArray<{ href: string; label: string; external?: boolean }> }> = [
  {
    title: 'Start',
    links: [
      { href: '/docs', label: 'Introduction' },
      { href: '/docs/installation', label: 'Installation' },
      { href: '/docs/theming', label: 'Theming' },
    ],
  },
  {
    title: 'Build',
    links: [
      { href: '/docs/components', label: 'Components' },
      { href: '/blocks', label: 'Blocks' },
      { href: '/docs/icons', label: 'Icons' },
    ],
  },
  {
    title: 'Brand',
    links: [
      { href: '/themes', label: 'Themes' },
      { href: '/colors', label: 'Colors' },
      { href: '/docs/accessibility', label: 'Accessibility' },
    ],
  },
  {
    title: 'Project',
    links: [
      { href: '/docs/governance', label: 'Decisions' },
      { href: '/docs/changelog', label: 'Changelog' },
      { href: GITHUB_URL, label: 'GitHub', external: true },
    ],
  },
];

/** The version on npm, read from the package at build time. */
function reactVersion(): string | undefined {
  const raw = readRepoFile('packages', 'react', 'package.json');
  try {
    return raw ? (JSON.parse(raw) as { version?: string }).version : undefined;
  } catch {
    return undefined;
  }
}

export function SiteFooter() {
  const version = reactVersion();
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.top}>
          <div className={styles.statement}>
            <Link href="/" className={styles.brand} aria-label="Strata home">
              <LogoMark size={20} />
              <span aria-hidden="true">Strata</span>
            </Link>
            <p className={styles.line}>
              One React library, <em>any brand</em>, accessible by construction.
            </p>
          </div>
          <nav aria-label="Footer" className={styles.columns}>
            {COLUMNS.map((col) => (
              <div key={col.title} className={styles.column}>
                <p className={styles.columnTitle}>{col.title}</p>
                <ul className={styles.list}>
                  {col.links.map((l) => (
                    <li key={l.href}>
                      {l.external ? (
                        <a href={l.href} className={styles.link} target="_blank" rel="noreferrer">
                          {l.label}
                        </a>
                      ) : (
                        <Link href={l.href} className={styles.link}>
                          {l.label}
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>
        <p className={styles.colophon}>
          Designed by Anuj Patel, engineering paired with Claude. Every decision is recorded with who made it, in{' '}
          <a href={githubTree('docs/adr')} className={styles.inlineLink}>
            docs/adr
          </a>
          .{version ? <span className={styles.version}> @strata/react {version}</span> : null}
        </p>
      </div>
    </footer>
  );
}

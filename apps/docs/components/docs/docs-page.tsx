import { IconArrowLeft, IconArrowRight, IconPencil } from '@tabler/icons-react';
import { Breadcrumb, Breadcrumbs } from '@strata/react';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { getPrevNext } from '@/lib/nav';
import type { TocItem } from '@/lib/toc';
import { Toc } from './toc';
import styles from './docs-page.module.css';
import prose from '../mdx/prose.module.css';

export interface Crumb {
  href?: string;
  label: string;
}

export interface DocsPageProps {
  /** Canonical path, used for prev/next. */
  href: string;
  crumbs: Crumb[];
  title: string;
  description?: ReactNode;
  /** Badges and links under the description. */
  meta?: ReactNode;
  toc?: TocItem[];
  /** Repo path of the file to edit, e.g. "apps/docs/content/docs/theming.mdx". */
  editPath?: string;
  editUrl?: string;
  /** Wider content column for pages built around previews. */
  wide?: boolean;
  children: ReactNode;
}

/** The content column of every /docs page: breadcrumbs, one h1, lead, body, prev/next, and the TOC column. */
export function DocsPage({ href, crumbs, title, description, meta, toc = [], editUrl, wide, children }: DocsPageProps) {
  const { prev, next } = getPrevNext(href);
  return (
    <div className={styles.page} data-toc={toc.length > 0 || undefined}>
      <article className={styles.article} data-wide={wide || undefined}>
        <header className={styles.header}>
          <Breadcrumbs className={styles.crumbs} aria-label="Page breadcrumbs">
            {crumbs.map((c) => (
              <Breadcrumb key={c.label} id={c.label} href={c.href}>
                {c.label}
              </Breadcrumb>
            ))}
          </Breadcrumbs>
          <h1 className={styles.title}>{title}</h1>
          {description && <p className={styles.lead}>{description}</p>}
          {meta && <div className={styles.meta}>{meta}</div>}
        </header>
        <div className={[styles.body, prose.flow].join(' ')}>{children}</div>
        <footer className={styles.footer}>
          {(prev || next) && (
            <nav aria-label="Previous and next pages" className={styles.pager}>
              {prev ? (
                <Link href={prev.href} className={styles.pagerLink} data-dir="prev">
                  <span className={styles.pagerHint}>Previous</span>
                  <span className={styles.pagerTitle}>
                    <IconArrowLeft aria-hidden size={16} stroke={1.75} className={styles.pagerIcon} />
                    {prev.title}
                  </span>
                </Link>
              ) : (
                <span />
              )}
              {next && (
                <Link href={next.href} className={styles.pagerLink} data-dir="next">
                  <span className={styles.pagerHint}>Next</span>
                  <span className={styles.pagerTitle}>
                    {next.title}
                    <IconArrowRight aria-hidden size={16} stroke={1.75} className={styles.pagerIcon} />
                  </span>
                </Link>
              )}
            </nav>
          )}
          {editUrl && (
            <a href={editUrl} className={styles.edit}>
              <IconPencil aria-hidden size={14} stroke={1.75} />
              Edit this page on GitHub
            </a>
          )}
        </footer>
      </article>
      {toc.length > 0 && (
        <div className={styles.tocColumn}>
          <div className={styles.tocSticky}>
            <Toc items={toc} />
          </div>
        </div>
      )}
    </div>
  );
}

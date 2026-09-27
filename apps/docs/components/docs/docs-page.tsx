import { IconArrowLeft, IconArrowRight, IconPencil } from '@strata/icons';
import { Eyebrow } from '@strata/react';
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
  /**
   * Where the page sits, shown as the eyebrow above the title ("Components · Actions"). Crumbs with an href are
   * links; the current page is left out, because the h1 right below already names it.
   */
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
          {crumbs.length > 0 && (
            <nav aria-label="Section">
              <Eyebrow lead="rule" className={styles.eyebrow}>
                {crumbs.map((c, i) => (
                  <span key={c.label}>
                    {i > 0 && <span aria-hidden="true"> · </span>}
                    {c.href ? (
                      <Link href={c.href} className={styles.eyebrowLink}>
                        {c.label}
                      </Link>
                    ) : (
                      c.label
                    )}
                  </span>
                ))}
              </Eyebrow>
            </nav>
          )}
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
                  <span className={styles.pagerHint}>
                    <IconArrowLeft aria-hidden className={styles.pagerIcon} />
                    Previous
                  </span>
                  <span className={styles.pagerTitle}>{prev.title}</span>
                </Link>
              ) : (
                <span />
              )}
              {next && (
                <Link href={next.href} className={styles.pagerLink} data-dir="next">
                  <span className={styles.pagerHint}>
                    Next
                    <IconArrowRight aria-hidden className={styles.pagerIcon} />
                  </span>
                  <span className={styles.pagerTitle}>{next.title}</span>
                </Link>
              )}
            </nav>
          )}
          {editUrl && (
            <a href={editUrl} className={styles.edit}>
              <IconPencil aria-hidden size={14} />
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

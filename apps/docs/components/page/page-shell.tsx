import type { ReactNode } from 'react';
import styles from './page-shell.module.css';

/**
 * Frame for top-level pages outside /docs (home, blocks, themes, colors): <main id="main">, the site
 * container and gutters, and an optional page header. Wave-2 pages render their content as children.
 */
export function PageShell({
  eyebrow,
  title,
  description,
  actions,
  children,
  width = 'default',
}: {
  eyebrow?: ReactNode;
  title?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  children?: ReactNode;
  /** `default` = site container, `narrow` = prose width. */
  width?: 'default' | 'narrow';
}) {
  return (
    <main id="main" tabIndex={-1} className={styles.main}>
      <div className={styles.container} data-width={width}>
        {(title || description) && (
          <header className={styles.header}>
            {eyebrow && <p className={styles.eyebrow}>{eyebrow}</p>}
            {title && <h1 className={styles.title}>{title}</h1>}
            {description && <p className={styles.description}>{description}</p>}
            {actions && <div className={styles.actions}>{actions}</div>}
          </header>
        )}
        {children}
      </div>
    </main>
  );
}

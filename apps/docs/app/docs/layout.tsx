import type { ReactNode } from 'react';
import { DocsSidebar } from '@/components/docs/docs-sidebar';
import { getSidebar } from '@/lib/nav';
import styles from './docs-layout.module.css';

export default function DocsLayout({ children }: { children: ReactNode }) {
  return (
    <div className={styles.container}>
      {/* A plain wrapper: the <nav aria-label="Docs"> inside is the landmark. */}
      <div className={styles.sidebar}>
        <div className={styles.sidebarScroll}>
          <DocsSidebar groups={getSidebar()} />
        </div>
      </div>
      <main id="main" className={styles.main} tabIndex={-1}>
        {children}
      </main>
    </div>
  );
}

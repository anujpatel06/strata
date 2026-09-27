import type { Metadata } from 'next';
import { BLOCKS } from '@/components/blocks/block-data';
import { BlockViewer } from '@/components/blocks/block-viewer';
import { PageShell } from '@/components/page/page-shell';
import styles from './blocks.module.css';

export const metadata: Metadata = {
  title: 'Blocks',
  description: 'Full pages built only from Strata components. Same code for every tenant; only tokens and copy change.',
};

export default function Blocks() {
  return (
    <PageShell
      eyebrow="Blocks"
      title={
        <>
          Whole screens, <em>one codebase</em>
        </>
      }
      description="Full pages built only from Strata components. Switch tenant and the code stays the same; only tokens and copy change. Copy the source into your project and own it."
    >
      <nav aria-label="Blocks on this page" className={styles.index}>
        <ol className={styles.indexList}>
          {BLOCKS.map((block, i) => (
            <li key={block.name}>
              <a href={`#${block.name}`} className={styles.indexLink}>
                <span className={styles.indexNumber}>{String(i + 1).padStart(2, '0')}</span>
                <span className={styles.indexTitle}>{block.title}</span>
              </a>
            </li>
          ))}
        </ol>
      </nav>
      <div className={styles.list}>
        {BLOCKS.map((block, i) => (
          <BlockViewer key={block.name} block={block} index={i + 1} />
        ))}
      </div>
    </PageShell>
  );
}

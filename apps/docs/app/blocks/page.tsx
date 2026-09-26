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
      title="Blocks"
      description="Full pages built only from Strata components. Switch tenant: the code stays the same, only tokens and copy change. Copy the source or install with the shadcn CLI."
    >
      <div className={styles.list}>
        {BLOCKS.map((block) => (
          <BlockViewer key={block.name} block={block} />
        ))}
      </div>
    </PageShell>
  );
}

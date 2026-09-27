import type { Metadata } from 'next';
import { BlockOverview } from '@/components/blocks/block-overview';
import { BLOCKS, getBlockContents, getBlockTenants } from '@/components/blocks/block-data';
import { BlockViewer } from '@/components/blocks/block-viewer';
import { PageShell } from '@/components/page/page-shell';
import styles from './blocks.module.css';

export const metadata: Metadata = {
  title: 'Blocks',
  description: 'Full pages built only from Strata components. Same code for every tenant; only tokens and copy change.',
};

/** Each block in the overview is drawn in the next tenant along, so the grid shows the same code in every brand. */
function overviewItems() {
  const tenants = getBlockTenants();
  return BLOCKS.map((block, i) => {
    const tenant = tenants[i % tenants.length]!;
    return {
      name: block.name,
      title: block.title,
      description: block.description,
      categories: block.categories,
      tenant,
      content: getBlockContents(block)[tenant.id],
    };
  });
}

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
      <BlockOverview items={overviewItems()} />
      <div className={styles.list}>
        {BLOCKS.map((block, i) => (
          <BlockViewer key={block.name} block={block} index={i + 1} />
        ))}
      </div>
    </PageShell>
  );
}

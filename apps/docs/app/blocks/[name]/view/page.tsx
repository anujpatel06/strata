import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { BLOCKS, getBlock, getBlockContents, getBlockTenants } from '@/components/blocks/block-data';
import { BlockView, BlockViewFallback } from '@/components/blocks/block-view';

export const dynamicParams = false;

export function generateStaticParams() {
  return BLOCKS.map((b) => ({ name: b.name }));
}

export async function generateMetadata({ params }: { params: Promise<{ name: string }> }): Promise<Metadata> {
  const { name } = await params;
  const block = getBlock(name);
  return block
    ? { title: `${block.title} block`, description: block.description, robots: { index: false, follow: true } }
    : {};
}

/** One block as the whole page, in the tenant and scheme from the query: ?tenant=<id>&scheme=light|dark. */
export default async function BlockViewPage({ params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  const block = getBlock(name);
  if (!block) notFound();
  return (
    <Suspense fallback={<BlockViewFallback />}>
      <BlockView name={block.name} tenants={getBlockTenants()} contents={getBlockContents(block)} />
    </Suspense>
  );
}

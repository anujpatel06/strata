import type { Metadata } from 'next';
import { MdxPage } from '@/components/docs/mdx-page';
import { DOC_CONTENT } from '@/lib/doc-content';
import { DOC_PAGES, getDocPage } from '@/lib/docs';

export const dynamicParams = false;

export function generateStaticParams() {
  // Only MDX pages: a page with its own route (e.g. /docs/icons) is listed in DOC_PAGES but has no loader.
  return DOC_PAGES.filter((p) => p.slug !== 'index' && p.slug in DOC_CONTENT).map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const page = getDocPage(slug);
  return page ? { title: page.title, description: page.description } : {};
}

export default async function DocPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <MdxPage slug={slug} />;
}

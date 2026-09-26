import type { Metadata } from 'next';
import { MdxPage } from '@/components/docs/mdx-page';
import { getDocPage } from '@/lib/docs';

const page = getDocPage('index')!;
export const metadata: Metadata = { title: page.title, description: page.description };

export default function DocsIndex() {
  return <MdxPage slug="index" />;
}

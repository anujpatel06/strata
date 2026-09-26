import type { Metadata } from 'next';
import { PageShell } from '@/components/page/page-shell';

export const metadata: Metadata = { title: 'Blocks', description: 'Page-level patterns built from Strata components.' };

export default function Blocks() {
  return <PageShell title="Blocks" description="Page-level patterns built from Strata components, rendered in every tenant." />;
}

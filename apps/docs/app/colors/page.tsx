import type { Metadata } from 'next';
import { PageShell } from '@/components/page/page-shell';

export const metadata: Metadata = { title: 'Colors', description: 'Every tenant’s ramps and semantic colour roles.' };

export default function Colors() {
  return <PageShell title="Colors" description="Every tenant’s 12-step ramps and the semantic roles components read." />;
}

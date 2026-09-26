import type { Metadata } from 'next';
import { PageShell } from '@/components/page/page-shell';

export const metadata: Metadata = { title: 'Themes', description: 'Generate an accessible Strata theme from a brand colour.' };

export default function Themes() {
  return <PageShell title="Themes" description="Paste a brand colour and get a complete light and dark theme that passes WCAG 2.2 AA." />;
}

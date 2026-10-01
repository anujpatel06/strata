import type { Metadata } from 'next';
import { PageShell } from '@/components/page/page-shell';
import { readState } from '@/components/themes/state';
import { ThemeStats } from '@/components/themes/theme-stats';
import { ThemesProvider } from '@/components/themes/themes-provider';
import { ThemesWorkspace } from '@/components/themes/themes-workspace';
import { getThemePresets } from '@/lib/theme-presets';

export const metadata: Metadata = {
  title: 'Themes',
  description: 'Type a brand colour and get a complete WCAG 2.2 AA theme — see it live, read every change the contrast solver made, and export it.',
};

/**
 * Prerendered, with no reference to the query string: reading `searchParams` here would opt the page into
 * server rendering on demand, and the site is a static export. ThemesProvider reads the address on the client
 * after hydration instead, so `?tenant=…&primary=…` links still work.
 */
export default function Themes() {
  const presets = getThemePresets();
  const initial = readState(new URLSearchParams(), presets);

  return (
    <ThemesProvider presets={presets} initial={initial}>
      <PageShell
        eyebrow="Themes"
        title={
          <>
            One colour in, <em>a whole brand</em> out
          </>
        }
        description="Type a brand colour. Get a complete, accessible theme, and see every change the solver made to get there."
        actions={<ThemeStats />}
      >
        <ThemesWorkspace />
      </PageShell>
    </ThemesProvider>
  );
}

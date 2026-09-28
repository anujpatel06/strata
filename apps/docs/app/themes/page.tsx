import type { Metadata } from 'next';
import { checkCopyReview } from '@/components/page/draft-copy-note';
import { PageShell } from '@/components/page/page-shell';
import { readState, type ThemePreset } from '@/components/themes/state';
import { ThemeStats } from '@/components/themes/theme-stats';
import { ThemesProvider } from '@/components/themes/themes-provider';
import { ThemesWorkspace } from '@/components/themes/themes-workspace';
import { HOUSE_ID } from '@/lib/house';
import { getHouseBrand, getTenants } from '@/lib/tenants';

export const metadata: Metadata = {
  title: 'Themes',
  description: 'Type a brand colour and get a complete WCAG 2.2 AA theme — see it live, read every change the contrast solver made, and export it.',
};

const LANGUAGE = new Intl.DisplayNames(['en'], { type: 'language' });

function languageName(locale: string): string {
  try {
    return LANGUAGE.of(locale.split('-')[0] ?? locale) ?? locale;
  } catch {
    return locale;
  }
}

/** Every tenant under tenants/, then the site's own brand. Adding a tenant folder adds a preset. */
function getPresets(): ThemePreset[] {
  const tenants: ThemePreset[] = getTenants().map((t) => ({
    id: t.id,
    label: t.name,
    brand: t.brand,
    locale: t.locale,
    dir: t.dir,
    industry: t.product.industry || languageName(t.locale),
    industryLang: t.locale.split('-')[0] ?? 'en',
    ...(t.product.industry && t.copyReview ? { copyReview: checkCopyReview(t.id, t.copyReview) } : {}),
  }));
  const house: ThemePreset = {
    id: HOUSE_ID,
    label: 'House',
    brand: getHouseBrand(),
    locale: 'en-US',
    dir: 'ltr',
    industry: 'This site',
    industryLang: 'en',
  };
  return [...tenants, house];
}

/**
 * Prerendered, with no reference to the query string: reading `searchParams` here would opt the page into
 * server rendering on demand, and the site is a static export. ThemesProvider reads the address on the client
 * after hydration instead, so `?tenant=…&primary=…` links still work.
 */
export default function Themes() {
  const presets = getPresets();
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

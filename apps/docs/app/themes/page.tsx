import type { Metadata } from 'next';
import { PageShell } from '@/components/page/page-shell';
import { PackageCommand } from '@/components/mdx/package-command';
import type { RegistryCommands } from '@/components/themes/export-panel';
import { readState, toQuery, type ThemePreset } from '@/components/themes/state';
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

export default async function Themes({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const presets = getPresets();
  const initial = readState(toQuery(await searchParams), presets);

  // Install commands are highlighted here, on the server, one pair per preset.
  const registry: Record<string, RegistryCommands> = {};
  for (const p of presets) {
    registry[p.id] = {
      tokens: <PackageCommand dlx={`shadcn@latest add @strata/strata-tokens-${p.id}`} />,
      theme: <PackageCommand dlx={`shadcn@latest add @strata/theme-${p.id}`} />,
    };
  }

  return (
    <ThemesProvider presets={presets} initial={initial}>
      <PageShell
        title="Themes"
        description="Type a brand colour. Get a complete, accessible theme — and see every change the solver made."
        actions={<ThemeStats />}
      >
        <ThemesWorkspace registry={registry} />
      </PageShell>
    </ThemesProvider>
  );
}

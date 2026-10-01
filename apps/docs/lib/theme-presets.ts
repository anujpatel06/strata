/**
 * Server-only: the preset list the live theme workspace starts from — every tenant under `tenants/`, then the
 * site's own brand. Adding a tenant folder adds a preset.
 *
 * Extracted from app/themes/page.tsx so /story can mount the same workspace from the same list; two copies of
 * this would drift the moment a tenant is added, and the copyReview marker is exactly the kind of thing a
 * second copy would quietly lose.
 */
import { checkCopyReview } from '@/components/page/draft-copy-note';
import type { ThemePreset } from '@/components/themes/state';
import { HOUSE_ID } from '@/lib/house';
import { getHouseBrand, getTenants } from '@/lib/tenants';

const LANGUAGE = new Intl.DisplayNames(['en'], { type: 'language' });

function languageName(locale: string): string {
  try {
    return LANGUAGE.of(locale.split('-')[0] ?? locale) ?? locale;
  } catch {
    return locale;
  }
}

export function getThemePresets(): ThemePreset[] {
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

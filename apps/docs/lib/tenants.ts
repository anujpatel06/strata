/** Server-only: tenant brands from tenants/<id>/brand.json. Adding a folder adds a tenant to the site. */
import type { BrandInput } from '@strata/theme-engine';
import { HOUSE } from './house';
import { cache } from 'react';
import { listRepoDir, readRepoFile } from './repo';

export interface TenantInfo {
  /** Folder name = data-strata-theme id, e.g. "vela". */
  id: string;
  name: string;
  brand: BrandInput;
  /** From content.json; "ltr" when absent. */
  dir: 'ltr' | 'rtl';
  /** BCP 47 locale from content.json, e.g. "ar-AE-u-nu-latn". */
  locale: string;
  /** Product name and industry in the tenant's own language (content.json). */
  product: { name: string; industry: string };
}

/** The three reference tenants in the order the brief introduces them; any others follow alphabetically. */
const ORDER = ['vela', 'harbor', 'qamar'];
const rank = (id: string) => {
  const i = ORDER.indexOf(id);
  return i === -1 ? ORDER.length : i;
};

export const getTenants = cache((): TenantInfo[] => {
  const tenants: TenantInfo[] = [];
  for (const id of listRepoDir('tenants')) {
    if (id === 'house') continue; // the site's own brand, see lib/house.ts
    const brandJson = readRepoFile('tenants', id, 'brand.json');
    if (!brandJson) continue;
    const brand = JSON.parse(brandJson) as BrandInput;
    const contentJson = readRepoFile('tenants', id, 'content.json');
    const content = contentJson
      ? (JSON.parse(contentJson) as { dir?: string; locale?: string; product?: { name?: string; industry?: string } })
      : {};
    tenants.push({
      id,
      name: brand.name,
      brand,
      dir: content.dir === 'rtl' ? 'rtl' : 'ltr',
      locale: content.locale ?? 'en-US',
      product: { name: content.product?.name ?? brand.name, industry: content.product?.industry ?? '' },
    });
  }
  return tenants.sort((a, b) => rank(a.id) - rank(b.id) || a.id.localeCompare(b.id));
});

/**
 * The site's own brand: tenants/house/brand.json when it exists (the registry's strata-tokens-house reads the
 * same file), otherwise HOUSE from lib/house.ts.
 */
export const getHouseBrand = cache((): BrandInput => {
  const raw = readRepoFile('tenants', 'house', 'brand.json');
  return raw ? (JSON.parse(raw) as BrandInput) : HOUSE;
});

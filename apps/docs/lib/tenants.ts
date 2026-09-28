/** Server-only: tenant brands from tenants/<id>/brand.json. Adding a folder adds a tenant to the site. */
import type { BrandInput } from '@syntara/theme-engine';
import { HOUSE } from './house';
import { cache } from 'react';
import { listRepoDir, readRepoFile } from './repo';

export interface TenantInfo {
  /** Folder name = data-syntara-theme id, e.g. "vela". */
  id: string;
  name: string;
  brand: BrandInput;
  /** From content.json; "ltr" when absent. */
  dir: 'ltr' | 'rtl';
  /** BCP 47 locale from content.json, e.g. "ar-AE-u-nu-latn". */
  locale: string;
  /** Product name and industry in the tenant's own language (content.json). */
  product: { name: string; industry: string };
  /** ISO currency from content.json, e.g. "INR". */
  currency: string;
  /** One real product moment for the tenant specimen (content.json `specimen`); `*word*` marks brand italics. */
  specimen?: { eyebrow: string; headline?: string; amount?: number; note?: string };
  /**
   * content.json `copyReview`: present while the tenant's copy is a draft no fluent reader has checked (Haat's Hindi,
   * ADR-020). Anything that shows the copy can show `note` (English) or `noteLocal` (the tenant's language) beside it.
   */
  copyReview?: { status: 'draft' | 'reviewed'; language: string; note: string; noteLocal?: string };
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
      ? (JSON.parse(contentJson) as {
          dir?: string;
          locale?: string;
          currency?: string;
          product?: { name?: string; industry?: string };
          specimen?: TenantInfo['specimen'];
          copyReview?: TenantInfo['copyReview'];
        })
      : {};
    tenants.push({
      id,
      name: brand.name,
      brand,
      dir: content.dir === 'rtl' ? 'rtl' : 'ltr',
      locale: content.locale ?? 'en-US',
      product: { name: content.product?.name ?? brand.name, industry: content.product?.industry ?? '' },
      currency: content.currency ?? 'USD',
      ...(content.specimen ? { specimen: content.specimen } : {}),
      ...(content.copyReview ? { copyReview: content.copyReview } : {}),
    });
  }
  return tenants.sort((a, b) => rank(a.id) - rank(b.id) || a.id.localeCompare(b.id));
});

/**
 * The site's own brand: tenants/house/brand.json when it exists (the registry's syntara-tokens-house reads the
 * same file), otherwise HOUSE from lib/house.ts.
 */
export const getHouseBrand = cache((): BrandInput => {
  const raw = readRepoFile('tenants', 'house', 'brand.json');
  return raw ? (JSON.parse(raw) as BrandInput) : HOUSE;
});

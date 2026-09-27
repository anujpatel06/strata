/**
 * Server-only: the block index (blocks/blocks.json), each block's source files, and each tenant's copy for it.
 * The same blocks.json feeds the registry build (packages/react/scripts/build-registry.mjs), so a block's title,
 * description and files are written once.
 */
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import blocksJson from '@/blocks/blocks.json';
import { benefitsOverviewTenantCopy } from '@/blocks/benefits-overview/benefits-overview.content';
import { portfolioTenantCopy } from '@/blocks/portfolio/portfolio.content';
import { DOCS_ROOT, readRepoFile } from '@/lib/repo';
import { getTenants } from '@/lib/tenants';

export interface BlockInfo {
  /** kebab-case; folder name in apps/docs/blocks and the registry item name. */
  name: string;
  title: string;
  description: string;
  categories: string[];
  /** Top-level keys of tenants/<id>/content.json this block reads. */
  contentKeys: string[];
}

export const BLOCKS: readonly BlockInfo[] = blocksJson;

export function getBlock(name: string): BlockInfo | undefined {
  return BLOCKS.find((b) => b.name === name);
}

export interface BlockFile {
  /** File name, e.g. "settings.module.css". */
  name: string;
  lang: 'tsx' | 'ts' | 'css';
  source: string;
}

const BLOCKS_DIR = path.join(/*turbopackIgnore: true*/ DOCS_ROOT, 'blocks');
const FILE_ORDER = ['.tsx', '.module.css', '.content.ts'];
const rank = (file: string) => {
  const i = FILE_ORDER.findIndex((ext) => file.endsWith(ext));
  return i === -1 ? FILE_ORDER.length : i;
};

/** The block's files in reading order: component, styles, content. */
export function getBlockFiles(name: string): BlockFile[] {
  const dir = path.join(/*turbopackIgnore: true*/ BLOCKS_DIR, name);
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => /\.(tsx|ts|css)$/.test(f))
    .sort((a, b) => rank(a) - rank(b) || a.localeCompare(b))
    .map((f) => ({
      name: f,
      lang: f.endsWith('.css') ? 'css' : f.endsWith('.tsx') ? 'tsx' : 'ts',
      source: readFileSync(path.join(/*turbopackIgnore: true*/ dir, f), 'utf8'),
    }));
}

export interface BlockTenant {
  id: string;
  name: string;
  locale: string;
  dir: 'ltr' | 'rtl';
}

export function getBlockTenants(): BlockTenant[] {
  return getTenants().map((t) => ({ id: t.id, name: t.name, locale: t.locale, dir: t.dir }));
}

/**
 * Sample copy a block ships for the docs tenants, keyed by block then tenant id. It fills keys a tenant's
 * content.json doesn't carry (benefits-overview's copy lives with the block, not in every content.json).
 */
const BLOCK_TENANT_COPY: Record<string, Record<string, Record<string, unknown>>> = {
  'benefits-overview': benefitsOverviewTenantCopy,
  portfolio: portfolioTenantCopy,
};

/**
 * Each tenant's content for one block: only the keys the block reads, so a page ships a few KB per tenant
 * instead of every section of every content.json. Tenants without content.json are skipped.
 */
export function getBlockContents(block: BlockInfo): Record<string, Record<string, unknown>> {
  const out: Record<string, Record<string, unknown>> = {};
  for (const tenant of getTenants()) {
    const raw = readRepoFile('tenants', tenant.id, 'content.json');
    if (!raw) continue;
    const content = { ...BLOCK_TENANT_COPY[block.name]?.[tenant.id], ...(JSON.parse(raw) as Record<string, unknown>) };
    const picked: Record<string, unknown> = {};
    for (const key of block.contentKeys) if (key in content) picked[key] = content[key];
    out[tenant.id] = picked;
  }
  return out;
}

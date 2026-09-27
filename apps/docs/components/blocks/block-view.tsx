'use client';

import { ThemeScope } from '@strata/react';
import { useSearchParams } from 'next/navigation';
import { BLOCK_COMPONENTS } from './block-components';
import type { BlockTenant } from './block-data';
import styles from './block-view.module.css';

export interface BlockViewProps {
  name: string;
  tenants: BlockTenant[];
  contents: Record<string, Record<string, unknown>>;
}

/**
 * A block alone, as the page: /blocks/<name>/view?tenant=<id>&scheme=light|dark. Without `scheme` it follows
 * the site's scheme. The page is static; the query is read on the client (inside a Suspense boundary).
 */
export function BlockView({ name, tenants, contents }: BlockViewProps) {
  const params = useSearchParams();
  const tenantParam = params.get('tenant');
  // ?tenant=house shows the block in the site's own brand with the block's sample copy (house has no content.json).
  const tenant =
    tenantParam === HOUSE_TENANT.id ? HOUSE_TENANT : (tenants.find((t) => t.id === tenantParam) ?? tenants[0]);
  const schemeParam = params.get('scheme');
  const scheme = schemeParam === 'light' || schemeParam === 'dark' ? schemeParam : 'site';
  const Block = BLOCK_COMPONENTS[name];
  return (
    <ThemeScope theme={tenant?.id} data-strata-scheme={scheme} locale={tenant?.locale} className={styles.scope}>
      {Block && <Block content={tenant ? contents[tenant.id] : undefined} headingLevel={1} />}
    </ThemeScope>
  );
}

const HOUSE_TENANT: BlockTenant = { id: 'house', name: 'House', locale: 'en-US', dir: 'ltr' };

/** Rendered into the static HTML until the query is known: the page canvas, so there is no flash of site chrome. */
export function BlockViewFallback() {
  return <div className={styles.fallback} />;
}

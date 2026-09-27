'use client';

/**
 * The live parts of /docs/color. One tenant choice is shared by every live region on the page (a tiny store,
 * so picking Qamar in one picker updates the swatches, the matrix specimens and the do/don't pairs together).
 * `?tenant=<id>` in the URL preselects one, which is how the axe and screenshot scripts load Vela or Qamar.
 * The scheme is never chosen here: regions use data-strata-scheme="site" and follow the site's light/dark.
 */
import { ThemeScope, ToggleButton, ToggleButtonGroup } from '@strata/react';
import { useSyncExternalStore, type ReactNode } from 'react';
import type { LiveTenant, RoleHexes } from './data';
import styles from './color-usage.module.css';

let current: string | undefined;
const listeners = new Set<() => void>();

function readUrl(): string | undefined {
  return new URLSearchParams(window.location.search).get('tenant') ?? undefined;
}

const store = {
  subscribe(fn: () => void) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },
  set(id: string) {
    current = id;
    const url = new URL(window.location.href);
    url.searchParams.set('tenant', id);
    window.history.replaceState(window.history.state, '', url);
    listeners.forEach((fn) => fn());
  },
};

function useTenant(tenants: LiveTenant[]): LiveTenant | undefined {
  const id = useSyncExternalStore(
    store.subscribe,
    () => current ?? readUrl() ?? tenants[0]?.id,
    () => tenants[0]?.id,
  );
  return tenants.find((t) => t.id === id) ?? tenants[0];
}

/** Tenant dots with the current name beside them. Every picker on the page drives the same choice. */
export function TenantPicker({ tenants, label = 'Live examples in' }: { tenants: LiveTenant[]; label?: string }) {
  const tenant = useTenant(tenants);
  return (
    <div className={styles.picker}>
      <span className={styles.pickerLabel} aria-hidden="true">
        {label}
      </span>
      <ToggleButtonGroup
        aria-label={`${label}: tenant`}
        size="sm"
        disallowEmptySelection
        selectedKeys={tenant ? [tenant.id] : []}
        onSelectionChange={(keys) => {
          const [next] = keys;
          if (next != null) store.set(String(next));
        }}
        className={styles.pickerGroup}
      >
        {tenants.map((t) => (
          <ToggleButton key={t.id} id={t.id} className={styles.pickerToggle}>
            <span className={styles.pickerDot} data-strata-theme={t.id} aria-hidden="true" />
            {t.name}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
    </div>
  );
}

/**
 * A region themed by the picked tenant, following the site's scheme. RTL tenants (Qamar) get their locale,
 * so direction flips exactly as it would in the product.
 */
export function LiveScope({
  tenants,
  children,
  className,
  label,
  surface = 'default',
  direction = 'tenant',
}: {
  tenants: LiveTenant[];
  children: ReactNode;
  className?: string;
  /** Names the region for assistive tech, e.g. "Surface roles, live". */
  label?: string;
  /** The role the region itself paints. */
  surface?: 'default' | 'none';
  /**
   * `tenant`: the tenant's locale and direction (specimens, so Qamar lays out right to left).
   * `page`: colours only; the region keeps the page's English and direction (role lists, captions).
   */
  direction?: 'tenant' | 'page';
}) {
  const tenant = useTenant(tenants);
  return (
    <ThemeScope
      theme={tenant?.id}
      data-strata-scheme="site"
      locale={direction === 'tenant' ? tenant?.locale : undefined}
      className={[styles.live, className].filter(Boolean).join(' ')}
      data-surface={surface}
      {...(label ? { role: 'group', 'aria-label': label } : {})}
    >
      {children}
    </ThemeScope>
  );
}

/** The picked tenant's name, inline ("Showing Vela"). */
export function TenantName({ tenants }: { tenants: LiveTenant[] }) {
  return <>{useTenant(tenants)?.name}</>;
}

/** A role's hex in the picked tenant; both schemes are rendered and CSS shows the site's current one. */
export function RoleHex({ tenants, hexes }: { tenants: LiveTenant[]; hexes: RoleHexes }) {
  const tenant = useTenant(tenants);
  const h = tenant ? hexes[tenant.id] : undefined;
  if (!h) return null;
  return (
    <span className={styles.hex} dir="ltr">
      <span className={styles.onLight}>{h.light}</span>
      <span className={styles.onDark}>{h.dark}</span>
    </span>
  );
}

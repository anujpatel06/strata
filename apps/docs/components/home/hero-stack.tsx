'use client';

/**
 * The hero's right half: one real tenant card, two more fanned behind it, and the chips that switch them.
 *
 * This is the page's brand control now. The showcase below used to carry it, and still reads it — see
 * home-stage.tsx for why the pick lives on the stage rather than in whichever component draws the buttons.
 *
 * The front card is a real `TenantCard` inside a real `ThemeScope`, the same component the brand rail renders
 * further down. That matters: the caption under it says only brand.json and content.json changed, and a picture
 * of a card would make that a claim rather than a demonstration.
 *
 * The two behind are the same component with other tenants' content, and they are decoration. They carry
 * `inert`, so their buttons are not focus stops and a screen reader never reaches them — a fanned stack is a
 * visual idea, and three dashboards in the reading order before the page's first heading is not.
 */

import { ThemeScope, ToggleButton, ToggleButtonGroup } from '@syntara/react';
import { useMemo, type Key } from 'react';
import type { TenantOverview } from './home-data';
import { TenantCard } from './tenant-card';
import { useStagePick } from './home-stage';
import styles from './hero-stack.module.css';

const firstKey = (keys: Set<Key>): string | undefined => {
  const [k] = keys;
  return k == null ? undefined : String(k);
};

export interface HeroStackProps {
  /** The real tenants, in brief order. The house brand is not among them: it is the site's own chrome. */
  tenants: TenantOverview[];
  /** id → primary hex, for the chips' dots. Read from brand.json, never written down here. */
  swatches: Readonly<Record<string, string>>;
}

export function HeroStack({ tenants, swatches }: HeroStackProps) {
  const [pick, setPick] = useStagePick(tenants[0]?.id ?? 'vela');

  /*
   * The pick can be a brand that has no card of its own — 'house', or the "Your colour" theme the showcase
   * generates from the hex field. The front card then keeps the first tenant's *content* and wears the picked
   * *theme*: the card is a demonstration of the tokens, and the copy is not what is being demonstrated.
   */
  const front = tenants.find((t) => t.id === pick) ?? tenants[0];
  const behind = useMemo(() => {
    if (!front) return [];
    const rest = tenants.filter((t) => t.id !== front.id);
    const start = tenants.indexOf(front);
    /* The two that follow the front one, wrapping — so the fan changes with the pick instead of always showing
       the same two brands behind whatever is in front. */
    return [rest[start % rest.length], rest[(start + 1) % rest.length]].filter(
      (t): t is TenantOverview => t != null,
    );
  }, [tenants, front]);

  if (!front) return null;

  return (
    <div className={styles.root}>
      <div className={styles.stack}>
        {behind.map((t, i) => (
          <div key={t.id} className={styles.behind} data-slot={i === 0 ? 'start' : 'end'} aria-hidden inert>
            <ThemeScope theme={t.id} data-syntara-scheme="site" locale={t.locale} className={styles.scope}>
              <TenantCard tenant={t} level={3} />
            </ThemeScope>
          </div>
        ))}
        <div className={styles.front}>
          <ThemeScope theme={pick} data-syntara-scheme="site" locale={front.locale} className={styles.scope}>
            <TenantCard tenant={front} level={2} />
          </ThemeScope>
        </div>
      </div>

      <ToggleButtonGroup
        aria-label="Brand"
        size="sm"
        selectedKeys={[pick]}
        disallowEmptySelection
        onSelectionChange={(keys) => {
          const key = firstKey(keys);
          if (key) setPick(key);
        }}
        className={styles.chips}
      >
        {tenants.map((t) => (
          <ToggleButton key={t.id} id={t.id} className={styles.chip}>
            <span className={styles.dot} style={{ backgroundColor: swatches[t.id] }} aria-hidden />
            {t.name}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>

      {/*
        Names the tenant, not its industry. The industry reads from that tenant's own content.json and is
        written in that tenant's language — Qamar's is Arabic, Haat's is Devanagari — so the mockup's "the same
        card for a neobank" came out as "the same card for a بقالة ومكافآت", an English sentence with a
        right-to-left phrase spliced into it. The brand names are Latin in every tenant.

        aria-live, because the words change when the chips do.
      */}
      <p className={styles.caption} aria-live="polite">
        The same card, in {front.name}’s brand. Only <code className={styles.file}>brand.json</code> and{' '}
        <code className={styles.file}>content.json</code> changed.
      </p>
    </div>
  );
}

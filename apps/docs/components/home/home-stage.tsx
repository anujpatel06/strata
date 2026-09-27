'use client';

/**
 * The homepage "stage": the hero and the live showcase share one piece of state, the brand picked in the
 * showcase toolbar. The hero's colour glow and its one coloured word follow that pick, so switching tenants
 * re-lights the whole top of the page, not just the grid.
 *
 * Both read the tenant's tokens by carrying its data-strata-theme attribute (the tenant CSS, and the
 * "Your colour" stylesheet the showcase injects, are already on the page). data-strata-scheme="site" makes them
 * follow the site's light/dark, whatever the showcase's own scheme toggle says, because they sit on the site canvas.
 */

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import styles from './home-stage.module.css';

interface StageState {
  /** data-strata-theme id the glow reads its colours from. */
  glow: string;
  /** data-strata-theme id the headline accent reads text.brand from. Only ids whose text.brand passes on the house canvas. */
  accent: string;
}

interface StageContext extends StageState {
  publish: (next: StageState) => void;
}

const Ctx = createContext<StageContext | null>(null);

/** The showcase calls this to tell the hero what's selected. A no-op outside a HomeStage. */
export function usePublishStage(): StageContext['publish'] {
  return useContext(Ctx)?.publish ?? noop;
}
const noop = () => {};

export function HomeStage({ initialTheme, children }: { initialTheme: string; children: ReactNode }) {
  const [state, setState] = useState<StageState>({ glow: initialTheme, accent: initialTheme });
  const publish = useCallback(
    (next: StageState) => setState((p) => (p.glow === next.glow && p.accent === next.accent ? p : next)),
    [],
  );
  const value = useMemo(() => ({ ...state, publish }), [state, publish]);
  return (
    <Ctx.Provider value={value}>
      <div className={styles.stage}>{children}</div>
    </Ctx.Provider>
  );
}

/**
 * The hero's atmosphere: soft fields of the tenant's primary and accent colours, drifting very slowly.
 * Decorative only (aria-hidden, no pointer events). See home-stage.module.css for the contrast budget.
 */
export function HeroGlow() {
  const glow = useContext(Ctx)?.glow;
  return (
    <div aria-hidden className={styles.glow} data-strata-theme={glow} data-strata-scheme={glow ? 'site' : undefined}>
      <span className={styles.glowPrimary} />
      <span className={styles.glowAccent} />
      <span className={styles.glowFlank} />
    </div>
  );
}

/** The one coloured phrase in the headline, in the selected tenant's text.brand. */
export function HeroAccent({ className, children }: { className?: string; children: ReactNode }) {
  const accent = useContext(Ctx)?.accent;
  return (
    <span className={className} data-strata-theme={accent} data-strata-scheme={accent ? 'site' : undefined}>
      {children}
    </span>
  );
}

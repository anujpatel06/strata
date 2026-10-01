'use client';

/**
 * The homepage "stage": the brand picked in the hero, and everything on the page that follows it.
 *
 * The pick lives here rather than in whichever component draws the control, because two of them now read it and
 * one of them sets it. The hero's chips set it; the hero's glow, its coloured word, its buttons, its card stack
 * and the showcase grid further down all read it. The showcase used to own the chips and publish the result
 * upward, which worked while it was the only picker — the hero is the picker now, and the showcase keeps only
 * the two controls the hero does not have: the hex field and light/dark.
 *
 * Both read the tenant's tokens by carrying its data-syntara-theme attribute (the tenant CSS, and the
 * "Your colour" stylesheet the showcase injects, are already on the page). data-syntara-scheme="site" makes them
 * follow the site's light/dark, whatever the showcase's own scheme toggle says, because they sit on the site canvas.
 *
 * The toolbar's Light/Dark is shared too, by the brand rail further down the page. The rail is not re-branded by
 * the pick — each card is deliberately a different brand, which is the whole point of that section — but it used
 * to ignore the toolbar's scheme entirely and follow the site's, so pressing Light left it dark.
 */

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { ThemeScope } from '@syntara/react';
import { ButtonLink } from '@/components/page/button-link';
import styles from './home-stage.module.css';

/** 'site' follows the page's own light/dark; the other two pin it. */
export type StageScheme = 'site' | 'light' | 'dark';

interface StageState {
  /**
   * The brand picked in the toolbar, as a data-syntara-theme id, with nothing withheld. Read by everything whose
   * colours are safe in any tenant: the glow, and any surface wearing a solved fill/label pair. `accent` and
   * `buttons` below are the same pick, downgraded to 'house' where that particular use would not hold up.
   */
  selected: string;
  /** data-syntara-theme id the headline accent reads text.brand from. Only ids whose text.brand passes on the house canvas. */
  accent: string;
  /** Light/dark as chosen in the showcase toolbar. */
  scheme: StageScheme;
  /**
   * data-syntara-theme id the hero's two call-to-action buttons wear. Only ids whose primary fill stays visible
   * on the house band; the showcase falls it back to 'house' otherwise.
   */
  buttons: string;
}

interface StageContext extends StageState {
  publish: (next: StageState) => void;
  /** The raw pick, as set by whatever control the reader touched. The source of truth for the whole page. */
  pick: string;
  setPick: (id: string) => void;
}

const Ctx = createContext<StageContext | null>(null);

/**
 * The showcase calls this to hand back what it derived from the pick — which ids are safe for the headline's
 * accent and for the hero's buttons, and the scheme. It knows, because it is the one holding the theme engine.
 * A no-op outside a HomeStage.
 */
export function usePublishStage(): StageContext['publish'] {
  return useContext(Ctx)?.publish ?? noop;
}
const noop = () => {};

/** The brand the reader picked, and the setter the hero's chips call. */
export function useStagePick(fallback: string): [string, (id: string) => void] {
  const ctx = useContext(Ctx);
  return [ctx?.pick ?? fallback, ctx?.setPick ?? noop];
}

export function HomeStage({ initialTheme, children }: { initialTheme: string; children: ReactNode }) {
  const [pick, setPick] = useState(initialTheme);
  const [state, setState] = useState<StageState>({
    selected: initialTheme,
    accent: initialTheme,
    scheme: 'site',
    buttons: initialTheme,
  });
  const publish = useCallback(
    (next: StageState) =>
      setState((p) =>
        p.selected === next.selected &&
        p.accent === next.accent &&
        p.scheme === next.scheme &&
        p.buttons === next.buttons
          ? p
          : next,
      ),
    [],
  );
  const value = useMemo(() => ({ ...state, publish, pick, setPick }), [state, publish, pick]);
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
  const glow = useContext(Ctx)?.selected;
  return (
    <div aria-hidden className={styles.glow} data-syntara-theme={glow} data-syntara-scheme={glow ? 'site' : undefined}>
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
    <span className={className} data-syntara-theme={accent} data-syntara-scheme={accent ? 'site' : undefined}>
      {children}
    </span>
  );
}

/**
 * A tenant card's theme scope in the brand rail. The theme is the card's own — the rail shows every brand at
 * once and that is its argument — but the light/dark follows the showcase toolbar, so one Light press changes
 * the whole page rather than only the grid beside the button.
 *
 * Outside a HomeStage (or before the showcase has published anything) it falls back to 'site', which is exactly
 * what the rail did before, so nothing depends on this provider existing.
 */
export function TenantScope({
  theme,
  locale,
  className,
  children,
}: {
  theme: string;
  locale?: string;
  className?: string;
  children: ReactNode;
}) {
  const scheme = useContext(Ctx)?.scheme ?? 'site';
  const schemeProps =
    scheme === 'site' ? ({ 'data-syntara-scheme': 'site' } as Record<string, string>) : { scheme };
  return (
    <ThemeScope theme={theme} locale={locale} className={className} {...schemeProps}>
      {children}
    </ThemeScope>
  );
}

/**
 * The hero's two calls to action, in the selected tenant's colours. "Get started" used to be grey whatever was
 * picked, because the site runs on the house theme and the house primary is #18181B: on a dark canvas the solver
 * has to lift a near-black fill to #4a4a4e just to keep it visible (2.20:1 against a 2.2 minimum), so the page's
 * own button sat there in grey while everything around it glowed.
 *
 * A fragment, not a wrapper: the two links stay direct children of .heroActions, so the flex row and the
 * nth-child rules that stagger their entrance are untouched.
 */
export function HeroButtons({
  primary,
  secondary,
}: {
  primary: { href: string; label: string };
  /** Optional: the hero runs one button beside the install command, the closing call to action runs two. */
  secondary?: { href: string; label: string };
}) {
  const theme = useContext(Ctx)?.buttons;
  return (
    <>
      <ButtonLink href={primary.href} variant="primary" size="lg" theme={theme}>
        {primary.label}
      </ButtonLink>
      {secondary && (
        <ButtonLink href={secondary.href} variant="outline" size="lg" theme={theme}>
          {secondary.label}
        </ButtonLink>
      )}
    </>
  );
}

/**
 * A card painted in the selected brand's own fill — the two coloured cards in the agents section.
 *
 * Safe in any tenant without a check, unlike the hero's buttons: these faces use a solved pair
 * (action.primary.bg with action.primary.fg, accent.bg with accent.fg), so the words on them are the engine's
 * answer for that fill rather than a colour chosen here. What the pick fixes is that the house brand is
 * #18181B and house has no accent at all, so both cards resolved to the same grey — two cards designed to
 * differ, painted the same colour.
 *
 * Scheme stays 'site': these are the site explaining itself, not a component preview, so they follow the page's
 * light/dark rather than the toolbar's (which is what the brand rail follows).
 */
export function BrandFace({ className, children }: { className?: string; children: ReactNode }) {
  const theme = useContext(Ctx)?.selected;
  return (
    <article className={className} data-syntara-theme={theme} data-syntara-scheme="site">
      {children}
    </article>
  );
}

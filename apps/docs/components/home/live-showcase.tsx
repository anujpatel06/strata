'use client';

/**
 * The homepage's live showcase: pick a tenant (or type any colour), flip light/dark, and the whole grid
 * re-skins. Tenants switch by attribute (their CSS is already on the page); "Your colour" runs the theme
 * engine in the browser and injects the result as a scoped stylesheet, so overlays opened from the grid
 * (Select popovers) get the same tokens when they copy the scope's attributes (ADR-012).
 */

import { IconArrowRight, IconMoon, IconShieldCheck, IconSun } from '@syntara/icons';
import { Switch, ThemeScope, ToggleButton, ToggleButtonGroup } from '@syntara/react';
import { TYPE_PAIRS, contrastRatio, generateTheme, toCSS, toCssVariables, type BrandInput, type Theme } from '@syntara/theme-engine';
import Link from 'next/link';
import { useEffect, useMemo, useRef, useState, type Key } from 'react';
import { ColorControl } from '@/components/themes/color-control';
import { parseHex } from '@/components/themes/state';
import { ShowcaseGrid } from '@/components/showcase/showcase-grid';
import type { HomeTenant } from './home-data';
import { ComponentNames } from './component-names';
import { usePublishStage, useStagePick } from './home-stage';
import { useSiteScheme } from './use-site-scheme';
import styles from './live-showcase.module.css';

const CUSTOM = 'custom';
/** data-syntara-theme id for "Your colour". Scoped to this page's stylesheet. */
const CUSTOM_THEME_ID = 'home-yours';
/** The visible label for the colour field, rendered inline so the toolbar stays one row on a wide screen. */
const COLOUR_LABEL_ID = 'home-brand-colour-label';
const DEFAULT_CUSTOM = '#0ea5e9';

type SchemeChoice = 'site' | 'light' | 'dark';

const firstKey = (keys: Set<Key>): string | undefined => {
  const [k] = keys;
  return k == null ? undefined : String(k);
};

/** Colour + shadow variables of the dark scheme, for scopes that follow the site (data-syntara-scheme="site"). */
function followSiteCss(theme: Theme, selector: string): string {
  const vars = toCssVariables(theme, 'dark');
  const body = Object.entries(vars)
    .filter(([name]) => name.startsWith('--syntara-color-') || name.startsWith('--syntara-shadow-'))
    .map(([name, value]) => `${name}:${value};`)
    .join('');
  const scope = `${selector}[data-syntara-scheme="site"]`;
  return (
    `:root[data-syntara-scheme="dark"] ${scope}{color-scheme:dark;${body}}` +
    `@media (prefers-color-scheme: dark){:root[data-syntara-scheme="auto"] ${scope}{color-scheme:dark;${body}}}`
  );
}

/** Per-channel sRGB mix of two #rrggbb colours: `t` of `b` into `a`. */
function mixHex(a: string, b: string, t: number): string {
  const ch = (h: string, i: number) => parseInt(h.slice(1 + i * 2, 3 + i * 2), 16);
  return `#${[0, 1, 2]
    .map((i) => Math.round(ch(a, i) * (1 - t) + ch(b, i) * t).toString(16).padStart(2, '0'))
    .join('')}`;
}

/**
 * How much of the brand's primary and accent the hero glow adds to the band under the headline, per scheme.
 * This is an approximation that decides one thing: whether the hero may wear the selected brand's text.brand at
 * all. It is deliberately pessimistic, so it can only ever withhold a colour that would have passed — never show
 * one that fails.
 *
 * These two numbers per scheme were calibrated against pixel measurements of the older hero, when the headline
 * sat on `surface.canvas` rather than on the banner band. Nothing in the repo re-checks them against the band, so
 * treat them as a pessimistic estimate, not a measurement. If the glow's strengths, positions, --_k steps or the
 * band's surface role change, check the headline against each tenant and scheme before trusting them again.
 */
const GLOW_TINT = { light: { primary: 0.12, accent: 0.04 }, dark: { primary: 0.3, accent: 0.15 } } as const;

/** AA for the headline's size. Ratios are never rounded up, here or in the copy: 4.49 fails. */
const HERO_MIN = 4.5;
/**
 * What a solid button fill needs against what is behind it to read as a button rather than a hole. Neither is a
 * WCAG number — WCAG 1.4.11 does not require a fill to contrast with its surroundings when the label carries the
 * meaning. Both are the engine's own heuristics (packages/theme-engine/src/roles.ts, `DARK_VISIBILITY_MIN` and
 * `OUTLINE_MIN`), repeated here because they are not exported.
 *
 * They differ per scheme because the engine treats the two cases differently: in dark it lifts a fill that falls
 * under 2.2, while in light it leaves the fill alone and gives the button a border instead, which is why a pale
 * fill like Qamar's amber (2.03:1 on the band) is still findable in light and does not need withholding here.
 */
const BUTTON_MIN = { light: 1.5, dark: 2.2 } as const;
const floor2 = (n: number) => (Math.floor(n * 100) / 100).toFixed(2);

/**
 * How a theme's text.brand reads on the site's hero, per scheme. The hero sets "Every brand." in the selected
 * brand's text.brand on the *house* banner band under the glow, while the solver only promised 4.5:1 against the
 * brand's own canvas, so we measure again here before handing the colour to the hero.
 *
 * The base is `surface.default`, not `surface.canvas`: the hero is a banner band now (sections.module.css
 * `.hero::before`) and that is the colour painted behind the headline. The two differ in both schemes — n(1) vs
 * n(2) in light, n(2) vs n(1) in dark — so reading the canvas here would measure a surface that is no longer
 * under the words.
 *
 * Returns the ratios rather than a verdict, because the shortfall is shown to the reader: a colour that cannot make
 * the headline is a fact about that colour, and the page used to swap in the house ink without saying so.
 */
function heroBrandTextContrast(theme: Theme, house: Theme): { scheme: 'light' | 'dark'; ratio: number }[] {
  return (['light', 'dark'] as const).map((scheme) => {
    const roles = theme.schemes[scheme].roles;
    return { scheme, ratio: contrastRatio(roles['text.brand'].hex, heroBackdrop(theme, house, scheme)) };
  });
}

/** The colour behind the hero's words: the house band, tinted by this theme's glow. */
function heroBackdrop(theme: Theme, house: Theme, scheme: 'light' | 'dark'): string {
  const roles = theme.schemes[scheme].roles;
  const band = house.schemes[scheme].roles['surface.default'].hex;
  return mixHex(
    mixHex(band, roles['action.primary.bg'].hex, GLOW_TINT[scheme].primary),
    roles['accent.bg'].hex,
    GLOW_TINT[scheme].accent,
  );
}

/**
 * Whether this theme's primary button stays findable as a shape on the hero's band, in both schemes.
 *
 * The engine already promised the fill against the *brand's own* canvas; the hero stands it on the house band
 * instead, so it is checked again here — the same reason the headline's colour is.
 *
 * Measured against the bare band, with the glow left out, and that is deliberate. The glow is mixed from this
 * theme's own `action.primary.bg`, so folding it in compares a colour against a backdrop made partly of itself:
 * the stronger the glow, the closer the ratio drives to 1:1, and every brand fails however visible it plainly
 * is. (A first version of this did exactly that and withheld all seven.) What the glow actually costs is a soft
 * blend at the button's edge where the two agree in hue — an aesthetic effect, not a findability failure, and the
 * label inside is a solver-checked pair against the fill either way.
 */
function heroButtonsVisible(theme: Theme, house: Theme): boolean {
  return (['light', 'dark'] as const).every(
    (scheme) =>
      contrastRatio(
        theme.schemes[scheme].roles['action.primary.bg'].hex,
        house.schemes[scheme].roles['surface.default'].hex,
      ) >= BUTTON_MIN[scheme],
  );
}

export interface LiveShowcaseProps {
  tenants: HomeTenant[];
  /** slug → title for every component in packages/react/meta; the "Component names" overlay labels only these. */
  components: Readonly<Record<string, string>>;
}

export function LiveShowcase({ tenants, components }: LiveShowcaseProps) {
  /* The pick is the hero's, held on the stage. This component reads it and reports back what it derived; it no
     longer draws the chips, because the hero does. */
  const [selected, setSelected] = useStagePick(tenants[0]?.id ?? 'house');
  const [schemeChoice, setSchemeChoice] = useState<SchemeChoice>('site');
  const [customHex, setCustomHex] = useState(DEFAULT_CUSTOM);
  const siteScheme = useSiteScheme();
  const effectiveScheme = schemeChoice === 'site' ? siteScheme : schemeChoice;

  const tenant = tenants.find((t) => t.id === selected);
  const isCustom = selected === CUSTOM;

  const customBrand: BrandInput = useMemo(
    () => ({ name: 'Your colour', primary: customHex, neutral: 'neutral', shape: 'soft', typePair: 'modern', density: 'comfortable' }),
    [customHex],
  );
  // Tenant themes are already on the page as CSS; they're generated here only for the solver summary.
  const theme = useMemo(() => generateTheme(isCustom ? customBrand : (tenant?.brand ?? customBrand)), [isCustom, customBrand, tenant]);
  const customCss = useMemo(() => {
    const selector = `[data-syntara-theme="${CUSTOM_THEME_ID}"]`;
    const t = isCustom ? theme : generateTheme(customBrand);
    return toCSS(t, { selector }) + '\n' + followSiteCss(t, selector);
  }, [isCustom, theme, customBrand]);

  /**
   * The colour the field shows: the selected brand's own primary, not a separate custom slot. The field used to
   * hold one colour whatever was selected, so picking Qamar left it reading the default sky blue — it looked like
   * the active colour and was not. Editing it from any brand starts "Your colour" at that brand's hex, so the
   * control reads as "remix this one" rather than as a slot that ignores the row above it.
   */
  const activeHex = isCustom ? customHex : (parseHex(tenant?.brand.primary) ?? customHex);
  const takeColour = (hex: string) => {
    setCustomHex(hex);
    setSelected(CUSTOM);
  };

  const scopeProps =
    schemeChoice === 'site'
      ? ({ 'data-syntara-scheme': 'site' } as Record<string, string>)
      : { scheme: schemeChoice };
  const locale = isCustom ? undefined : tenant?.locale;
  const name = isCustom ? 'Your colour' : (tenant?.name ?? '');
  const frameRef = useRef<HTMLDivElement | null>(null);
  const [showNames, setShowNames] = useState(false);
  /*
   * What the brand is made of, read off the brand rather than written down: neutral, shape, density, type pair.
   * It reads the *active* brand, so "Your colour" describes the theme being generated in the browser instead of
   * falling back to an empty string — which used to be invisible only because the brand's name sat beside it.
   */
  const spec = useMemo(() => {
    const b = isCustom ? customBrand : tenant?.brand;
    if (!b) return '';
    const pair = TYPE_PAIRS[b.typePair as keyof typeof TYPE_PAIRS];
    return [b.neutral, b.shape, b.density, pair?.label].filter(Boolean).join(' · ');
  }, [isCustom, customBrand, tenant]);
  const { checks, passed, adjustments } = theme.summary;
  const themeId = isCustom ? CUSTOM_THEME_ID : selected;

  // Hand the selection to the hero (its glow and accent word). The accent falls back to the house brand for any
  // colour whose text.brand wouldn't pass on the site canvas.
  const publish = usePublishStage();
  const houseBrand = tenants.find((t) => t.id === 'house')?.brand;
  const houseTheme = useMemo(() => (houseBrand ? generateTheme(houseBrand) : undefined), [houseBrand]);
  // The worst scheme the headline fails in, or undefined when the colour carries it in both. Undefined also when
  // the house theme is missing: the hero still falls back, but nothing is claimed about a ratio we did not measure.
  const heroShortfall = useMemo(() => {
    if (!houseTheme) return undefined;
    const failing = heroBrandTextContrast(theme, houseTheme).filter((c) => c.ratio < HERO_MIN);
    return failing.length ? failing.reduce((a, b) => (b.ratio < a.ratio ? b : a)) : undefined;
  }, [theme, houseTheme]);
  const accentOk = houseTheme != null && heroShortfall === undefined;
  /* The buttons are a separate judgement from the headline: a fill can be plainly visible while the same brand's
     text.brand is too light to set a headline in, and the reverse. */
  const buttonsOk = useMemo(
    () => houseTheme != null && heroButtonsVisible(theme, houseTheme),
    [theme, houseTheme],
  );
  useEffect(() => {
    publish({
      selected: themeId,
      accent: accentOk ? themeId : 'house',
      scheme: schemeChoice,
      buttons: buttonsOk ? themeId : 'house',
    });
  }, [publish, themeId, accentOk, buttonsOk, schemeChoice]);

  return (
    <div className={styles.root}>
      <style>{customCss}</style>
      {/*
        What is left of the toolbar: the two controls the hero's chip row does not have. The tenant chips used to
        live here too — the hero draws them now, and two rows of the same seven brands a screen apart was the
        reason for moving them rather than copying them. Editing the hex still switches to "Your colour", so that
        theme is reachable without a chip of its own.
      */}
      <div className={styles.toolbar}>
        <div className={styles.toolbarInner}>
          {/* The same control /themes uses: one field with the native picker as its swatch prefix, a visible
              label, and "Use a hex like #3D45D6" when the draft is malformed. The homepage had grown its own
              barer copy of this — two sibling controls, aria-labels only, no error message. */}
          <div className={styles.picker}>
            <span id={COLOUR_LABEL_ID} className={styles.pickerLabel}>
              Brand colour
            </span>
            <ColorControl
              label="Brand colour"
              labelledBy={COLOUR_LABEL_ID}
              value={activeHex}
              onChange={takeColour}
              className={styles.toolbarField}
            />
          </div>

          <ToggleButtonGroup
            aria-label="Colour scheme"
            size="sm"
            selectedKeys={[effectiveScheme]}
            disallowEmptySelection
            onSelectionChange={(keys) => {
              const key = firstKey(keys);
              if (key === 'light' || key === 'dark') setSchemeChoice(key);
            }}
            className={styles.scheme}
          >
            {/* The words are the accessible name now, so there is no aria-label: a label repeating the visible
                text is one more copy to keep in sync, and a label disagreeing with it is what a speech-input
                user hits when they say the word they can see. */}
            <ToggleButton id="light">
              <IconSun aria-hidden />
              Light
            </ToggleButton>
            <ToggleButton id="dark">
              <IconMoon aria-hidden />
              Dark
            </ToggleButton>
          </ToggleButtonGroup>
        </div>
      </div>

      {/*
        The frame's own header: what this brand is made of, and the switch that labels the screen with the
        component each part is. The spec is read from the brand rather than written down, so it cannot drift
        from the brand.json beside it.

        It used to open with a coloured dot and the brand's name. Both were already on the selected chip one row
        above — same dot, same word — so the two rows read as one thing said twice. The name survives in the
        solver line below, which is an aria-live region: that announcement has to say whose contrast results it
        is reporting, and a bare count would not.
      */}
      <div className={styles.caption}>
        <span className={styles.captionSpec}>{spec}</span>
        {/* Switch takes its own label as children — a wrapping <label> round it is an empty one, which axe
            flags as critical and a screen reader reads as a control with no name. */}
        <Switch isSelected={showNames} onChange={setShowNames} className={styles.namesToggle}>
          Component names
        </Switch>
      </div>

      <div className={styles.frame} ref={frameRef}>
        {/* The stage the grid floats on: the same colour field as the hero glow, fainter. Decorative. */}
        <div aria-hidden className={styles.field} data-syntara-theme={themeId} data-syntara-scheme="site" />
        <ThemeScope theme={themeId} {...scopeProps} className={styles.scope}>
          <ShowcaseGrid locale={locale} motion />
        </ThemeScope>
        <ComponentNames targetRef={frameRef} enabled={showNames} components={components} />
      </div>

      <p className={styles.solver} aria-live="polite">
        <IconShieldCheck aria-hidden className={styles.solverIcon} />
        <span>
          <span className={styles.solverName}>{name}:</span>{' '}
          <span className={styles.solverFigure}>
            {passed === checks ? `all ${passed} contrast checks pass` : `${passed} of ${checks} contrast checks pass`}
          </span>
          <span aria-hidden> · </span>
          <span className={styles.solverFigure}>
            {adjustments} automatic {adjustments === 1 ? 'adjustment' : 'adjustments'}
          </span>
          {heroShortfall && (
            <>
              <span aria-hidden> · </span>
              <span className={styles.solverNote}>
                the headline above keeps the house colour: this one reads{' '}
                <span className={styles.solverFigure}>{floor2(heroShortfall.ratio)}:1</span> on the hero in{' '}
                {heroShortfall.scheme}, and AA needs{'\u00a0'}
                {HERO_MIN}
              </span>
            </>
          )}
        </span>
        <Link href="/themes" className={styles.solverLink}>
          See why
          <IconArrowRight aria-hidden className={styles.arrow} />
        </Link>
      </p>
    </div>
  );
}

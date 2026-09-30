'use client';

/**
 * The homepage's live showcase: pick a tenant (or type any colour), flip light/dark, and the whole grid
 * re-skins. Tenants switch by attribute (their CSS is already on the page); "Your colour" runs the theme
 * engine in the browser and injects the result as a scoped stylesheet, so overlays opened from the grid
 * (Select popovers) get the same tokens when they copy the scope's attributes (ADR-012).
 */

import { IconArrowRight, IconMoon, IconShieldCheck, IconSun } from '@syntara/icons';
import { ThemeScope, ToggleButton, ToggleButtonGroup } from '@syntara/react';
import { contrastRatio, generateTheme, toCSS, toCssVariables, type BrandInput, type Theme } from '@syntara/theme-engine';
import Link from 'next/link';
import { useEffect, useMemo, useState, type Key } from 'react';
import { ColorControl } from '@/components/themes/color-control';
import { parseHex } from '@/components/themes/state';
import { ShowcaseGrid } from '@/components/showcase/showcase-grid';
import type { HomeTenant } from './home-data';
import { usePublishStage } from './home-stage';
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
 * How much of the brand's primary and accent the hero glow adds to the canvas under the headline, per scheme.
 * Calibrated against pixel measurements of the rendered hero (Vela, Harbor, Qamar at 390, 768, 1024, 1280 and
 * 1440 wide; worst pixel under "Every brand."): the model reads 0.13 to 0.35 below the screen in light and 0.9+
 * below in dark, so it errs toward falling back to the house ink. Re-calibrate if the glow in home-stage.module.css
 * changes (strengths, positions or the --_k steps).
 */
const GLOW_TINT = { light: { primary: 0.12, accent: 0.04 }, dark: { primary: 0.3, accent: 0.15 } } as const;

/** AA for the headline's size. Ratios are never rounded up, here or in the copy: 4.49 fails. */
const HERO_MIN = 4.5;
const floor2 = (n: number) => (Math.floor(n * 100) / 100).toFixed(2);

/**
 * How a theme's text.brand reads on the site's hero, per scheme. The hero sets "Every brand." in the selected
 * brand's text.brand on the *house* canvas under the glow, while the solver only promised 4.5:1 against the brand's
 * own canvas, so we measure again here before handing the colour to the hero.
 *
 * Returns the ratios rather than a verdict, because the shortfall is shown to the reader: a colour that cannot make
 * the headline is a fact about that colour, and the page used to swap in the house ink without saying so.
 */
function heroBrandTextContrast(theme: Theme, house: Theme): { scheme: 'light' | 'dark'; ratio: number }[] {
  return (['light', 'dark'] as const).map((scheme) => {
    const roles = theme.schemes[scheme].roles;
    const canvas = house.schemes[scheme].roles['surface.canvas'].hex;
    const bg = mixHex(mixHex(canvas, roles['action.primary.bg'].hex, GLOW_TINT[scheme].primary), roles['accent.bg'].hex, GLOW_TINT[scheme].accent);
    return { scheme, ratio: contrastRatio(roles['text.brand'].hex, bg) };
  });
}

export interface LiveShowcaseProps {
  tenants: HomeTenant[];
}

export function LiveShowcase({ tenants }: LiveShowcaseProps) {
  const [selected, setSelected] = useState<string>(tenants[0]?.id ?? 'house');
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
  useEffect(() => {
    publish({ glow: themeId, accent: accentOk ? themeId : 'house' });
  }, [publish, themeId, accentOk]);

  return (
    <div className={styles.root}>
      <style>{customCss}</style>
      <div className={styles.toolbar}>
        <div className={styles.toolbarInner}>
          <div className={styles.chipScroller}>
          <ToggleButtonGroup
            aria-label="Theme"
            size="sm"
            selectedKeys={[selected]}
            disallowEmptySelection
            onSelectionChange={(keys) => {
              const key = firstKey(keys);
              if (key) setSelected(key);
            }}
            className={styles.chips}
          >
            {tenants.map((t) => (
              <ToggleButton key={t.id} id={t.id} className={styles.chip}>
                <span className={styles.dot} style={{ backgroundColor: t.brand.primary }} aria-hidden />
                {t.name}
                {t.dir === 'rtl' && <span className={styles.tag}>RTL</span>}
              </ToggleButton>
            ))}
            <ToggleButton id={CUSTOM} className={styles.chip}>
              <span className={styles.dot} style={{ backgroundColor: customHex }} aria-hidden />
              Your colour
            </ToggleButton>
          </ToggleButtonGroup>
          </div>

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
            <ToggleButton id="light" aria-label="Light">
              <IconSun aria-hidden />
            </ToggleButton>
            <ToggleButton id="dark" aria-label="Dark">
              <IconMoon aria-hidden />
            </ToggleButton>
          </ToggleButtonGroup>
        </div>
      </div>

      <div className={styles.frame}>
        {/* The stage the grid floats on: the same colour field as the hero glow, fainter. Decorative. */}
        <div aria-hidden className={styles.field} data-syntara-theme={themeId} data-syntara-scheme="site" />
        <ThemeScope theme={themeId} {...scopeProps} className={styles.scope}>
          <ShowcaseGrid locale={locale} motion />
        </ThemeScope>
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

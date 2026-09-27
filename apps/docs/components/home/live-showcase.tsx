'use client';

/**
 * The homepage's live showcase: pick a tenant (or type any colour), flip light/dark, and the whole grid
 * re-skins. Tenants switch by attribute (their CSS is already on the page); "Your colour" runs the theme
 * engine in the browser and injects the result as a scoped stylesheet, so overlays opened from the grid
 * (Select popovers) get the same tokens when they copy the scope's attributes (ADR-012).
 */

import { IconArrowRight, IconMoon, IconShieldCheck, IconSun } from '@strata/icons';
import { TextField, ThemeScope, ToggleButton, ToggleButtonGroup } from '@strata/react';
import {
  contrastRatio,
  generateTheme,
  isValidHex,
  normalizeHex,
  toCSS,
  toCssVariables,
  type BrandInput,
  type Theme,
} from '@strata/theme-engine';
import Link from 'next/link';
import { useEffect, useMemo, useState, type Key } from 'react';
import { ShowcaseGrid } from '@/components/showcase/showcase-grid';
import type { HomeTenant } from './home-data';
import { usePublishStage } from './home-stage';
import { useSiteScheme } from './use-site-scheme';
import styles from './live-showcase.module.css';

const CUSTOM = 'custom';
/** data-strata-theme id for "Your colour". Scoped to this page's stylesheet. */
const CUSTOM_THEME_ID = 'home-yours';
const DEFAULT_CUSTOM = '#0ea5e9';

type SchemeChoice = 'site' | 'light' | 'dark';

const firstKey = (keys: Set<Key>): string | undefined => {
  const [k] = keys;
  return k == null ? undefined : String(k);
};

/** Colour + shadow variables of the dark scheme, for scopes that follow the site (data-strata-scheme="site"). */
function followSiteCss(theme: Theme, selector: string): string {
  const vars = toCssVariables(theme, 'dark');
  const body = Object.entries(vars)
    .filter(([name]) => name.startsWith('--strata-color-') || name.startsWith('--strata-shadow-'))
    .map(([name, value]) => `${name}:${value};`)
    .join('');
  const scope = `${selector}[data-strata-scheme="site"]`;
  return (
    `:root[data-strata-scheme="dark"] ${scope}{color-scheme:dark;${body}}` +
    `@media (prefers-color-scheme: dark){:root[data-strata-scheme="auto"] ${scope}{color-scheme:dark;${body}}}`
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

/**
 * Whether a theme's text.brand reads on the site's hero in both schemes (4.5:1, never rounded up). The hero sets
 * "Every brand." in the selected brand's text.brand on the *house* canvas under the glow, while the solver only
 * promised 4.5:1 against the brand's own canvas, so we check again here before handing the colour to the hero.
 */
function brandTextPassesOnHero(theme: Theme, house: Theme): boolean {
  return (['light', 'dark'] as const).every((s) => {
    const roles = theme.schemes[s].roles;
    const canvas = house.schemes[s].roles['surface.canvas'].hex;
    const bg = mixHex(mixHex(canvas, roles['action.primary.bg'].hex, GLOW_TINT[s].primary), roles['accent.bg'].hex, GLOW_TINT[s].accent);
    return contrastRatio(roles['text.brand'].hex, bg) >= 4.5;
  });
}

export interface LiveShowcaseProps {
  tenants: HomeTenant[];
}

export function LiveShowcase({ tenants }: LiveShowcaseProps) {
  const [selected, setSelected] = useState<string>(tenants[0]?.id ?? 'house');
  const [schemeChoice, setSchemeChoice] = useState<SchemeChoice>('site');
  const [customHex, setCustomHex] = useState(DEFAULT_CUSTOM);
  const [draft, setDraft] = useState(DEFAULT_CUSTOM);
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
    const selector = `[data-strata-theme="${CUSTOM_THEME_ID}"]`;
    const t = isCustom ? theme : generateTheme(customBrand);
    return toCSS(t, { selector }) + '\n' + followSiteCss(t, selector);
  }, [isCustom, theme, customBrand]);

  const onDraft = (value: string) => {
    setDraft(value);
    const candidate = value.trim().startsWith('#') ? value.trim() : `#${value.trim()}`;
    if (isValidHex(candidate)) {
      setCustomHex(normalizeHex(candidate));
      setSelected(CUSTOM);
    }
  };
  const draftValid = isValidHex(draft.trim().startsWith('#') ? draft.trim() : `#${draft.trim()}`);

  const scopeProps =
    schemeChoice === 'site'
      ? ({ 'data-strata-scheme': 'site' } as Record<string, string>)
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
  const accentOk = useMemo(() => (houseTheme ? brandTextPassesOnHero(theme, houseTheme) : false), [theme, houseTheme]);
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

          <div className={styles.picker}>
            <input
              type="color"
              className={styles.swatch}
              value={customHex}
              aria-label="Pick a brand colour"
              onChange={(e) => {
                setCustomHex(e.target.value);
                setDraft(e.target.value);
                setSelected(CUSTOM);
              }}
            />
            <TextField
              aria-label="Brand colour as hex"
              value={draft}
              onChange={onDraft}
              onBlur={() => {
                if (!draftValid) setDraft(customHex);
              }}
              isInvalid={!draftValid}
              spellCheck="false"
              autoComplete="off"
              className={styles.hex}
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
        <div aria-hidden className={styles.field} data-strata-theme={themeId} data-strata-scheme="site" />
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
        </span>
        <Link href="/themes" className={styles.solverLink}>
          See why
          <IconArrowRight aria-hidden className={styles.arrow} />
        </Link>
      </p>
    </div>
  );
}

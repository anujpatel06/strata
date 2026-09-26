'use client';

/**
 * The homepage's live showcase: pick a tenant (or type any colour), flip light/dark, and the whole grid
 * re-skins. Tenants switch by attribute (their CSS is already on the page); "Your colour" runs the theme
 * engine in the browser and injects the result as a scoped stylesheet, so overlays opened from the grid
 * (Select popovers) get the same tokens when they copy the scope's attributes (ADR-012).
 */

import { IconArrowRight, IconMoon, IconShieldCheck, IconSun } from '@tabler/icons-react';
import { TextField, ThemeScope, ToggleButton, ToggleButtonGroup } from '@strata/react';
import {
  generateTheme,
  isValidHex,
  normalizeHex,
  toCSS,
  toCssVariables,
  type BrandInput,
  type Theme,
} from '@strata/theme-engine';
import Link from 'next/link';
import { useMemo, useState, type Key } from 'react';
import { ShowcaseGrid } from '@/components/showcase/showcase-grid';
import type { HomeTenant } from './home-data';
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
    () => ({ name: 'Your colour', primary: customHex, neutral: 'neutral', shape: 'soft', typePair: 'precise', density: 'comfortable' }),
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
              <IconSun aria-hidden stroke={1.75} />
            </ToggleButton>
            <ToggleButton id="dark" aria-label="Dark">
              <IconMoon aria-hidden stroke={1.75} />
            </ToggleButton>
          </ToggleButtonGroup>
        </div>
      </div>

      <div className={styles.frame}>
        <ThemeScope theme={isCustom ? CUSTOM_THEME_ID : selected} {...scopeProps} className={styles.scope}>
          <ShowcaseGrid locale={locale} />
        </ThemeScope>
      </div>

      <p className={styles.solver} aria-live="polite">
        <IconShieldCheck aria-hidden stroke={1.75} className={styles.solverIcon} />
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
          <IconArrowRight aria-hidden stroke={1.75} className={styles.arrow} />
        </Link>
      </p>
    </div>
  );
}

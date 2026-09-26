'use client';

import { ThemeScope } from '@strata/react';
import { toCSS, toCssVariables } from '@strata/theme-engine';
import { useDeferredValue, useMemo, type CSSProperties } from 'react';
import { ShowcaseGrid } from '@/components/showcase/showcase-grid';
import { useThemes } from './themes-provider';
import styles from './preview.module.css';

/**
 * data-strata-theme id of the live preview. The wrapper gets the theme inline (toCssVariables), which is instant
 * and covers everything inside it. Overlays (dialogs, selects, tooltips) portal to <body> and copy this id when
 * they open (ADR-012), so the same theme is also written as a scoped stylesheet for them to resolve against.
 */
export const PREVIEW_THEME_ID = 'themes-live';

/**
 * The preview's React Aria locale. Right-to-left presets keep their own (Qamar renders as ar-AE, mirrored); the
 * rest use the site's en-US. The showcase copy is English and priced in dollars, and dates formatted in en-IN or
 * en-GB differ between Node's ICU and browsers' ("Wednesday, 30 September 2026" vs "Wednesday 30 September,
 * 2026"), which breaks hydration of the server-rendered preview.
 */
function previewLocale(locale: string, dir: 'ltr' | 'rtl'): string {
  return dir === 'rtl' ? locale : 'en-US';
}

export function PreviewPanel() {
  const { theme: liveTheme, state, preset } = useThemes();
  // Keep typing responsive: the preview re-renders a few dozen components, so let React defer it.
  const theme = useDeferredValue(liveTheme);
  const { scheme } = state;
  const density = theme.input.density;

  const vars = useMemo(() => toCssVariables(theme, scheme, density) as CSSProperties, [theme, scheme, density]);
  const overlayCss = useMemo(() => toCSS(theme, { selector: `[data-strata-theme="${PREVIEW_THEME_ID}"]` }), [theme]);

  return (
    <>
      <style>{overlayCss}</style>
      <ThemeScope
        theme={PREVIEW_THEME_ID}
        scheme={scheme}
        density={density}
        locale={previewLocale(preset.locale, preset.dir)}
        style={vars}
        className={styles.stage}
        role="region"
        aria-label={`${theme.input.name} theme preview, ${scheme}`}
      >
        <h2 className="visually-hidden">Live preview</h2>
        <ShowcaseGrid />
      </ThemeScope>
    </>
  );
}

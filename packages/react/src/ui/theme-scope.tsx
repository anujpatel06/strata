'use client';

import type { HTMLAttributes, JSX } from 'react';
import { I18nProvider } from 'react-aria-components';
import styles from './theme-scope.module.css';

export interface ThemeScopeProps extends HTMLAttributes<HTMLDivElement> {
  /** Tenant id whose token CSS is loaded under [data-strata-theme="<id>"]. Omit to inherit (e.g. a :root theme). */
  theme?: string;
  scheme?: 'light' | 'dark';
  /** Omit to use the tenant's default density. */
  density?: 'comfortable' | 'compact';
  /**
   * BCP 47 locale for the subtree, e.g. "ar-AE". Sets React Aria's locale (keyboard direction, date formats,
   * popover placement) and, unless you pass them, `lang` and `dir`. React Aria reads direction from the locale,
   * not from the DOM, so right-to-left regions need this.
   */
  locale?: string;
}

const RTL_LANGUAGES = new Set(['ar', 'he', 'fa', 'ur', 'ps', 'yi', 'dv', 'ku', 'sd', 'ug']);

/**
 * Applies a Strata theme to a subtree. Token CSS (from @strata/tokens or the theme engine's toCSS) keys off
 * these data attributes, which must sit on the SAME element. Overlays (dialogs, menus, toasts) portal to <body>
 * and copy these attributes from the nearest scope when they open, so they match the region they came from.
 */
export function ThemeScope({
  theme,
  scheme = 'light',
  density,
  locale,
  lang,
  dir,
  className,
  ...rest
}: ThemeScopeProps): JSX.Element {
  const language = locale?.split('-')[0]?.toLowerCase();
  const scope = (
    <div
      data-strata-theme={theme}
      data-strata-scheme={scheme}
      data-strata-density={density}
      lang={lang ?? language}
      dir={dir ?? (language ? (RTL_LANGUAGES.has(language) ? 'rtl' : 'ltr') : undefined)}
      className={[styles.scope, className].filter(Boolean).join(' ')}
      {...rest}
    />
  );
  return locale ? <I18nProvider locale={locale}>{scope}</I18nProvider> : scope;
}

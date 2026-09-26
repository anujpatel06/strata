'use client';

import type { HTMLAttributes, JSX } from 'react';
import styles from './theme-scope.module.css';

export interface ThemeScopeProps extends HTMLAttributes<HTMLDivElement> {
  /** Tenant id whose token CSS is loaded under [data-strata-theme="<id>"]. Omit to inherit (e.g. :root theme). */
  theme?: string;
  scheme?: 'light' | 'dark';
  /** Omit to use the tenant's default density. */
  density?: 'comfortable' | 'compact';
}

/**
 * Applies a Strata theme to a subtree. Token CSS (from @strata/tokens or the theme engine's toCSS) keys off
 * these data attributes, which must sit on the SAME element — that's all this component does, plus the
 * base surface, text colour and body font so the subtree renders like a page.
 */
export function ThemeScope({ theme, scheme = 'light', density, className, ...rest }: ThemeScopeProps): JSX.Element {
  return (
    <div
      data-strata-theme={theme}
      data-strata-scheme={scheme}
      data-strata-density={density}
      className={[styles.scope, className].filter(Boolean).join(' ')}
      {...rest}
    />
  );
}

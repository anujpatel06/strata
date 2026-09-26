/**
 * Server-only: the site's theme CSS, built with the same engine and exporter tenants ship with.
 *
 *   :root, [data-strata-theme="house"]   the house brand (site chrome + "House" in previews)
 *   [data-strata-theme="<tenant>"]       one block per tenant, for ThemeScope in previews
 *
 * toCSS emits light, dark, `auto` (prefers-color-scheme) and the other density for each.
 * On top, previews can follow the SITE's scheme without JavaScript: a scope with
 * data-strata-scheme="site" picks up the dark colours when <html> is dark (explicitly or via auto).
 * Only colour + elevation variables are repeated there, so density attributes keep working.
 */
import { generateTheme, googleFontsHref, toCSS, toCssVariables, type Theme } from '@strata/theme-engine';
import { cache } from 'react';
import { HOUSE_ID } from './house';
import { getHouseBrand, getTenants } from './tenants';

export interface SiteTheme {
  css: string;
  /** Google Fonts stylesheet for the house type pair (render-blocking, preconnected). */
  houseFontHref: string;
  /** Stylesheets for tenant type pairs not covered by the house pair (loaded after hydration). */
  tenantFontHrefs: string[];
}

/** Colour + elevation variables of one scheme, as a declaration list. */
function schemeDeclarations(theme: Theme, scheme: 'dark'): string {
  const vars = toCssVariables(theme, scheme);
  return Object.entries(vars)
    .filter(([name]) => name.startsWith('--strata-color-') || name.startsWith('--strata-shadow-'))
    .map(([name, value]) => `  ${name}: ${value};`)
    .join('\n');
}

function followSiteCSS(theme: Theme, id: string): string {
  const scope = `[data-strata-theme="${id}"][data-strata-scheme="site"]`;
  const body = `  color-scheme: dark;\n${schemeDeclarations(theme, 'dark')}`;
  return [
    `/* ${theme.input.name}: previews that follow the site scheme */`,
    `:root[data-strata-scheme="dark"] ${scope} {\n${body}\n}`,
    `@media (prefers-color-scheme: dark) {\n  :root[data-strata-scheme="auto"] ${scope} {\n${body.replace(/^/gm, '  ')}\n  }\n}`,
  ].join('\n');
}

export const getSiteTheme = cache((): SiteTheme => {
  const house = generateTheme(getHouseBrand());
  const parts = [toCSS(house, { selector: `:root, [data-strata-theme="${HOUSE_ID}"]` }), followSiteCSS(house, HOUSE_ID)];
  const houseFontHref = googleFontsHref(house.typePair);
  const tenantFontHrefs = new Set<string>();
  for (const tenant of getTenants()) {
    const theme = generateTheme(tenant.brand);
    parts.push(toCSS(theme, { selector: `[data-strata-theme="${tenant.id}"]` }), followSiteCSS(theme, tenant.id));
    const href = googleFontsHref(theme.typePair);
    if (href !== houseFontHref) tenantFontHrefs.add(href);
  }
  return { css: parts.join('\n'), houseFontHref, tenantFontHrefs: [...tenantFontHrefs] };
});

/** Site-wide constants. Isomorphic: safe to import from server and client components. */

/** Public origin used in copy-paste commands. Set NEXT_PUBLIC_SITE_URL in production. */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000').replace(/\/+$/, '');

export const SITE_NAME = 'Syntara';
export const SITE_DESCRIPTION =
  'A multi-brand design system that humans and AI agents build with. One React library, any brand, WCAG 2.2 AA by construction.';

export const GITHUB_URL = 'https://github.com/anujpatel06/syntara';

/** GitHub link to a file in the repo, e.g. githubBlob('docs/adr/002-headless-primitives-react-aria.md'). */
export const githubBlob = (repoPath: string): string => `${GITHUB_URL}/blob/main/${repoPath.replace(/^\/+/, '')}`;
/** GitHub link to a folder in the repo. */
export const githubTree = (repoPath: string): string => `${GITHUB_URL}/tree/main/${repoPath.replace(/^\/+/, '')}`;

export interface NavLink {
  href: string;
  label: string;
  /**
   * Shown only once the header row has room for it (min-width: 960px, the same breakpoint the search uses).
   * The row fits at 768 with 33px to spare (#38) and this label needs more than that, so without the hold-back
   * every page from 768 to 959 scrolls sideways by 26px.
   */
  wide?: true;
}

/**
 * Header navigation. Longest prefix wins for the active state, so `/docs/components` and `/docs/installation`
 * are matched before `/docs`.
 *
 * "Get started" is first and points at Installation. The header used to offer six ways to browse and none to
 * begin, which left the homepage's two small buttons as the only route in.
 */
export const MAIN_NAV: readonly NavLink[] = [
  { href: '/docs/installation', label: 'Get started', wide: true },
  { href: '/docs', label: 'Docs' },
  { href: '/docs/components', label: 'Components' },
  { href: '/blocks', label: 'Blocks' },
  { href: '/themes', label: 'Themes' },
  { href: '/colors', label: 'Colors' },
  { href: '/docs/icons', label: 'Icons' },
];

/** Returns the MAIN_NAV href that owns a pathname (longest prefix wins), or undefined. */
export function activeMainNav(pathname: string): string | undefined {
  let best: string | undefined;
  for (const { href } of MAIN_NAV) {
    if (pathname === href || pathname.startsWith(href + '/')) {
      if (!best || href.length > best.length) best = href;
    }
  }
  return best;
}

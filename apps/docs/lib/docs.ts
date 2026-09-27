/**
 * The hand-written docs pages (content/docs/*.mdx) and their order. Isomorphic: the sidebar, search,
 * breadcrumbs and prev/next links all read this list. To add a page: add an entry here and
 * content/docs/<slug>.mdx, then register the loader in lib/doc-content.ts.
 */
export type DocGroupId = 'getting-started' | 'foundations' | 'project';

export const DOC_GROUPS: ReadonlyArray<{ id: DocGroupId; label: string }> = [
  { id: 'getting-started', label: 'Getting started' },
  { id: 'foundations', label: 'Foundations' },
  { id: 'project', label: 'Project' },
];

export interface DocPage {
  /**
   * File name in content/docs without extension; "index" is /docs. A page with its own route instead of an MDX
   * file (icons: app/docs/icons/page.tsx) is listed here too, so the sidebar, search and prev/next include it.
   */
  slug: string;
  href: string;
  title: string;
  description: string;
  group: DocGroupId;
  /** Extra search terms. */
  keywords?: string;
}

export const DOC_PAGES: readonly DocPage[] = [
  {
    slug: 'index',
    href: '/docs',
    title: 'Introduction',
    description: 'A multi-brand design system: one React library, any brand, accessible by construction.',
    group: 'getting-started',
    keywords: 'overview about principles tenants',
  },
  {
    slug: 'installation',
    href: '/docs/installation',
    title: 'Installation',
    description: 'Add Strata to a React project with npm, or by copying the files.',
    group: 'getting-started',
    keywords: 'install setup npm pnpm copy manual tokens styles',
  },
  {
    slug: 'mcp',
    href: '/docs/mcp',
    title: 'MCP',
    description: 'The planned Strata MCP server for AI coding agents.',
    group: 'getting-started',
    keywords: 'mcp agents claude cursor ai model context protocol',
  },
  {
    slug: 'figma',
    href: '/docs/figma',
    title: 'Figma',
    description: 'Import Strata tokens as Figma variables: Brand, Scheme and Density collections.',
    group: 'getting-started',
    keywords: 'figma variables design collections modes',
  },
  {
    slug: 'theming',
    href: '/docs/theming',
    title: 'Theming',
    description: 'Token tiers, semantic roles, ThemeScope, and adding a tenant with one JSON file.',
    group: 'foundations',
    keywords: 'tokens css variables brand tenant theme scope roles',
  },
  {
    slug: 'color',
    href: '/docs/color',
    title: 'Using colour',
    description: 'Which colour role to use for what, the pairs the engine guarantees, and how to check your own.',
    group: 'foundations',
    keywords: 'color colour roles contrast pairs palette brand status feedback chart glass swatches do dont',
  },
  {
    slug: 'dark-mode',
    href: '/docs/dark-mode',
    title: 'Dark mode',
    description: 'Light, dark and system schemes from one attribute.',
    group: 'foundations',
    keywords: 'dark light scheme prefers-color-scheme',
  },
  {
    slug: 'rtl',
    href: '/docs/rtl',
    title: 'RTL',
    description: 'Right-to-left layouts with logical properties and React Aria locales.',
    group: 'foundations',
    keywords: 'rtl arabic direction logical properties locale',
  },
  {
    slug: 'density',
    href: '/docs/density',
    title: 'Density',
    description: 'Comfortable and compact density without changing component code.',
    group: 'foundations',
    keywords: 'density compact comfortable control height',
  },
  {
    slug: 'accessibility',
    href: '/docs/accessibility',
    title: 'Accessibility',
    description: 'WCAG 2.2 AA contrast by construction, keyboard support from React Aria.',
    group: 'foundations',
    keywords: 'a11y wcag contrast keyboard screen reader focus',
  },
  {
    slug: 'icons',
    href: '/docs/icons',
    title: 'Icons',
    description: 'Strata’s own icon set, curvy and minimal. Search it, try a size and stroke, copy an import.',
    group: 'foundations',
    keywords: 'icons svg glyphs @strata/icons stroke grid tabler lucide',
  },
  {
    slug: 'governance',
    href: '/docs/governance',
    title: 'Governance',
    description: 'Decision records, how changes get in, maturity criteria, and who decides.',
    group: 'project',
    keywords: 'adr decisions contribution rfc process maturity alpha beta stable graduation',
  },
  {
    slug: 'changelog',
    href: '/docs/changelog',
    title: 'Changelog',
    description: 'What shipped in each release.',
    group: 'project',
    keywords: 'releases versions changes',
  },
];

export function getDocPage(slug: string): DocPage | undefined {
  return DOC_PAGES.find((p) => p.slug === slug);
}

// Every route the docs site prerenders, shared by the scripts that sweep the running site so they cannot drift
// apart on which pages count as covered.
import { readdirSync } from 'node:fs';

export const TENANTS = ['vela', 'harbor', 'qamar', 'care', 'haat', 'house'];
export const BLOCKS = ['benefits-overview', 'portfolio', 'dashboard-overview', 'request-flow', 'settings', 'sign-in', 'activity-table'];

export function docsRoutes() {
  const comps = readdirSync('packages/react/meta')
    .filter((f) => f.endsWith('.meta.json'))
    .map((f) => f.replace('.meta.json', ''));
  const docs = readdirSync('apps/docs/content/docs')
    .filter((f) => f.endsWith('.mdx'))
    .map((f) => f.replace('.mdx', ''))
    .filter((s) => s !== 'index');
  return [
    '/',
    '/docs',
    '/docs/components',
    '/blocks',
    '/themes',
    '/colors',
    '/story',
    ...docs.map((d) => `/docs/${d}`),
    ...comps.map((c) => `/docs/components/${c}`),
    ...BLOCKS.flatMap((b) => TENANTS.map((t) => `/blocks/${b}/view?tenant=${t}`)),
  ];
}

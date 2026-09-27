// Checks the prerendered docs HTML for tab lists that the server rendered without a selected tab.
// Every Tabs renders one tab list and, for its selected tab, one panel. A tab list with no panel means the
// selection was not resolved on the server, and the page fails hydration (React error 418).
// Run after `pnpm --filter @strata/docs build`: node scripts/check-ssr-tabs.mjs
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';

const root = join('apps/docs', process.env.NEXT_DIST_DIR ?? '.next', 'server/app');
if (!existsSync(root)) {
  console.error(`No build at ${root}. Run: pnpm --filter @strata/docs build`);
  process.exit(1);
}
const pages = readdirSync(root, { recursive: true }).filter((f) => String(f).endsWith('.html')).map((f) => join(root, String(f)));
const count = (html, re) => (html.match(re) ?? []).length;
const failures = [];
let lists = 0;
for (const file of pages) {
  const html = readFileSync(file, 'utf8');
  const tablists = count(html, /role="tablist"/g);
  const panels = count(html, /role="tabpanel"/g);
  lists += tablists;
  if (tablists !== panels) failures.push(`${relative(root, file)}: ${tablists} tab lists, ${panels} panels`);
}
console.log(`pages: ${pages.length}; tab lists: ${lists}; pages with a tab list missing its panel: ${failures.length}`);
for (const f of failures) console.log(`  ${f}`);
process.exit(failures.length ? 1 : 0);

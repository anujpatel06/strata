// Fails when a docs page scrolls sideways on a narrow phone. CONVENTIONS.md requires every component to work at
// 320px, but nothing measured the pages themselves, and a page that scrolls sideways is not something a test or
// an axe sweep notices — it looks fine until someone holds a small phone.
//
// One fixed grid was enough to break it: the homepage pinned a stat group to two columns, each tile got 134px on a
// 320px screen, and a figure at display size has no break opportunity, so it pushed the page 26px wide.
//
// 768px is checked as well as 320px, because the widest band is not the narrowest one: the site header's desktop
// row (nav + expanded search) needed 906px but switched on at 768, so every page scrolled sideways by up to 114px
// from 768 to 881 while 320 and 1024 both passed. A width that only a tablet or a half-screen window hits is
// exactly the width nobody opens by hand.
//
// Run against the site started from the build:
//   pnpm --filter @syntara/docs start        # note the PID and kill that PID
//   node scripts/check-narrow-overflow.mjs
// SYNTARA_WIDTHS overrides the widths. The build id of the running site is checked first.
import { launchBrowser } from './launch-browser.mjs';
import { assertServedBuild } from './served-build.mjs';
import { docsRoutes } from './docs-routes.mjs';

const base = process.env.SYNTARA_BASE_URL ?? 'http://localhost:3000';
const widths = (process.env.SYNTARA_WIDTHS ?? '320,768').split(',').map(Number);
const routes = process.env.SYNTARA_ROUTES ? process.env.SYNTARA_ROUTES.split(',') : docsRoutes();
const CONCURRENCY = Number(process.env.SYNTARA_CONCURRENCY ?? 4);

const buildId = await assertServedBuild(base);
const browser = await launchBrowser();
const failures = [];
let checked = 0;

for (const width of widths) {
  const ctx = await browser.newContext({ viewport: { width, height: 844 }, reducedMotion: 'reduce' });
  // An offline machine must not look like a layout fault.
  await ctx.route('https://fonts.googleapis.com/**', (r) => r.fulfill({ status: 200, contentType: 'text/css', body: '' }));
  for (let i = 0; i < routes.length; i += CONCURRENCY) {
    await Promise.all(
      routes.slice(i, i + CONCURRENCY).map(async (route) => {
        const page = await ctx.newPage();
        try {
          await page.goto(base + route, { waitUntil: 'networkidle', timeout: 45000 });
          await page.waitForTimeout(300);
          const r = await page.evaluate(() => {
            const doc = document.documentElement;
            if (doc.scrollWidth <= doc.clientWidth + 1) return null;
            // Name the boxes that cannot hold their content. Several, deepest first: a visually-hidden heading is
            // wider than its 1px box by design and would otherwise be the only thing reported.
            const found = [];
            for (const el of document.querySelectorAll('body *')) {
              if (!(el instanceof HTMLElement)) continue;
              const over = el.scrollWidth - el.clientWidth;
              if (over <= 1 || el.clientWidth <= 1) continue;
              const ox = getComputedStyle(el).overflowX;
              if (ox === 'auto' || ox === 'scroll' || ox === 'hidden' || ox === 'clip') continue;
              let depth = 0;
              for (let p = el.parentElement; p; p = p.parentElement) depth++;
              found.push({ depth, over, cls: String(el.className).slice(0, 44), tag: el.tagName.toLowerCase() });
            }
            found.sort((a, b) => b.depth - a.depth || b.over - a.over);
            return { over: doc.scrollWidth - doc.clientWidth, found: found.slice(0, 3) };
          });
          if (r) {
            failures.push(`${width}px ${route}: page is ${r.over}px too wide`);
            for (const f of r.found) failures.push(`    cannot hold its content: ${f.tag}.${f.cls} (+${f.over}px)`);
          }
          checked++;
        } catch (e) {
          failures.push(`${width}px ${route}: load failed — ${String(e).split('\n')[0].slice(0, 90)}`);
        }
        await page.close();
      }),
    );
  }
  await ctx.close();
}
await browser.close();

console.log(`build ${buildId} at ${base}; ${routes.length} routes × ${widths.join(', ')}px; checked: ${checked}; pages scrolling sideways: ${failures.filter((f) => !f.startsWith("    ")).length}`);
for (const f of failures) console.log(`  ${f}`);
process.exit(failures.filter((f) => !f.startsWith("    ")).length ? 1 : 0);

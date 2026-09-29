import { launchBrowser } from './launch-browser.mjs';
import { AxeBuilder } from '@axe-core/playwright';
import { assertServedBuild } from './served-build.mjs';
import { docsRoutes } from './docs-routes.mjs';
// SYNTARA_BASE_URL lets the sweep run against a server on another port when 3000 is taken.
const base = process.env.SYNTARA_BASE_URL ?? 'http://localhost:3000';
const routes = docsRoutes();
// Refuse to sweep a server that is not running this build, or the result describes someone else's port.
await assertServedBuild(base);
const browser = await launchBrowser();
const summary = {};
let total = 0;
for (const scheme of ['light', 'dark']) {
  const ctx = await browser.newContext({ colorScheme: scheme, viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce' });
  await ctx.route('https://fonts.googleapis.com/**', (r) => r.fulfill({ status: 200, contentType: 'text/css', body: '' }));
  for (const route of routes) {
    const page = await ctx.newPage();
    const errs = [];
    page.on('pageerror', (e) => errs.push(e.message));
    try {
      await page.goto(base + route, { waitUntil: 'networkidle', timeout: 45000 });
      // Scan the hydrated page, not the server HTML: heavy routes (/blocks) are still hydrating at networkidle, and
      // effects such as Meter's role fix only run once React owns the DOM. Hydrated = <main> carries a React fiber.
      await page
        .waitForFunction(() => Object.keys(document.querySelector('main') ?? {}).some((k) => k.startsWith('__react')), null, { timeout: 15000 })
        .catch(() => (summary['not-hydrated'] ??= []).push(`${scheme} ${route}`));
      const res = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
      for (const v of res.violations) {
        const k = `${v.id} (${v.impact})`;
        (summary[k] ??= []).push(`${scheme} ${route} ×${v.nodes.length}`);
        total += v.nodes.length;
      }
      if (errs.length) (summary['pageerror'] ??= []).push(`${scheme} ${route}: ${errs[0].slice(0, 120)}`);
    } catch (e) {
      (summary['load-failed'] ??= []).push(`${scheme} ${route}: ${String(e).slice(0, 100)}`);
    }
    await page.close();
  }
  await ctx.close();
}
await browser.close();
console.log(`routes: ${routes.length} × 2 schemes; violation nodes: ${total}`);
console.log(JSON.stringify(summary, null, 1));

// The sweep used to stop at those two lines, so it printed a number and exited 0 whatever the number was.
// Run in CI like that it would have been green with every route failing — the fault it exists to catch (2026-09-29).
// A route that never loaded, threw, or was scanned before hydration is a route this sweep did not measure, so those
// fail too: an unmeasured route must not read as a clean one. The 2026-09-27 entry in docs/log.md is the case for
// that — the 8 nodes once seen on /blocks appeared only when axe ran ahead of hydration.
const unmeasured = ['load-failed', 'pageerror', 'not-hydrated'].filter((k) => summary[k]?.length);
if (total || unmeasured.length) {
  const why = [total ? `${total} violation node(s)` : null, ...unmeasured.map((k) => `${summary[k].length} ${k}`)];
  console.error(`axe sweep failed: ${why.filter(Boolean).join(', ')}. The summary above lists the routes.`);
  process.exit(1);
}

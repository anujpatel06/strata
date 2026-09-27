import { chromium } from 'playwright';
import { launchBrowser } from './launch-browser.mjs';
import { AxeBuilder } from '@axe-core/playwright';
import { readdirSync } from 'node:fs';
const base = 'http://localhost:3000';
const comps = readdirSync('packages/react/meta').filter((f) => f.endsWith('.meta.json')).map((f) => f.replace('.meta.json', ''));
const docs = readdirSync('apps/docs/content/docs').filter((f) => f.endsWith('.mdx')).map((f) => f.replace('.mdx', '')).filter((s) => s !== 'index');
const blocks = ['benefits-overview', 'portfolio', 'dashboard-overview', 'request-flow', 'settings', 'sign-in', 'activity-table'];
const routes = ['/', '/docs', '/docs/components', '/blocks', '/themes', '/colors', ...docs.map((d) => `/docs/${d}`), ...comps.map((c) => `/docs/components/${c}`), ...blocks.flatMap((b) => ['vela', 'harbor', 'qamar', 'care', 'house'].map((t) => `/blocks/${b}/view?tenant=${t}`))];
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

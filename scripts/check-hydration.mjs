// Loads every prerendered docs route in a real browser and fails on a React hydration error.
//
// check-ssr-tabs.mjs catches one known shape of this fault by reading the HTML; this catches the rest by watching
// what React says when it hydrates. React only reports a mismatch at hydration time, and in a production build it
// says "Minified React error #418" with no detail, so the fault is invisible to a test that reads the HTML alone
// and easy to miss in a sweep that only listens for uncaught exceptions (React recovers by re-rendering on the
// client, so nothing is thrown).
//
// Run after `pnpm --filter @syntara/docs build` against the site started from that build:
//   pnpm --filter @syntara/docs start         # serves the export; note the PID and kill that PID
//   node scripts/check-hydration.mjs
// SYNTARA_BASE_URL points it at another port. The build id of the running site is checked first, so a sweep can
// never silently measure a server someone else left on the port.
import { launchBrowser } from './launch-browser.mjs';
import { assertServedBuild } from './served-build.mjs';
import { docsRoutes } from './docs-routes.mjs';

const base = process.env.SYNTARA_BASE_URL ?? 'http://localhost:3000';
const schemes = (process.env.SYNTARA_SCHEMES ?? 'light,dark').split(',');
const routes = process.env.SYNTARA_ROUTES ? process.env.SYNTARA_ROUTES.split(',') : docsRoutes();
const CONCURRENCY = Number(process.env.SYNTARA_CONCURRENCY ?? 4);

// 418 text mismatch · 419 suspense · 421 hydrate suspense · 422/423 recovered by client render · 425 text content.
const HYDRATION = /Minified React error #(418|419|421|422|423|425)\b|Hydration failed|Text content does not match|did not match the server/i;

const buildId = await assertServedBuild(base);
const browser = await launchBrowser();
const failures = [];
let loaded = 0;

for (const scheme of schemes) {
  const ctx = await browser.newContext({ colorScheme: scheme, viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce' });
  // The sweep must not depend on the network: an offline machine would otherwise look like a hydration fault.
  await ctx.route('https://fonts.googleapis.com/**', (r) => r.fulfill({ status: 200, contentType: 'text/css', body: '' }));
  for (let i = 0; i < routes.length; i += CONCURRENCY) {
    await Promise.all(
      routes.slice(i, i + CONCURRENCY).map(async (route) => {
        const page = await ctx.newPage();
        const hits = [];
        page.on('console', (m) => {
          const t = m.text();
          if (m.type() === 'error' && HYDRATION.test(t)) hits.push(t);
        });
        page.on('pageerror', (e) => {
          if (HYDRATION.test(e.message)) hits.push(e.message);
        });
        try {
          await page.goto(base + route, { waitUntil: 'networkidle', timeout: 45000 });
          // React reports a mismatch as it hydrates, so wait until React owns <main> before judging the page.
          await page
            .waitForFunction(() => Object.keys(document.querySelector('main') ?? {}).some((k) => k.startsWith('__react')), null, { timeout: 15000 })
            .catch(() => failures.push(`${scheme} ${route}: never hydrated`));
          loaded++;
        } catch (e) {
          failures.push(`${scheme} ${route}: load failed — ${String(e).split('\n')[0].slice(0, 100)}`);
        }
        if (hits.length) failures.push(`${scheme} ${route}: ${hits[0].split('\n')[0].slice(0, 140)}`);
        await page.close();
      }),
    );
  }
  await ctx.close();
}
await browser.close();

console.log(`build ${buildId} at ${base}; routes: ${routes.length} × ${schemes.length} schemes; loaded: ${loaded}; hydration failures: ${failures.length}`);
for (const f of failures) console.log(`  ${f}`);
process.exit(failures.length ? 1 : 0);

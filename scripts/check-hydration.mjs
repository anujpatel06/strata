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

/**
 * React says only "Minified React error #418" in a production build, which names nothing. When a route fails, diff
 * the text the server sent against the text React ended up with, and report the first places they part company —
 * otherwise the failure tells you a page is broken and nothing about why, which on a machine you cannot reproduce
 * on (a CI runner, say) leaves you guessing.
 */
async function textDiff(page, url) {
  try {
    return await page.evaluate(async (u) => {
      const html = await fetch(u, { cache: 'no-store' }).then((r) => r.text());
      const doc = new DOMParser().parseFromString(html, 'text/html');
      const texts = (root) => {
        const out = [];
        const walk = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
        for (let n = walk.nextNode(); n; n = walk.nextNode()) {
          const t = n.nodeValue.replace(/\s+/g, ' ').trim();
          if (t) out.push(t);
        }
        return out;
      };
      const server = texts(doc.querySelector('main') ?? doc.body);
      const client = texts(document.querySelector('main') ?? document.body);
      // Compare as multisets, not position by position. Plenty of components legitimately add text after
      // hydration — a chart measures its box and only then draws its axis labels — and a single insertion would
      // put a positional diff out of step for the rest of the page, burying the one line that actually changed.
      const tally = (list) => list.reduce((m, t) => m.set(t, (m.get(t) ?? 0) + 1), new Map());
      const sc = tally(server);
      const cc = tally(client);
      const only = (a, b) => [...a].flatMap(([t, n]) => Array((n - (b.get(t) ?? 0)) > 0 ? 1 : 0).fill(t));
      // Text the server sent that React did not keep is the mismatch; text only the client has is usually an
      // after-hydration addition, so it comes second and is labelled as such.
      return { serverOnly: only(sc, cc).slice(0, 4), clientOnly: only(cc, sc).slice(0, 4) };
    }, url);
  } catch {
    return null;
  }
}

const buildId = await assertServedBuild(base);
const browser = await launchBrowser();
const failures = [];   // one entry per failing route, for the count
const report = [];     // the lines printed under the summary, including the diffs
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
            .catch(() => { failures.push(route); report.push(`${scheme} ${route}: never hydrated`); });
          loaded++;
        } catch (e) {
          failures.push(route);
          report.push(`${scheme} ${route}: load failed — ${String(e).split('\n')[0].slice(0, 100)}`);
        }
        if (hits.length) {
          failures.push(route);
          report.push(`${scheme} ${route}: ${hits[0].split('\n')[0].slice(0, 120)}`);
          const d = await textDiff(page, base + route);
          for (const t of d?.serverOnly ?? []) report.push(`    only in the server HTML: ${JSON.stringify(t)}`);
          for (const t of d?.clientOnly ?? []) report.push(`    only after hydration:    ${JSON.stringify(t)}`);
        }
        await page.close();
      }),
    );
  }
  await ctx.close();
}
await browser.close();

console.log(`build ${buildId} at ${base}; routes: ${routes.length} × ${schemes.length} schemes; loaded: ${loaded}; hydration failures: ${failures.length}`);
for (const line of report) console.log(`  ${line}`);
process.exit(failures.length ? 1 : 0);

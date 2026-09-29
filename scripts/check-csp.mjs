// Loads every docs route with the Content-Security-Policy the host will actually send, and fails on a page that
// the policy breaks.
//
// This exists because a CSP added to apps/docs/public/_headers shipped untested: nothing applies that file
// locally or in CI — `serve` ignores it — so /docs/server-driven-ui reached production and never hydrated at all.
// The policy is read from _headers here, so the check and the deployment cannot drift apart.
//
//   pnpm --filter @syntara/docs start        # note the PID and kill that PID
//   node scripts/check-csp.mjs
import { readFileSync } from 'node:fs';
import { launchBrowser } from './launch-browser.mjs';
import { assertServedBuild } from './served-build.mjs';
import { docsRoutes } from './docs-routes.mjs';

const base = process.env.SYNTARA_BASE_URL ?? 'http://localhost:3000';
const routes = process.env.SYNTARA_ROUTES ? process.env.SYNTARA_ROUTES.split(',') : docsRoutes();
const CONCURRENCY = Number(process.env.SYNTARA_CONCURRENCY ?? 4);

/** The `/*` policy from _headers — the one every page gets. */
function policyFromHeaders() {
  const text = readFileSync('apps/docs/public/_headers', 'utf8');
  const line = text.split('\n').find((l) => /^\s+Content-Security-Policy:/i.test(l));
  if (!line) throw new Error('apps/docs/public/_headers has no Content-Security-Policy to test');
  return line.replace(/^\s*Content-Security-Policy:\s*/i, '').trim();
}

const policy = policyFromHeaders();
const buildId = await assertServedBuild(base);
const browser = await launchBrowser();
const failures = [];
let checked = 0;

const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce' });
// Serve the policy the host sends. Playwright cannot add a response header to a navigation without rewriting the
// response, so the document is fetched and replayed with the header attached.
await ctx.route('**/*', async (route) => {
  const req = route.request();
  if (req.resourceType() !== 'document') return route.continue();
  const res = await route.fetch();
  const headers = { ...res.headers(), 'content-security-policy': policy };
  return route.fulfill({ response: res, headers });
});

for (let i = 0; i < routes.length; i += CONCURRENCY) {
  await Promise.all(
    routes.slice(i, i + CONCURRENCY).map(async (route) => {
      const page = await ctx.newPage();
      const violations = [];
      page.on('console', (m) => {
        const t = m.text();
        if (/Content Security Policy|violates the following/i.test(t)) violations.push(t.split('\n')[0].slice(0, 130));
      });
      page.on('pageerror', (e) => {
        if (/Content Security Policy|EvalError/i.test(e.message)) violations.push(e.message.split('\n')[0].slice(0, 130));
      });
      try {
        await page.goto(base + route, { waitUntil: 'networkidle', timeout: 45000 });
        const hydrated = await page
          .waitForFunction(() => Object.keys(document.querySelector('main') ?? {}).some((k) => k.startsWith('__react')), null, { timeout: 15000 })
          .then(() => true)
          .catch(() => false);
        if (!hydrated) failures.push(`${route}: never hydrated under the site's CSP`);
        checked++;
      } catch (e) {
        failures.push(`${route}: load failed — ${String(e).split('\n')[0].slice(0, 90)}`);
      }
      for (const v of [...new Set(violations)].slice(0, 2)) failures.push(`${route}: ${v}`);
      await page.close();
    }),
  );
}
await ctx.close();
await browser.close();

console.log(`build ${buildId} at ${base}; ${routes.length} routes under the site's own CSP; loaded: ${checked}; failures: ${failures.length}`);
if (!failures.length) console.log(`  policy: ${policy.slice(0, 120)}…`);
for (const f of failures) console.log(`  ${f}`);
process.exit(failures.length ? 1 : 0);

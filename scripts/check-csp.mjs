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

// SYNTARA_BASE_URL lets the check run against a server on another port when 3000 is taken (serve falls back to a
// random port and still exits 0), the same way scripts/axe-sweep.mjs takes it.
const base = process.env.SYNTARA_BASE_URL ?? 'http://localhost:3000';
const routes = process.env.SYNTARA_ROUTES ? process.env.SYNTARA_ROUTES.split(',') : docsRoutes();
const CONCURRENCY = Number(process.env.SYNTARA_CONCURRENCY ?? 4);
// Every document is replayed through route.fetch against the local server, so one dropped connection is a flake
// rather than a CSP finding. Retry it a few times before giving up on the route.
const FETCH_ATTEMPTS = Math.max(1, Number(process.env.SYNTARA_FETCH_ATTEMPTS ?? 3));

// A throw inside a Playwright route handler is an unhandled promise rejection, which kills the process with a Node
// internals trace and no mention of which check was running: that is how a single `read ECONNRESET` from the local
// server failed CI on a docs-only pull request (#20, 2026-10-01). Anything that still escapes says so in words.
for (const event of ['unhandledRejection', 'uncaughtException']) {
  process.on(event, (err) => {
    const kind = event === 'unhandledRejection' ? 'unhandled promise rejection' : 'uncaught exception';
    console.error(`check-csp crashed with an ${kind}: ${String(err?.message ?? err).split('\n')[0]}`);
    console.error(`This is a fault in scripts/check-csp.mjs or in the server at ${base}, not a CSP violation.`);
    console.error(String(err?.stack ?? '').split('\n').slice(1, 4).join('\n'));
    process.exit(1);
  });
}

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
/** Routes whose document never came back over the wire: reported apart from CSP findings. route → first message. */
const transportErrors = new Map();
let checked = 0;
let retried = 0;

/** The route as docsRoutes() names it, for messages that line up with the failure list. */
const routeOf = (url) => (url.startsWith(base) ? url.slice(base.length) || '/' : url);
const firstLine = (e) => String(e?.message ?? e).split('\n')[0].trim();

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Fetches the document for replay, retrying a dropped connection. Throws with the last error if every attempt fails. */
async function fetchWithRetry(route) {
  let last;
  for (let attempt = 1; attempt <= FETCH_ATTEMPTS; attempt++) {
    try {
      return await route.fetch();
    } catch (e) {
      last = e;
      if (attempt === FETCH_ATTEMPTS) break;
      retried++;
      await sleep(150 * attempt);
    }
  }
  throw last;
}

const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce' });
// Serve the policy the host sends. Playwright cannot add a response header to a navigation without rewriting the
// response, so the document is fetched and replayed with the header attached.
await ctx.route('**/*', async (route) => {
  const req = route.request();
  try {
    if (req.resourceType() !== 'document') return await route.continue();
    const res = await fetchWithRetry(route);
    const headers = { ...res.headers(), 'content-security-policy': policy };
    return await route.fulfill({ response: res, headers });
  } catch (e) {
    const message = firstLine(e);
    // A closed page or a torn-down context is this script shutting down, not the server failing.
    if (!/Target page|context or browser has been closed|Route is already handled/i.test(message)) {
      const key = routeOf(req.url());
      if (!transportErrors.has(key)) transportErrors.set(key, message);
    }
    // Let the navigation fail so the per-route handler below reports it, instead of hanging until the goto timeout.
    await route.abort().catch(() => {});
  }
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
        const transport = transportErrors.get(route);
        failures.push(
          transport
            ? `${route}: transport error after ${FETCH_ATTEMPTS} attempts, not a CSP failure — ${transport}`
            : `${route}: load failed — ${firstLine(e).slice(0, 90)}`,
        );
      }
      for (const v of [...new Set(violations)].slice(0, 2)) failures.push(`${route}: ${v}`);
      await page.close();
    }),
  );
}
await ctx.close();
await browser.close();

// A subresource document (an iframe) can drop without failing its page's navigation. Still a route this check did
// not measure under the real policy, so it cannot read as a clean one.
for (const [route, message] of transportErrors) {
  if (!failures.some((f) => f.startsWith(`${route}: `))) {
    failures.push(`${route}: transport error after ${FETCH_ATTEMPTS} attempts, not a CSP failure — ${message}`);
  }
}

const transportCount = failures.filter((f) => f.includes('transport error after')).length;
console.log(
  `build ${buildId} at ${base}; ${routes.length} routes under the site's own CSP; loaded: ${checked}; failures: ${failures.length}` +
    (retried ? `; fetches retried: ${retried}` : ''),
);
if (!failures.length) console.log(`  policy: ${policy.slice(0, 120)}…`);
for (const f of failures) console.log(`  ${f}`);
if (transportCount) {
  console.error(
    `${transportCount} of ${failures.length} failure(s) are transport errors, not CSP violations: the server at ${base} ` +
      `stopped answering after ${FETCH_ATTEMPTS} attempts. Check that it is still up (lsof -nP -iTCP -sTCP:LISTEN) and re-run.`,
  );
}
process.exit(failures.length ? 1 : 0);

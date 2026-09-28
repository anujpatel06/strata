// /themes keeps its state in the address, so a shared link must restore that theme. The page is prerendered with
// no knowledge of the query string (the site is a static export), and the provider reads the address on the client
// after hydration — which is easy to break silently. This checks a few shared links end to end.
//
//   node scripts/check-theme-links.mjs      (SYNTARA_BASE_URL to point elsewhere)
import { launchBrowser } from './launch-browser.mjs';
import { assertServedBuild } from './served-build.mjs';

const base = process.env.SYNTARA_BASE_URL ?? 'http://localhost:3000';

/** Each case: the address to open, and what must be true once it has settled. */
const CASES = [
  { query: '?tenant=qamar', expect: { tenant: 'qamar' } },
  { query: '?tenant=harbor&scheme=dark', expect: { tenant: 'harbor', scheme: 'dark' } },
  { query: '?tenant=vela&primary=ff0000', expect: { tenant: 'vela', primary: '#ff0000' } },
  { query: '?tenant=haat&tab=tokens', expect: { tenant: 'haat', tab: 'tokens' } },
  // A nonsense address must fall back rather than break the page.
  { query: '?tenant=does-not-exist&primary=nothex', expect: {} },
];

await assertServedBuild(base);
const browser = await launchBrowser();
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce' });
await ctx.route('https://fonts.googleapis.com/**', (r) => r.fulfill({ status: 200, contentType: 'text/css', body: '' }));
const failures = [];

for (const { query, expect } of CASES) {
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', (e) => errs.push(e.message.split('\n')[0]));
  await page.goto(`${base}/themes${query}`, { waitUntil: 'networkidle', timeout: 45000 });
  // The provider replaces the state in an effect, then writes the address back; wait for that to settle.
  await page.waitForTimeout(1500);

  const got = await page.evaluate(() => {
    const q = new URLSearchParams(window.location.search);
    return {
      tenant: q.get('tenant'),
      scheme: q.get('scheme') ?? 'light',
      tab: q.get('tab') ?? 'preview',
      primary: q.get('primary') ? `#${q.get('primary')}` : null,
      // Only the preview tab renders the themed scope; the others show tables and code.
      styled: Boolean(document.querySelector('[data-syntara-theme]')) && document.querySelectorAll('style').length > 0,
      selectedTab: document.querySelector('[role="tab"][aria-selected="true"]')?.textContent?.trim().toLowerCase() ?? null,
    };
  });

  for (const [key, want] of Object.entries(expect)) {
    if (got[key] !== want) failures.push(`${query}: ${key} is ${JSON.stringify(got[key])}, expected ${JSON.stringify(want)}`);
  }
  if (got.tab === 'preview' && !got.styled) failures.push(`${query}: preview tab rendered no themed scope`);
  if (got.tab !== 'preview' && got.selectedTab !== got.tab) {
    failures.push(`${query}: selected tab is ${JSON.stringify(got.selectedTab)}, expected ${JSON.stringify(got.tab)}`);
  }
  if (errs.length) failures.push(`${query}: page error — ${errs[0].slice(0, 120)}`);
  await page.close();
}

await ctx.close();
await browser.close();
console.log(`shared /themes links checked: ${CASES.length}; failures: ${failures.length}`);
for (const f of failures) console.log(`  ${f}`);
process.exit(failures.length ? 1 : 0);

// Checks in a real browser that overlays unmount once they close. jsdom can't show this: it has no Web Animations
// API, so React Aria never waits for an exit animation there.
// 1. Tooltips: Tab through each page's main content. After every Tab the only tooltip left must be the one that
//    describes the focused control, and it must be positioned. A closed tooltip that stays mounted sits at 0,0.
//    A control that has a tooltip must still show it once the page has settled: focus scrolls the control into
//    view, and that scroll must not close the tooltip.
//    Just after the Tab, the only other tooltip allowed is the previous one fading out. Any third one belongs to
//    a control that focus only passed through (a toggle group focuses its last item on Tab) and must not show.
// 2. Menu and Popover: open the first one with the keyboard, press Escape, and nothing may stay mounted.
// Runs with and without reduced motion, against the production site:
//   pnpm --filter @syntara/docs build && (cd apps/docs && npx next start -p 3000), then node scripts/check-overlay-exit.mjs
import { existsSync } from 'node:fs';
import { launchBrowser } from './launch-browser.mjs';

const base = process.env.SYNTARA_BASE_URL ?? 'http://localhost:3000';
const tooltipRoutes = ['/docs/components/button', '/docs/components/tooltip', '/docs/components/toggle-group'];
// The page where the fault was first seen outside the component pages.
if (existsSync('apps/docs/content/docs/server-driven-ui.mdx')) tooltipRoutes.push('/docs/server-driven-ui');
const popoverRoutes = ['/docs/components/menu', '/docs/components/popover'];
const TABS = 30;
// Longer than the slowest overlay exit (--syntara-motion-duration-normal, 200ms).
const SETTLE = 350;
// Early enough to catch a tooltip that is fading out (--syntara-motion-duration-fast, 120ms).
const EARLY = 40;
// A tooltip sits 6 to 8px from its control. Further away means it didn't follow the control when the page scrolled.
const MAX_GAP = 16;

const failures = [];
let tooltipsSeen = 0;
let popoversSeen = 0;

async function open(ctx, route) {
  const page = await ctx.newPage();
  await page.goto(base + route, { waitUntil: 'networkidle', timeout: 45000 });
  await page.waitForFunction(() => Object.keys(document.querySelector('main') ?? {}).some((k) => k.startsWith('__react')), null, { timeout: 15000 });
  return page;
}

const browser = await launchBrowser();
for (const reducedMotion of ['no-preference', 'reduce']) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion });
  await ctx.route('https://fonts.googleapis.com/**', (r) => r.fulfill({ status: 200, contentType: 'text/css', body: '' }));

  for (const route of tooltipRoutes) {
    const page = await open(ctx, route);
    await page.evaluate(() => {
      // Remember which control each tooltip describes. React Aria removes aria-describedby as the tooltip closes.
      window.__owners = new Map();
      new MutationObserver((records) => {
        for (const r of records) for (const id of (r.target.getAttribute('aria-describedby') ?? '').split(' ')) if (id) window.__owners.set(id, r.target);
      }).observe(document.body, { subtree: true, attributes: true, attributeFilter: ['aria-describedby'] });
      document.querySelector('main')?.querySelector('a[href], button')?.focus();
    });
    // Tooltips seen up to the end of the previous step. One of them may still be fading out.
    let known = [];
    for (let i = 0; i < TABS; i++) {
      await page.keyboard.press('Tab');
      await page.waitForTimeout(EARLY);
      // A tooltip may close while its control keeps focus (React Aria closes tooltips on scroll), so "live" here
      // means it belongs to the focused control.
      const early = await page.evaluate(() =>
        [...document.querySelectorAll('[role="tooltip"]')].map((t) => ({ id: t.id, text: t.textContent, live: window.__owners.get(t.id) === document.activeElement })),
      );
      for (const t of early) {
        if (!t.live && !known.includes(t.id)) failures.push(`${reducedMotion} ${route} Tab ${i + 1}: tooltip "${t.text}" flashed for a control that focus only passed through`);
      }
      known = early.map((t) => t.id);
      await page.waitForTimeout(SETTLE - EARLY);
      const tips = await page.evaluate(() => {
        const describedBy = document.activeElement?.getAttribute('aria-describedby') ?? '';
        return [...document.querySelectorAll('[role="tooltip"]')].map((t) => {
          const r = t.getBoundingClientRect();
          const c = document.activeElement.getBoundingClientRect();
          // The gap between the tooltip and the focused control, on the axis where they don't overlap.
          const gap = Math.round(Math.max(c.left - r.right, r.left - c.right, c.top - r.bottom, r.top - c.bottom));
          return { text: t.textContent, x: Math.round(r.x), y: Math.round(r.y), gap, exiting: t.hasAttribute('data-exiting'), live: describedBy.split(' ').includes(t.id) };
        });
      });
      tooltipsSeen += tips.filter((t) => t.live).length;
      const lost = await page.evaluate(() => [...window.__owners].some(([id, owner]) => owner === document.activeElement && !document.getElementById(id)));
      if (lost) failures.push(`${reducedMotion} ${route} Tab ${i + 1}: the focused control's tooltip closed by itself`);
      for (const t of tips) {
        if (t.live && t.gap > MAX_GAP) failures.push(`${reducedMotion} ${route} Tab ${i + 1}: tooltip "${t.text}" sits ${t.gap}px from its control`);
        if (!t.live || t.exiting || (t.x === 0 && t.y === 0)) {
          failures.push(`${reducedMotion} ${route} Tab ${i + 1}: stale tooltip "${t.text}" at ${t.x},${t.y}${t.exiting ? ' [data-exiting]' : ''}`);
        }
      }
    }
    await page.close();
  }

  for (const route of popoverRoutes) {
    const page = await open(ctx, route);
    const focused = await page.evaluate(() => {
      const trigger = document.querySelector('main [aria-haspopup], main button[aria-expanded]');
      trigger?.focus();
      return trigger != null;
    });
    if (!focused) {
      failures.push(`${reducedMotion} ${route}: no trigger found`);
      await page.close();
      continue;
    }
    await page.keyboard.press('Enter');
    await page.waitForTimeout(SETTLE);
    const opened = await page.evaluate(() => document.querySelectorAll('[data-trigger]').length);
    if (opened === 0) failures.push(`${reducedMotion} ${route}: the overlay did not open`);
    popoversSeen += opened;
    await page.keyboard.press('Escape');
    await page.waitForTimeout(SETTLE);
    const left = await page.evaluate(() => document.querySelectorAll('[data-trigger], [data-exiting]').length);
    if (left > 0) failures.push(`${reducedMotion} ${route}: ${left} overlay(s) still mounted after Escape`);
    await page.close();
  }
  await ctx.close();
}
await browser.close();

if (tooltipsSeen === 0) failures.push('no tooltip opened, so nothing was checked');
console.log(`tooltips checked: ${tooltipsSeen}; menus and popovers checked: ${popoversSeen}; failures: ${failures.length}`);
for (const f of failures) console.log(`  ${f}`);
process.exit(failures.length ? 1 : 0);

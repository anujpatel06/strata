/**
 * Shared Chromium launcher for the repo scripts. Order: PLAYWRIGHT_CHROMIUM_PATH, then Playwright's bundled
 * browser, then the installed Google Chrome (channel 'chrome'). The fallback exists because `npx playwright install`
 * isn't always run on a dev machine, while Chrome usually is installed.
 */
import { chromium } from 'playwright';

export async function launchBrowser(options = {}) {
  if (process.env.PLAYWRIGHT_CHROMIUM_PATH) {
    return chromium.launch({ ...options, executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH });
  }
  try {
    return await chromium.launch(options);
  } catch (bundledError) {
    try {
      return await chromium.launch({ ...options, channel: 'chrome' });
    } catch {
      throw bundledError;
    }
  }
}

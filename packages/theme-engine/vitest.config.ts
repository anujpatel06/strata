import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    /*
     * Vitest's default is 5s, and this package's fuzz tests sit close enough to it that a busy machine turns them
     * red for no reason. The worst one — exporters.test.ts "sheen keeps text.subtle ≥ 4.5:1 at its brightest pixel"
     * — measured 3,087ms at load average 31 (2026-10-01, `vitest run test/exporters.test.ts --reporter=verbose`),
     * and timed out at 5,135ms earlier the same day. 20s matches @syntara/react and @syntara/sdui and leaves ~6×
     * headroom, so a slow CI runner fails only when something is genuinely wrong.
     */
    testTimeout: 20_000,
  },
});

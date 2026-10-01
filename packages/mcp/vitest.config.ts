import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    /*
     * Vitest's default is 5s. Three tests here walk all 959 icons or spawn the server over stdio, and at load
     * average 28 they measured 3,371ms (icons.test.ts "never returns a name that is not exported"), 3,330ms
     * (sizes.test.ts "find_icon at its limit of 30") and 2,165ms (protocol.test.ts), with the first two timing out
     * earlier the same day (2026-10-01, `vitest run --reporter=verbose`). 20s matches @syntara/react and
     * @syntara/sdui and leaves ~6× headroom.
     */
    testTimeout: 20_000,
  },
});

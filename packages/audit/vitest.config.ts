import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // The CLI tests start a Node process each, through tsx. On a busy machine one start can take several seconds.
    testTimeout: 60_000,
  },
});

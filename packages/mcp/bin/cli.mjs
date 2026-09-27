#!/usr/bin/env node
/**
 * strata-mcp: runs the TypeScript source through tsx, so there is no build step.
 *
 *   node packages/mcp/bin/cli.mjs          (stdio; set STRATA_ROOT to point at another checkout)
 */
import { register } from 'tsx/esm/api';

register();

try {
  await import('../src/main.ts');
} catch (err) {
  console.error(`strata-mcp failed to start: ${err instanceof Error ? err.message : String(err)}`);
  process.exit(1);
}

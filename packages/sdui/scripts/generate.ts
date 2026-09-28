/**
 * pnpm --filter @syntara/sdui generate
 *
 * Writes the wire contract to packages/sdui/schema/: one JSON Schema per node (nodes/*.schema.json), the shared
 * definitions (defs.schema.json), the screen schema (screen.schema.json), manifest.json, and src/schemas.generated.ts
 * (static imports of those files). The files are committed;
 * test/generate.test.ts fails when they are stale. Removes node files that are no longer generated.
 */
import { mkdirSync, readdirSync, rmSync, writeFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import * as icons from '@syntara/icons';
import { PKG_DIR, SCHEMA_DIR, buildSchemas, iconNamesFrom, readGapTokens, readMetas, readPrevious, schemasModule, serialise } from './build-schemas';

const files = buildSchemas({
  metas: readMetas(),
  iconNames: iconNamesFrom(icons as Record<string, unknown>),
  gapTokens: readGapTokens(),
  previous: readPrevious(),
});

mkdirSync(path.join(SCHEMA_DIR, 'nodes'), { recursive: true });
const nodesDir = path.join(SCHEMA_DIR, 'nodes');
if (existsSync(nodesDir)) {
  for (const f of readdirSync(nodesDir)) if (!files[`nodes/${f}`]) rmSync(path.join(nodesDir, f));
}
for (const [rel, value] of Object.entries(files)) writeFileSync(path.join(SCHEMA_DIR, rel), serialise(value));
writeFileSync(path.join(PKG_DIR, 'src/schemas.generated.ts'), schemasModule(files));
console.log(`Wrote ${Object.keys(files).length} files to schema/ and src/schemas.generated.ts`);

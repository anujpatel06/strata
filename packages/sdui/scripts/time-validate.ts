/**
 * pnpm --filter @syntara/sdui exec tsx scripts/time-validate.ts
 *
 * Times validateScreen on the order-status example: the first call (which compiles every schema) and the mean of
 * the next 1,000. A rough figure for one machine, not a benchmark.
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { validateScreen } from '../src/index';
import { PKG_DIR } from './build-schemas';

const doc: unknown = JSON.parse(readFileSync(path.join(PKG_DIR, 'examples/order-status.json'), 'utf8'));
const t0 = performance.now();
const first = validateScreen(doc);
const t1 = performance.now();
const runs = 1000;
for (let i = 0; i < runs; i++) validateScreen(doc);
const t2 = performance.now();
if (!first.valid) throw new Error('order-status.json should be valid');
console.log(`first call (compiles every schema): ${(t1 - t0).toFixed(0)} ms`);
console.log(`after that: ${((t2 - t1) / runs).toFixed(3)} ms per document (mean of ${runs})`);
console.log(`${process.platform} ${process.arch}, Node ${process.version}`);

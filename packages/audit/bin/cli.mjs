#!/usr/bin/env node
/**
 * syntara-audit. Runs the TypeScript source through tsx, so there is no build step.
 */
import { register } from 'tsx/esm/api';

register();
const { main } = await import('../src/cli.ts');
process.exitCode = main(process.argv.slice(2));

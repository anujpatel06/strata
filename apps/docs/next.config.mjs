import { readFileSync, readdirSync } from 'node:fs';
import createMDX from '@next/mdx';

/**
 * `import { Button } from '@syntara/react'` → `import { Button } from '@syntara/react/ui/button'`.
 * The barrel re-exports every component with `export *`, which the bundler doesn't tree-shake across
 * 'use client' modules, so without this every page shipped the whole library. Built from the export
 * statements in packages/react/src/ui/*.tsx, so new components are picked up automatically; anything
 * not found falls through to the barrel.
 */
function syntaraImportMap() {
  const uiDir = new URL('../../packages/react/src/ui/', import.meta.url);
  /** @type {Record<string, string>} */
  const map = {};
  for (const file of readdirSync(uiDir).sort()) {
    if (!file.endsWith('.tsx')) continue;
    const target = `@syntara/react/ui/${file.slice(0, -4)}`;
    const source = readFileSync(new URL(file, uiDir), 'utf8');
    const names = new Set();
    for (const m of source.matchAll(/export\s+(?:declare\s+)?(?:async\s+)?(?:function|const|let|class|interface|type|enum)\s+([A-Za-z_$][\w$]*)/g)) names.add(m[1]);
    for (const m of source.matchAll(/export\s+(?:type\s+)?\{([^}]*)\}/g)) {
      for (const part of m[1].split(',')) {
        const name = part.trim().replace(/^type\s+/, '').split(/\s+as\s+/).pop()?.trim();
        if (name) names.add(name);
      }
    }
    for (const name of names) map[`^${name}$`] ??= target;
  }
  map['.*'] = '@syntara/react';
  return map;
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  pageExtensions: ['ts', 'tsx', 'md', 'mdx'],
  // Workspace packages ship TypeScript source + CSS Modules; Next compiles them.
  transpilePackages: ['@syntara/react', '@syntara/theme-engine'],
  modularizeImports: {
    '@syntara/react': { transform: syntaraImportMap(), skipDefaultConversion: true },
  },
  reactStrictMode: true,
  poweredByHeader: false,
  // Lets parallel builds in one checkout use separate output folders: NEXT_DIST_DIR=.next-b1 next build
  distDir: process.env.NEXT_DIST_DIR || '.next',
};

// Keep the MDX plugin lists empty: Turbopack can only pass serialisable options to the loader.
// Heading ids, code highlighting and callouts are handled by mdx-components.tsx instead.
const withMDX = createMDX({ extension: /\.(md|mdx)$/ });

export default withMDX(nextConfig);

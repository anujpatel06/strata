/**
 * Library build for the npm package — `pnpm --filter @syntara/react build`.
 *
 *   dist/index.js, dist/ui/<name>.js   ESM, one module per source file (preserveModules), 'use client' kept
 *   dist/styles.css                     every CSS Module, compiled — consumers import '@syntara/react/styles.css' once
 *   dist/types/**                       declarations (tsc -p tsconfig.build.json, run by emitDeclarations below)
 *
 * Dependencies and peers stay external. Tests use vitest.config.ts, not this file.
 */
import { execFileSync } from 'node:child_process';
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig, type Plugin } from 'vite';

const root = path.dirname(fileURLToPath(import.meta.url));
const src = path.join(root, 'src');
const pkg = JSON.parse(readFileSync(path.join(root, 'package.json'), 'utf8')) as {
  dependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
};

/** Every dependency and peer, including subpaths (react/jsx-runtime, @react-aria/…). */
const externals = [...Object.keys(pkg.dependencies ?? {}), ...Object.keys(pkg.peerDependencies ?? {})];
const isExternal = (id: string): boolean => externals.some((dep) => id === dep || id.startsWith(`${dep}/`));

/** One entry per component file + the barrel, so each component is its own importable, tree-shakeable module. */
const entries: Record<string, string> = { index: path.join(src, 'index.ts') };
for (const file of readdirSync(path.join(src, 'ui'))) {
  if (file.endsWith('.tsx')) entries[`ui/${file.slice(0, -4)}`] = path.join(src, 'ui', file);
}

const USE_CLIENT = /^\s*(['"])use client\1;?/;

/**
 * Bundlers drop module-level directives, and React Server Components need 'use client' at the very top of
 * every client module. Remember which sources had it and re-add it to the matching output module.
 */
function preserveUseClient(): Plugin {
  const clientModules = new Set<string>();
  return {
    name: 'syntara:preserve-use-client',
    transform(code, id) {
      if (USE_CLIENT.test(code)) clientModules.add(id.split('?')[0]!);
      return null;
    },
    renderChunk(code, chunk) {
      const id = chunk.facadeModuleId ?? chunk.moduleIds?.[0];
      if (!id || !clientModules.has(id) || USE_CLIENT.test(code)) return null;
      return { code: `'use client';\n${code}`, map: null };
    },
  };
}

/**
 * Declarations: `tsc -p tsconfig.build.json` into dist/types after the bundle is written (vite empties dist first,
 * so tsc has to run second). Source imports are extensionless ('./button'), which `moduleResolution: bundler`
 * accepts but node16/nodenext consumers reject in .d.ts files — so relative specifiers get their `.js` added.
 */
function emitDeclarations(): Plugin {
  const addJs = (code: string): string =>
    code.replace(
      /((?:from|import)\s*\(?\s*)(['"])(\.{1,2})((?:\/[^'"]*)?)\2/g,
      (m, lead: string, q: string, dots: string, rest: string) => {
        // tsc writes the barrel as a directory specifier — `import("..").Icon` — which nodenext rejects.
        if (!rest) return `${lead}${q}${dots}/index.js${q}`;
        if (/\.(js|mjs|cjs|json|css)$/.test(rest)) return m;
        return `${lead}${q}${dots}${rest}.js${q}`;
      },
    );
  const walk = (dir: string): string[] =>
    readdirSync(dir, { withFileTypes: true }).flatMap((d) =>
      d.isDirectory() ? walk(path.join(dir, d.name)) : d.name.endsWith('.d.ts') ? [path.join(dir, d.name)] : [],
    );
  return {
    name: 'syntara:emit-declarations',
    apply: 'build',
    closeBundle() {
      const tsc = path.join(root, 'node_modules/.bin/tsc');
      execFileSync(tsc, ['-p', path.join(root, 'tsconfig.build.json')], { cwd: root, stdio: 'inherit' });
      for (const file of walk(path.join(root, 'dist/types'))) writeFileSync(file, addJs(readFileSync(file, 'utf8')));
    },
  };
}

/** CSS Module class names: syntara-<file>__<class> — readable in devtools, unique because file names are. */
function scopedName(local: string, filename: string): string {
  const file = path.basename(filename.split('?')[0]!).replace(/\.module\.css$/, '');
  return `syntara-${file}__${local}`;
}

export default defineConfig({
  plugins: [react(), preserveUseClient(), emitDeclarations()],
  css: { modules: { generateScopedName: scopedName } },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    target: 'es2022',
    minify: false,
    sourcemap: true,
    cssCodeSplit: false,
    copyPublicDir: false,
    lib: { entry: entries, formats: ['es'], cssFileName: 'styles' },
    rollupOptions: {
      external: isExternal,
      output: {
        preserveModules: true,
        preserveModulesRoot: src,
        entryFileNames: '[name].js',
      },
    },
  },
});

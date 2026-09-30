/**
 * Library build for the npm package — `pnpm --filter @syntara/icons build`.
 *
 *   dist/index.js, dist/icons/<group>.js   ESM, one module per source file (preserveModules), so importing
 *                                          two icons does not pull in 480 others
 *   dist/types/**                          declarations (tsc -p tsconfig.build.json, run by emitDeclarations)
 *
 * In the repo, `exports` still points at src; the dist mapping lives in publishConfig, same as @syntara/react.
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

const externals = [...Object.keys(pkg.dependencies ?? {}), ...Object.keys(pkg.peerDependencies ?? {})];
const isExternal = (id: string): boolean => externals.some((dep) => id === dep || id.startsWith(`${dep}/`));

/** Same as @syntara/react: extensionless relative specifiers in .d.ts files are rejected by nodenext consumers. */
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

export default defineConfig({
  plugins: [react(), emitDeclarations()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    target: 'es2022',
    minify: false,
    sourcemap: true,
    copyPublicDir: false,
    lib: { entry: { index: path.join(src, 'index.ts') }, formats: ['es'] },
    rollupOptions: {
      external: isExternal,
      output: { preserveModules: true, preserveModulesRoot: src, entryFileNames: '[name].js' },
    },
  },
});

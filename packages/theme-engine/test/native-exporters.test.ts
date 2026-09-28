/**
 * Native token exporters (Compose + SwiftUI) × every tenant in tenants/, both schemes.
 *
 * What is proven here, and how:
 *  1. Colours: parsed back out of the generated Kotlin and Swift text (with regexes local to this
 *     file, independent of the exporter's own reader) and compared byte for byte with the Theme.
 *  2. Contrast: verifyNativeExport() re-runs every pair in contrast-pairs.json on the parsed values.
 *  3. No silent omissions: every CSS variable is exported or on NATIVE_EXCLUSIONS, and every
 *     exclusion is written up in packages/tokens/README-native.md.
 *  4. Units: sizes are the design values in dp/sp/pt, unchanged (touch targets are not raised).
 *  5. Validity: Swift is type-checked with swiftc when it is installed. There is no Kotlin compiler
 *     here, so Kotlin gets structural checks only (see "Kotlin structure").
 *  6. Determinism and a stable API: same bytes on every run; the same declarations for every tenant.
 */
import { execFile } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { afterAll, describe, expect, it } from 'vitest';
import { CHART_AXIS_ROLE, CHART_GRID_ROLE } from '../src/chart';
import { toCssVariables } from '../src/css-vars';
import { toCompose } from '../src/export/compose';
import { NATIVE_EXCLUSIONS, buildNativeModel, nativePropName, verifyNativeExport } from '../src/export/native';
import { toSwiftUI } from '../src/export/swiftui';
import { CONTRAST_PAIRS } from '../src/roles';
import { generateTheme } from '../src/theme';
import type { BrandInput, Density, Scheme, Theme } from '../src/types';
import { ROLES, roleToCssVar } from '../src/types';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, '../../..');
const tenantsDir = join(repoRoot, 'tenants');
const readmeNative = join(repoRoot, 'packages/tokens/README-native.md');

const TENANTS = readdirSync(tenantsDir, { withFileTypes: true })
  .filter((d) => d.isDirectory() && existsSync(join(tenantsDir, d.name, 'brand.json')))
  .map((d) => d.name)
  .sort()
  .map((id) => ({ id, input: JSON.parse(readFileSync(join(tenantsDir, id, 'brand.json'), 'utf8')) as BrandInput }));

const SCHEMES: Scheme[] = ['light', 'dark'];
const PAIRS_PER_SCHEME = CONTRAST_PAIRS.reduce((n, p) => n + p.against.length, 0);

interface Built {
  id: string;
  theme: Theme;
  kt: string;
  swift: string;
}
const built: Built[] = TENANTS.map(({ id, input }) => {
  const theme = generateTheme(input);
  return { id, theme, kt: toCompose(theme), swift: toSwiftUI(theme) };
});

/* ------------------------------------------------------------------ independent readers */

/** Text between `start` (ending in "(") and its matching ")". */
function block(src: string, start: string): string {
  const at = src.indexOf(start);
  expect(at, `"${start}" not found`).toBeGreaterThan(-1);
  let depth = 1;
  for (let i = at + start.length; i < src.length; i++) {
    if (src[i] === '(') depth++;
    else if (src[i] === ')' && --depth === 0) return src.slice(at + start.length, i);
  }
  throw new Error(`Unbalanced block after "${start}"`);
}

/** prop → "#rrggbb" for opaque colours in a Kotlin instance block. */
function kotlinColors(src: string, instance: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const m of block(src, `val ${instance}: SyntaraColors = SyntaraColors(`).matchAll(/(\w+) = Color\(0xFF([0-9A-F]{6})\),/g)) {
    out[m[1]!] = `#${m[2]!.toLowerCase()}`;
  }
  return out;
}

/** prop → "#rrggbb" for opaque colours in a Swift instance block. */
function swiftColors(src: string, instance: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const m of block(src, `static let ${instance} = SyntaraColors(`).matchAll(/(\w+): srgb\(0x([0-9A-F]{6})\)/g)) {
    out[m[1]!] = `#${m[2]!.toLowerCase()}`;
  }
  return out;
}

/** The public names a file declares: types, cases, properties, functions. Sorted, de-duplicated. */
function declarations(src: string, platform: 'kotlin' | 'swift'): string[] {
  const code = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '').replace(/"(?:[^"\\]|\\.)*"/g, '""');
  const re =
    platform === 'kotlin'
      ? /\b(?:data class|enum class|object|val|fun(?: <\w+>)?)\s+`?(\w+)`?/g
      : /\b(?:struct|enum|case|let|var|func)\s+`?(\w+)`?/g;
  const names = [...code.matchAll(re)].map((m) => m[1]!);
  if (platform === 'kotlin') {
    const e = /enum class \w+ \{([^}]*)\}/.exec(code);
    if (e) names.push(...e[1]!.split(',').map((s) => s.trim()).filter(Boolean));
  }
  return [...new Set(names)].sort();
}

/* ------------------------------------------------------------------ helpers */

describe('nativePropName', () => {
  it('turns CSS keys into identifiers that are valid on both platforms', () => {
    expect(nativePropName('feedback-success-on-solid')).toBe('feedbackSuccessOnSolid');
    expect(nativePropName('chart-1')).toBe('chart1');
    expect(nativePropName('2xl')).toBe('xl2');
    expect(nativePropName('4')).toBe('x4');
    expect(nativePropName('duration-fast')).toBe('durationFast');
  });
});

describe('tenants', () => {
  it('discovers every tenant in tenants/', () => {
    expect(TENANTS.length).toBeGreaterThan(0);
  });
});

/* ------------------------------------------------------------------ per tenant */

describe.each(built)('$id', ({ id, theme, kt, swift }) => {
  it('1. colours: every role and chart colour in both files equals the theme, byte for byte', () => {
    for (const scheme of SCHEMES) {
      const s = theme.schemes[scheme];
      const expected: Record<string, string> = {};
      for (const role of ROLES) expected[nativePropName(roleToCssVar(role).replace('--syntara-color-', ''))] = s.roles[role].hex;
      s.chart.series.forEach((hex, i) => (expected[`chart${i + 1}`] = hex));
      const inst = scheme === 'light' ? 'Light' : 'Dark';
      const fromKt = kotlinColors(kt, `${inst}Colors`);
      const fromSwift = swiftColors(swift, scheme);
      for (const [prop, hex] of Object.entries(expected)) {
        expect(fromKt[prop], `Kotlin ${scheme}.${prop}`).toBe(hex);
        expect(fromSwift[prop], `Swift ${scheme}.${prop}`).toBe(hex);
      }
      // chartGrid / chartAxis alias roles on the web (var()); natively they carry the same bytes.
      for (const got of [fromKt, fromSwift]) {
        expect(got.chartGrid).toBe(s.roles[CHART_GRID_ROLE].hex);
        expect(got.chartAxis).toBe(s.roles[CHART_AXIS_ROLE].hex);
      }
    }
  });

  it('2. contrast: every pair in contrast-pairs.json passes on the values read back from each file', () => {
    for (const [platform, src] of [['compose', kt], ['swiftui', swift]] as const) {
      const r = verifyNativeExport(theme, src, platform);
      expect(r.problems).toEqual([]);
      expect(r.checks).toHaveLength(PAIRS_PER_SCHEME * 2);
      expect(r.checks.every((c) => c.pass)).toBe(true);
      // Same pairs, same ratios as the engine's own checks: nothing changed on the way out.
      const engine = theme.checks.map((c) => `${c.scheme} ${c.fg} ${c.bg} ${c.ratio}`).sort();
      expect(r.checks.map((c) => `${c.scheme} ${c.fg} ${c.bg} ${c.ratio}`).sort()).toEqual(engine);
    }
  });

  it('3. no silent omissions: every CSS variable is exported or excluded with a reason', () => {
    const model = buildNativeModel(theme);
    const all = new Set<string>();
    for (const s of SCHEMES) for (const d of ['comfortable', 'compact'] as Density[]) for (const k of Object.keys(toCssVariables(theme, s, d))) all.add(k);
    const exported = model.groups.flatMap((g) => g.entries.map((e) => e.cssVar)).filter((v): v is string => !!v);
    const excluded = model.excluded.map((x) => x.cssVar);
    expect(new Set(exported).size).toBe(exported.length);
    expect(exported.filter((v) => excluded.includes(v))).toEqual([]);
    expect([...all].filter((v) => !exported.includes(v) && !excluded.includes(v))).toEqual([]);
    expect(exported.length + excluded.length).toBe(all.size);
    // Each exported variable is named in both files (doc comment), each excluded one in both headers.
    for (const v of exported) {
      expect(kt, `Kotlin mentions ${v}`).toContain(`\`${v}\``);
      expect(swift, `Swift mentions ${v}`).toContain(`\`${v}\``);
    }
    for (const v of excluded) {
      expect(kt.split('package ')[0]).toContain(v);
      expect(swift.split('import SwiftUI')[0]).toContain(v);
    }
  });

  it('4. units: sizes are the design values (dp / sp / pt), not changed, including sub-minimum control heights', () => {
    const f = theme.foundations;
    for (const [k, v] of Object.entries(f.space)) {
      expect(kt).toContain(`${nativePropName(k)} = ${v}.dp,`);
      expect(swift).toMatch(new RegExp(`\\b${nativePropName(k)}: ${v}\\b`));
    }
    for (const [k, v] of Object.entries(f.fontSize)) expect(kt).toContain(`${nativePropName(k)} = ${v}.sp,`);
    for (const d of Object.keys(f.density) as Density[]) {
      const name = d.charAt(0).toUpperCase() + d.slice(1);
      const k = block(kt, `val ${name}Density: SyntaraDensityTokens = SyntaraDensityTokens(`);
      const s = block(swift, `static let ${d} = SyntaraDensityTokens(`);
      for (const [key, v] of Object.entries(f.density[d])) {
        expect(k).toContain(`${key} = ${v}.dp,`);
        expect(s).toMatch(new RegExp(`\\b${key}: ${v}\\b`));
      }
    }
    // Font sizes scale with the user's text size: sp on Android, Font.custom(relativeTo:) on iOS.
    expect(block(kt, 'val FontSizes: SyntaraFontSizes = SyntaraFontSizes(')).not.toContain('.dp');
    expect(swift).toContain('Font.custom(family, size: size, relativeTo: textStyle(nearest: size))');
    // The platform touch-target minimum is documented, not applied.
    expect(kt).toContain('48.dp touch target');
    expect(swift).toContain('44 pt touch target');
  });

  it('5. RTL: tokens carry no direction (no left/right/start/end values)', () => {
    for (const src of [kt, swift]) {
      expect(src).toContain('Tokens carry no layout direction');
      const code = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
      expect(code).not.toMatch(/\b(?:left|right|start|end|layoutDirection|LayoutDirection)\b\s*[=:]/i);
    }
  });

  it('6. Kotlin structure: balanced, every instance sets exactly its class fields, every type is imported or declared', () => {
    const code = kt.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '').replace(/"(?:[^"\\]|\\.)*"/g, '""');
    for (const [open, close] of [['(', ')'], ['{', '}'], ['[', ']']] as const) {
      let depth = 0;
      for (const ch of code) {
        if (ch === open) depth++;
        if (ch === close) depth--;
        expect(depth, `${open}${close} closes before it opens`).toBeGreaterThanOrEqual(0);
      }
      expect(depth, `${open}${close} balanced`).toBe(0);
    }
    expect(code.trimStart().startsWith('package com.syntara.tokens\n')).toBe(true);

    const classes = new Map<string, string[]>();
    for (const m of code.matchAll(/data class (\w+)\(([\s\S]*?)\n\)/g)) {
      classes.set(m[1]!, [...m[2]!.matchAll(/val (\w+):/g)].map((x) => x[1]!));
    }
    expect(classes.size).toBeGreaterThan(5);
    let instances = 0;
    for (const m of code.matchAll(/val (\w+): (\w+) = \2\(\n([\s\S]*?)\n {4}\)/g)) {
      const fields = classes.get(m[2]!);
      expect(fields, `class ${m[2]} declared`).toBeDefined();
      const args = [...m[3]!.matchAll(/^ {8}(\w+) = /gm)].map((x) => x[1]!);
      expect(args, `${m[1]} sets every field of ${m[2]} once, in order`).toEqual(fields);
      instances++;
    }
    expect(instances).toBe(buildNativeModel(theme).groups.reduce((n, g) => n + g.variants.length, 0));

    const imported = new Set([...code.matchAll(/^import [\w.]+\.(\w+)$/gm)].map((m) => m[1]!));
    const declared = new Set([...code.matchAll(/\b(?:data class|enum class|object)\s+(\w+)/g)].map((m) => m[1]!));
    const builtins = new Set(['Boolean', 'Float', 'Int', 'List', 'String', 'Unit', 'T']);
    for (const m of code.matchAll(/:\s*(?:@Composable\s*\(\)\s*->\s*)?([A-Z]\w*)/g)) {
      const t = m[1]!;
      expect(imported.has(t) || declared.has(t) || builtins.has(t), `type ${t} is imported or declared`).toBe(true);
    }
    // Identifiers: no bare Kotlin hard keyword as a declared name.
    const KEYWORDS = ['as', 'break', 'class', 'continue', 'do', 'else', 'false', 'for', 'fun', 'if', 'in', 'interface', 'is', 'null', 'object', 'package', 'return', 'super', 'this', 'throw', 'true', 'try', 'typealias', 'typeof', 'val', 'var', 'when', 'while'];
    for (const m of code.matchAll(/\b(?:val|fun|class|object)\s+(\w+)/g)) expect(KEYWORDS, `identifier ${m[1]}`).not.toContain(m[1]);
    const body = code.replace(/^import .*$/gm, '');
    for (const i of imported) expect(body, `import ${i} is used`).toMatch(new RegExp(`\\b${i}\\b`));
  });

  it('7. brand is data: no tenant id in any declared name', () => {
    for (const [src, p] of [[kt, 'kotlin'], [swift, 'swift']] as const) {
      for (const name of declarations(src, p)) expect(name.toLowerCase()).not.toContain(id.toLowerCase());
    }
  });

  it('8. deterministic: same input, same bytes; no timestamps', () => {
    const again = generateTheme(theme.input);
    expect(toCompose(again)).toBe(kt);
    expect(toSwiftUI(again)).toBe(swift);
    for (const src of [kt, swift]) {
      expect(src).not.toMatch(/\b20\d\d-\d\d-\d\d\b|\d\d:\d\d:\d\d/);
      expect(src.split('\n')[0]).toBe('// GENERATED FILE. Do not edit by hand.');
      expect(src).toContain('Generated by @syntara/theme-engine@');
    }
  });
});

/* ------------------------------------------------------------------ across tenants */

describe('across tenants', () => {
  it('every tenant declares the same API, so switching brand means swapping the file', () => {
    for (const p of ['kotlin', 'swift'] as const) {
      const first = declarations(p === 'kotlin' ? built[0]!.kt : built[0]!.swift, p);
      for (const b of built.slice(1)) expect(declarations(p === 'kotlin' ? b.kt : b.swift, p), `${b.id} (${p})`).toEqual(first);
    }
  });

  it('every exclusion is still emitted by the engine and is written up in README-native.md', () => {
    const readme = readFileSync(readmeNative, 'utf8');
    const emitted = new Set(Object.keys(toCssVariables(built[0]!.theme, 'dark')));
    for (const v of Object.keys(NATIVE_EXCLUSIONS)) {
      expect(emitted.has(v), `${v} is still a CSS variable`).toBe(true);
      expect(readme, `README-native.md lists ${v}`).toContain(`\`${v}\``);
    }
  });
});

/* ------------------------------------------------------------------ the checks fail when they should */

describe('verifyNativeExport catches bad output', () => {
  const { theme, kt, swift } = built[0]!;
  const lightText = theme.schemes.light.roles['text.subtle'].hex.slice(1).toUpperCase();
  const lightCanvas = theme.schemes.light.roles['surface.canvas'].hex.slice(1).toUpperCase();

  it('a colour that differs from the theme', () => {
    const bad = kt.replace(`textSubtle = Color(0xFF${lightText})`, 'textSubtle = Color(0xFF000001)');
    expect(bad).not.toBe(kt);
    const r = verifyNativeExport(theme, bad, 'compose');
    expect(r.problems.some((p) => p.includes('textSubtle'))).toBe(true);
  });

  it('a colour that breaks a contrast pair', () => {
    const bad = swift.replace(`textSubtle: srgb(0x${lightText})`, `textSubtle: srgb(0x${lightCanvas})`);
    expect(bad).not.toBe(swift);
    const r = verifyNativeExport(theme, bad, 'swiftui');
    expect(r.problems.some((p) => /text\.subtle on surface\.canvas = 1\.000:1/.test(p))).toBe(true);
    expect(r.checks.some((c) => !c.pass)).toBe(true);
  });

  it('a missing colour block', () => {
    const r = verifyNativeExport(theme, kt.replace('val DarkColors: SyntaraColors', 'val Dark: SyntaraColors'), 'compose');
    expect(r.problems.some((p) => p.includes('DarkColors'))).toBe(true);
  });
});

/* ------------------------------------------------------------------ new tokens flow through without being named */

describe('tokens the exporter has never seen', () => {
  const theme = built[0]!.theme;
  const extra =
    (add: Record<string, (s: Scheme) => string>) =>
    (t: Theme, s: Scheme, d: Density): Record<string, string> => ({
      ...toCssVariables(t, s, d),
      ...Object.fromEntries(Object.entries(add).map(([k, f]) => [k, f(s)])),
    });

  it('land in the right group with the right unit, in both files', () => {
    const cssVariables = extra({
      '--syntara-font-min-size': () => '14px',
      '--syntara-line-height-loose': () => '1.8',
      '--syntara-color-brand-new': (s) => (s === 'light' ? '#123456' : '#abcdef'),
      '--syntara-script-gap': () => '6px',
    });
    const model = buildNativeModel(theme, { cssVariables });
    const kt = toCompose(theme, {}, model);
    const swift = toSwiftUI(theme, model);
    expect(kt).toContain('minSize = 14.sp,');
    expect(kt).toContain('loose = 1.8.em,');
    expect(kt).toContain('brandNew = Color(0xFF123456),');
    expect(kt).toContain('brandNew = Color(0xFFABCDEF),');
    expect(kt).toContain('data class SyntaraScript(');
    expect(kt).toContain('gap = 6.dp,');
    expect(swift).toContain('brandNew: srgb(0xABCDEF)');
    expect(swift).toContain('public static let script = SyntaraScript(');
    expect(verifyNativeExport(theme, kt, 'compose', model).problems).toEqual([]);
  });

  it('fail loudly when they have no native form and are not excluded', () => {
    const cssVariables = extra({ '--syntara-backdrop': () => 'radial-gradient(circle, red, blue)' });
    expect(() => buildNativeModel(theme, { cssVariables })).toThrow(/--syntara-backdrop .*NATIVE_EXCLUSIONS/);
  });
});

/* ------------------------------------------------------------------ snapshot */

describe('snapshot', () => {
  it('vela: the full Kotlin and Swift files, for review', async () => {
    const vela = built.find((b) => b.id === 'vela');
    if (!vela) return;
    await expect(vela.kt).toMatchFileSnapshot('./__snapshots__/native/vela.SyntaraTokens.kt');
    await expect(vela.swift).toMatchFileSnapshot('./__snapshots__/native/vela.SyntaraTokens.swift');
  });
});

/* ------------------------------------------------------------------ compilers */

const run = promisify(execFile);
const which = async (bin: string): Promise<string | undefined> => {
  try {
    return (await run('/usr/bin/which', [bin])).stdout.trim() || undefined;
  } catch {
    return undefined;
  }
};
const swiftc = await which('swiftc');
const kotlinc = await which('kotlinc');
const work = mkdtempSync(join(tmpdir(), 'syntara-native-'));
afterAll(() => rmSync(work, { recursive: true, force: true }));

describe('compilers', () => {
  it.skipIf(!swiftc)(
    'swiftc type-checks every tenant\'s Swift file (Swift 6 language mode, warnings as errors, macOS SDK)',
    async () => {
      const arch = process.arch === 'arm64' ? 'arm64' : 'x86_64';
      const results = await Promise.all(
        built.map(async ({ id, swift }) => {
          const file = join(work, `${id}.swift`);
          writeFileSync(file, swift);
          try {
            await run(swiftc!, ['-typecheck', '-swift-version', '6', '-warnings-as-errors', '-target', `${arch}-apple-macos14.0`, file]);
            return { id, ok: true, err: '' };
          } catch (err) {
            return { id, ok: false, err: String((err as { stderr?: string }).stderr ?? err) };
          }
        }),
      );
      expect(results.filter((r) => !r.ok)).toEqual([]);
    },
    300_000,
  );

  it.skipIf(!!kotlinc)('Kotlin is NOT compiled here: no kotlinc on this machine (structure is checked above instead)', () => {
    expect(kotlinc).toBeUndefined();
  });
});

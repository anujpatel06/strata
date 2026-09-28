/**
 * Theme → one Kotlin file of Jetpack Compose tokens (SyntaraTokens.kt).
 *
 *   @Immutable data class per group      SyntaraColors, SyntaraEffects, SyntaraSpace, SyntaraRadius, …
 *   object SyntaraTokens                   every value: LightColors / DarkColors, Space, ComfortableDensity, …
 *   Local<Group> CompositionLocals        only for values that change with scheme or density
 *   @Composable fun SyntaraTheme { }       provides them (darkTheme defaults to isSystemInDarkTheme())
 *   object SyntaraTheme                    SyntaraTheme.colors.textDefault, SyntaraTheme.space.x4, …
 *
 * Needs Compose runtime, UI, foundation (isSystemInDarkTheme) and animation-core (easing, spring). No Material.
 * The file carries no brand name in any identifier: switching brand means swapping the file.
 * Tokens only: Syntara ships no native components (ADR-019).
 */
import type { Theme } from '../types';
import {
  type NativeColor,
  type NativeEntry,
  type NativeGroup,
  type NativeKind,
  type NativeModel,
  type NativeShadowLayer,
  buildNativeModel,
  hexDigits,
  nativeInstanceName,
  num,
  wrap,
} from './native';
import { GENERATOR_ID } from './util';

const KOTLIN_KEYWORDS = new Set([
  'as', 'break', 'class', 'continue', 'do', 'else', 'false', 'for', 'fun', 'if', 'in', 'interface', 'is', 'null',
  'object', 'package', 'return', 'super', 'this', 'throw', 'true', 'try', 'typealias', 'typeof', 'val', 'var', 'when', 'while',
]);

/** A Kotlin identifier, backticked when it is a hard keyword. */
export const kotlinIdent = (name: string): string => (KOTLIN_KEYWORDS.has(name) ? `\`${name}\`` : name);

const pascal = (s: string): string => s.charAt(0).toUpperCase() + s.slice(1);

/** Kotlin string literal: escapes \, " and $ (string templates). */
const kstr = (s: string): string => `"${s.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\$/g, '\\$')}"`;

/** Text safe inside a Kotlin block comment (Kotlin block comments nest). */
const safeComment = (s: string): string => s.replace(/\/\*/g, '/ *').replace(/\*\//g, '* /');

const KOTLIN_TYPE: Record<NativeKind, string> = {
  color: 'Color',
  dimension: 'Dp',
  fontSize: 'TextUnit',
  em: 'TextUnit',
  number: 'Float',
  fontWeight: 'FontWeight',
  durationMs: 'Int',
  cubicBezier: 'CubicBezierEasing',
  shadow: 'List<SyntaraShadowLayer>',
  fontFamilies: 'List<String>',
};

const IMPORTS_FOR: Record<NativeKind, string[]> = {
  color: ['androidx.compose.ui.graphics.Color'],
  dimension: ['androidx.compose.ui.unit.Dp', 'androidx.compose.ui.unit.dp'],
  fontSize: ['androidx.compose.ui.unit.TextUnit', 'androidx.compose.ui.unit.sp'],
  em: ['androidx.compose.ui.unit.TextUnit', 'androidx.compose.ui.unit.em'],
  number: [],
  fontWeight: ['androidx.compose.ui.text.font.FontWeight'],
  durationMs: [],
  cubicBezier: ['androidx.compose.animation.core.CubicBezierEasing'],
  shadow: ['androidx.compose.ui.graphics.Color', 'androidx.compose.ui.unit.Dp', 'androidx.compose.ui.unit.dp'],
  fontFamilies: [],
};

/** n.dp / n.sp / n.em, parenthesising negatives so the unit binds to the number. */
const unit = (n: number, u: 'dp' | 'sp' | 'em'): string => (n < 0 ? `(${num(n)}).${u}` : `${num(n)}.${u}`);

function color(c: NativeColor): string {
  const base = `Color(0xFF${hexDigits(c.hex)})`;
  return c.alpha === 1 ? base : `${base}.copy(alpha = ${num(c.alpha)}f)`;
}

function shadowLayer(l: NativeShadowLayer): string {
  return (
    `SyntaraShadowLayer(color = ${color(l.color)}, offsetX = ${unit(l.offsetX, 'dp')}, offsetY = ${unit(l.offsetY, 'dp')}, ` +
    `blur = ${unit(l.blur, 'dp')}, spread = ${unit(l.spread, 'dp')}, inset = ${l.inset})`
  );
}

/** One value as a Kotlin expression (may span lines; continuation lines are indented by `indent`). */
function value(e: NativeEntry, v: unknown, indent: string): string {
  switch (e.kind) {
    case 'color':
      return color(v as NativeColor);
    case 'dimension':
      return unit(v as number, 'dp');
    case 'fontSize':
      return unit(v as number, 'sp');
    case 'em':
      return unit(v as number, 'em');
    case 'number':
      return `${num(v as number)}f`;
    case 'fontWeight':
      return `FontWeight(${num(v as number)})`;
    case 'durationMs':
      return num(v as number);
    case 'cubicBezier':
      return `CubicBezierEasing(${(v as number[]).map((n) => `${num(n)}f`).join(', ')})`;
    case 'shadow': {
      const layers = v as NativeShadowLayer[];
      if (layers.length === 0) return 'emptyList()';
      return `listOf(\n${layers.map((l) => `${indent}    ${shadowLayer(l)},`).join('\n')}\n${indent})`;
    }
    case 'fontFamilies': {
      const f = v as string[];
      return f.length ? `listOf(${f.map(kstr).join(', ')})` : 'emptyList()';
    }
  }
}

function kdoc(text: string, indent: string): string[] {
  const lines = wrap(safeComment(text), 96 - indent.length);
  if (lines.length === 1) return [`${indent}/** ${lines[0]} */`];
  return [`${indent}/**`, ...lines.map((l) => `${indent} * ${l}`.trimEnd()), `${indent} */`];
}

const entryDoc = (e: NativeEntry): string => (e.cssVar ? `\`${e.cssVar}\`` : e.source ?? '');

function dataClass(g: NativeGroup): string[] {
  const out = [...kdoc(g.doc('compose'), ''), '@Immutable', `data class ${g.cls}(`];
  for (const e of g.entries) {
    out.push(...kdoc(entryDoc(e), '    '));
    out.push(`    val ${kotlinIdent(e.prop)}: ${KOTLIN_TYPE[e.kind]},`);
  }
  out.push(')');
  if (g.accessor === 'spring') {
    out[out.length - 1] = ') {';
    out.push(
      '    /** damping / (2 × √(stiffness × mass)), the ratio Compose\'s spring() takes. */',
      '    val dampingRatio: Float get() = damping / (2f * sqrt(stiffness * mass))',
      '',
      '    /** A Compose spring with the same motion. Compose springs have unit mass, so stiffness is divided by [mass]. */',
      '    fun <T> spec(): SpringSpec<T> = spring(dampingRatio = dampingRatio, stiffness = stiffness / mass)',
      '}',
    );
  }
  return out;
}

/** "surfaceCanvas = Color(…)," lines for one instance, with a note on values that alias another token. */
function instance(model: NativeModel, g: NativeGroup, variant: string, name: string, indent: string): string[] {
  const propOf = new Map(model.groups.flatMap((x) => x.entries.map((e) => [e.cssVar, `${x.accessor}.${e.prop}`] as const)));
  const out = [`${indent}val ${name}: ${g.cls} = ${g.cls}(`];
  for (const e of g.entries) {
    const v = e.values[variant];
    let note = '';
    if (e.kind === 'color') {
      const c = v as NativeColor;
      if (c.from) note = ` // ${propOf.get(c.from) ?? c.from}${c.alpha === 1 ? '' : ` at ${num(c.alpha * 100)}%`}`;
    }
    out.push(`${indent}    ${kotlinIdent(e.prop)} = ${value(e, v, indent + '    ')},${note}`);
  }
  out.push(`${indent})`);
  return out;
}

export interface ToComposeOptions {
  /** Kotlin package. Default "com.syntara.tokens". */
  packageName?: string;
}

export function toCompose(theme: Theme, opts: ToComposeOptions = {}, model: NativeModel = buildNativeModel(theme)): string {
  const pkg = opts.packageName ?? 'com.syntara.tokens';
  if (!/^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)*$/.test(pkg)) throw new Error(`Invalid Kotlin package: ${pkg}`);
  const groups = model.groups;
  const modal = groups.filter((g) => g.varies !== 'none');
  const constant = groups.filter((g) => g.varies === 'none');
  const densityGroups = groups.filter((g) => g.varies === 'density');
  const densityVariants = densityGroups[0]?.variants ?? [];
  const kinds = new Set(groups.flatMap((g) => g.entries.map((e) => e.kind)));

  const imports = new Set<string>([
    'androidx.compose.foundation.isSystemInDarkTheme',
    'androidx.compose.runtime.Composable',
    'androidx.compose.runtime.CompositionLocalProvider',
    'androidx.compose.runtime.Immutable',
    'androidx.compose.runtime.ReadOnlyComposable',
    'androidx.compose.runtime.staticCompositionLocalOf',
  ]);
  for (const k of kinds) for (const i of IMPORTS_FOR[k]) imports.add(i);
  if (groups.some((g) => g.accessor === 'spring')) {
    imports.add('androidx.compose.animation.core.SpringSpec');
    imports.add('androidx.compose.animation.core.spring');
    imports.add('kotlin.math.sqrt');
  }

  const excluded = model.excluded.map((x) => x.cssVar).join(', ');
  const out: string[] = [
    '// GENERATED FILE. Do not edit by hand.',
    `// Syntara design tokens for Jetpack Compose. Brand: ${model.brandName.replace(/[\r\n]/g, ' ')}.`,
    `// Generated by ${GENERATOR_ID} (toCompose). Rebuild with \`pnpm tokens\`.`,
    '//',
    '// Tokens only: Syntara has no native components. See README-native.md in @syntara/tokens.',
    '// - Colours are the engine\'s 8-bit sRGB values, unchanged (no Display P3, no re-derivation), so the',
    '//   contrast the engine checked is the contrast the app shows. `pnpm tokens` reads the colours back',
    '//   out of this file and re-checks every contrast pair on them.',
    '// - 1 CSS px = 1 dp. Font sizes are sp, so they follow the user\'s font size setting.',
    '// - Tokens carry no layout direction. Compose mirrors layouts from the locale.',
    '// - Control heights are web design values and can be below the 48.dp touch target.',
    ...(excluded ? [`// - Left out on purpose (reasons in README-native.md): ${excluded}.`] : []),
    '',
    `package ${pkg}`,
    '',
    ...[...imports].sort().map((i) => `import ${i}`),
    '',
  ];

  // Types.
  if (kinds.has('shadow')) {
    out.push(
      ...kdoc(
        'One layer of a layered shadow, in dp, as written for the web. Compose has no layered or spread shadow; draw the layers yourself or map them to an elevation.',
        '',
      ),
      '@Immutable',
      'data class SyntaraShadowLayer(',
      '    val color: Color,',
      '    val offsetX: Dp,',
      '    val offsetY: Dp,',
      '    val blur: Dp,',
      '    val spread: Dp,',
      '    val inset: Boolean,',
      ')',
      '',
    );
  }
  for (const g of groups) out.push(...dataClass(g), '');
  if (densityVariants.length) {
    out.push(...kdoc('Density modes. The brand\'s default is SyntaraTokens.DefaultDensity.', ''));
    out.push(`enum class SyntaraDensity { ${densityVariants.map(pascal).join(', ')} }`, '');
  }

  // Values.
  out.push(...kdoc('Every token value. SyntaraTheme reads these; use them directly outside composition.', ''), 'object SyntaraTokens {');
  out.push('    /** The brand these values came from. Data only: code should not branch on it. */');
  out.push(`    const val BrandName: String = ${kstr(model.brandName)}`, '');
  if (densityVariants.length) {
    out.push(`    val DefaultDensity: SyntaraDensity = SyntaraDensity.${pascal(model.defaultDensity)}`, '');
  }
  for (const g of modal) {
    for (const variant of g.variants) out.push(...instance(model, g, variant, nativeInstanceName('compose', g, variant), '    '), '');
  }
  for (const g of constant) out.push(...instance(model, g, 'base', nativeInstanceName('compose', g, 'base'), '    '), '');
  for (const g of modal) {
    if (g.varies === 'scheme') {
      const [light, dark] = [nativeInstanceName('compose', g, 'light'), nativeInstanceName('compose', g, 'dark')];
      out.push(`    fun ${g.accessor}(darkTheme: Boolean): ${g.cls} = if (darkTheme) ${dark} else ${light}`, '');
    } else {
      out.push(`    fun ${g.accessor}(density: SyntaraDensity): ${g.cls} = when (density) {`);
      for (const v of g.variants) out.push(`        SyntaraDensity.${pascal(v)} -> ${nativeInstanceName('compose', g, v)}`);
      out.push('    }', '');
    }
  }
  out[out.length - 1] = '}';
  out.push('');

  // CompositionLocals for the values that change with scheme or density.
  for (const g of modal) {
    out.push(
      `val Local${g.cls} = staticCompositionLocalOf<${g.cls}> {`,
      `    error(${kstr(`No ${g.cls} provided. Wrap your content in SyntaraTheme { }.`)})`,
      '}',
      '',
    );
  }

  out.push(
    '/**',
    ' * Provides the scheme- and density-dependent Syntara tokens to [content]. Read them through SyntaraTheme:',
    ' *',
    ' * ```',
    ' * SyntaraTheme {',
    ' *     Text("Hi", color = SyntaraTheme.colors.textDefault, fontSize = SyntaraTheme.fontSize.md)',
    ' * }',
    ' * ```',
    ' */',
    '@Composable',
    'fun SyntaraTheme(',
    '    darkTheme: Boolean = isSystemInDarkTheme(),',
    ...(densityVariants.length ? ['    density: SyntaraDensity = SyntaraTokens.DefaultDensity,'] : []),
    '    content: @Composable () -> Unit,',
    ') {',
    '    CompositionLocalProvider(',
    ...modal.map((g) => `        Local${g.cls} provides SyntaraTokens.${g.accessor}(${g.varies === 'scheme' ? 'darkTheme' : 'density'}),`),
    '        content = content,',
    '    )',
    '}',
    '',
    ...kdoc('Syntara tokens for the current composition. Scheme and density values need a SyntaraTheme { } above them.', ''),
    'object SyntaraTheme {',
  );
  for (const g of modal) {
    out.push(`    val ${g.accessor}: ${g.cls}`, `        @Composable @ReadOnlyComposable get() = Local${g.cls}.current`, '');
  }
  for (const g of constant) out.push(`    val ${g.accessor}: ${g.cls} get() = SyntaraTokens.${nativeInstanceName('compose', g, 'base')}`);
  out.push('}', '');
  return out.join('\n');
}

/**
 * Theme → one Swift file of SwiftUI tokens (SyntaraTokens.swift).
 *
 *   struct per group                 SyntaraColors, SyntaraEffects, SyntaraSpace, SyntaraRadius, …
 *   SyntaraColors.light / .dark       values that change with the colour scheme (static lets)
 *   SyntaraDensityTokens.comfortable  values that change with density
 *   enum SyntaraTheme                 constant groups (SyntaraTheme.space.x4) + font(family:size:weight:)
 *   EnvironmentValues                syntaraColors, syntaraEffects, syntaraDensity
 *   View.syntaraTheme(density:)       sets them from the environment's colorScheme
 *
 * Light and dark are resolved through the environment's colorScheme, not dynamic UIColor/NSColor:
 * the file is plain SwiftUI, so it builds for iOS and macOS alike.
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

const SWIFT_KEYWORDS = new Set([
  'associatedtype', 'class', 'deinit', 'enum', 'extension', 'fileprivate', 'func', 'import', 'init', 'inout', 'internal',
  'let', 'open', 'operator', 'private', 'precedencegroup', 'protocol', 'public', 'rethrows', 'static', 'struct', 'subscript',
  'typealias', 'var', 'break', 'case', 'catch', 'continue', 'default', 'defer', 'do', 'else', 'fallthrough', 'for', 'guard',
  'if', 'in', 'repeat', 'return', 'throw', 'switch', 'where', 'while', 'Any', 'as', 'false', 'is', 'nil', 'self', 'Self',
  'super', 'throws', 'true', 'try',
]);

/** A Swift identifier, backticked when it is a keyword. */
export const swiftIdent = (name: string): string => (SWIFT_KEYWORDS.has(name) ? `\`${name}\`` : name);

/** Swift string literal. Escaping the backslash also disarms "\(" interpolation. */
const sstr = (s: string): string => `"${s.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n')}"`;

const SWIFT_TYPE: Record<NativeKind, string> = {
  color: 'Color',
  dimension: 'CGFloat',
  fontSize: 'CGFloat',
  em: 'CGFloat',
  number: 'Double',
  fontWeight: 'Font.Weight',
  durationMs: 'TimeInterval',
  cubicBezier: 'SyntaraCubicBezier',
  shadow: '[SyntaraShadowLayer]',
  fontFamilies: '[String]',
};

/** CSS numeric weights → SwiftUI's named weights (SwiftUI has no numeric Font.Weight initialiser). */
const WEIGHTS: Record<number, string> = {
  100: 'ultraLight',
  200: 'thin',
  300: 'light',
  400: 'regular',
  500: 'medium',
  600: 'semibold',
  700: 'bold',
  800: 'heavy',
  900: 'black',
};

function color(c: NativeColor): string {
  return c.alpha === 1 ? `srgb(0x${hexDigits(c.hex)})` : `srgb(0x${hexDigits(c.hex)}, opacity: ${num(c.alpha)})`;
}

function shadowLayer(l: NativeShadowLayer): string {
  return (
    `SyntaraShadowLayer(color: ${color(l.color)}, offsetX: ${num(l.offsetX)}, offsetY: ${num(l.offsetY)}, ` +
    `blur: ${num(l.blur)}, spread: ${num(l.spread)}, inset: ${l.inset})`
  );
}

function value(e: NativeEntry, v: unknown, indent: string): string {
  switch (e.kind) {
    case 'color':
      return color(v as NativeColor);
    case 'dimension':
    case 'fontSize':
    case 'em':
    case 'number':
      return num(v as number);
    case 'fontWeight': {
      const name = WEIGHTS[v as number];
      if (!name) throw new Error(`toSwiftUI: font weight ${String(v)} has no SwiftUI Font.Weight (use a multiple of 100)`);
      return `.${name}`;
    }
    case 'durationMs':
      return num((v as number) / 1000);
    case 'cubicBezier': {
      const [x1, y1, x2, y2] = (v as number[]).map(num);
      return `SyntaraCubicBezier(x1: ${x1}, y1: ${y1}, x2: ${x2}, y2: ${y2})`;
    }
    case 'shadow': {
      const layers = v as NativeShadowLayer[];
      if (layers.length === 0) return '[]';
      return `[\n${layers.map((l) => `${indent}    ${shadowLayer(l)}`).join(',\n')}\n${indent}]`;
    }
    case 'fontFamilies':
      return `[${(v as string[]).map(sstr).join(', ')}]`;
  }
}

const doc = (text: string, indent: string): string[] => wrap(text, 96 - indent.length).map((l) => `${indent}/// ${l}`.trimEnd());

const entryDoc = (e: NativeEntry): string => {
  const unit =
    e.kind === 'durationMs' ? ' (seconds)' : e.kind === 'dimension' ? ' (points)' : e.kind === 'fontSize' ? ' (points at the default text size)' : '';
  return (e.cssVar ? `\`${e.cssVar}\`` : e.source ?? '') + unit;
};

function struct(g: NativeGroup): string[] {
  const out = [...doc(g.doc('swiftui'), ''), `public struct ${g.cls}: Equatable, Sendable {`];
  for (const e of g.entries) {
    out.push(...doc(entryDoc(e), '    '), `    public let ${swiftIdent(e.prop)}: ${SWIFT_TYPE[e.kind]}`);
  }
  if (g.accessor === 'spring') {
    out.push(
      '',
      '    /// The same spring as a SwiftUI animation.',
      '    public var animation: Animation {',
      '        .interpolatingSpring(mass: mass, stiffness: stiffness, damping: damping, initialVelocity: 0)',
      '    }',
    );
  }
  out.push('}');
  return out;
}

/** "name = SyntaraX(\n  a: …,\n  b: …\n)" — no trailing comma (Swift < 6.1 rejects it in argument lists). */
function instance(model: NativeModel, g: NativeGroup, variant: string, decl: string, indent: string): string[] {
  const propOf = new Map(model.groups.flatMap((x) => x.entries.map((e) => [e.cssVar, `${x.accessor}.${e.prop}`] as const)));
  const out = [`${indent}${decl} = ${g.cls}(`];
  g.entries.forEach((e, i) => {
    const v = e.values[variant];
    let note = '';
    if (e.kind === 'color') {
      const c = v as NativeColor;
      if (c.from) note = ` // ${propOf.get(c.from) ?? c.from}${c.alpha === 1 ? '' : ` at ${num(c.alpha * 100)}%`}`;
    }
    const comma = i < g.entries.length - 1 ? ',' : '';
    out.push(`${indent}    ${e.prop}: ${value(e, v, indent + '    ')}${comma}${note}`);
  });
  out.push(`${indent})`);
  return out;
}

const envKey = (g: NativeGroup): string => `${g.cls}Key`;
const envName = (g: NativeGroup): string => `syntara${g.accessor.charAt(0).toUpperCase()}${g.accessor.slice(1)}`;

export function toSwiftUI(theme: Theme, model: NativeModel = buildNativeModel(theme)): string {
  const groups = model.groups;
  const modal = groups.filter((g) => g.varies !== 'none');
  const constant = groups.filter((g) => g.varies === 'none');
  const densityVariants = groups.find((g) => g.varies === 'density')?.variants ?? [];
  const kinds = new Set(groups.flatMap((g) => g.entries.map((e) => e.kind)));
  const excluded = model.excluded.map((x) => x.cssVar).join(', ');

  const out: string[] = [
    '// GENERATED FILE. Do not edit by hand.',
    `// Syntara design tokens for SwiftUI. Brand: ${model.brandName.replace(/[\r\n]/g, ' ')}.`,
    `// Generated by ${GENERATOR_ID} (toSwiftUI). Rebuild with \`pnpm tokens\`.`,
    '//',
    '// Tokens only: Syntara has no native components. See README-native.md in @syntara/tokens.',
    '// - Colours are the engine\'s 8-bit sRGB values, unchanged (no Display P3, no re-derivation), so the',
    '//   contrast the engine checked is the contrast the app shows. `pnpm tokens` reads the colours back',
    '//   out of this file and re-checks every contrast pair on them.',
    '// - Light and dark come from the environment\'s colorScheme: apply .syntaraTheme() and read',
    '//   @Environment(\\.syntaraColors). Values are also available directly: SyntaraColors.light / .dark.',
    '// - 1 CSS px = 1 pt. Use SyntaraTheme.font(family:size:weight:) so text follows Dynamic Type.',
    '// - Tokens carry no layout direction. SwiftUI mirrors layouts from the locale.',
    '// - Control heights are web design values and can be below the 44 pt touch target.',
    ...(excluded ? [`// - Left out on purpose (reasons in README-native.md): ${excluded}.`] : []),
    '',
    '// swiftlint:disable all',
    '',
    'import SwiftUI',
    '',
    '/// An sRGB colour from 8-bit channels written as 0xRRGGBB: the exact bytes the engine produced.',
    'private func srgb(_ rgb: UInt32, opacity: Double = 1) -> Color {',
    '    Color(',
    '        .sRGB,',
    '        red: Double((rgb >> 16) & 0xFF) / 255,',
    '        green: Double((rgb >> 8) & 0xFF) / 255,',
    '        blue: Double(rgb & 0xFF) / 255,',
    '        opacity: opacity',
    '    )',
    '}',
    '',
  ];

  if (kinds.has('shadow')) {
    out.push(
      ...doc(
        'One layer of a layered shadow, in points, as written for the web. `blur` is the CSS blur length; SwiftUI .shadow(radius:) is a different measure, so check the result by eye. SwiftUI has no spread or inset shadow.',
        '',
      ),
      'public struct SyntaraShadowLayer: Equatable, Sendable {',
      '    public let color: Color',
      '    public let offsetX: CGFloat',
      '    public let offsetY: CGFloat',
      '    public let blur: CGFloat',
      '    public let spread: CGFloat',
      '    public let inset: Bool',
      '}',
      '',
    );
  }
  if (kinds.has('cubicBezier')) {
    out.push(
      '/// A CSS cubic-bezier() easing curve.',
      'public struct SyntaraCubicBezier: Equatable, Sendable {',
      '    public let x1: Double',
      '    public let y1: Double',
      '    public let x2: Double',
      '    public let y2: Double',
      '',
      '    /// This curve as a SwiftUI animation.',
      '    public func animation(duration: TimeInterval) -> Animation {',
      '        .timingCurve(x1, y1, x2, y2, duration: duration)',
      '    }',
      '}',
      '',
    );
  }
  for (const g of groups) out.push(...struct(g), '');
  if (densityVariants.length) {
    out.push(
      '/// Density modes. The brand\'s default is SyntaraTheme.defaultDensity.',
      'public enum SyntaraDensity: String, CaseIterable, Sendable {',
      ...densityVariants.map((v) => `    case ${swiftIdent(v)}`),
      '}',
      '',
    );
  }

  // Values that change with scheme or density: static lets on their struct.
  for (const g of modal) {
    out.push(`extension ${g.cls} {`);
    for (const v of g.variants) out.push(...instance(model, g, v, `public static let ${nativeInstanceName('swiftui', g, v)}`, '    '), '');
    if (g.varies === 'scheme') {
      out.push(
        `    /// The ${g.cls} for a colour scheme.`,
        `    public static func forScheme(_ scheme: ColorScheme) -> ${g.cls} {`,
        '        scheme == .dark ? .dark : .light',
        '    }',
      );
    } else {
      out.push(
        `    /// The ${g.cls} for a density.`,
        `    public static func forDensity(_ density: SyntaraDensity) -> ${g.cls} {`,
        '        switch density {',
        ...g.variants.map((v) => `        case .${swiftIdent(v)}: return .${swiftIdent(v)}`),
        '        }',
        '    }',
      );
    }
    out.push('}', '');
  }

  // Constant values.
  out.push(
    '/// Every value that doesn\'t change with scheme or density, and helpers.',
    'public enum SyntaraTheme {',
    '    /// The brand these values came from. Data only: code should not branch on it.',
    `    public static let brandName = ${sstr(model.brandName)}`,
  );
  if (densityVariants.length) out.push(`    public static let defaultDensity: SyntaraDensity = .${swiftIdent(model.defaultDensity)}`);
  out.push('');
  for (const g of constant) out.push(...instance(model, g, 'base', `public static let ${nativeInstanceName('swiftui', g, 'base')}`, '    '), '');
  out.push(
    '    /// A custom font at a Syntara size that follows Dynamic Type. It scales relative to the Apple text',
    '    /// style whose default size is nearest (ties go to the larger style). The app must bundle and',
    '    /// register the font; if it isn\'t found, SwiftUI falls back to the system font.',
    '    public static func font(family: String, size: CGFloat, weight: Font.Weight = .regular) -> Font {',
    '        Font.custom(family, size: size, relativeTo: textStyle(nearest: size)).weight(weight)',
    '    }',
    '',
    '    /// The Apple text style whose default size (at the Large content size) is nearest to `size`.',
    '    public static func textStyle(nearest size: CGFloat) -> Font.TextStyle {',
    '        let styles: [(style: Font.TextStyle, size: CGFloat)] = [',
    '            (.caption2, 11), (.caption, 12), (.footnote, 13), (.subheadline, 15), (.callout, 16),',
    '            (.body, 17), (.title3, 20), (.title2, 22), (.title, 28), (.largeTitle, 34),',
    '        ]',
    '        var best = styles[0]',
    '        for candidate in styles where abs(candidate.size - size) <= abs(best.size - size) {',
    '            best = candidate',
    '        }',
    '        return best.style',
    '    }',
    '}',
    '',
  );

  // Environment.
  for (const g of modal) {
    const def = g.varies === 'scheme' ? '.light' : `.forDensity(SyntaraTheme.defaultDensity)`;
    out.push(`private struct ${envKey(g)}: EnvironmentKey {`, `    static let defaultValue: ${g.cls} = ${def}`, '}', '');
  }
  out.push('extension EnvironmentValues {');
  modal.forEach((g, i) => {
    const note =
      g.varies === 'scheme'
        ? 'Set by .syntaraTheme() from the colour scheme. Light until then.'
        : `Set by .syntaraTheme(density:). The brand's default density until then.`;
    out.push(
      `    /// ${note}`,
      `    public var ${envName(g)}: ${g.cls} {`,
      `        get { self[${envKey(g)}.self] }`,
      `        set { self[${envKey(g)}.self] = newValue }`,
      '    }',
    );
    if (i < modal.length - 1) out.push('');
  });
  out.push('}', '');

  const densityParam = densityVariants.length ? 'density: SyntaraDensity = SyntaraTheme.defaultDensity' : '';
  out.push(
    'extension View {',
    '    /// Puts Syntara\'s colour, effect and density tokens into the environment, matching the',
    '    /// environment\'s colorScheme where this modifier is applied. A subtree that sets its own',
    '    /// colorScheme below this point needs .syntaraTheme() again.',
    `    public func syntaraTheme(${densityParam}) -> some View {`,
    `        modifier(SyntaraThemeModifier(${densityVariants.length ? 'density: density' : ''}))`,
    '    }',
    '}',
    '',
    'private struct SyntaraThemeModifier: ViewModifier {',
    ...(densityVariants.length ? ['    let density: SyntaraDensity'] : []),
    '    @Environment(\\.colorScheme) private var colorScheme',
    '',
    '    func body(content: Content) -> some View {',
    '        content',
    ...modal.map((g) => `            .environment(\\.${envName(g)}, .${g.varies === 'scheme' ? 'forScheme(colorScheme)' : 'forDensity(density)'})`),
    '    }',
    '}',
    '',
  );
  return out.join('\n');
}

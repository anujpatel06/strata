/**
 * Server-only data for /docs/color ("Using colour"). Everything is read from its source at build time:
 * the engine (generateTheme for every tenants/<id>/brand.json, the house brand included), the pair list in
 * packages/theme-engine/src/contrast-pairs.json, and the two component files whose numbers the page quotes.
 * Nothing on the page is typed in by hand.
 */
import { ROLES, contrastRatio, generateTheme, type Role, type Scheme, type Theme } from '@syntara/theme-engine';
import { cache } from 'react';
import { HOUSE_ID } from '@/lib/house';
import { readRepoFile } from '@/lib/repo';
import { getHouseBrand, getTenants } from '@/lib/tenants';

export type Kind = 'text' | 'non-text';

export interface LiveTenant {
  id: string;
  name: string;
  /** BCP 47 locale from content.json; Qamar's makes its live regions right-to-left. */
  locale: string;
}

/** Hex per tenant per scheme, for the swatch labels (the chips themselves read the live CSS variable). */
export type RoleHexes = Record<string, Record<Scheme, string>>;

export interface MatrixCell {
  bg: Role;
  /** Worst ratio across every tenant and both schemes. Only set for guaranteed pairs. */
  worst?: number;
  /** Tenant and scheme of the worst ratio, e.g. "Care dark". */
  worstAt?: string;
}

export interface MatrixRow {
  fg: Role;
  cells: MatrixCell[];
}

export interface Matrix {
  kind: Kind;
  required: number;
  columns: Role[];
  rows: MatrixRow[];
}

export interface FillRow {
  fg: Role;
  fills: Array<{ bg: Role; worst: number; worstAt: string }>;
}

/** An unlisted pair that passes in some themes and fails in others: it looks safe and isn't. */
export interface NearMiss {
  fg: Role;
  bg: Role;
  kind: Kind;
  required: number;
  worst: number;
  worstAt: string;
  /** How many of the tenant × scheme themes it passes in, out of `of`. */
  passes: number;
  of: number;
}

interface PairsFile {
  requirements: Record<Kind, number>;
  pairs: Array<{ fg: Role; kind: Kind; against: Role[] }>;
}

export interface ColorUsageData {
  tenants: LiveTenant[];
  hexes: Record<Role, RoleHexes>;
  requirements: Record<Kind, number>;
  text: Matrix;
  nonText: Matrix;
  fills: FillRow[];
  nearMisses: NearMiss[];
  /** Unlisted role pairs in the two matrices that pass in every theme today (still not guaranteed). */
  luckyCount: number;
  unlistedCount: number;
  themeCount: number;
  /** Chart series: the worst 3:1 margin against surface.raised and surface.default across all themes. */
  chartWorst: { ratio: number; at: string };
  /** Glass opacity range across tenants and schemes (percent, solved by the engine). */
  glass: { min: number; max: number };
  /** The feature card's glow strength per scheme and its fade stop, read from card.module.css. */
  featureGlow?: { light: number; dark: number; stop: number };
  /** The "don't" pair on the page: feedback.danger.fg on action.primary.bg, lowest over every theme. */
  dangerOnBrand: { ratio: number; at: string };
  /** Dark-mode field edge: % of border.strong mixed into border.default, from text-field.module.css. */
  fieldDarkMix?: number;
}

const SCHEMES: Scheme[] = ['light', 'dark'];
const SURFACES = ROLES.filter((r) => r.startsWith('surface.'));

/** Floors to 2 decimals: ratios are never rounded up (4.499 shows as 4.49, which fails). */
export const floor2 = (n: number) => (Math.floor(n * 100) / 100).toFixed(2);

export const getColorUsageData = cache((): ColorUsageData => {
  const raw = readRepoFile('packages', 'theme-engine', 'src', 'contrast-pairs.json');
  const file = JSON.parse(raw ?? '{"requirements":{"text":4.5,"non-text":3},"pairs":[]}') as PairsFile;

  const infos = [
    { id: HOUSE_ID, name: 'House', locale: 'en-US', brand: getHouseBrand() },
    ...getTenants().map((t) => ({ id: t.id, name: t.name, locale: t.locale, brand: t.brand })),
  ];
  const themes: Array<{ id: string; name: string; theme: Theme }> = infos.map((t) => ({
    id: t.id,
    name: t.name,
    theme: generateTheme(t.brand),
  }));
  const hexOf = (theme: Theme, scheme: Scheme, role: Role) => theme.schemes[scheme].roles[role].hex;

  const hexes = Object.fromEntries(
    ROLES.map((role) => [
      role,
      Object.fromEntries(
        themes.map((t) => [t.id, { light: hexOf(t.theme, 'light', role), dark: hexOf(t.theme, 'dark', role) }]),
      ),
    ]),
  ) as Record<Role, RoleHexes>;

  /** The lowest ratio of a pair over every tenant × scheme, measured on the final hex (what the engine checks). */
  const worstOf = (fg: Role, bg: Role) => {
    let worst = Infinity;
    let worstAt = '';
    let passes = 0;
    const required = file.pairs.find((p) => p.fg === fg)?.kind === 'non-text' ? file.requirements['non-text'] : file.requirements.text;
    for (const t of themes) {
      for (const s of SCHEMES) {
        const r = contrastRatio(hexOf(t.theme, s, fg), hexOf(t.theme, s, bg));
        if (r >= required) passes++;
        if (r < worst) {
          worst = r;
          worstAt = `${t.name} ${s}`;
        }
      }
    }
    return { worst, worstAt, passes, required };
  };

  const guaranteed = new Set(file.pairs.flatMap((p) => p.against.map((bg) => `${p.fg}|${bg}`)));
  const themeCount = themes.length * SCHEMES.length;

  const nearMisses: NearMiss[] = [];
  let luckyCount = 0;
  let unlistedCount = 0;

  const matrix = (kind: Kind): Matrix => {
    const pairs = file.pairs.filter((p) => p.kind === kind && p.against.some((bg) => SURFACES.includes(bg as never)));
    const columns = SURFACES.filter((s) => file.pairs.some((p) => p.against.includes(s)));
    const rows = pairs.map((p) => ({
      fg: p.fg,
      cells: columns.map((bg): MatrixCell => {
        const w = worstOf(p.fg, bg);
        if (guaranteed.has(`${p.fg}|${bg}`)) return { bg, worst: w.worst, worstAt: w.worstAt };
        unlistedCount++;
        if (w.passes === themeCount) luckyCount++;
        else if (w.passes * 2 > themeCount) nearMisses.push({ fg: p.fg, bg, kind, required: w.required, worst: w.worst, worstAt: w.worstAt, passes: w.passes, of: themeCount });
        return { bg };
      }),
    }));
    return { kind, required: file.requirements[kind], columns, rows };
  };

  const text = matrix('text');
  const nonText = matrix('non-text');

  const fills: FillRow[] = file.pairs
    .filter((p) => p.kind === 'text')
    .map((p) => ({
      fg: p.fg,
      fills: p.against
        .filter((bg) => !SURFACES.includes(bg as never))
        .map((bg) => {
          const w = worstOf(p.fg, bg);
          return { bg, worst: w.worst, worstAt: w.worstAt };
        }),
    }))
    .filter((row) => row.fills.length > 0);

  // Charts: every series must reach 3:1 on surface.raised and surface.default (ADR-016).
  let chartWorst = { ratio: Infinity, at: '' };
  const opacities: number[] = [];
  for (const t of themes) {
    for (const s of SCHEMES) {
      const sch = t.theme.schemes[s];
      opacities.push(sch.glass.opacity);
      sch.chart.series.forEach((hex, i) => {
        for (const bg of ['surface.raised', 'surface.default'] as const) {
          const r = contrastRatio(hex, sch.roles[bg].hex);
          if (r < chartWorst.ratio) chartWorst = { ratio: r, at: `${t.name} ${s}, series ${i + 1} on ${bg}` };
        }
      });
    }
  }

  const dob = worstOf('feedback.danger.fg', 'action.primary.bg');
  const dangerOnBrand = { ratio: dob.worst, at: dob.worstAt };

  // Numbers quoted from component CSS, read the same way their tests read them.
  const cardCss = readRepoFile('packages', 'react', 'src', 'ui', 'card.module.css') ?? '';
  const glowBlock = /--_glow: light-dark\(([\s\S]*?)\);\n/.exec(cardCss)?.[1] ?? '';
  const [gl, gd] = [...glowBlock.matchAll(/action-primary-bg\) (\d+)%/g)].map((m) => Number(m[1]));
  const stop = /var\(--_glow\) 0%, var\(--syntara-color-surface-raised\) (\d+)%/.exec(cardCss)?.[1];
  const fieldCss = readRepoFile('packages', 'react', 'src', 'ui', 'text-field.module.css') ?? '';
  const fieldMix = /color-mix\(in oklab, var\(--syntara-color-border-strong\) (\d+)%, var\(--syntara-color-border-default\)\)/.exec(fieldCss)?.[1];

  return {
    tenants: infos.map(({ id, name, locale }) => ({ id, name, locale })),
    hexes,
    requirements: file.requirements,
    text,
    nonText,
    fills,
    nearMisses,
    luckyCount,
    unlistedCount,
    themeCount,
    chartWorst,
    dangerOnBrand,
    glass: { min: Math.round(Math.min(...opacities) * 100), max: Math.round(Math.max(...opacities) * 100) },
    ...(gl != null && gd != null && stop ? { featureGlow: { light: gl, dark: gd, stop: Number(stop) } } : {}),
    ...(fieldMix ? { fieldDarkMix: Number(fieldMix) } : {}),
  };
});

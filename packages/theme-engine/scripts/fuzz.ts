/**
 * Theme fuzz: 1,000 random brands × light/dark through generateTheme, every contrast pair checked.
 *
 *   pnpm test:themes            (root)  =  pnpm --filter @syntara/theme-engine fuzz
 *
 * Writes reports/fuzz-report.json and reports/fuzz-report.md. Exits 1 if any check fails.
 * Inputs are fully determined by the seed; only the timing numbers vary between runs/machines.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { cpus } from 'node:os';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { contrastRatio, formatRatio } from '../src/color';
import { CHART_AXIS_ROLE, CHART_GRID_ROLE, CHART_SERIES, CHART_SURFACES, chartCvdDeltaE, chartDeltaE, chartPaletteProblems } from '../src/chart';
import { brandFidelity, type BrandColorInput } from '../src/fidelity';
import { GLASS_TEXT_ROLES, glassWorstRatio } from '../src/glass';
import { BASE_STEP, RAMP_NAMES } from '../src/ramps';
import { CONTRAST_PAIRS } from '../src/roles';
import { countTokens, generateTheme } from '../src/theme';
import {
  ROLES,
  type AdjustmentKind,
  type BrandInput,
  type ContrastCheck,
  type Density,
  type NeutralTemperature,
  type RampName,
  type Role,
  type Scheme,
  type Shape,
  type Theme,
  type TypePairId,
} from '../src/types';

export const FUZZ_SEED = 2026;
export const FUZZ_THEMES = 1000;
export const FUZZ_COMMAND = 'pnpm test:themes';

/** mulberry32 — tiny, fast, well-distributed 32-bit PRNG. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const NEUTRALS: NeutralTemperature[] = ['cool', 'neutral', 'warm', 'paper'];
const SHAPES: Shape[] = ['sharp', 'soft', 'round'];
/**
 * Frozen: the pairs that existed when the published numbers were first run. Appending one (bilingual-devanagari,
 * ADR-020) would re-map the pair 487 of the 1,000 brands draw. It changes no colour output or fuzz number (the pair
 * isn't an input to colour), but it would change the brands themselves, so new pairs are covered by
 * test/script-type.test.ts instead.
 */
const TYPE_PAIR_IDS: TypePairId[] = ['precise', 'calm', 'friendly', 'technical', 'bilingual-round', 'bilingual-classic', 'editorial', 'modern'];
const DENSITIES: Density[] = ['comfortable', 'compact'];

/** Deterministic random brands: random primary; random neutral/shape/typePair/density; 50% get a random accent. */
export function fuzzInputs(seed = FUZZ_SEED, count = FUZZ_THEMES): BrandInput[] {
  const rand = mulberry32(seed);
  const pick = <T>(xs: readonly T[]): T => xs[Math.floor(rand() * xs.length)]!;
  const hex = () => '#' + Math.floor(rand() * 0x1000000).toString(16).padStart(6, '0');
  const out: BrandInput[] = [];
  for (let i = 0; i < count; i++) {
    const primary = hex();
    const neutral = pick(NEUTRALS);
    const shape = pick(SHAPES);
    const typePair = pick(TYPE_PAIR_IDS);
    const density = pick(DENSITIES);
    const accent = rand() < 0.5 ? hex() : undefined;
    const input: BrandInput = { name: `Fuzz ${i + 1}`, primary, neutral, shape, typePair, density };
    if (accent) input.accent = accent;
    out.push(input);
  }
  return out;
}

const HEX = /^#[0-9a-f]{6}$/;
const EXPECTED_CHECKS = 2 * CONTRAST_PAIRS.reduce((n, p) => n + p.against.length, 0);

/**
 * Structural invariants every generated theme must satisfy, beyond the contrast checks themselves.
 * Returns human-readable violations (empty = valid). Used by the fuzz run and the test suites.
 */
export function validateTheme(theme: Theme): string[] {
  const problems: string[] = [];
  const bad = (msg: string) => problems.push(msg);

  if (theme.checks.length !== EXPECTED_CHECKS) bad(`expected ${EXPECTED_CHECKS} checks, got ${theme.checks.length}`);
  const passed = theme.checks.filter((c) => c.pass).length;
  if (theme.summary.checks !== theme.checks.length) bad('summary.checks mismatch');
  if (theme.summary.passed !== passed) bad('summary.passed mismatch');
  if (theme.summary.failed !== theme.checks.length - passed) bad('summary.failed mismatch');
  if (theme.summary.adjustments !== theme.adjustments.length) bad('summary.adjustments mismatch');
  if (theme.summary.tokenCount !== countTokens()) bad('summary.tokenCount mismatch');

  // Glass: text on the translucent overlay surface passes over a black AND a white backdrop.
  for (const scheme of ['light', 'dark'] as const) {
    const { roles, glass } = theme.schemes[scheme];
    for (const r of GLASS_TEXT_ROLES) {
      const ratio = glassWorstRatio(roles['surface.raised'].hex, roles[r].hex, glass.opacity);
      if (ratio < 4.5) bad(`${scheme} ${r} on glass (${glass.opacity}) only reaches ${formatRatio(ratio)}:1`);
    }
  }

  // Chart palette: 4 series that pass the dataviz checks (band, chroma, 3:1 on both surfaces, CVD + normal ΔE).
  for (const scheme of ['light', 'dark'] as const) {
    const { roles, chart } = theme.schemes[scheme];
    if (chart.series.length !== CHART_SERIES) bad(`${scheme} chart has ${chart.series.length} series`);
    for (const hex of chart.series) if (!HEX.test(hex)) bad(`${scheme} chart series has invalid hex ${hex}`);
    const surfaces = CHART_SURFACES.map((r) => roles[r].hex);
    for (const p of chartPaletteProblems(chart.series, scheme, surfaces)) bad(`${scheme} chart ${p}`);
    if (chart.grid !== roles[CHART_GRID_ROLE].hex || chart.axis !== roles[CHART_AXIS_ROLE].hex) bad(`${scheme} chart grid/axis differ from their roles`);
  }

  const seenPairs = new Set<string>();
  for (const c of theme.checks) {
    const key = `${c.scheme}|${c.fg}|${c.bg}`;
    if (seenPairs.has(key)) bad(`duplicate check ${key}`);
    seenPairs.add(key);
    const roles = theme.schemes[c.scheme].roles;
    if (c.fgHex !== roles[c.fg].hex || c.bgHex !== roles[c.bg].hex) bad(`check ${key} hex differs from resolved role`);
    if (c.ratio !== contrastRatio(c.fgHex, c.bgHex)) bad(`check ${key} ratio not recomputable from hex`);
    if (c.pass !== c.ratio >= c.required) bad(`check ${key} pass flag inconsistent`);
  }

  const adjIds = new Set<string>();
  for (const a of theme.adjustments) {
    if (adjIds.has(a.id)) bad(`duplicate adjustment id ${a.id}`);
    adjIds.add(a.id);
    if (!a.id.startsWith(`${a.scheme}:${a.role}`)) bad(`adjustment id ${a.id} does not match scheme/role`);
    if (!a.label) bad(`adjustment ${a.id} has no label`);
    if (!HEX.test(a.fromHex) || !HEX.test(a.toHex)) bad(`adjustment ${a.id} has invalid hexes`);
    if (a.fromHex === a.toHex) bad(`adjustment ${a.id} changes nothing`);
    // "White labels on …" names white in words (the brief's voice); every other hex is quoted.
    const mentions = (hex: string) => a.message.includes(hex) || (hex === '#ffffff' && /\bwhite\b/i.test(a.message));
    if (!mentions(a.fromHex) || !mentions(a.toHex)) bad(`adjustment ${a.id} message lacks hexes`);
    if (a.ratioBefore !== undefined && !a.message.includes(`${formatRatio(a.ratioBefore)}:1`)) bad(`adjustment ${a.id} message lacks floored ratio`);
    if (!theme.schemes[a.scheme].roles[a.role].adjusted) bad(`adjustment ${a.id} but role not marked adjusted`);
  }

  for (const scheme of ['light', 'dark'] as const) {
    const s = theme.schemes[scheme];
    for (const name of RAMP_NAMES) {
      const ramp = s.ramps[name];
      if (ramp.length !== 12) bad(`${scheme} ${name} ramp has ${ramp.length} steps`);
      for (const hex of ramp) if (!HEX.test(hex)) bad(`${scheme} ${name} ramp has invalid hex ${hex}`);
    }
    if (s.ramps.primary[BASE_STEP - 1] !== theme.input.primary) bad(`${scheme} primary step 9 is not the brand colour`);
    if (s.ramps.accent[BASE_STEP - 1] !== theme.input.accent) bad(`${scheme} accent step 9 is not the accent colour`);
    for (const role of ROLES) {
      const c = s.roles[role];
      if (!c || !HEX.test(c.hex)) {
        bad(`${scheme} ${role} unresolved or invalid`);
        continue;
      }
      if (c.ref) {
        const [ramp, step] = c.ref.split('.') as [RampName, string];
        if (s.ramps[ramp]?.[Number(step) - 1] !== c.hex) bad(`${scheme} ${role} ref ${c.ref} does not match its hex`);
      }
      if (c.adjusted && !adjIds.has(c.adjusted.adjustmentId)) bad(`${scheme} ${role} points at missing adjustment ${c.adjusted.adjustmentId}`);
    }
    const bg = s.roles['action.primary.bg'].hex;
    const hover = s.roles['action.primary.hover'].hex;
    const pressed = s.roles['action.primary.pressed'].hex;
    if (hover === bg || pressed === hover) bad(`${scheme} primary hover/pressed not distinct (${bg} ${hover} ${pressed})`);
  }
  return problems;
}

export interface FuzzFailure {
  theme: number;
  input: BrandInput;
  scheme: Scheme;
  fg: Role;
  bg: Role;
  fgHex: string;
  bgHex: string;
  ratio: number;
  required: number;
}

export interface MarginRecord {
  required: number;
  /** Lowest ratio observed among checks with this requirement. */
  minRatio: number;
  /** minRatio − required. Negative means a failure. */
  margin: number;
  theme: number;
  primary: string;
  accent?: string;
  scheme: Scheme;
  fg: Role;
  bg: Role;
  fgHex: string;
  bgHex: string;
}

export interface Intervention {
  scheme: Scheme;
  role: Role;
  kind: AdjustmentKind;
  /** Number of brands (themes) with at least one such adjustment. */
  brands: number;
  percent: number;
  /** Of those, brands where no ramp step fitted and the role was nudged to an off-ramp value. */
  offRamp: number;
}

export interface FuzzResult {
  seed: number;
  themes: number;
  checksPerTheme: number;
  totalChecks: number;
  passed: number;
  failed: number;
  /** Floored to 2 decimals — never rounded up to 100. */
  passRatePercent: number;
  failures: FuzzFailure[];
  /** Structural problems found by validateTheme (should be empty). */
  invariantViolations: { theme: number; input: BrandInput; problems: string[] }[];
  generationMs: { median: number; p95: number; max: number };
  minMargin: Record<string, MarginRecord>;
  adjustmentsPerTheme: { min: number; median: number; max: number };
  interventions: Intervention[];
  chart: ChartStats;
  /** Brand fidelity (src/fidelity.ts): one row per brand colour and scheme. */
  fidelity: FidelityStats[];
}

/** How far the shipped brand fill is from the colour the brand asked for, across every brand. OKLab ΔE × 100. */
export interface FidelityStats {
  input: BrandColorInput;
  scheme: Scheme;
  role: Role;
  /** Brands whose colour is shipped exactly as given. */
  exact: number;
  /** Floored to 1 decimal. */
  exactPercent: number;
  median: number;
  p95: number;
  max: number;
  /** The brand that moved furthest. */
  worst: { theme: number; asked: string; shipped: string };
}

/** Chart palette results across every brand × scheme. */
export interface ChartStats {
  /** Brand × scheme palettes checked (brands × 2). */
  palettes: number;
  /** Palettes with no chartPaletteProblems. */
  passed: number;
  /** Floored to 2 decimals. */
  passRatePercent: number;
  /** Palettes where the solver left a note (near-grey brand, gamut limit, or a closest-miss pick). */
  withNotes: Record<string, number>;
  /** Tightest values shipped (the thresholds are 8, 15 and 3). */
  minCvdDeltaE: number;
  minNormalDeltaE: number;
  minContrast: number;
}

function quantile(sorted: number[], q: number): number {
  if (sorted.length === 0) return NaN;
  const idx = Math.min(sorted.length - 1, Math.max(0, Math.ceil(q * sorted.length) - 1));
  return sorted[idx]!;
}

function median(sorted: number[]): number {
  const n = sorted.length;
  if (n === 0) return NaN;
  return n % 2 ? sorted[(n - 1) / 2]! : (sorted[n / 2 - 1]! + sorted[n / 2]!) / 2;
}

export function runFuzz(inputs: BrandInput[] = fuzzInputs(), seed = FUZZ_SEED): FuzzResult {
  const times: number[] = [];
  const adjCounts: number[] = [];
  const failures: FuzzFailure[] = [];
  const minMargin: Record<string, MarginRecord> = {};
  const interventionBrands = new Map<string, number>();
  const offRampBrands = new Map<string, number>();
  const invariantViolations: FuzzResult['invariantViolations'] = [];
  let totalChecks = 0;
  let passed = 0;
  let checksPerTheme = 0;
  const fidelity = new Map<string, { input: BrandColorInput; scheme: Scheme; role: Role; values: number[]; exact: number; worst: FidelityStats['worst']; worstDeltaE: number }>();
  const chart: ChartStats = { palettes: 0, passed: 0, passRatePercent: 0, withNotes: {}, minCvdDeltaE: Infinity, minNormalDeltaE: Infinity, minContrast: Infinity };

  inputs.forEach((input, i) => {
    const theme = generateTheme(input);
    times.push(theme.summary.generationMs);
    adjCounts.push(theme.adjustments.length);
    checksPerTheme = theme.checks.length;
    totalChecks += theme.checks.length;
    passed += theme.summary.passed;

    for (const c of theme.checks) {
      if (!c.pass) failures.push({ theme: i, input, ...pickCheck(c) });
      const key = String(c.required);
      const margin = c.ratio - c.required;
      const cur = minMargin[key];
      if (!cur || margin < cur.margin) {
        minMargin[key] = {
          required: c.required,
          minRatio: c.ratio,
          margin,
          theme: i,
          primary: theme.input.primary,
          ...(theme.input.accent !== theme.input.primary ? { accent: theme.input.accent } : {}),
          scheme: c.scheme,
          fg: c.fg,
          bg: c.bg,
          fgHex: c.fgHex,
          bgHex: c.bgHex,
        };
      }
    }

    for (const scheme of ['light', 'dark'] as const) {
      const { roles, chart: ch } = theme.schemes[scheme];
      const surfaces = CHART_SURFACES.map((r) => roles[r].hex);
      chart.palettes++;
      if (chartPaletteProblems(ch.series, scheme, surfaces).length === 0) chart.passed++;
      for (const note of ch.notes ?? []) {
        const kind = note.includes('near-grey') ? 'near-grey brand' : note.includes("can't reach chroma") ? 'gamut limit (series 1)' : 'closest-miss pick';
        chart.withNotes[kind] = (chart.withNotes[kind] ?? 0) + 1;
      }
      ch.series.forEach((hex, k) => {
        for (const sf of surfaces) chart.minContrast = Math.min(chart.minContrast, contrastRatio(hex, sf));
        const next = ch.series[k + 1];
        if (next) chart.minCvdDeltaE = Math.min(chart.minCvdDeltaE, chartCvdDeltaE(hex, next));
        for (const other of ch.series.slice(k + 1)) chart.minNormalDeltaE = Math.min(chart.minNormalDeltaE, chartDeltaE(hex, other));
      });
    }

    for (const f of brandFidelity(theme)) {
      const key = `${f.input}|${f.scheme}`;
      let row = fidelity.get(key);
      if (!row) fidelity.set(key, (row = { input: f.input, scheme: f.scheme, role: f.role, values: [], exact: 0, worst: { theme: i, asked: f.asked, shipped: f.shipped }, worstDeltaE: -1 }));
      row.values.push(f.deltaE);
      if (f.exact) row.exact++;
      if (f.deltaE > row.worstDeltaE) {
        row.worstDeltaE = f.deltaE;
        row.worst = { theme: i, asked: f.asked, shipped: f.shipped };
      }
    }

    const problems = validateTheme(theme);
    if (problems.length) invariantViolations.push({ theme: i, input, problems });

    const seen = new Set<string>();
    const offRamp = new Set<string>();
    for (const a of theme.adjustments) {
      const key = `${a.scheme}|${a.role}|${a.kind}`;
      seen.add(key);
      if (a.kind === 'contrast' && !theme.schemes[a.scheme].roles[a.role].ref) offRamp.add(key);
    }
    for (const k of seen) interventionBrands.set(k, (interventionBrands.get(k) ?? 0) + 1);
    for (const k of offRamp) offRampBrands.set(k, (offRampBrands.get(k) ?? 0) + 1);
  });

  const sortedTimes = [...times].sort((a, b) => a - b);
  const sortedAdj = [...adjCounts].sort((a, b) => a - b);
  const interventions: Intervention[] = [...interventionBrands.entries()]
    .map(([k, brands]) => {
      const [scheme, role, kind] = k.split('|') as [Scheme, Role, AdjustmentKind];
      return { scheme, role, kind, brands, percent: (100 * brands) / inputs.length, offRamp: offRampBrands.get(k) ?? 0 };
    })
    .sort((a, b) => b.brands - a.brands || a.scheme.localeCompare(b.scheme) || a.role.localeCompare(b.role) || a.kind.localeCompare(b.kind));

  const failed = totalChecks - passed;
  return {
    seed,
    themes: inputs.length,
    checksPerTheme,
    totalChecks,
    passed,
    failed,
    passRatePercent: totalChecks === 0 ? 0 : Math.floor((passed / totalChecks) * 10000) / 100,
    failures,
    invariantViolations,
    generationMs: { median: median(sortedTimes), p95: quantile(sortedTimes, 0.95), max: sortedTimes[sortedTimes.length - 1] ?? NaN },
    minMargin,
    adjustmentsPerTheme: { min: sortedAdj[0] ?? 0, median: median(sortedAdj), max: sortedAdj[sortedAdj.length - 1] ?? 0 },
    interventions,
    chart: { ...chart, passRatePercent: chart.palettes === 0 ? 0 : Math.floor((chart.passed / chart.palettes) * 10000) / 100 },
    fidelity: [...fidelity.values()].map((row) => {
      const sorted = [...row.values].sort((a, b) => a - b);
      return {
        input: row.input,
        scheme: row.scheme,
        role: row.role,
        exact: row.exact,
        exactPercent: sorted.length === 0 ? 0 : Math.floor((row.exact / sorted.length) * 1000) / 10,
        median: median(sorted),
        p95: quantile(sorted, 0.95),
        max: sorted[sorted.length - 1] ?? 0,
        worst: row.worst,
      };
    }),
  };
}

function pickCheck(c: ContrastCheck) {
  return { scheme: c.scheme, fg: c.fg, bg: c.bg, fgHex: c.fgHex, bgHex: c.bgHex, ratio: c.ratio, required: c.required };
}

/* ------------------------------------------------------------------ *
 * Report
 * ------------------------------------------------------------------ */

const fmtInt = (n: number) => n.toLocaleString('en-US');
const fmtMs = (n: number) => n.toFixed(2);
/** Margins are floored to 3 decimals so a tight pass is never shown as looser than it is. */
/** ΔE floored to 1 decimal (never shown looser than it is). */
const fmtFloor1 = (n: number) => (Math.floor(n * 10 + 1e-9) / 10).toFixed(1);
/** Distances the solver moved a colour are rounded up to 1 decimal: a move is never shown smaller than it is. */
const fmtCeil1 = (n: number) => (Math.ceil(n * 10 - 1e-9) / 10).toFixed(1);
const fmtMargin = (n: number) => (Math.floor(n * 1000 + 1e-9) / 1000).toFixed(3);

function environment() {
  return { node: process.version, platform: `${process.platform}-${process.arch}`, cpu: cpus()[0]?.model?.trim() ?? 'unknown' };
}

export function toMarkdown(r: FuzzResult, env = environment()): string {
  const lines: string[] = [];
  lines.push('# Theme fuzz report', '');
  lines.push(`Generated by \`${FUZZ_COMMAND}\` (= \`pnpm --filter @syntara/theme-engine fuzz\`). Do not edit by hand.`, '');
  lines.push(
    `Seed **${r.seed}** (mulberry32) · **${fmtInt(r.themes)}** random brands: random primary, random accent for ~50%, random neutral / shape / type pair / density. Each brand is generated in light and dark and every pair in \`src/contrast-pairs.json\` is checked on the final 8-bit hex values (${r.checksPerTheme} checks per brand).`,
    '',
  );
  lines.push('| Metric | Value |', '|---|---|');
  lines.push(`| Brands | ${fmtInt(r.themes)} |`);
  lines.push(`| Contrast checks | ${fmtInt(r.totalChecks)} |`);
  lines.push(`| Passed | ${fmtInt(r.passed)} |`);
  lines.push(`| Failed | ${fmtInt(r.failed)} |`);
  lines.push(`| Pass rate | ${r.passRatePercent.toFixed(2)}% |`);
  lines.push(`| Median generation time | ${fmtMs(r.generationMs.median)} ms |`);
  lines.push(`| p95 generation time | ${fmtMs(r.generationMs.p95)} ms |`);
  lines.push(`| Adjustments per brand (min / median / max) | ${r.adjustmentsPerTheme.min} / ${r.adjustmentsPerTheme.median} / ${r.adjustmentsPerTheme.max} |`);
  lines.push('');
  lines.push(`Timing measured with \`performance.now()\` around each \`generateTheme\` call on ${env.cpu}, Node ${env.node} (${env.platform}); it varies by machine.`, '');

  lines.push('## Tightest margins', '');
  lines.push('The lowest ratio the solver shipped for each requirement across all brands (margin = ratio − required, floored).', '');
  lines.push('| Required | Lowest ratio | Margin | Pair | Brand |', '|---|---|---|---|---|');
  for (const m of Object.values(r.minMargin).sort((a, b) => b.required - a.required)) {
    lines.push(
      `| ${m.required}:1 | ${formatRatio(m.minRatio)}:1 (${m.minRatio.toFixed(4)}) | ${fmtMargin(m.margin)} | ${m.scheme} \`${m.fg}\` ${m.fgHex} on \`${m.bg}\` ${m.bgHex} | #${m.theme + 1} primary ${m.primary}${m.accent ? `, accent ${m.accent}` : ''} |`,
    );
  }
  lines.push('');

  lines.push('## How often the solver intervened', '');
  lines.push(
    'Share of brands with at least one adjustment of each kind, by scheme and role. `contrast` = moved to meet WCAG 2.2 AA; `choice` = ink label instead of white; `visibility` = findability heuristic (not WCAG). *Off-ramp* counts contrast fixes where no ramp step fitted and the value was nudged (or a solid fill was moved) to a new colour; the rest fell back to another ramp step. The system palette (feedback colours, secondary button labels) is tuned to pass as-is, so every row here is driven by the brand\'s own colours.',
    '',
  );
  lines.push('| Scheme | Role | Kind | Brands | Share | Off-ramp |', '|---|---|---|---|---|---|');
  for (const iv of r.interventions) {
    lines.push(`| ${iv.scheme} | \`${iv.role}\` | ${iv.kind} | ${fmtInt(iv.brands)} | ${iv.percent.toFixed(1)}% | ${iv.kind === 'contrast' ? fmtInt(iv.offRamp) : '—'} |`);
  }
  lines.push('');

  lines.push('## Chart palette', '');
  const c = r.chart;
  lines.push(
    'Every brand × scheme gets 4 chart series from `src/chart.ts`. Checked on the final hex against the dataviz validator\'s rules: OKLCH L in the scheme band, chroma ≥ 0.1, ≥ 3:1 on surface.raised and surface.default, adjacent-pair CVD ΔE ≥ 8 (protan, deutan, tritan; Machado 2009), and normal-vision ΔE ≥ 15 on every pair.',
    '',
  );
  lines.push('| Metric | Value |', '|---|---|');
  lines.push(`| Palettes (brands × 2 schemes) | ${fmtInt(c.palettes)} |`);
  lines.push(`| Passed every chart check | ${fmtInt(c.passed)} (${c.passRatePercent.toFixed(2)}%) |`);
  lines.push(`| Lowest adjacent CVD ΔE (needs 8) | ${fmtFloor1(c.minCvdDeltaE)} |`);
  lines.push(`| Lowest normal-vision ΔE, any pair (needs 15) | ${fmtFloor1(c.minNormalDeltaE)} |`);
  lines.push(`| Lowest contrast on a surface (needs 3:1) | ${formatRatio(c.minContrast)}:1 (${c.minContrast.toFixed(4)}) |`);
  for (const [kind, n] of Object.entries(c.withNotes)) lines.push(`| Solver notes: ${kind} | ${fmtInt(n)} palettes |`);
  lines.push('');

  lines.push('## Brand fidelity', '');
  lines.push(
    'How far the colour on screen is from the colour the brand asked for. For each brand colour and scheme, the input hex is compared with the fill that carries it. Distance is Euclidean in OKLab × 100; 0 means the brand colour is shipped exactly. As a guide, not a threshold: under 2 is hard to see side by side, over 10 reads as a different colour. Distances are rounded up to 1 decimal, so a move is never shown smaller than it is.',
    '',
  );
  lines.push('| Brand colour | Scheme | Role | Kept exactly | Median ΔE | p95 ΔE | Largest ΔE | Furthest brand |', '|---|---|---|---|---|---|---|---|');
  for (const f of r.fidelity) {
    lines.push(
      `| ${f.input} | ${f.scheme} | \`${f.role}\` | ${fmtInt(f.exact)} (${f.exactPercent.toFixed(1)}%) | ${fmtCeil1(f.median)} | ${fmtCeil1(f.p95)} | ${fmtCeil1(f.max)} | #${f.worst.theme + 1} ${f.worst.asked} → ${f.worst.shipped} |`,
    );
  }
  lines.push('');

  lines.push('## Structural invariants', '');
  lines.push(
    r.invariantViolations.length === 0
      ? 'All brands passed `validateTheme`: 12 valid steps per ramp, step 9 = the exact brand/accent hex in both schemes, every role resolved, refs match their ramp step, every adjusted role links to an adjustment whose message quotes its hexes and floored ratio, primary hover/pressed distinct, 4 chart series passing every chart check with grid/axis equal to their roles.'
      : `${r.invariantViolations.length} brand(s) violated invariants:`,
  );
  for (const v of r.invariantViolations.slice(0, 50)) lines.push(`- #${v.theme + 1} (${v.input.primary}): ${v.problems.join('; ')}`);
  lines.push('');

  lines.push('## Failures', '');
  if (r.failures.length === 0) {
    lines.push('None. Every generated theme passed every check.');
  } else {
    lines.push('| Brand | Input | Pair | Ratio | Required |', '|---|---|---|---|---|');
    for (const f of r.failures) {
      lines.push(
        `| #${f.theme + 1} | primary ${f.input.primary}${f.input.accent ? `, accent ${f.input.accent}` : ''}, ${f.input.neutral} | ${f.scheme} \`${f.fg}\` ${f.fgHex} on \`${f.bg}\` ${f.bgHex} | ${formatRatio(f.ratio)}:1 (${f.ratio.toFixed(4)}) | ${f.required}:1 |`,
      );
    }
  }
  lines.push('');
  return lines.join('\n');
}

function main(): void {
  const result = runFuzz();
  const env = environment();
  const outDir = resolve(dirname(fileURLToPath(import.meta.url)), '../reports');
  mkdirSync(outDir, { recursive: true });
  writeFileSync(resolve(outDir, 'fuzz-report.json'), JSON.stringify({ command: FUZZ_COMMAND, environment: env, ...result }, null, 2) + '\n');
  writeFileSync(resolve(outDir, 'fuzz-report.md'), toMarkdown(result, env));

  const top = result.interventions.slice(0, 8);
  const m45 = result.minMargin['4.5'];
  const m3 = result.minMargin['3'];
  const out = [
    `Theme fuzz — seed ${result.seed}, ${fmtInt(result.themes)} brands × light/dark`,
    `  checks   ${fmtInt(result.totalChecks)}  passed ${fmtInt(result.passed)}  failed ${fmtInt(result.failed)}  (${result.passRatePercent.toFixed(2)}%)`,
    `  time     median ${fmtMs(result.generationMs.median)} ms  p95 ${fmtMs(result.generationMs.p95)} ms  max ${fmtMs(result.generationMs.max)} ms`,
    m45 ? `  4.5:1    lowest ${m45.minRatio.toFixed(4)} (margin ${fmtMargin(m45.margin)}) — ${m45.scheme} ${m45.fg} on ${m45.bg}` : '',
    m3 ? `  3:1      lowest ${m3.minRatio.toFixed(4)} (margin ${fmtMargin(m3.margin)}) — ${m3.scheme} ${m3.fg} on ${m3.bg}` : '',
    `  chart    ${fmtInt(result.chart.passed)}/${fmtInt(result.chart.palettes)} palettes pass (${result.chart.passRatePercent.toFixed(2)}%)  min CVD ΔE ${fmtFloor1(result.chart.minCvdDeltaE)}  min normal ΔE ${fmtFloor1(result.chart.minNormalDeltaE)}  min contrast ${result.chart.minContrast.toFixed(4)}`,
    ...result.fidelity.map((f) => `  fidelity ${f.input.padEnd(7)} ${f.scheme.padEnd(5)} kept exactly ${f.exactPercent.toFixed(1)}%  ΔE median ${fmtCeil1(f.median)}  p95 ${fmtCeil1(f.p95)}  max ${fmtCeil1(f.max)}`),
    `  invariants  ${result.invariantViolations.length === 0 ? 'all brands valid' : `${result.invariantViolations.length} brand(s) with violations`}`,
    `  adjustments per brand  min ${result.adjustmentsPerTheme.min} / median ${result.adjustmentsPerTheme.median} / max ${result.adjustmentsPerTheme.max}`,
    '  most frequent interventions:',
    ...top.map((iv) => `    ${iv.percent.toFixed(1).padStart(5)}%  ${iv.scheme.padEnd(5)} ${iv.role} (${iv.kind})`),
    `  reports → ${outDir}/fuzz-report.{json,md}`,
  ].filter(Boolean);
  console.log(out.join('\n'));
  if (result.failed > 0 || result.invariantViolations.length > 0) {
    console.error(`\n${result.failed} check(s) failed, ${result.invariantViolations.length} brand(s) with invariant violations — see fuzz-report.md`);
    process.exitCode = 1;
  }
}

const invokedDirectly = process.argv[1] !== undefined && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (invokedDirectly) main();

/**
 * Chart palette: 4 categorical series colours per scheme, solved (like glass.ts), not picked.
 *
 * Brand colours are not a chart palette: they sit outside the chart lightness band, some are
 * near-grey (chroma < 0.1), and brand + accent often collapse under colour-vision deficiency.
 * So the palette is derived, and every series passes the dataviz validator's checks on its
 * final 8-bit hex (validate_palette.js from the dataviz skill; thresholds mirrored below):
 *
 *   band      OKLCH L inside the scheme's band (light 0.43–0.77, dark 0.48–0.67)
 *   chroma    OKLCH C ≥ 0.10 (below it a hue reads as grey)
 *   contrast  ≥ 3:1 (WCAG non-text) against surface.raised AND surface.default
 *   CVD       adjacent pairs ΔE ≥ 8 (OKLab ×100) under protan, deutan and tritan, simulated with
 *             Machado, Oliveira & Fernandes 2009 at severity 1 (the validator's model; its
 *             thresholds are calibrated to it, so we use the same matrices and clamp)
 *   normal    ΔE ≥ 15 under unsimulated vision. The validator checks adjacent pairs; we check
 *             EVERY pair, so no two series ever look alike even when a legend reorders them.
 *
 * Series 1 = the brand primary's hue, moved into the band with chroma lifted to ≥ 0.10.
 * Series 2–4 walk CHART_CANDIDATES in fixed order and take the first hue that is ≥ 35° from every
 * chosen hue and has a tone passing against the series already chosen (the tone nearest the target L).
 * The order is fixed, so a series' identity never depends on a ranking. Decision: ADR-016.
 */
import { contrastRatio, hexToOklch, hexToRgb8, linearRgbToOklab, oklchToHex, srgbToLinear, type Oklab, type Rgb } from './color';
import type { Role, ResolvedColor, Scheme, SchemeTheme } from './types';

/* ------------------------------------------------------------------ *
 * Thresholds (validate_palette.js: BAND, CHROMA_FLOOR, CVD_TARGET, NORMAL_FLOOR, CONTRAST_MIN)
 * ------------------------------------------------------------------ */

export const CHART_BAND: Record<Scheme, readonly [number, number]> = { light: [0.43, 0.77], dark: [0.48, 0.67] };
export const CHART_CHROMA_FLOOR = 0.1;
export const CHART_CVD_MIN = 8;
export const CHART_NORMAL_MIN = 15;
export const CHART_CONTRAST_MIN = 3;
export const CHART_SERIES = 4;
/** Surfaces a chart sits on; every series is checked against both. */
export const CHART_SURFACES: readonly Role[] = ['surface.raised', 'surface.default'];
/** Grid lines are decorative (border.subtle); axis labels are text (text.subtle, already contrast-checked). */
export const CHART_GRID_ROLE: Role = 'border.subtle';
export const CHART_AXIS_ROLE: Role = 'text.subtle';

/**
 * Solver aims a hair inside each limit so the quantised hex still passes; the checks below
 * use the exact thresholds. (8-bit rounding moves OKLCH L by < 0.002 and C by < 0.003.)
 */
const L_MARGIN = 0.004;
const C_TARGET_MIN = 0.105;
/** Below this the brand reads as grey: its hue is noise, so there is no hue to keep. */
const ACHROMATIC_BRAND_C = 0.02;
const L_STEP = 0.005;
/**
 * Series 2–4 sit as close to this lightness as the pairwise checks allow: vivid mid-tones, not the
 * band's extremes (a max-margin search picked navy and brown). Light: just under the 3:1-on-white ceiling.
 */
const SERIES_TARGET_L: Record<Scheme, number> = { light: 0.6, dark: 0.64 };
/**
 * Two series closer than this in hue read as "the same colour, lighter" (a navy and a sky blue), even when
 * ΔE passes. A candidate that close to a chosen series is skipped, so every series is its own hue family.
 */
export const CHART_MIN_HUE_GAP = 35;

/**
 * Fixed-order candidate hues for series 2–4 (OKLCH h, preferred C). Order = identity: a brand gets
 * the first ones that pass. Blue → orange → teal → magenta leads because those four alternate warm/cool and
 * separate well under protan/deutan; amber, violet, green and red are spares for brands whose own hue
 * (series 1) collides with an early candidate.
 */
export const CHART_CANDIDATES: readonly { name: string; h: number; c: number }[] = [
  { name: 'blue', h: 255, c: 0.16 },
  { name: 'orange', h: 45, c: 0.17 },
  { name: 'teal', h: 180, c: 0.12 },
  { name: 'magenta', h: 340, c: 0.17 },
  { name: 'amber', h: 80, c: 0.16 },
  { name: 'violet', h: 295, c: 0.17 },
  { name: 'green', h: 140, c: 0.16 },
  { name: 'red', h: 25, c: 0.18 },
];

/* ------------------------------------------------------------------ *
 * Validator maths (mirrors validate_palette.js)
 * ------------------------------------------------------------------ */

export type CvdKind = 'protan' | 'deutan' | 'tritan';
type M3 = readonly [Rgb, Rgb, Rgb];

/** Machado, Oliveira & Fernandes (2009), severity 1.0, applied to linear RGB. */
const MACHADO: Record<CvdKind, M3> = {
  protan: [
    [0.152286, 1.052583, -0.204868],
    [0.114503, 0.786281, 0.099216],
    [-0.003882, -0.048116, 1.051998],
  ],
  deutan: [
    [0.367322, 0.860646, -0.227968],
    [0.280085, 0.672501, 0.047413],
    [-0.01182, 0.04294, 0.968881],
  ],
  tritan: [
    [1.255528, -0.076749, -0.178779],
    [-0.078411, 0.930809, 0.147602],
    [0.004733, 0.691367, 0.3039],
  ],
};
export const CVD_KINDS: readonly CvdKind[] = ['protan', 'deutan', 'tritan'];

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

function linear(hex: string): Rgb {
  return hexToRgb8(hex).map((v) => srgbToLinear(v / 255)) as Rgb;
}

function simulate(rgb: Rgb, kind: CvdKind): Rgb {
  const m = MACHADO[kind];
  return m.map((row) => clamp01(row[0] * rgb[0] + row[1] * rgb[1] + row[2] * rgb[2])) as Rgb;
}

/** OKLab of a hex under normal vision (index 0) and each CVD simulation (1–3, CVD_KINDS order). */
type Profile = readonly [Oklab, Oklab, Oklab, Oklab];
const PROFILE_KINDS = [undefined, ...['protan', 'deutan', 'tritan']] as const;
/** Memo: the solver compares the same ~1,100 candidate tones for every brand. Cleared when it grows. */
const profiles = new Map<string, Profile>();
const PROFILE_CACHE_MAX = 8192;

function profile(hex: string): Profile {
  let p = profiles.get(hex);
  if (!p) {
    const lin = linear(hex);
    p = PROFILE_KINDS.map((k) => linearRgbToOklab(k ? simulate(lin, k as CvdKind) : lin)) as unknown as Profile;
    if (profiles.size >= PROFILE_CACHE_MAX) profiles.clear();
    profiles.set(hex, p);
  }
  return p;
}

const KIND_INDEX: Record<CvdKind, number> = { protan: 1, deutan: 2, tritan: 3 };

/** Euclidean OKLab distance ×100 between two hexes; with `kind`, both are first simulated. */
export function chartDeltaE(a: string, b: string, kind?: CvdKind): number {
  const i = kind ? KIND_INDEX[kind] : 0;
  const p = profile(a)[i]!;
  const q = profile(b)[i]!;
  return 100 * Math.hypot(p.l - q.l, p.a - q.a, p.b - q.b);
}

/** Lowest ΔE of a pair across the three CVD simulations. */
export function chartCvdDeltaE(a: string, b: string): number {
  return Math.min(chartDeltaE(a, b, 'protan'), chartDeltaE(a, b, 'deutan'), chartDeltaE(a, b, 'tritan'));
}

/**
 * Every rule a chart palette must meet, as plain-English problems (empty = passes).
 * Used by the solver's final check, the fuzz invariant and the tests.
 */
export function chartPaletteProblems(series: readonly string[], scheme: Scheme, surfaces: readonly string[]): string[] {
  const out: string[] = [];
  const [lo, hi] = CHART_BAND[scheme];
  series.forEach((hex, i) => {
    const { l, c } = hexToOklch(hex);
    const n = `series ${i + 1} ${hex}`;
    if (l < lo || l > hi) out.push(`${n}: L ${l.toFixed(3)} outside the ${scheme} band ${lo}–${hi}`);
    if (c < CHART_CHROMA_FLOOR) out.push(`${n}: chroma ${c.toFixed(3)} below ${CHART_CHROMA_FLOOR}`);
    for (const s of surfaces) {
      const r = contrastRatio(hex, s);
      if (r < CHART_CONTRAST_MIN) out.push(`${n}: ${r.toFixed(2)}:1 against ${s}, needs ${CHART_CONTRAST_MIN}:1`);
    }
  });
  for (let i = 0; i < series.length; i++) {
    for (let j = i + 1; j < series.length; j++) {
      const [a, b] = [series[i]!, series[j]!];
      const d = chartDeltaE(a, b);
      if (d < CHART_NORMAL_MIN) out.push(`series ${i + 1}–${j + 1}: normal-vision ΔE ${d.toFixed(1)} < ${CHART_NORMAL_MIN}`);
      if (j === i + 1) {
        for (const k of CVD_KINDS) {
          const dk = chartDeltaE(a, b, k);
          if (dk < CHART_CVD_MIN) out.push(`series ${i + 1}–${j + 1}: ${k} ΔE ${dk.toFixed(1)} < ${CHART_CVD_MIN}`);
        }
      }
    }
  }
  return out;
}

/* ------------------------------------------------------------------ *
 * Solver
 * ------------------------------------------------------------------ */

/** One tone passes the single-colour rules: band, chroma floor, 3:1 on every surface. */
function toneOk(hex: string, scheme: Scheme, surfaces: readonly string[]): boolean {
  const { l, c } = hexToOklch(hex);
  const [lo, hi] = CHART_BAND[scheme];
  return l >= lo && l <= hi && c >= CHART_CHROMA_FLOOR && surfaces.every((s) => contrastRatio(hex, s) >= CHART_CONTRAST_MIN);
}

type Tone = { l: number; hex: string };

/** Tones at hue `h`, one per L on a 0.005 grid inside the band (chroma: `c`, at least 0.105, gamut-clipped). */
function tones(h: number, c: number, scheme: Scheme): Tone[] {
  const [lo, hi] = CHART_BAND[scheme];
  const out: Tone[] = [];
  for (let l = lo + L_MARGIN; l <= hi - L_MARGIN + 1e-9; l += L_STEP) {
    out.push({ l, hex: oklchToHex({ l, c: Math.max(c, C_TARGET_MIN), h }) });
  }
  return out;
}

/** Candidate tones don't depend on the brand, so they're built (and sorted) once per scheme. */
const candidateTones = new Map<string, Tone[]>();
function tonesFor(i: number, scheme: Scheme): Tone[] {
  const key = `${scheme}|${i}`;
  let t = candidateTones.get(key);
  if (!t) {
    const cand = CHART_CANDIDATES[i]!;
    const target = SERIES_TARGET_L[scheme];
    // Nearest the series target lightness first (ties: the darker tone, for a stable order).
    t = tones(cand.h, cand.c, scheme).sort((a, b) => Math.abs(a.l - target) - Math.abs(b.l - target) || a.l - b.l);
    candidateTones.set(key, t);
  }
  return t;
}

export interface ChartSolution {
  series: string[];
  /** Plain-English notes when the solver had to fall back (near-grey brand, a gamut limit, a relaxed rule). */
  notes: string[];
}

/**
 * Series 1: the brand hue at the in-band lightness nearest the brand's own, chroma ≥ 0.10.
 * Near-grey brands (C < 0.02) have no hue to keep: they take the accent's hue if it has one,
 * else the first candidate at the series target lightness. If no tone at the hue reaches the chroma floor inside the band with
 * 3:1 contrast, the most saturated passing-contrast tone is used and a note says so.
 */
function solveSeries1(primary: string, accent: string, scheme: Scheme, surfaces: readonly string[], notes: string[]): string {
  const p = hexToOklch(primary);
  let h = p.h;
  let c = p.c;
  let target = p.l;
  if (p.c < ACHROMATIC_BRAND_C) {
    const a = hexToOklch(accent);
    if (a.c >= ACHROMATIC_BRAND_C) {
      ({ h, c, l: target } = a);
      notes.push(`Series 1: the primary ${primary} is near-grey, so it takes the accent's hue (${accent}).`);
    } else {
      const first = CHART_CANDIDATES[0]!;
      ({ h, c } = first);
      target = SERIES_TARGET_L[scheme];
      notes.push(`Series 1: the brand ${primary} is near-grey with no chromatic accent, so it starts at ${first.name}.`);
    }
  }
  const all = tones(h, c, scheme);
  const ok = all.filter((t) => toneOk(t.hex, scheme, surfaces));
  if (ok.length) return ok.reduce((best, t) => (Math.abs(t.l - target) < Math.abs(best.l - target) ? t : best)).hex;
  // Gamut fallback: highest chroma among in-band tones that still clear 3:1.
  const [lo, hi] = CHART_BAND[scheme];
  const contrastOk = all.filter((t) => {
    const o = hexToOklch(t.hex);
    return o.l >= lo && o.l <= hi && surfaces.every((s) => contrastRatio(t.hex, s) >= CHART_CONTRAST_MIN);
  });
  const pick = (contrastOk.length ? contrastOk : all).reduce((best, t) => (hexToOklch(t.hex).c > hexToOklch(best.hex).c ? t : best));
  notes.push(
    `Series 1: sRGB can't reach chroma ${CHART_CHROMA_FLOOR} at hue ${h.toFixed(0)}° inside the ${scheme} band with 3:1 contrast; using the most saturated tone ${pick.hex} (C ${hexToOklch(pick.hex).c.toFixed(3)}).`,
  );
  return pick.hex;
}

/** Worst normalised margin of `hex` next to the chosen series (≥ 1 = passes every pairwise rule). */
function pairScore(hex: string, chosen: readonly string[]): number {
  let score = Infinity;
  for (const prev of chosen) score = Math.min(score, chartDeltaE(hex, prev) / CHART_NORMAL_MIN);
  const last = chosen[chosen.length - 1];
  if (last) score = Math.min(score, chartCvdDeltaE(hex, last) / CHART_CVD_MIN);
  return score;
}

/** Shortest distance between two hues, degrees (0–180). */
export function hueGap(a: number, b: number): number {
  const d = Math.abs(a - b) % 360;
  return d > 180 ? 360 - d : d;
}

export function solveChartSeries(primary: string, accent: string, scheme: Scheme, surfaces: readonly string[]): ChartSolution {
  const notes: string[] = [];
  const series = [solveSeries1(primary, accent, scheme, surfaces, notes)];
  const used = new Set<number>();
  while (series.length < CHART_SERIES) {
    let placed = false;
    // Fixed order: the first candidate with ANY passing tone wins; among its tones, the one nearest the target L.
    for (let i = 0; i < CHART_CANDIDATES.length && !placed; i++) {
      if (used.has(i)) continue;
      const cand = CHART_CANDIDATES[i]!;
      if (series.some((hex) => hueGap(hexToOklch(hex).h, cand.h) < CHART_MIN_HUE_GAP)) continue;
      // tonesFor() is sorted nearest-to-target first, so the first passing tone is the pick.
      const best = tonesFor(i, scheme).find((t) => toneOk(t.hex, scheme, surfaces) && pairScore(t.hex, series) >= 1);
      if (best) {
        series.push(best.hex);
        used.add(i);
        placed = true;
      }
    }
    if (!placed) {
      // No candidate passes: take the candidate tone with the best margin and say so (the fuzz reports it).
      let best: { hex: string; score: number; i: number } | null = null;
      CHART_CANDIDATES.forEach((cand, i) => {
        if (used.has(i)) return;
        for (const t of tonesFor(i, scheme)) {
          if (!toneOk(t.hex, scheme, surfaces)) continue;
          const score = pairScore(t.hex, series);
          if (!best || score > best.score) best = { hex: t.hex, score, i };
        }
      });
      const b = best as { hex: string; score: number; i: number } | null;
      if (!b) throw new Error(`Chart palette: no candidate tone fits the ${scheme} band with 3:1 contrast.`);
      series.push(b.hex);
      used.add(b.i);
      notes.push(`Series ${series.length}: no candidate hue passed every pairwise check; ${b.hex} is the closest (margin ${b.score.toFixed(2)}).`);
    }
  }
  return { series, notes };
}

/** Per-scheme chart tokens from the resolved roles and the brand inputs. */
export function solveChart(roles: Record<Role, ResolvedColor>, scheme: Scheme, primary: string, accent: string): SchemeTheme['chart'] {
  const surfaces = CHART_SURFACES.map((r) => roles[r].hex);
  const { series, notes } = solveChartSeries(primary, accent, scheme, surfaces);
  return {
    series,
    grid: roles[CHART_GRID_ROLE].hex,
    axis: roles[CHART_AXIS_ROLE].hex,
    ...(notes.length ? { notes } : {}),
  };
}

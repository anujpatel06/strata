/**
 * Semantic roles + contrast solver.
 *
 * Each scheme is resolved in dependency order (backgrounds before the foregrounds checked against
 * them). Roles with a candidate list take the first ramp step that passes every pair listed for
 * them in contrast-pairs.json; if none passes, the last candidate is nudged in OKLCH lightness
 * until it does. Solid fills (primary button, accent, feedback badges) pick an on-colour: white,
 * else ink, else the fill itself moves. Every departure from the preferred value is recorded as
 * an Adjustment with a one-sentence, plain-English explanation.
 *
 * All ratios are computed on final 8-bit hex values (see color.ts).
 */
import pairsJson from './contrast-pairs.json' with { type: 'json' };
import {
  contrastRatio,
  formatRatio,
  hexToOklch,
  oklchToHex,
  relativeLuminance,
  type Oklch,
} from './color';
import { FEEDBACK_LABEL, FEEDBACK_NAMES } from './ramps';
import {
  ROLES,
  type Adjustment,
  type ContrastCheck,
  type Ramp,
  type RampName,
  type ResolvedColor,
  type Role,
  type Scheme,
} from './types';

/* ------------------------------------------------------------------ *
 * Contrast pairs
 * ------------------------------------------------------------------ */

export interface ContrastPair {
  fg: Role;
  kind: ContrastCheck['kind'];
  required: number;
  against: Role[];
}

const ROLE_SET: ReadonlySet<string> = new Set(ROLES);

function asRole(value: unknown, where: string): Role {
  if (typeof value !== 'string' || !ROLE_SET.has(value)) {
    throw new Error(`contrast-pairs.json: unknown role ${JSON.stringify(value)} in ${where}`);
  }
  return value as Role;
}

function loadPairs(json: unknown): ContrastPair[] {
  const doc = json as { requirements?: Record<string, number>; pairs?: unknown[] };
  const reqs = doc.requirements ?? {};
  return (doc.pairs ?? []).map((raw, i) => {
    const p = raw as { fg?: unknown; kind?: unknown; against?: unknown };
    const kind = p.kind;
    if (kind !== 'text' && kind !== 'non-text') throw new Error(`contrast-pairs.json: bad kind in pairs[${i}]`);
    const required = reqs[kind];
    if (typeof required !== 'number') throw new Error(`contrast-pairs.json: no requirement for "${kind}"`);
    if (!Array.isArray(p.against) || p.against.length === 0) throw new Error(`contrast-pairs.json: empty against in pairs[${i}]`);
    return {
      fg: asRole(p.fg, `pairs[${i}].fg`),
      kind,
      required,
      against: p.against.map((bg, j) => asRole(bg, `pairs[${i}].against[${j}]`)),
    };
  });
}

/** Every guaranteed pair, from contrast-pairs.json (validated at load). */
export const CONTRAST_PAIRS: readonly ContrastPair[] = loadPairs(pairsJson);

/** Pairs a foreground role must satisfy, flattened to (bg, required). */
export function requirementsFor(fg: Role): { bg: Role; required: number }[] {
  return CONTRAST_PAIRS.filter((p) => p.fg === fg).flatMap((p) =>
    p.against.map((bg) => ({ bg, required: p.required })),
  );
}

/** One ContrastCheck per (fg, bg) pair in contrast-pairs.json, on final hex values. */
export function checkScheme(scheme: Scheme, roles: Record<Role, ResolvedColor>): ContrastCheck[] {
  const out: ContrastCheck[] = [];
  for (const p of CONTRAST_PAIRS) {
    for (const bg of p.against) {
      const fgHex = roles[p.fg].hex;
      const bgHex = roles[bg].hex;
      const ratio = contrastRatio(fgHex, bgHex);
      out.push({ scheme, fg: p.fg, bg, fgHex, bgHex, ratio, required: p.required, kind: p.kind, pass: ratio >= p.required });
    }
  }
  return out;
}

/* ------------------------------------------------------------------ *
 * Labels (human names for roles, used in adjustment messages and UIs)
 * ------------------------------------------------------------------ */

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export const ROLE_LABELS: Record<Role, string> = (() => {
  const labels: Partial<Record<Role, string>> = {
    'surface.canvas': 'Page background',
    'surface.default': 'Default surface',
    'surface.raised': 'Raised surface',
    'surface.sunken': 'Sunken surface',
    'surface.selected': 'Selected surface',
    'surface.inverse': 'Inverse surface',
    'text.default': 'Body text',
    'text.subtle': 'Secondary text',
    'text.disabled': 'Disabled text',
    'text.inverse': 'Inverse text',
    'text.brand': 'Link text',
    'border.subtle': 'Subtle border',
    'border.default': 'Border',
    'border.strong': 'Input border',
    'action.primary.bg': 'Primary button',
    'action.primary.fg': 'Button label',
    'action.primary.hover': 'Primary button hover',
    'action.primary.pressed': 'Primary button pressed',
    'action.primary.border': 'Primary button outline',
    'action.secondary.bg': 'Secondary button',
    'action.secondary.fg': 'Secondary button label',
    'action.secondary.hover': 'Secondary button hover',
    'action.secondary.pressed': 'Secondary button pressed',
    'accent.bg': 'Accent fill',
    'accent.fg': 'Accent label',
    'accent.subtle': 'Subtle accent background',
    'accent.text': 'Accent text',
    'focus.ring': 'Focus ring',
  };
  for (const f of FEEDBACK_NAMES) {
    labels[`feedback.${f}.bg`] = `${cap(f)} message background`;
    labels[`feedback.${f}.fg`] = `${cap(f)} message text`;
    labels[`feedback.${f}.border`] = `${cap(f)} message border`;
    labels[`feedback.${f}.solid`] = `${cap(f)} badge`;
    labels[`feedback.${f}.onSolid`] = `${cap(f)} badge label`;
  }
  return labels as Record<Role, string>;
})();

/** How a background role is named inside a sentence. */
const BG_PHRASES: Partial<Record<Role, string>> = {
  'surface.canvas': 'the page background',
  'surface.default': 'the default surface',
  'surface.raised': 'raised surfaces',
  'surface.sunken': 'sunken areas',
  'surface.selected': 'selected items',
  'surface.inverse': 'the inverse surface',
  'action.secondary.bg': 'the secondary button',
  'action.secondary.hover': 'the secondary button hover state',
  'action.secondary.pressed': 'the secondary button pressed state',
  'accent.subtle': 'the subtle accent background',
  'accent.bg': 'the accent fill',
};

function bgPhrase(role: Role, hex: string): string {
  if (hex === '#ffffff') return 'white';
  if (hex === '#000000') return 'black';
  const named = BG_PHRASES[role] ?? (role.startsWith('feedback.') ? `the ${role.split('.')[1]} message background` : ROLE_LABELS[role].toLowerCase());
  return `${named} ${hex}`;
}

const r1 = formatRatio;

/* ------------------------------------------------------------------ *
 * Solver constants
 * ------------------------------------------------------------------ */

export const WHITE = '#ffffff';
const TEXT_MIN = 4.5;
/** Nudge step in OKLCH L for candidate roles and button fills. */
const NUDGE_STEP = 0.005;
const NUDGE_CAP = 200;
/**
 * Dark-mode findability heuristic — NOT a WCAG requirement. A primary/accent fill below 2.2:1
 * against the dark canvas reads as a hole in the page rather than a button (think navy on
 * near-black). WCAG 1.4.11 does not require fills to contrast with their surroundings when the
 * label carries the meaning, so this is a product decision, logged as kind 'visibility'.
 */
const DARK_VISIBILITY_MIN = 2.2;
const DARK_VISIBILITY_STEP = 0.01;
/**
 * Below this ratio against the default surface a fill is effectively invisible as a shape
 * (e.g. pale yellow on white); the button gets an outline. Also a heuristic, not WCAG.
 */
const OUTLINE_MIN = 1.5;
/** Hover / pressed move the fill away from its label by these OKLCH L deltas. */
const HOVER_DL = 0.04;
const PRESSED_DL = 0.08;
/** Hover / pressed stay inside this L range where a change is still perceptible. */
const STATE_L_MIN = 0.12;
const STATE_L_MAX = 0.97;

interface StepRef {
  hex: string;
  ref?: string;
}

interface Worst {
  ratio: number;
  bg: Role;
  bgHex: string;
}

export interface RoleResolution {
  roles: Record<Role, ResolvedColor>;
  adjustments: Adjustment[];
}

/** Direction in L that increases contrast against the given backgrounds: -1 darker, +1 lighter. */
function awayFrom(bgHexes: string[]): -1 | 1 {
  const minWith = (probe: string) => Math.min(...bgHexes.map((bg) => contrastRatio(probe, bg)));
  return minWith('#000000') >= minWith(WHITE) ? -1 : 1;
}

function stepL(from: Oklch, dir: number, dl: number): string {
  return oklchToHex({ l: from.l + dir * dl, c: from.c, h: from.h });
}

/* ------------------------------------------------------------------ *
 * Resolver
 * ------------------------------------------------------------------ */

class SchemeResolver {
  private readonly roles: Partial<Record<Role, ResolvedColor>> = {};
  private readonly adjustments: Adjustment[] = [];
  private readonly ids = new Set<string>();

  constructor(
    readonly scheme: Scheme,
    readonly ramps: Record<RampName, Ramp>,
    /** Light-mode roles, passed when resolving dark so solid fills keep the same label (ADR-006). */
    readonly lightRoles?: Record<Role, ResolvedColor>,
  ) {}

  step(ramp: RampName, n: number): StepRef {
    const hex = this.ramps[ramp][n - 1];
    if (hex === undefined) throw new Error(`No step ${n} in ${ramp} ramp`);
    return { hex, ref: `${ramp}.${n}` };
  }

  hex(role: Role): string {
    const c = this.roles[role];
    if (!c) throw new Error(`Role ${role} used before it was resolved (${this.scheme})`);
    return c.hex;
  }

  color(role: Role): ResolvedColor {
    const c = this.roles[role];
    if (!c) throw new Error(`Role ${role} used before it was resolved (${this.scheme})`);
    return c;
  }

  set(role: Role, value: StepRef): void {
    this.roles[role] = value.ref ? { hex: value.hex, ref: value.ref } : { hex: value.hex };
  }

  private setAdjusted(role: Role, value: StepRef, from: StepRef, adj: Adjustment): void {
    const adjusted: NonNullable<ResolvedColor['adjusted']> = { fromHex: from.hex, adjustmentId: adj.id };
    if (from.ref) adjusted.fromRef = from.ref;
    this.roles[role] = value.ref ? { hex: value.hex, ref: value.ref, adjusted } : { hex: value.hex, adjusted };
  }

  private addAdjustment(a: Omit<Adjustment, 'id' | 'scheme' | 'label'>): Adjustment {
    let id = `${this.scheme}:${a.role}`;
    if (this.ids.has(id)) id = `${id}:${a.kind}`;
    for (let n = 2; this.ids.has(id); n++) id = `${this.scheme}:${a.role}:${a.kind}-${n}`;
    this.ids.add(id);
    const adj: Adjustment = {
      id,
      scheme: this.scheme,
      role: a.role,
      kind: a.kind,
      label: ROLE_LABELS[a.role],
      fromHex: a.fromHex,
      toHex: a.toHex,
      ...(a.against ? { against: a.against } : {}),
      ...(a.ratioBefore !== undefined ? { ratioBefore: a.ratioBefore } : {}),
      ...(a.ratioAfter !== undefined ? { ratioAfter: a.ratioAfter } : {}),
      ...(a.required !== undefined ? { required: a.required } : {}),
      message: a.message,
    };
    this.adjustments.push(adj);
    return adj;
  }

  private worst(fgHex: string, reqs: { bg: Role; required: number }[]): Worst {
    let worst: Worst | undefined;
    for (const { bg } of reqs) {
      const bgHex = this.hex(bg);
      const ratio = contrastRatio(fgHex, bgHex);
      if (!worst || ratio < worst.ratio) worst = { ratio, bg, bgHex };
    }
    if (!worst) throw new Error('worst() needs at least one pair');
    return worst;
  }

  private passes(fgHex: string, reqs: { bg: Role; required: number }[]): boolean {
    return reqs.every(({ bg, required }) => contrastRatio(fgHex, this.hex(bg)) >= required);
  }

  /**
   * Candidate solver: first candidate that passes all its pairs wins. Otherwise nudge the last
   * candidate's OKLCH L away from its backgrounds in 0.005 steps until it passes.
   */
  solve(role: Role, candidates: StepRef[]): void {
    const reqs = requirementsFor(role);
    const preferred = candidates[0];
    if (!preferred) throw new Error(`No candidates for ${role}`);
    if (reqs.length === 0) {
      this.set(role, preferred);
      return;
    }
    for (let i = 0; i < candidates.length; i++) {
      const cand = candidates[i]!;
      if (!this.passes(cand.hex, reqs)) continue;
      if (i === 0) {
        this.set(role, cand);
      } else {
        const adj = this.contrastAdjustment(role, preferred, cand, reqs);
        this.setAdjusted(role, cand, preferred, adj);
      }
      return;
    }
    const last = candidates[candidates.length - 1]!;
    const dir = awayFrom(reqs.map((r) => this.hex(r.bg)));
    const start = hexToOklch(last.hex);
    let hex = last.hex;
    for (let i = 1; i <= NUDGE_CAP; i++) {
      hex = stepL(start, dir, NUDGE_STEP * i);
      if (this.passes(hex, reqs)) break;
    }
    const nudged: StepRef = { hex };
    const adj = this.contrastAdjustment(role, preferred, nudged, reqs);
    this.setAdjusted(role, nudged, preferred, adj);
  }

  private contrastAdjustment(
    role: Role,
    from: StepRef,
    to: StepRef,
    reqs: { bg: Role; required: number }[],
  ): Adjustment {
    const before = this.worst(from.hex, reqs);
    const after = this.worst(to.hex, reqs);
    const required = Math.max(...reqs.map((r) => r.required));
    const darker = relativeLuminance(to.hex) < relativeLuminance(from.hex);
    const fromRamp = from.ref?.split('.')[0];
    const toRamp = to.ref?.split('.')[0];
    const tone =
      toRamp === 'neutral' && fromRamp !== 'neutral'
        ? `the neutral ${darker ? 'ink' : 'tone'}`
        : darker
          ? 'a deeper tone'
          : 'a lighter tone';
    const on = bgPhrase(before.bg, before.bgHex);
    let message: string;
    switch (role) {
      case 'focus.ring':
        message = `${from.hex} is too ${darker ? 'light' : 'dark'} to see as a focus ring on ${on} (${r1(before.ratio)}:1), so the ring uses ${tone}, ${to.hex} (${r1(after.ratio)}:1).`;
        break;
      case 'border.strong':
        message = `${from.hex} is too faint for input borders on ${on} (${r1(before.ratio)}:1), so inputs use ${tone}, ${to.hex} (${r1(after.ratio)}:1).`;
        break;
      case 'text.brand':
        message = `Links in ${from.hex} only reach ${r1(before.ratio)}:1 on ${on}, so link text uses ${tone}, ${to.hex} (${r1(after.ratio)}:1).`;
        break;
      default:
        message = `${ROLE_LABELS[role]} in ${from.hex} only reaches ${r1(before.ratio)}:1 on ${on}, so it uses ${tone}, ${to.hex} (${r1(after.ratio)}:1).`;
    }
    return this.addAdjustment({
      role,
      kind: 'contrast',
      fromHex: from.hex,
      toHex: to.hex,
      against: [...new Set(reqs.map((r) => r.bg))],
      ratioBefore: before.ratio,
      ratioAfter: after.ratio,
      required,
      message,
    });
  }

  /**
   * A solid fill and the label on it (primary button, accent fill, feedback badge).
   * 1. (dark, opt-in) visibility: raise the fill's L until it reaches 2.2:1 on the dark canvas.
   * 2. label: the preferred label (white unless `prefer: 'ink'`) if ≥ 4.5; else the other label
   *    ('choice'); else move the fill (see chooseFillMove).
   *    Dark mode tries the light-mode label first, deepening or lightening the fill by up to
   *    ΔL 0.12 so the button looks like the same button in both schemes (ADR-006, Anuj). If that
   *    move is too big, or would undo the visibility lift, the rule above applies instead.
   * 3. hover / pressed: move away from the label by ΔL 0.04 / 0.08 (see deriveState).
   * 4. border: the fill itself, or border.strong when the fill vanishes into the surface.
   */
  solidWithLabel(o: {
    bgRole: Role;
    fgRole: Role;
    hoverRole?: Role;
    pressedRole?: Role;
    borderRole?: Role;
    base: StepRef;
    darkVisibility: boolean;
    /** "Your primary" */
    owner: string;
    /** "buttons" (as in "dark-mode buttons") */
    fillsNoun: string;
    /** "the primary button" */
    fillNoun: string;
    /** "button labels" */
    labelsNoun: string;
    /** "primary buttons" (as in "…so primary buttons get an outline") */
    outlinedNoun?: string;
    /** Preferred label. Default 'white'. */
    prefer?: 'white' | 'ink';
  }): void {
    const { scheme } = this;
    let bg = o.base.hex;
    let bgAdj: Adjustment | undefined;

    // 1. Dark findability heuristic (not WCAG; see DARK_VISIBILITY_MIN).
    if (scheme === 'dark' && o.darkVisibility) {
      const canvas = this.hex('surface.canvas');
      const before = contrastRatio(bg, canvas);
      if (before < DARK_VISIBILITY_MIN) {
        const start = hexToOklch(bg);
        let next = bg;
        for (let i = 1; i <= Math.ceil(1 / DARK_VISIBILITY_STEP); i++) {
          next = stepL(start, 1, DARK_VISIBILITY_STEP * i);
          if (contrastRatio(next, canvas) >= DARK_VISIBILITY_MIN) break;
        }
        const after = contrastRatio(next, canvas);
        bgAdj = this.addAdjustment({
          role: o.bgRole,
          kind: 'visibility',
          fromHex: bg,
          toHex: next,
          against: ['surface.canvas'],
          ratioBefore: before,
          ratioAfter: after,
          required: DARK_VISIBILITY_MIN,
          message: `${o.owner} ${bg} nearly disappears on the dark canvas (${r1(before)}:1), so dark-mode ${o.fillsNoun} use a lighter tone of the same hue, ${next} (${r1(after)}:1).`,
        });
        bg = next;
      }
    }

    // 2. On-colour: the preferred label if it reaches 4.5:1, else the other label ('choice'),
    //    else move the fill (see chooseFillMove).
    const ink = scheme === 'light' ? this.step('neutral', 12) : this.step('neutral', 1);
    const white: StepRef = { hex: WHITE };
    const preferInk = o.prefer === 'ink';
    const preferred = preferInk ? ink : white;
    const other = preferInk ? white : ink;
    let label: StepRef;
    const match = this.lightMatch(o.fgRole);
    const matchLabel = match === 'ink' ? ink : match === 'white' ? white : undefined;
    const matchMove = matchLabel && this.matchFillMove(bg, matchLabel.hex, match === 'white' ? -1 : 1, o.darkVisibility);
    if (matchLabel && contrastRatio(matchLabel.hex, bg) >= TEXT_MIN) {
      label = matchLabel;
    } else if (matchLabel && matchMove) {
      const otherR = contrastRatio(match === 'white' ? ink.hex : WHITE, bg);
      const after = contrastRatio(matchLabel.hex, matchMove);
      const tone = match === 'white' ? 'deeper' : 'lighter';
      bgAdj = this.addAdjustment({
        role: o.bgRole,
        kind: 'choice',
        fromHex: bg,
        toHex: matchMove,
        against: [o.fgRole],
        ratioBefore: contrastRatio(matchLabel.hex, bg),
        ratioAfter: after,
        required: TEXT_MIN,
        message: `${match === 'white' ? 'White' : 'Ink'} labels on ${bg} only reach ${r1(contrastRatio(matchLabel.hex, bg))}:1 (${match === 'white' ? 'ink' : 'white'} would pass at ${r1(otherR)}:1), but to match light mode, dark-mode ${o.fillsNoun} use a ${tone} tone, ${matchMove}, so ${o.labelsNoun} stay ${match} (${r1(after)}:1).`,
      });
      bg = matchMove;
      label = matchLabel;
    } else if (contrastRatio(preferred.hex, bg) >= TEXT_MIN) {
      label = preferred;
    } else if (contrastRatio(other.hex, bg) >= TEXT_MIN) {
      label = other;
    } else {
      const whiteR = contrastRatio(WHITE, bg);
      const inkR = contrastRatio(ink.hex, bg);
      const move = chooseFillMove(bg, ink.hex, preferInk ? 'ink' : 'white');
      label = move.label === 'ink' ? ink : white;
      const after = contrastRatio(label.hex, move.hex);
      const tone = `${move.dl <= 0.03 + 1e-9 ? 'slightly ' : ''}${move.label === 'ink' ? 'lighter' : 'deeper'}`;
      bgAdj = this.addAdjustment({
        role: o.bgRole,
        kind: 'contrast',
        fromHex: bg,
        toHex: move.hex,
        against: [o.fgRole],
        ratioBefore: Math.max(whiteR, inkR),
        ratioAfter: after,
        required: TEXT_MIN,
        message: `Neither white (${r1(whiteR)}:1) nor ink (${r1(inkR)}:1) labels reach 4.5:1 on ${bg}, so ${o.fillNoun} uses a ${tone} tone, ${move.hex}, with ${move.label} labels (${r1(after)}:1).`,
      });
      bg = move.hex;
    }

    // Record the fill.
    if (bgAdj) this.setAdjusted(o.bgRole, { hex: bg }, o.base, bgAdj);
    else this.set(o.bgRole, o.base);

    // Record the label: a 'choice' adjustment only when it differs from the preferred label.
    if (label.hex === preferred.hex) {
      this.set(o.fgRole, label);
    } else {
      const prefR = contrastRatio(preferred.hex, bg);
      const gotR = contrastRatio(label.hex, bg);
      const message = preferInk
        ? `Ink labels (${preferred.hex}) on ${bg} only reach ${r1(prefR)}:1, so ${o.labelsNoun} use white (${r1(gotR)}:1).`
        : `White labels on ${bg} only reach ${r1(prefR)}:1, so ${o.labelsNoun} use ink ${label.hex} (${r1(gotR)}:1).`;
      const adj = this.addAdjustment({
        role: o.fgRole,
        kind: 'choice',
        fromHex: preferred.hex,
        toHex: label.hex,
        against: [o.bgRole],
        ratioBefore: prefR,
        ratioAfter: gotR,
        required: TEXT_MIN,
        message,
      });
      this.setAdjusted(o.fgRole, label, preferred, adj);
    }

    // 3. Interaction states.
    if (o.hoverRole) this.set(o.hoverRole, { hex: deriveState(bg, label.hex, HOVER_DL) });
    if (o.pressedRole) this.set(o.pressedRole, { hex: deriveState(bg, label.hex, PRESSED_DL) });

    // 4. Outline.
    if (o.borderRole) {
      const surface = this.hex('surface.default');
      const r = contrastRatio(bg, surface);
      const fill = this.color(o.bgRole);
      const fillRef: StepRef = fill.ref ? { hex: fill.hex, ref: fill.ref } : { hex: fill.hex };
      if (r < OUTLINE_MIN) {
        const strong = this.color('border.strong');
        const to: StepRef = strong.ref ? { hex: strong.hex, ref: strong.ref } : { hex: strong.hex };
        const adj = this.addAdjustment({
          role: o.borderRole,
          kind: 'visibility',
          fromHex: bg,
          toHex: strong.hex,
          against: ['surface.default'],
          ratioBefore: r,
          ratioAfter: contrastRatio(strong.hex, surface),
          required: OUTLINE_MIN,
          message: `${bg} is almost the same as the background (${r1(r)}:1), so ${o.outlinedNoun ?? o.fillsNoun} get an outline (${strong.hex}).`,
        });
        this.setAdjusted(o.borderRole, to, fillRef, adj);
      } else {
        this.set(o.borderRole, fillRef);
      }
    }
  }

  /** The label ('white' | 'ink') this fill's label role got in light mode; undefined when resolving light. */
  private lightMatch(fgRole: Role): 'white' | 'ink' | undefined {
    const light = this.lightRoles?.[fgRole];
    if (this.scheme !== 'dark' || !light) return undefined;
    return light.hex === WHITE ? 'white' : 'ink';
  }

  /**
   * Smallest fill move (0.005 L steps, at most PREFERRED_LABEL_MAX_DL) that gives `labelHex` 4.5:1,
   * darker for white and lighter for ink. Deepening must keep the dark visibility minimum when
   * the fill has one. Undefined when no move within the cap works.
   */
  private matchFillMove(bgHex: string, labelHex: string, dir: -1 | 1, keepVisible: boolean): string | undefined {
    if (contrastRatio(labelHex, bgHex) >= TEXT_MIN) return undefined;
    const start = hexToOklch(bgHex);
    const canvas = this.hex('surface.canvas');
    for (let i = 1; NUDGE_STEP * i <= PREFERRED_LABEL_MAX_DL + 1e-9; i++) {
      const hex = stepL(start, dir, NUDGE_STEP * i);
      if (contrastRatio(labelHex, hex) < TEXT_MIN) continue;
      if (keepVisible && contrastRatio(hex, canvas) < DARK_VISIBILITY_MIN) return undefined;
      return hex;
    }
    return undefined;
  }

  result(): RoleResolution {
    const missing = ROLES.filter((r) => !this.roles[r]);
    if (missing.length) throw new Error(`Unresolved roles (${this.scheme}): ${missing.join(', ')}`);
    const roles = Object.fromEntries(ROLES.map((r) => [r, this.roles[r]!])) as Record<Role, ResolvedColor>;
    const order = new Map<Role, number>(ROLES.map((r, i) => [r, i]));
    // Stable sort by role order; within a role, insertion order (e.g. visibility before contrast).
    const adjustments = this.adjustments
      .map((a, i) => ({ a, i }))
      .sort((x, y) => order.get(x.a.role)! - order.get(y.a.role)! || x.i - y.i)
      .map(({ a }) => a);
    return { roles, adjustments };
  }
}

/**
 * Largest L move (OKLCH) we accept to keep the preferred label when neither label fits a fill.
 * Within this, "deeper fill + white label" beats a smaller move to ink: designers expect a
 * saturated red button to get darker with white text, not paler with dark text.
 */
export const PREFERRED_LABEL_MAX_DL = 0.12;

/**
 * Neither white nor ink reaches 4.5:1 on `bgHex` (a mid-tone). Move the fill in 0.005 L steps:
 * darker until white passes, lighter until ink passes. Keep the preferred label if its move is
 * ΔL ≤ 0.12; otherwise take the smaller move (ties go to the preferred label).
 */
export function chooseFillMove(
  bgHex: string,
  inkHex: string,
  prefer: 'white' | 'ink',
): { hex: string; label: 'white' | 'ink'; dl: number } {
  const start = hexToOklch(bgHex);
  const search = (dir: -1 | 1, labelHex: string) => {
    for (let i = 1; i <= NUDGE_CAP; i++) {
      const hex = stepL(start, dir, NUDGE_STEP * i);
      if (contrastRatio(labelHex, hex) >= TEXT_MIN) return { hex, dl: NUDGE_STEP * i };
    }
    return undefined;
  };
  const moves = { white: search(-1, WHITE), ink: search(1, inkHex) };
  const otherLabel = prefer === 'ink' ? 'white' : 'ink';
  const pref = moves[prefer];
  const alt = moves[otherLabel];
  const usePreferred = !!pref && (pref.dl <= PREFERRED_LABEL_MAX_DL + 1e-9 || !alt || pref.dl <= alt.dl);
  const pick = usePreferred ? prefer : otherLabel;
  const move = moves[pick];
  // One of the two always exists: L → 0 gives black (white label 21:1), L → 1 gives white.
  if (!move) throw new Error(`No label fits ${bgHex}`);
  return { hex: move.hex, label: pick, dl: move.dl };
}

/**
 * Hover / pressed: move the fill AWAY from its label (darker under a white label, lighter under
 * ink) by `dl`. If that would leave the perceptible range [0.12, 0.97], go the other direction
 * instead — starting from the range edge when the fill already sits outside it, so pure black or
 * pure white still get a visible state — and shrink the move until the label keeps 4.5:1.
 */
export function deriveState(bgHex: string, labelHex: string, dl: number): string {
  const o = hexToOklch(bgHex);
  const away: -1 | 1 = relativeLuminance(labelHex) > relativeLuminance(bgHex) ? -1 : 1;
  const ok = (hex: string) => contrastRatio(labelHex, hex) >= TEXT_MIN;
  const target = o.l + away * dl;
  if (target >= STATE_L_MIN && target <= STATE_L_MAX) {
    // Moving away only increases contrast, but gamut mapping can bend luminance slightly: verify.
    let hex = oklchToHex({ l: target, c: o.c, h: o.h });
    for (let i = 1; !ok(hex) && i <= NUDGE_CAP; i++) hex = oklchToHex({ l: target + away * NUDGE_STEP * i, c: o.c, h: o.h });
    return hex;
  }
  const edge = Math.min(STATE_L_MAX, Math.max(STATE_L_MIN, o.l));
  for (let d = dl; d > 1e-9; d -= NUDGE_STEP) {
    const hex = oklchToHex({ l: edge - away * d, c: o.c, h: o.h });
    if (ok(hex)) return hex;
  }
  // Nothing towards the label keeps 4.5:1: fall back to moving away (beyond the range).
  let hex = oklchToHex({ l: target, c: o.c, h: o.h });
  for (let i = 1; !ok(hex) && i <= NUDGE_CAP; i++) hex = oklchToHex({ l: target + away * NUDGE_STEP * i, c: o.c, h: o.h });
  return hex;
}

/* ------------------------------------------------------------------ *
 * Mapping
 * ------------------------------------------------------------------ */

export function resolveRoles(
  scheme: Scheme,
  ramps: Record<RampName, Ramp>,
  lightRoles?: Record<Role, ResolvedColor>,
): RoleResolution {
  const s = new SchemeResolver(scheme, ramps, lightRoles);
  const L = scheme === 'light';
  const n = (i: number) => s.step('neutral', i);
  const p = (i: number) => s.step('primary', i);
  const a = (i: number) => s.step('accent', i);

  // Surfaces
  s.set('surface.canvas', L ? n(2) : n(1));
  s.set('surface.default', L ? n(1) : n(2));
  s.set('surface.raised', L ? n(1) : n(3));
  s.set('surface.sunken', L ? n(3) : n(1));
  s.set('surface.selected', L ? p(3) : p(4));
  s.set('surface.inverse', n(12));

  // Text (single candidates still go through the solver so a failure is nudged, never shipped)
  s.solve('text.default', [n(12)]);
  s.solve('text.subtle', [n(11)]);
  s.set('text.disabled', n(8)); // WCAG 1.4.3 exempts disabled controls; not checked
  s.solve('text.inverse', [n(1)]);
  s.solve('text.brand', [p(11), p(12)]);

  // Borders
  s.set('border.subtle', L ? n(5) : n(4));
  s.set('border.default', L ? n(7) : n(6));
  s.solve('border.strong', [n(9), n(10), n(11)]);

  // Secondary action
  s.set('action.secondary.bg', p(3));
  s.set('action.secondary.hover', p(4));
  s.set('action.secondary.pressed', p(5));
  // Light: step 12 is preferred — step 11 (L ≤ 0.52) cannot reach 4.5:1 on the pressed fill
  // (step 5, L 0.885) for most brands, which made the fallback the rule rather than the exception.
  s.solve('action.secondary.fg', L ? [p(12)] : [p(11), p(12)]);

  // Accent (subtle + text)
  s.set('accent.subtle', L ? a(3) : a(4));
  s.solve('accent.text', [a(11), a(12)]);

  // Focus ring
  s.solve('focus.ring', L ? [p(9), p(10), p(11), p(12), n(12)] : [p(9), p(11), p(12), n(12)]);

  // Primary button
  s.solidWithLabel({
    bgRole: 'action.primary.bg',
    fgRole: 'action.primary.fg',
    hoverRole: 'action.primary.hover',
    pressedRole: 'action.primary.pressed',
    borderRole: 'action.primary.border',
    base: p(9),
    darkVisibility: true,
    owner: 'Your primary',
    fillsNoun: 'buttons',
    fillNoun: 'the primary button',
    labelsNoun: 'button labels',
    outlinedNoun: 'primary buttons',
  });

  // Accent fill
  s.solidWithLabel({
    bgRole: 'accent.bg',
    fgRole: 'accent.fg',
    base: a(9),
    darkVisibility: true,
    owner: 'Your accent',
    fillsNoun: 'accent fills',
    fillNoun: 'the accent fill',
    labelsNoun: 'accent labels',
  });

  // Feedback
  for (const f of FEEDBACK_NAMES) {
    const fr = (i: number) => s.step(f, i);
    s.set(`feedback.${f}.bg`, fr(3));
    s.set(`feedback.${f}.border`, fr(7));
    s.solve(`feedback.${f}.fg`, [fr(11), fr(12)]);
    s.solidWithLabel({
      bgRole: `feedback.${f}.solid`,
      fgRole: `feedback.${f}.onSolid`,
      base: fr(9),
      darkVisibility: false,
      owner: `The ${f} colour`,
      fillsNoun: `${f} badges`,
      fillNoun: `the ${f} badge`,
      labelsNoun: `${f} badge labels`,
      prefer: FEEDBACK_LABEL[f],
    });
  }

  return s.result();
}


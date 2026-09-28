/**
 * Strata theme-engine — public contract.
 *
 * Everything other packages and apps rely on is declared here. Implementation files
 * (color.ts, ramps.ts, roles.ts, theme.ts, css-vars.ts, export/*) must satisfy these types.
 * Change this file only deliberately: it is the API.
 */

export type Scheme = 'light' | 'dark';
export type Density = 'comfortable' | 'compact';
/** 'paper' is a warmer, yellower off-white, like printed stock (added for the editorial Care brand, ADR-015). */
export type NeutralTemperature = 'cool' | 'neutral' | 'warm' | 'paper';
export type Shape = 'sharp' | 'soft' | 'round';
export type TypePairId =
  | 'precise'
  | 'calm'
  | 'friendly'
  | 'technical'
  | 'bilingual-round'
  | 'bilingual-classic'
  | 'editorial'
  | 'modern'
  | 'bilingual-devanagari';

/** The ≤6 inputs a brand provides. A tenant's brand.json is exactly this shape. */
export interface BrandInput {
  /** Display name, e.g. "Vela". */
  name: string;
  /** Primary brand colour as hex (#rgb or #rrggbb, case-insensitive). Kept exact wherever contrast allows. */
  primary: string;
  /** Optional accent colour as hex. Defaults to `primary`. */
  accent?: string;
  neutral: NeutralTemperature;
  shape: Shape;
  typePair: TypePairId;
  density: Density;
}

/** BrandInput after normalisation: hex values are lowercase #rrggbb, accent is filled. */
export interface ResolvedBrandInput extends Required<BrandInput> {}

export type RampName = 'primary' | 'accent' | 'neutral' | 'success' | 'warning' | 'danger' | 'info';
/** 12 lowercase #rrggbb values. Index 0 = step 1 (lightest in light scheme, darkest in dark scheme). */
export type Ramp = string[];

/** Every semantic colour role. Components may only use these (via CSS variables), never ramp steps. */
export const ROLES = [
  'surface.canvas',
  'surface.default',
  'surface.raised',
  'surface.sunken',
  'surface.selected',
  'surface.inverse',
  'text.default',
  'text.subtle',
  'text.disabled',
  'text.inverse',
  'text.brand',
  'border.subtle',
  'border.default',
  'border.strong',
  'action.primary.bg',
  'action.primary.fg',
  'action.primary.hover',
  'action.primary.pressed',
  'action.primary.border',
  'action.secondary.bg',
  'action.secondary.fg',
  'action.secondary.hover',
  'action.secondary.pressed',
  'accent.bg',
  'accent.fg',
  'accent.subtle',
  'accent.text',
  'focus.ring',
  'feedback.success.bg',
  'feedback.success.fg',
  'feedback.success.border',
  'feedback.success.solid',
  'feedback.success.onSolid',
  'feedback.warning.bg',
  'feedback.warning.fg',
  'feedback.warning.border',
  'feedback.warning.solid',
  'feedback.warning.onSolid',
  'feedback.danger.bg',
  'feedback.danger.fg',
  'feedback.danger.border',
  'feedback.danger.solid',
  'feedback.danger.onSolid',
  'feedback.info.bg',
  'feedback.info.fg',
  'feedback.info.border',
  'feedback.info.solid',
  'feedback.info.onSolid',
] as const;
export type Role = (typeof ROLES)[number];

export interface ResolvedColor {
  /** Final value, lowercase #rrggbb. */
  hex: string;
  /** "primary.9" when the value is exactly a ramp step. Absent when the solver produced a new value. */
  ref?: string;
  /** Present when the solver changed this role away from its preferred value. */
  adjusted?: { fromHex: string; fromRef?: string; adjustmentId: string };
}

/**
 * contrast   — moved to meet a WCAG 2.2 AA ratio
 * visibility — moved so the element stays findable (e.g. navy button on a near-black canvas)
 * choice     — a documented pick between valid options (e.g. ink labels instead of white)
 */
export type AdjustmentKind = 'contrast' | 'visibility' | 'choice';

export interface Adjustment {
  /** Stable id, e.g. "light:focus.ring". */
  id: string;
  scheme: Scheme;
  role: Role;
  kind: AdjustmentKind;
  /** Human label, e.g. "Focus ring", "Button label". */
  label: string;
  fromHex: string;
  toHex: string;
  against?: Role[];
  ratioBefore?: number;
  ratioAfter?: number;
  required?: number;
  /** One plain-English sentence a designer or PM understands. No jargon beyond "contrast". */
  message: string;
}

export interface ContrastCheck {
  scheme: Scheme;
  fg: Role;
  bg: Role;
  fgHex: string;
  bgHex: string;
  /** Exact WCAG 2.x ratio computed from the final 8-bit hex values. Never rounded up. */
  ratio: number;
  required: number;
  kind: 'text' | 'non-text';
  pass: boolean;
}

export interface SchemeTheme {
  ramps: Record<RampName, Ramp>;
  roles: Record<Role, ResolvedColor>;
  /** raised/overlay: elevation. highlight: an inset top-edge sheen for solid fills (tactile buttons). */
  shadows: { raised: string; overlay: string; highlight: string };
  /** Translucent overlay surface: surface.raised at `opacity` + backdrop blur (px). Opacity is solved (glass.ts). */
  glass: { opacity: number; blur: number };
  /**
   * Chart palette (chart.ts). `series`: 4 categorical hexes in fixed order. Series 1 is the brand hue;
   * every series passes the dataviz checks (band, chroma ≥ 0.1, 3:1 on surfaces, CVD + normal ΔE).
   * `grid` = border.subtle (decorative), `axis` = text.subtle (text). `notes` only when the solver fell back.
   */
  chart: { series: string[]; grid: string; axis: string; notes?: string[] };
}

export interface DensityTokens {
  controlHeight: number;
  controlPaddingInline: number;
  tableRowHeight: number;
  cardInset: number;
  sectionGap: number;
  fieldGap: number;
}

export interface Foundations {
  /** px. Keys are 4pt-grid multipliers. */
  space: { '0': 0; '1': 4; '2': 8; '3': 12; '4': 16; '5': 20; '6': 24; '8': 32; '10': 40; '12': 48; '16': 64 };
  /** px. Depends on `shape`. */
  radius: { button: number; field: number; container: number; badge: number; pill: number };
  /** px */
  fontSize: { xs: number; sm: number; md: number; lg: number; xl: number; '2xl': number; '3xl': number; '4xl': number; '5xl': number };
  lineHeight: { tight: number; snug: number; normal: number };
  fontWeight: { regular: number; medium: number; semibold: number; bold: number };
  /**
   * ms + CSS easings. `easing` is the standard curve, `easingOut` a fast-settling enter curve,
   * `spring` a damped spring sampled into CSS linear() with the time it takes to settle.
   */
  motion: {
    durationFast: number;
    durationNormal: number;
    durationSlow: number;
    easing: string;
    easingOut: string;
    spring: { easing: string; duration: number; stiffness: number; damping: number };
  };
  density: Record<Density, DensityTokens>;
}

export interface TypePair {
  id: TypePairId;
  /** e.g. "Precise — Inter Tight / Inter" */
  label: string;
  /** Full CSS font-family stacks, including fallbacks. */
  heading: string;
  body: string;
  mono: string;
  /** CSS letter-spacing for headings. Must be "0" for Arabic-capable pairs (tracking breaks joined script). */
  headingTracking: string;
  supportsArabic: boolean;
  /** Google Fonts family names to load, e.g. ["Inter Tight", "Inter", "JetBrains Mono"]. */
  googleFamilies: string[];
  /** Families whose italics are loaded too (for editorial emphasis: an <em> in a heading is a real italic). */
  italicFamilies?: string[];
  /** Variable families loaded with their optical-size axis range, e.g. { Fraunces: '9..144' }: display sizes get the display cut. */
  opticalSizeFamilies?: Record<string, string>;
  /**
   * Type tokens for a script whose marks don't fit the Latin values (ADR-020). Absent on Latin and Arabic pairs.
   * The brand still has six inputs: the pair carries the script, and components read the same tokens.
   */
  script?: ScriptTypeTokens;
}

/**
 * Per-script type tokens (ADR-020). They replace values in Foundations, so every exporter (CSS, DTCG, Figma) reads
 * them from the same place. Each value is measured by scripts/check-script-clipping.mjs, not chosen by eye.
 */
export interface ScriptTypeTokens {
  /** The script the pair is built for. */
  name: 'devanagari';
  /** Replaces Foundations.lineHeight: the smallest values at which no glyph's ink leaves its line box. */
  lineHeight: Foundations['lineHeight'];
  /** px. Steps of the type scale below this are raised to it, because smaller marks merge. */
  minFontSize: number;
  /**
   * --strata-font-tracking-caps for this script. Devanagari has no case, and positive letter-spacing breaks the
   * headline (shirorekha) that joins a word, so it is "0". The per-size tracking curve stays: it is 0 or negative,
   * and measured negative values break no headline.
   */
  capsTracking: string;
}

export interface ThemeSummary {
  checks: number;
  passed: number;
  failed: number;
  adjustments: number;
  /** Number of tokens in the DTCG export (primitives + semantic + foundations). */
  tokenCount: number;
  /** Wall-clock ms for generateTheme, measured with performance.now(). */
  generationMs: number;
}

export interface Theme {
  input: ResolvedBrandInput;
  schemes: Record<Scheme, SchemeTheme>;
  adjustments: Adjustment[];
  checks: ContrastCheck[];
  foundations: Foundations;
  typePair: TypePair;
  summary: ThemeSummary;
}

/* ------------------------------------------------------------------ *
 * CSS variable contract (implemented by toCssVariables in css-vars.ts)
 *
 * Colour roles:  --strata-color-<role>, dots → dashes, camelCase → kebab
 *                e.g. feedback.success.onSolid → --strata-color-feedback-success-on-solid
 * Space:         --strata-space-{0,1,2,3,4,5,6,8,10,12,16}        (px)
 * Radius:        --strata-radius-{button,field,container,badge,pill} (px)
 * Fonts:         --strata-font-heading | --strata-font-body | --strata-font-mono (stacks)
 *                --strata-font-heading-tracking
 * Type scale:    --strata-font-size-{xs,sm,md,lg,xl,2xl,3xl,4xl,5xl}  (px)
 * Tracking:      --strata-font-tracking-{xs,sm,md,lg,xl,2xl,3xl,4xl,5xl,caps}  (em; 0 for Arabic-capable pairs; caps 0 for Devanagari)
 * Icons:         --strata-icon-stroke  (unitless SVG stroke width)
 *                --strata-line-height-{tight,snug,normal}         (unitless)
 *                --strata-font-weight-{regular,medium,semibold,bold}
 * Elevation:     --strata-shadow-raised | --strata-shadow-overlay | --strata-shadow-highlight | --strata-hairline | --strata-rim | --strata-glow | --strata-sheen
 * Glass:         --strata-glass-bg | --strata-glass-blur | --strata-glass-opacity
 * Chart:         --strata-chart-{1,2,3,4}  (series hexes, fixed order; per scheme)
 *                --strata-chart-grid | --strata-chart-axis   (var() aliases of border.subtle / text.subtle)
 * Motion:        --strata-motion-duration-{fast,normal,slow,spring} (ms) | --strata-motion-easing | --strata-motion-easing-out | --strata-motion-spring
 * Density:       --strata-control-height | --strata-control-padding-inline | --strata-table-row-height
 *                --strata-card-inset | --strata-section-gap | --strata-field-gap   (px)
 * ------------------------------------------------------------------ */

/** Converts a role to its CSS custom property name. */
export function roleToCssVar(role: Role): string {
  return '--strata-color-' + role.replace(/\./g, '-').replace(/[A-Z]/g, (m) => '-' + m.toLowerCase());
}

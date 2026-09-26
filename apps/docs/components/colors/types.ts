/** Serialisable colour data the /colors page computes at build time and hands to the client grid. */

export interface ColorSwatch {
  /** 1–12. */
  step: number;
  /** Lowercase #rrggbb. */
  hex: string;
  /** "oklch(L C H)", computed from the 8-bit hex. */
  oklch: string;
  /** Semantic roles that resolve to exactly this step in this scheme, e.g. ["action.primary.bg"]. */
  roles: string[];
  /** CSS variable of the first role, e.g. "--strata-color-action-primary-bg". */
  cssVar?: string;
  /** Which end of the tenant's own neutral ramp reads best on this swatch (for the hover label). */
  ink: string;
}

export interface ColorRamp {
  name: string;
  label: string;
  swatches: ColorSwatch[];
}

export interface ColorScheme {
  scheme: 'light' | 'dark';
  ramps: ColorRamp[];
}

export interface BrandFact {
  label: string;
  value: string;
  /** A colour to show as a swatch next to the value. */
  swatch?: string;
}

export interface ColorTenant {
  id: string;
  name: string;
  description: string;
  facts: BrandFact[];
  schemes: ColorScheme[];
}

export type CopyFormat = 'hex' | 'var' | 'oklch';

/**
 * Brand fidelity: how far the colour on screen is from the colour the brand asked for (ADR-018).
 *
 * The solver may move a brand fill to make its label readable. This measures that move, so "accessible by
 * construction" comes with its cost stated. For each brand input and scheme it compares the input hex with the role
 * that carries it as a fill: `action.primary.bg` for the primary, `accent.bg` for the accent.
 *
 * Distance is Euclidean in OKLab × 100 (the same measure as the chart palette checks). As a guide only, not a
 * threshold: under 2 is hard to see side by side, over 10 reads as a different colour.
 */
import { chartDeltaE } from './chart';
import type { Role, Scheme, Theme } from './types';

export type BrandColorInput = 'primary' | 'accent';

/** The role that shows each brand colour as a fill. */
export const FIDELITY_ROLES: Record<BrandColorInput, Role> = {
  primary: 'action.primary.bg',
  accent: 'accent.bg',
};

export interface FidelityRecord {
  input: BrandColorInput;
  scheme: Scheme;
  role: Role;
  /** What the brand asked for. */
  asked: string;
  /** What the theme ships in that role. */
  shipped: string;
  /** OKLab distance × 100. 0 when the brand colour is kept exactly. */
  deltaE: number;
  exact: boolean;
}

const SCHEMES: readonly Scheme[] = ['light', 'dark'];

/** One record per brand colour and scheme. The accent is reported even when it defaulted to the primary. */
export function brandFidelity(theme: Theme): FidelityRecord[] {
  const out: FidelityRecord[] = [];
  for (const input of ['primary', 'accent'] as const) {
    const asked = theme.input[input];
    const role = FIDELITY_ROLES[input];
    for (const scheme of SCHEMES) {
      const shipped = theme.schemes[scheme].roles[role].hex;
      const exact = shipped === asked;
      out.push({ input, scheme, role, asked, shipped, deltaE: exact ? 0 : chartDeltaE(asked, shipped), exact });
    }
  }
  return out;
}

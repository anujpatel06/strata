import { contrastRatio, type AdjustmentKind, type Scheme } from '@strata/theme-engine';

/** Contrast ratio floored (never rounded up) to 2 decimals: 4.499 → "4.49". The epsilon only absorbs float noise. */
export function floorRatio(ratio: number): string {
  return (Math.floor(ratio * 100 + 1e-9) / 100).toFixed(2);
}

/** Required ratio for display: 4.5 → "4.5", 3 → "3". */
export function formatRequired(required: number): string {
  return Number.isInteger(required) ? String(required) : required.toFixed(1);
}

export const SCHEME_LABEL: Record<Scheme, string> = { light: 'Light', dark: 'Dark' };

export const KIND_LABEL: Record<AdjustmentKind, string> = {
  contrast: 'Contrast',
  visibility: 'Visibility',
  choice: 'Choice',
};

/** Whichever of white or black reads better on `hex` — for labels drawn on top of swatches. */
export function labelOn(hex: string): '#ffffff' | '#000000' {
  return contrastRatio('#ffffff', hex) >= contrastRatio('#000000', hex) ? '#ffffff' : '#000000';
}

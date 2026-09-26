import type { AdjustmentKind, Scheme } from '@strata/theme-engine';

/**
 * Same as the engine's formatRatio (packages/theme-engine/src/color.ts), which the package entry doesn't export:
 * floored — never rounded up — to one decimal, so 4.49 shows as "4.4" and never passes by rounding.
 * The 1e-9 guard only absorbs binary-float noise (2.3 is stored as 2.2999…98).
 */
export function formatRatio(ratio: number): string {
  return (Math.floor(ratio * 10 + 1e-9) / 10).toFixed(1);
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

/** What each adjustment kind means, for tooltips and screen readers. */
export const KIND_HELP: Record<AdjustmentKind, string> = {
  contrast: 'Moved to meet a WCAG 2.2 AA contrast ratio.',
  visibility: 'Moved so the element stays findable. A Strata heuristic, not a WCAG result.',
  choice: 'A documented pick between valid options.',
};

export const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

export function formatBytes(bytes: number): string {
  return bytes < 1024 ? `${bytes} B` : `${(bytes / 1024).toFixed(1)} KB`;
}

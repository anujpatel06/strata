/**
 * @syntara/theme-engine — public entry point.
 * Owners: theme.ts / color.ts / type-pairs.ts / foundations.ts (engine core),
 *         css-vars.ts / export/* (exporters). Names below are the contract.
 */
export * from './types';

// Engine core
export { generateTheme, normalizeBrandInput, countTokens } from './theme';
export {
  contrastRatio,
  isValidHex,
  normalizeHex,
  hexToOklch,
  oklchToHex,
  relativeLuminance,
} from './color';
export { TYPE_PAIRS, googleFontsHref } from './type-pairs';
export { FOUNDATIONS, radiusForShape } from './foundations';
export { CHART_CANDIDATES, chartPaletteProblems, solveChartSeries } from './chart';
export { FIDELITY_ROLES, brandFidelity, type BrandColorInput, type FidelityRecord } from './fidelity';

// Exporters
export { toCssVariables } from './css-vars';
export { toCSS } from './export/css';
export { toDTCG } from './export/dtcg';
export { toFigmaFiles, FIGMA_STARTER_MODE, type FigmaExportOptions, type FigmaModes } from './export/figma';
export { toShadcnCssVars, toShadcnCSS, type ShadcnCssVars, type ToShadcnOptions } from './export/shadcn';
export { toCompose, type ToComposeOptions } from './export/compose';
export { toSwiftUI } from './export/swiftui';
export {
  NATIVE_EXCLUSIONS,
  buildNativeModel,
  verifyNativeExport,
  type NativeExportCheck,
  type NativeModel,
  type NativeModelOptions,
  type NativePlatform,
} from './export/native';

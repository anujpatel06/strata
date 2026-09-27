/** Batch: objects. Spec: ../create-icon.tsx; reference drawings: ./core.ts. */
import { createIcon } from '../create-icon';

// File family: every file icon is core's IconFile page + fold, with one small mark in the lower half (y 11.5–17.5).
const PAGE = 'M13 3.75H8.5a3.25 3.25 0 0 0-3.25 3.25v10a3.25 3.25 0 0 0 3.25 3.25h7a3.25 3.25 0 0 0 3.25-3.25V9.5z';
const FOLD = 'M13 3.75v2.9a2.85 2.85 0 0 0 2.85 2.85h2.9';
const file = (...marks: string[]) => [['path', { d: PAGE }], ['path', { d: FOLD }], ...marks.map((d) => ['path', { d }] as const)] as const;

export const IconFileText = createIcon('file-text', file('M9 13.25h6M9 16.5h3.5'));
// </> reduced to fit the page: two small angles and a slash.
export const IconFileCode = createIcon('file-code', file('M9.5 12.25 7.75 14.5l1.75 2.25M14.5 12.25l1.75 2.25-1.75 2.25M12.65 12l-1.3 5'));
// A small brace pair (TSX/TS). Letters would be illegible at 16px.
export const IconFileTypeTsx = createIcon('file-type-tsx', file(
  'M10 11.75c-.85 0-1.35.4-1.35 1.2v.45c0 .6-.3.95-.9 1.1.6.15.9.5.9 1.1v.45c0 .8.5 1.2 1.35 1.2M14 11.75c.85 0 1.35.4 1.35 1.2v.45c0 .6.3.95.9 1.1-.6.15-.9.5-.9 1.1v.45c0 .8-.5 1.2-1.35 1.2',
));
// A # (CSS), slanted like a typed hash.
export const IconFileTypeCss = createIcon('file-type-css', file('M10.9 11.75l-.8 5.5M14.65 11.75l-.8 5.5M8.75 13.25h7M8.25 15.75h7'));
// JSON = a full-height brace pair, no page.
export const IconJson = createIcon('json', [
  ['path', { d: 'M9 4.75c-1.6 0-2.5.8-2.5 2.5v2.1c0 1.5-.75 2.4-2 2.65 1.25.25 2 1.15 2 2.65v2.1c0 1.7.9 2.5 2.5 2.5' }],
  ['path', { d: 'M15 4.75c1.6 0 2.5.8 2.5 2.5v2.1c0 1.5.75 2.4 2 2.65-1.25.25-2 1.15-2 2.65v2.1c0 1.7-.9 2.5-2.5 2.5' }],
]);
// One outline: the tab is a soft S-step, no inner line.
export const IconFolder = createIcon('folder', [
  ['path', { d: 'M3.25 8.25A3.25 3.25 0 0 1 6.5 5h2.6c.8 0 1.5.35 2 .95l1 1.2c.45.55 1.1.85 1.8.85h3.6a3.25 3.25 0 0 1 3.25 3.25v4.5A3.25 3.25 0 0 1 17.5 19h-11a3.25 3.25 0 0 1-3.25-3.25z' }],
]);
// Small-radius top; the torn bottom is a shallow zigzag whose round joins soften it (a wave read as a ghost).
export const IconReceipt = createIcon('receipt', [
  ['path', { d: 'M18.5 20.25V6a2.5 2.5 0 0 0-2.5-2.5H8A2.5 2.5 0 0 0 5.5 6v14.25l1.625-1.25 1.625 1.25 1.625-1.25 1.625 1.25 1.625-1.25 1.625 1.25 1.625-1.25z' }],
  ['path', { d: 'M9 8h6M9 11.5h6M9 15h3.5' }],
]);
export const IconCreditCard = createIcon('credit-card', [
  ['rect', { x: 3, y: 5.5, width: 18, height: 13, rx: 3.25 }],
  ['path', { d: 'M3.5 9.75h17M6.75 14.75h3' }],
]);
// Body + a pill pocket on the right edge with a clasp dot.
export const IconWallet = createIcon('wallet', [
  ['rect', { x: 3.5, y: 5, width: 17, height: 14, rx: 4.5 }],
  ['path', { d: 'M20.5 9.75H17a2.25 2.25 0 0 0 0 4.5h3.5' }],
  ['circle', { cx: 17, cy: 12, r: 0.9, fill: 'currentColor', stroke: 'none' }],
]);
// Roof is a soft dome-pediment curve rather than a sharp triangle; three columns, one base.
export const IconBuildingBank = createIcon('building-bank', [
  ['path', { d: 'M4 9.5C7 7.9 9.6 6 12 4.5c2.4 1.5 5 3.4 8 5z' }],
  ['path', { d: 'M7 12.5v4.5M12 12.5v4.5M17 12.5v4.5M4 20h16' }],
]);
// Device family: every screen uses the medium radius 3.25.
export const IconDeviceDesktop = createIcon('device-desktop', [
  ['rect', { x: 3, y: 4, width: 18, height: 12.5, rx: 3.25 }],
  ['path', { d: 'M12 16.5V20M8.75 20h6.5' }],
]);
export const IconDeviceTablet = createIcon('device-tablet', [
  ['rect', { x: 5, y: 3, width: 14, height: 18, rx: 3.25 }],
  ['path', { d: 'M10.5 17.75h3' }],
]);
export const IconDeviceMobile = createIcon('device-mobile', [
  ['rect', { x: 7, y: 3, width: 10, height: 18, rx: 3.25 }],
  ['path', { d: 'M11 17.75h2' }],
]);
// Prompt: core's round-tipped chevron at small scale, then a cursor underscore.
export const IconTerminal2 = createIcon('terminal-2', [
  ['rect', { x: 3, y: 4.5, width: 18, height: 15, rx: 4.5 }],
  ['path', { d: 'M7.3 8.7C8.57 9.85 9.51 10.84 10.25 11.61a.55 .55 0 0 1 0 .77C9.51 13.16 8.57 14.15 7.3 15.3M12.75 15.25h4' }],
]);
// Two round-tipped chevrons (core's chevron at 0.8) and a slash.
export const IconCode = createIcon('code', [
  ['path', { d: 'M9.03 7.2C7.19 8.88 5.83 10.32 4.75 11.44a.8 .8 0 0 0 0 1.12C5.83 13.68 7.19 15.12 9.03 16.8' }],
  ['path', { d: 'M14.97 7.2C16.81 8.88 18.17 10.32 19.25 11.44a.8 .8 0 0 1 0 1.12C18.17 13.68 16.81 15.12 14.97 16.8' }],
  ['path', { d: 'M13.25 6.5 10.75 17.5' }],
]);
// Trunk + one branch that sweeps back into the lower node in a single curve.
export const IconGitBranch = createIcon('git-branch', [
  ['circle', { cx: 7, cy: 5.75, r: 2.25 }],
  ['circle', { cx: 7, cy: 18.25, r: 2.25 }],
  ['circle', { cx: 17, cy: 5.75, r: 2.25 }],
  ['path', { d: 'M7 8v8M17 8c0 5-4 7.25-8.4 8.65' }],
]);
// Four soft-cornered diamonds (the component metaphor designers know).
export const IconComponents = createIcon('components', [
  ['path', { d: 'M12.78 4.03L14.22 5.47Q15 6.25 14.22 7.03L12.78 8.47Q12 9.25 11.22 8.47L9.78 7.03Q9 6.25 9.78 5.47L11.22 4.03Q12 3.25 12.78 4.03ZM18.53 9.78L19.97 11.22Q20.75 12 19.97 12.78L18.53 14.22Q17.75 15 16.97 14.22L15.53 12.78Q14.75 12 15.53 11.22L16.97 9.78Q17.75 9 18.53 9.78ZM12.78 15.53L14.22 16.97Q15 17.75 14.22 18.53L12.78 19.97Q12 20.75 11.22 19.97L9.78 18.53Q9 17.75 9.78 16.97L11.22 15.53Q12 14.75 12.78 15.53ZM7.03 9.78L8.47 11.22Q9.25 12 8.47 12.78L7.03 14.22Q6.25 15 5.47 14.22L4.03 12.78Q3.25 12 4.03 11.22L5.47 9.78Q6.25 9 7.03 9.78Z' }],
]);
// Layout family: outer boxes rx 4.5, inner tiles rx 2, gaps 2.
export const IconTable = createIcon('table', [
  ['rect', { x: 3.5, y: 4, width: 17, height: 16, rx: 4.5 }],
  ['path', { d: 'M3.5 9.5h17M9.75 9.5V20' }],
]);
// Compact list (used for "compact" density): three thin stacked tiles.
export const IconLayoutList = createIcon('layout-list', [
  ['rect', { x: 4, y: 4, width: 16, height: 4, rx: 2 }],
  ['rect', { x: 4, y: 10, width: 16, height: 4, rx: 2 }],
  ['rect', { x: 4, y: 16, width: 16, height: 4, rx: 2 }],
]);
export const IconLayoutGrid = createIcon('layout-grid', [
  ['rect', { x: 4, y: 4, width: 7, height: 7, rx: 2 }],
  ['rect', { x: 13, y: 4, width: 7, height: 7, rx: 2 }],
  ['rect', { x: 4, y: 13, width: 7, height: 7, rx: 2 }],
  ['rect', { x: 13, y: 13, width: 7, height: 7, rx: 2 }],
]);
// Comfortable rows: one box, one divider.
export const IconLayoutRows = createIcon('layout-rows', [
  ['rect', { x: 3.5, y: 3.5, width: 17, height: 17, rx: 4.5 }],
  ['path', { d: 'M3.5 12h17' }],
]);
// Mosaic of four tiles, tall/short alternating, so it differs from the even grid.
export const IconLayoutDashboard = createIcon('layout-dashboard', [
  ['rect', { x: 4, y: 4, width: 7, height: 9, rx: 2 }],
  ['rect', { x: 4, y: 15, width: 7, height: 5, rx: 2 }],
  ['rect', { x: 13, y: 4, width: 7, height: 5, rx: 2 }],
  ['rect', { x: 13, y: 11, width: 7, height: 9, rx: 2 }],
]);
export const IconToggle = createIcon('toggle', [
  ['rect', { x: 3, y: 7, width: 18, height: 10, rx: 5 }],
  ['circle', { cx: 16, cy: 12, r: 2.75 }],
]);
// Density pair: same line length, 4 lines at spacing 4 (small) vs 3 lines at spacing 6 (medium).
export const IconBaselineDensitySmall = createIcon('baseline-density-small', [['path', { d: 'M4.5 6h15M4.5 10h15M4.5 14h15M4.5 18h15' }]]);
export const IconBaselineDensityMedium = createIcon('baseline-density-medium', [['path', { d: 'M4.5 6h15M4.5 12h15M4.5 18h15' }]]);
// Text direction pair: two text lines aligned to the start edge, an arrow underneath; exact mirrors.
export const IconTextDirectionLtr = createIcon('text-direction-ltr', [
  ['path', { d: 'M5 5.5h14M5 10h9' }],
  ['path', { d: 'M5 16.5h13.5M15.75 13.75l2.75 2.75-2.75 2.75' }],
]);
export const IconTextDirectionRtl = createIcon('text-direction-rtl', [
  ['path', { d: 'M19 5.5H5M19 10h-9' }],
  ['path', { d: 'M19 16.5H5.5M8.25 13.75 5.5 16.5l2.75 2.75' }],
]);
// A panel with its rail at the inline start: the sidebar collapse toggle (moved from sidebar.tsx).
export const IconLayoutSidebar = createIcon('layout-sidebar', [['rect', { x: 3, y: 4, width: 18, height: 16, rx: 4.5 }], ['path', { d: 'M9.5 4v16' }]]);
// A small rounded square: a bullet for list items that have no icon of their own (moved from sidebar.tsx).
export const IconSquareSmall = createIcon('square-small', [['rect', { x: 7.5, y: 7.5, width: 9, height: 9, rx: 2.5 }]]);

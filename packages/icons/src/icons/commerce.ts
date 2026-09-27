/** Domain: finance & commerce. Spec: ../create-icon.tsx; reference drawings: ./core.ts (Anuj-approved). */
import { createIcon } from '../create-icon';

// Shared parts, the same ones status.ts and objects.ts use: the r=8.75 ring, filled dots r≈1, the file page + fold,
// the receipt outline, and one soft tag outline (tag + discount).
const ring = ['circle', { cx: 12, cy: 12, r: 8.75 }] as const;
const dot = (cx: number, cy: number, r = 0.95) => ['circle', { cx, cy, r, fill: 'currentColor', stroke: 'none' }] as const;
const PAGE = 'M13 3.75H8.5a3.25 3.25 0 0 0-3.25 3.25v10a3.25 3.25 0 0 0 3.25 3.25h7a3.25 3.25 0 0 0 3.25-3.25V9.5z';
const FOLD = 'M13 3.75v2.9a2.85 2.85 0 0 0 2.85 2.85h2.9';
const RECEIPT = 'M18.5 20.25V6a2.5 2.5 0 0 0-2.5-2.5H8A2.5 2.5 0 0 0 5.5 6v14.25l1.625-1.25 1.625 1.25 1.625-1.25 1.625 1.25 1.625-1.25 1.625 1.25 1.625-1.25z';
// Tag pointing down-right: a soft square-ish head at the top-left, every corner arced.
const TAG = 'M3.75 6v4.1c0 .8.32 1.56.88 2.12l6.9 6.9a2.5 2.5 0 0 0 3.54 0l4.1-4.1a2.5 2.5 0 0 0 0-3.54l-6.9-6.9A3 3 0 0 0 10.1 3.75H6A2.25 2.25 0 0 0 3.75 6Z';

// Coin: the ring plus one short gleam near its upper-left rim. (A long arc read as a spinner; an inner circle as a radio.)
export const IconCoin = createIcon('coin', [ring, ['path', { d: 'M7.4 10.9a5 5 0 0 1 3.5-3.5' }]]);
// Two coins overlapping on the diagonal; the back one is drawn only where it shows.
export const IconCoins = createIcon('coins', [
  ['circle', { cx: 9.25, cy: 14.25, r: 5.75 }],
  ['path', { d: 'M9.14 8.5A5.75 5.75 0 1 1 14.86 15.5' }],
]);
// ₹: two bars, a bowl hanging from the top bar, then the leg.
export const IconCurrencyRupee = createIcon('currency-rupee', [
  ['path', { d: 'M7.5 4.75h9M7.5 8.75h9' }],
  ['path', { d: 'M7.5 4.75h2.75a4 4 0 0 1 0 8H7.5l7.5 6.5' }],
]);
// $: a soft S with the stem only above and below it, so the S stays readable at 16px.
export const IconCurrencyDollar = createIcon('currency-dollar', [
  ['path', { d: 'M16 8.25c-.6-1.55-2.1-2.5-4-2.5-2.35 0-4 1.25-4 3.05 0 1.9 1.7 2.55 4 3.2s4 1.3 4 3.2c0 1.8-1.65 3.05-4 3.05-1.9 0-3.4-.95-4-2.5' }],
  ['path', { d: 'M12 3.75v2M12 18.25v2' }],
]);
// €: an open arc and two bars.
export const IconCurrencyEuro = createIcon('currency-euro', [
  ['path', { d: 'M18.25 6.88A6.5 6.5 0 1 0 18.25 17.12' }],
  ['path', { d: 'M5.75 10.25h7.5M5.75 13.75h7.5' }],
]);
// A round pig facing right: one outline with stub legs and a soft snout, an eye, and the coin slot on its back.
export const IconPiggyBank = createIcon('piggy-bank', [
  ['path', { d: 'M17.6 9.9C16.6 7.5 14.3 6 11.25 6 7.3 6 4.25 8.6 4.25 12.25c0 2.05.85 3.65 2.25 4.65V19a1 1 0 0 0 1 1H9a1 1 0 0 0 1-1v-1.1c1 .15 2 .15 3 0V19a1 1 0 0 0 1 1h1.5a1 1 0 0 0 1-1v-2.1c.7-.5 1.2-1.1 1.55-1.65H19a1 1 0 0 0 1-1v-3.35a1 1 0 0 0-1-1z' }],
  ['path', { d: 'M9.5 9h3' }],
  dot(15.25, 11),
]);
// A pie with one slice lifted out toward the top-right.
export const IconChartPie = createIcon('chart-pie', [
  ['path', { d: 'M11.25 5A7.75 7.75 0 1 0 19 12.75H11.25Z' }],
  ['path', { d: 'M13 3.25A7.75 7.75 0 0 1 20.75 11H13Z' }],
]);
// Three pill bars, no axis.
export const IconChartBar = createIcon('chart-bar', [
  ['rect', { x: 3.75, y: 12, width: 3.5, height: 8, rx: 1.75 }],
  ['rect', { x: 10.25, y: 4, width: 3.5, height: 16, rx: 1.75 }],
  ['rect', { x: 16.75, y: 8.5, width: 3.5, height: 11.5, rx: 1.75 }],
]);
// A rounded axis corner and one smooth line rising across it.
export const IconChartLine = createIcon('chart-line', [
  ['path', { d: 'M4 4.5v12a3.25 3.25 0 0 0 3.25 3.25H20' }],
  ['path', { d: 'M8 14.75c1.6-2.6 2.6-4 4-4s2 2 3.5 2 2.6-2.4 4.5-5.25' }],
]);
// The file page with two ledger rows (item | amount), so it differs from file-text's prose lines.
export const IconFileInvoice = createIcon('file-invoice', [
  ['path', { d: PAGE }],
  ['path', { d: FOLD }],
  ['path', { d: 'M9 12.75h2M13.5 12.75H15M9 16.25h2M13.5 16.25H15' }],
]);
// One banknote: a medium-radius landscape box and a round medallion.
export const IconCash = createIcon('cash', [
  ['rect', { x: 3, y: 6.5, width: 18, height: 11, rx: 3.25 }],
  ['circle', { cx: 12, cy: 12, r: 2.5 }],
]);
// objects.ts receipt; its lines replaced by a return arrow curling back to the left.
export const IconReceiptRefund = createIcon('receipt-refund', [
  ['path', { d: RECEIPT }],
  ['path', { d: 'M15 14.5v-1.75a3 3 0 0 0-3-3H9M11 7.75l-2 2 2 2' }],
]);
export const IconPercentage = createIcon('percentage', [
  ['circle', { cx: 7.5, cy: 7.5, r: 2 }],
  ['circle', { cx: 16.5, cy: 16.5, r: 2 }],
  ['path', { d: 'M17.5 6.5 6.5 17.5' }],
]);
// Handle into a basket whose corners are all arced; two dot wheels.
export const IconShoppingCart = createIcon('shopping-cart', [
  ['path', { d: 'M3.5 4.75h1.3a1.5 1.5 0 0 1 1.47 1.2L7.9 14.3a2 2 0 0 0 1.96 1.6h7.2a2 2 0 0 0 1.95-1.55l1.2-5.1A1.25 1.25 0 0 0 19 7.75H6.6' }],
  dot(9.5, 19, 1.25),
  dot(17, 19, 1.25),
]);
// Bag widening gently toward a rounded base; the handle arc dips into it.
export const IconShoppingBag = createIcon('shopping-bag', [
  ['path', { d: 'M6.5 8h11a1 1 0 0 1 1 .93l.6 8.57a2.5 2.5 0 0 1-2.5 2.75H7.4a2.5 2.5 0 0 1-2.5-2.75l.6-8.57A1 1 0 0 1 6.5 8Z' }],
  ['path', { d: 'M9 10.75V7.5a3 3 0 0 1 6 0v3.25' }],
]);
export const IconTag = createIcon('tag', [['path', { d: TAG }], dot(7.75, 7.75, 1.2)]);
// The tag again, with a % on its long axis in place of the hole.
export const IconDiscount = createIcon('discount', [
  ['path', { d: TAG }],
  ['path', { d: 'M9.5 14.25 14.25 9.5' }],
  dot(9.75, 9.75),
  dot(14, 14),
]);
// Scalloped awning over a rounded front with an arched door.
export const IconBuildingStore = createIcon('building-store', [
  ['path', { d: 'M3.5 8.5 4.6 5.8A2 2 0 0 1 6.45 4.5h11.1a2 2 0 0 1 1.85 1.3l1.1 2.7a2.83 2.83 0 0 1-5.67 0 2.83 2.83 0 0 1-5.66 0 2.83 2.83 0 0 1-5.67 0Z' }],
  ['path', { d: 'M5 11.75v5.5A2.75 2.75 0 0 0 7.75 20h8.5A2.75 2.75 0 0 0 19 17.25v-5.5M10 20v-3a2 2 0 0 1 4 0v3' }],
]);
// Box + cab with a sloped soft windscreen; the body line stops at each wheel.
export const IconTruck = createIcon('truck', [
  ['path', { d: 'M5.5 17h-.25A2.25 2.25 0 0 1 3 14.75v-7A2.25 2.25 0 0 1 5.25 5.5H12a2.25 2.25 0 0 1 2.25 2.25V17M9.5 17h5M14.25 9.25h3.05c.7 0 1.35.37 1.72.98l1.45 2.44c.18.31.28.66.28 1.02V15a2 2 0 0 1-2 2h-.25' }],
  ['circle', { cx: 7.5, cy: 17, r: 2 }],
  ['circle', { cx: 16.5, cy: 17, r: 2 }],
]);
// Box seen corner-on: a hexagon with every corner rounded, and the two top seams meeting in the middle.
export const IconPackage = createIcon('package', [
  ['path', { d: 'M10.6 4.02Q12 3.25 13.4 4.02L18.35 6.73Q19.75 7.5 19.75 9.1L19.75 14.9Q19.75 16.5 18.35 17.27L13.4 19.98Q12 20.75 10.6 19.98L5.65 17.27Q4.25 16.5 4.25 14.9L4.25 9.1Q4.25 7.5 5.65 6.73Z' }],
  ['path', { d: 'M4.6 7.71 12 11.75l7.4-4.04M12 11.75v8.62' }],
]);
// Four arced scan corners around four bars.
export const IconBarcode = createIcon('barcode', [
  ['path', { d: 'M4 8V7a3 3 0 0 1 3-3h1M16 4h1a3 3 0 0 1 3 3v1M20 16v1a3 3 0 0 1-3 3h-1M8 20H7a3 3 0 0 1-3-3v-1' }],
  ['path', { d: 'M8.5 8.5v7M11 8.5v7M13.5 8.5v7M15.75 8.5v7' }],
]);
// Three rounded finder squares, each with a centre dot, and a few data dots in the last quadrant.
export const IconQrcode = createIcon('qrcode', [
  ['path', { d: 'M3.75 5.75a2 2 0 0 1 2-2h2.5a2 2 0 0 1 2 2v2.5a2 2 0 0 1-2 2h-2.5a2 2 0 0 1-2-2ZM13.75 5.75a2 2 0 0 1 2-2h2.5a2 2 0 0 1 2 2v2.5a2 2 0 0 1-2 2h-2.5a2 2 0 0 1-2-2ZM3.75 15.75a2 2 0 0 1 2-2h2.5a2 2 0 0 1 2 2v2.5a2 2 0 0 1-2 2h-2.5a2 2 0 0 1-2-2Z' }],
  dot(7, 7), dot(17, 7), dot(7, 17),
  dot(15, 15), dot(19, 15), dot(17, 17), dot(15, 19), dot(19, 19),
]);
// Lid, box, and one ribbon that rises into two looped bows.
export const IconGift = createIcon('gift', [
  ['rect', { x: 4, y: 8, width: 16, height: 4, rx: 2 }],
  ['path', { d: 'M5.5 12v5a3 3 0 0 0 3 3h7a3 3 0 0 0 3-3v-5' }],
  ['path', { d: 'M12 8v12M12 8c-1-2.5-2.5-4-4-4a2 2 0 0 0 0 4M12 8c1-2.5 2.5-4 4-4a2 2 0 0 1 0 4' }],
]);
// Rounded box on two feet, a round dial off-centre and a door handle (centred, the dial read as a camera).
export const IconSafe = createIcon('safe', [
  ['rect', { x: 3.5, y: 4, width: 17, height: 14.5, rx: 3.25 }],
  ['circle', { cx: 10.25, cy: 11.25, r: 3.25 }],
  ['path', { d: 'M17 10v2.5M7 18.5V20M17 18.5V20' }],
]);
// Balance: mast and base, a gently arched beam, two bowls on V strings.
export const IconScale = createIcon('scale', [
  ['path', { d: 'M12 5v14.5M8.5 19.5h7' }],
  ['path', { d: 'M5.25 7.5C7.6 6.75 9.8 6.25 12 6.25s4.4.5 6.75 1.25' }],
  ['path', { d: 'M5.25 7.5 2.75 13.25a2.5 2.5 0 0 0 5 0ZM18.75 7.5l-2.5 5.75a2.5 2.5 0 0 0 5 0Z' }],
]);
// Portrait body, display line, six key dots.
export const IconCalculator = createIcon('calculator', [
  ['rect', { x: 5, y: 3, width: 14, height: 18, rx: 3.25 }],
  ['path', { d: 'M8.75 7.5h6.5' }],
  dot(9, 12.5), dot(12, 12.5), dot(15, 12.5),
  dot(9, 16.5), dot(12, 16.5), dot(15, 16.5),
]);
// An open hand from the left, palm up, with a coin floating above it.
export const IconHandCoin = createIcon('hand-coin', [
  ['circle', { cx: 15.25, cy: 6.75, r: 3.25 }],
  ['path', { d: 'M3.5 12.75h3c.9 0 1.7.3 2.4.8l1.1.8h2.75a1.6 1.6 0 0 1 0 3.2H9.5' }],
  ['path', { d: 'M3.5 19.5h7.25c1 0 1.95-.35 2.7-.95l5.6-4.55a1.75 1.75 0 0 0-2.2-2.7l-3.1 2.4' }],
]);
// Cup with round-arc handles; stem and a flat base.
export const IconTrophy = createIcon('trophy', [
  ['path', { d: 'M7.25 4.25h9.5v5.25a4.75 4.75 0 0 1-9.5 0Z' }],
  ['path', { d: 'M7.25 6.25h-1a2.25 2.25 0 0 0 0 4.5h1.25M16.75 6.25h1a2.25 2.25 0 0 1 0 4.5H16.5' }],
  ['path', { d: 'M12 14.25v5.5M8.5 19.75h7' }],
]);

/** Domain: dev, data & system. Spec: ../create-icon.tsx; reference drawings: ./core.ts (Anuj-approved). */
import { createIcon } from '../create-icon';

// Shared parts, same values as status.ts / objects.ts so the families line up.
const dot = (cx: number, cy: number, r = 0.95) => ['circle', { cx, cy, r, fill: 'currentColor', stroke: 'none' }] as const;
const node = (cx: number, cy: number) => ['circle', { cx, cy, r: 2.25 }] as const; // objects.ts git-branch node
const SHIELD = 'M12 3.75C10 5.05 8 5.75 6.1 5.8Q5.1 5.85 5.1 6.85C5.1 13 7.6 17.7 12 20.25C16.4 17.7 18.9 13 18.9 6.85Q18.9 5.85 17.9 5.8C16 5.75 14 5.05 12 3.75Z';
// navigation.ts rotate: one counter-clockwise arc ending in the shared arrowhead (core chevron at 0.52).
const ROTATE = 'M7.84 17.94A7.25 7.25 0 1 0 7.53 6.29L5.82 8.26M10 8.21C8.39 8.39 7.1 8.45 6.09 8.5A0.52 0.52 0 0 1 5.54 8.02C5.45 7.02 5.33 5.74 5.29 4.12';

// Three stacked soft ellipses: a lid, one seam, one base, sides joined.
export const IconDatabase = createIcon('database', [
  ['ellipse', { cx: 12, cy: 6.5, rx: 7, ry: 2.75 }],
  ['path', { d: 'M5 6.5v11a7 2.75 0 0 0 14 0v-11' }],
  ['path', { d: 'M5 12a7 2.75 0 0 0 14 0' }],
]);
// Two rounded racks, one status dot each.
export const IconServer = createIcon('server', [
  ['rect', { x: 3.75, y: 4, width: 16.5, height: 7, rx: 2.5 }],
  ['rect', { x: 3.75, y: 13, width: 16.5, height: 7, rx: 2.5 }],
  dot(7.5, 7.5),
  dot(7.5, 16.5),
]);
// Cloud = three lobes joined by small concave fillets (one continuous curve), open where the arrow leaves.
export const IconCloudUpload = createIcon('cloud-upload', [
  ['path', { d: 'M9.5 18H7.5A4 4 0 0 1 6.62 10.1A1 1 0 0 0 7.37 9.33A5.5 5.5 0 0 1 18.23 10.02A1 1 0 0 0 18.81 10.84A3.75 3.75 0 0 1 17.25 18H14.5' }],
  ['path', { d: 'M12 20.25V11M8.7 13.85C9.86 12.59 10.85 11.65 11.62 10.91A0.55 0.55 0 0 1 12.39 10.91C13.16 11.65 14.15 12.59 15.3 13.85' }],
]);
// Chip body (medium radius) with two pins per side; no inner die.
export const IconCpu = createIcon('cpu', [
  ['rect', { x: 6, y: 6, width: 12, height: 12, rx: 3.25 }],
  ['path', { d: 'M10 3.5V6M14 3.5V6M10 18v2.5M14 18v2.5M3.5 10H6M3.5 14H6M18 10h2.5M18 14h2.5' }],
]);
// Pill body, domed head, two pairs of legs curving away from the middle.
export const IconBug = createIcon('bug', [
  ['rect', { x: 7.5, y: 8.5, width: 9, height: 11.5, rx: 4.5 }],
  ['path', { d: 'M9.5 8.5a2.5 2.5 0 0 1 5 0' }],
  ['path', { d: 'M7.5 16.25c-1.7.1-2.8.95-3.25 2.5M16.5 16.25c1.7.1 2.8.95 3.25 2.5M7.5 12c-1.7-.1-2.8-.95-3.25-2.5M16.5 12c1.7-.1 2.8-.95 3.25-2.5' }],
]);
// git-branch nodes; the side branch sweeps out of the trunk into the right node.
export const IconGitMerge = createIcon('git-merge', [
  node(7, 5.75),
  node(7, 18.25),
  node(17, 14.5),
  ['path', { d: 'M7 8v8M7 8c.4 3.9 3.4 6.4 7.75 6.5' }],
]);
// Source node on the left; the right node reaches up and bends back into an arrow aimed at the base.
export const IconGitPullRequest = createIcon('git-pull-request', [
  node(7, 5.75),
  node(7, 18.25),
  node(17, 18.25),
  ['path', { d: 'M7 8v8M17 16V9a3.25 3.25 0 0 0-3.25-3.25h-2.1M14.04 8.45C13 7.51 12.24 6.7 11.63 6.07A0.45 0.45 0 0 1 11.63 5.44C12.24 4.81 13 4 14.04 3.05' }],
]);
// Three hooks, each curling round a node dot and running on towards the next one (rotational symmetry).
export const IconWebhook = createIcon('webhook', [
  ['path', { d: 'M9.81 9.95A3 3 0 1 1 14.92 7.21L16.65 14.56M16.51 13.98A3 3 0 1 1 16.33 19.77L9.1 17.59M9.68 17.77A3 3 0 1 1 4.75 14.71L10.25 9.54' }],
  dot(12, 7.9, 1.1),
  dot(17.2, 16.9, 1.1),
  dot(6.8, 16.9, 1.1),
]);
// Three nested arches, legs of different lengths so they read as ridges, not a target.
export const IconFingerprint = createIcon('fingerprint', [
  ['path', { d: 'M4.5 17c-.3-1.6-.5-3.2-.5-5a8 8 0 0 1 16 0v.75' }],
  ['path', { d: 'M7 19.5V12a5 5 0 0 1 10 0v2.5c0 2-.4 3.9-1.25 5.5' }],
  ['path', { d: 'M10 12a2 2 0 0 1 4 0v3.5c0 1.7-.35 3.3-1 4.75' }],
]);
// status.ts lock with the shackle lifted off its right post.
export const IconLockOpen = createIcon('lock-open', [
  ['rect', { x: 5, y: 10.25, width: 14, height: 9.75, rx: 3.25 }],
  ['path', { d: 'M8 10.25V8a4 4 0 0 1 7.8-1.25' }],
  dot(12, 15.1),
]);
// status.ts shield with a small lock (small radius) in its heart.
export const IconShieldLock = createIcon('shield-lock', [
  ['path', { d: SHIELD }],
  ['rect', { x: 9.25, y: 11.25, width: 5.5, height: 4.25, rx: 1.25 }],
  ['path', { d: 'M10.5 11.25v-1a1.5 1.5 0 0 1 3 0v1' }],
]);
// Three concentric arcs over a dot, all on one focus.
export const IconWifi = createIcon('wifi', [
  ['path', { d: 'M9.35 15.85A3.75 3.75 0 0 1 14.65 15.85M6.52 13.02A7.75 7.75 0 0 1 17.48 13.02M3.69 10.19A11.75 11.75 0 0 1 20.31 10.19' }],
  dot(12, 18, 1.1),
]);
export const IconWifiOff = createIcon('wifi-off', [
  ['path', { d: 'M9.35 15.85A3.75 3.75 0 0 1 14.65 15.85M6.52 13.02A7.75 7.75 0 0 1 17.48 13.02M3.69 10.19A11.75 11.75 0 0 1 20.31 10.19' }],
  dot(12, 18, 1.1),
  ['path', { d: 'M5 4.75 19 19.25' }],
]);
// The rune with every corner softened.
export const IconBluetooth = createIcon('bluetooth', [
  ['path', { d: 'M7 7.5L15.71 15.31Q16.75 16.25 15.71 17.18L13.04 19.57Q12 20.5 12 19.1L12 4.9Q12 3.5 13.04 4.43L15.71 6.82Q16.75 7.75 15.71 8.69L7 16.5' }],
]);
// Rounded body, pill terminal, filled level block.
export const IconBattery = createIcon('battery', [
  ['rect', { x: 2.75, y: 7, width: 16, height: 10, rx: 3.25 }],
  ['path', { d: 'M21.25 10.5v3' }],
  ['rect', { x: 5.5, y: 9.75, width: 5.5, height: 4.5, rx: 1.25, fill: 'currentColor', stroke: 'none' }],
]);
export const IconPower = createIcon('power', [
  ['path', { d: 'M16.98 6.81A7.75 7.75 0 1 1 7.02 6.81' }],
  ['path', { d: 'M12 3.5v8' }],
]);
// Two prongs, a U-shaped head, a cord that curls away.
export const IconPlug = createIcon('plug', [
  ['path', { d: 'M7.5 7.5h9a1 1 0 0 1 1 1V10a5.5 5.5 0 0 1-11 0V8.5a1 1 0 0 1 1-1Z' }],
  ['path', { d: 'M9.5 3.75V7.5M14.5 3.75V7.5M12 15.5v1.75c0 1.8 1.2 3 3 3' }],
]);
// Friendly: round-cornered head, antenna dot, two eye dots.
export const IconRobot = createIcon('robot', [
  ['rect', { x: 4.5, y: 8, width: 15, height: 12, rx: 4.5 }],
  ['path', { d: 'M12 8V5.75' }],
  dot(12, 4.5, 1.1),
  dot(9.25, 13.75, 1.15),
  dot(14.75, 13.75, 1.15),
]);
// A plain stick and status.ts's small concave sparkle at its tip.
export const IconWand = createIcon('wand', [
  ['path', { d: 'M4.75 19.25 12.5 11.5' }],
  ['path', { d: 'M16.5 4.25Q17.05 6.95 19.75 7.5Q17.05 8.05 16.5 10.75Q15.95 8.05 13.25 7.5Q15.95 6.95 16.5 4.25Z' }],
  dot(8.5, 7, 0.9),
]);
// ⌘: one continuous outline, four loops round a square.
export const IconCommand = createIcon('command', [
  ['path', { d: 'M9.25 9.25V6.25a3 3 0 1 0-3 3h11.5a3 3 0 1 0-3-3v11.5a3 3 0 1 0 3-3H6.25a3 3 0 1 0 3 3Z' }],
]);
// Landscape body, one row of key dots, a space bar.
export const IconKeyboard = createIcon('keyboard', [
  ['rect', { x: 2.75, y: 6, width: 18.5, height: 12, rx: 3.25 }],
  dot(7, 10.25),
  dot(10.33, 10.25),
  dot(13.67, 10.25),
  dot(17, 10.25),
  ['path', { d: 'M8.5 14.25h7' }],
]);
// Paper in, rounded body, paper out.
export const IconPrinter = createIcon('printer', [
  ['path', { d: 'M7.25 8.5V6a2 2 0 0 1 2-2h5.5a2 2 0 0 1 2 2v2.5' }],
  ['path', { d: 'M7.25 17H6.5a3.25 3.25 0 0 1-3.25-3.25v-2A3.25 3.25 0 0 1 6.5 8.5h11a3.25 3.25 0 0 1 3.25 3.25v2A3.25 3.25 0 0 1 17.5 17h-.75' }],
  ['path', { d: 'M7.25 13.5h9.5v4.5a2 2 0 0 1-2 2h-5.5a2 2 0 0 1-2-2Z' }],
]);
// navigation.ts rotate with core clock hands inside.
export const IconHistory = createIcon('history', [
  ['path', { d: ROTATE }],
  ['path', { d: 'M12 8.5V12l2.25 1.5' }],
]);
// Two soft bulbs that cross at the waist, capped top and bottom.
export const IconHourglass = createIcon('hourglass', [
  ['path', { d: 'M6.5 3.75h11M6.5 20.25h11' }],
  ['path', { d: 'M8 3.75V6.5c0 2.1 1.9 3.6 4 5.5s4 3.4 4 5.5v2.75M16 3.75V6.5c0 2.1-1.9 3.6-4 5.5s-4 3.4-4 5.5v2.75' }],
]);
// Clock face with two bell arcs.
export const IconAlarm = createIcon('alarm', [
  ['circle', { cx: 12, cy: 13, r: 7.25 }],
  ['path', { d: 'M12 9.5V13l2.25 1.5' }],
  ['path', { d: 'M3.5 7.5a4 4 0 0 1 4-4M16.5 3.5a4 4 0 0 1 4 4' }],
]);
// Face, crown with its stem, one side button, one hand.
export const IconStopwatch = createIcon('stopwatch', [
  ['circle', { cx: 12, cy: 13.25, r: 7.25 }],
  ['path', { d: 'M10 3.5h4M12 3.5V6M17.5 7.25 18.75 6M12 13.25V10' }],
]);
// objects.ts json braces, smaller, with a dot between them.
export const IconApi = createIcon('api', [
  ['path', { d: 'M9 6c-1.35 0-2.1.7-2.1 2.1v1.6c0 1.25-.6 2-1.65 2.3 1.05.3 1.65 1.05 1.65 2.3v1.6c0 1.4.75 2.1 2.1 2.1' }],
  ['path', { d: 'M15 6c1.35 0 2.1.7 2.1 2.1v1.6c0 1.25.6 2 1.65 2.3-1.05.3-1.65 1.05-1.65 2.3v1.6c0 1.4-.75 2.1-2.1 2.1' }],
  dot(12, 12, 1.1),
]);
// Isometric cube: soft hexagon, three edges meeting in the middle.
export const IconCube = createIcon('cube', [
  ['path', { d: 'M10.48 4.12Q12 3.25 13.52 4.12L17.98 6.71Q19.5 7.58 19.5 9.33L19.5 14.67Q19.5 16.42 17.98 17.29L13.52 19.88Q12 20.75 10.48 19.88L6.02 17.29Q4.5 16.42 4.5 14.67L4.5 9.33Q4.5 7.58 6.02 6.71Z' }],
  ['path', { d: 'M4.88 7.8 12 12l7.12-4.2M12 12v8.31' }],
]);

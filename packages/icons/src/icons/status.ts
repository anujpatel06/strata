/** Batch: status. Spec: ../create-icon.tsx; reference drawings: ./core.ts. */
import { createIcon } from '../create-icon';

// Shared parts. The circle family uses core info-circle's ring; filled dots are r≈1.
const ring = ['circle', { cx: 12, cy: 12, r: 8.75 }] as const;
const dot = (cx: number, cy: number, r = 0.95) => ['circle', { cx, cy, r, fill: 'currentColor', stroke: 'none' }] as const;
// One eye outline (soft lens with rounded ends) shared by eye and eye-off.
const eyeLens = 'M3.25 12.75a1.5 1.5 0 0 1 0-1.5C5.4 7.9 8.4 6 12 6s6.6 1.9 8.75 5.25a1.5 1.5 0 0 1 0 1.5C18.6 16.1 15.6 18 12 18s-6.6-1.9-8.75-5.25Z';

// Tick: core check's curve scaled 0.62 into the ring.
export const IconCircleCheck = createIcon('circle-check', [ring, ['path', { d: 'M8 12.85 10.3 15.15C11.75 12.75 13.55 10.9 16 9.45' }]]);
export const IconCircleX = createIcon('circle-x', [ring, ['path', { d: 'M9.5 9.5l5 5M14.5 9.5l-5 5' }]]);
// Rounded triangle: every corner a soft quadratic, no points.
export const IconAlertTriangle = createIcon('alert-triangle', [
  ['path', { d: 'M10.72 6.01Q12 3.75 13.28 6.01L19.47 16.99Q20.75 19.25 18.15 19.25H5.85Q3.25 19.25 4.53 16.99Z' }],
  ['path', { d: 'M12 9.5v3.75' }],
  dot(12, 16.1),
]);
// info-circle flipped: stroke on top, dot below.
export const IconAlertCircle = createIcon('alert-circle', [ring, ['path', { d: 'M12 7.75v4.75' }], dot(12, 15.9)]);
// Glyph-only (sits in alert/toast chips, drawn with a heavier stroke there): tall bar + a dot sized to that stroke.
export const IconExclamationMark = createIcon('exclamation-mark', [['path', { d: 'M12 5v9.25' }], dot(12, 18.75, 1.2)]);
// Glyph-only, drawn small in its box (alert.tsx scales it 1.5×), like Tabler's info-small.
export const IconInfoSmall = createIcon('info-small', [['path', { d: 'M12 11.25v4.75' }], dot(12, 8.35)]);
export const IconHelpCircle = createIcon('help-circle', [ring, ['path', { d: 'M9.6 9.75a2.4 2.4 0 1 1 3.3 2.2c-.55.25-.9.7-.9 1.35v.2' }], dot(12, 16.35)]);
export const IconShieldCheck = createIcon('shield-check', [
  ['path', { d: 'M12 3.75C10 5.05 8 5.75 6.1 5.8Q5.1 5.85 5.1 6.85C5.1 13 7.6 17.7 12 20.25C16.4 17.7 18.9 13 18.9 6.85Q18.9 5.85 17.9 5.8C16 5.75 14 5.05 12 3.75Z' }],
  ['path', { d: 'M8.9 12.5 10.7 14.3C11.75 12.5 13.05 11.1 15.1 9.9' }],
]);
export const IconLock = createIcon('lock', [
  ['rect', { x: 5, y: 10.25, width: 14, height: 9.75, rx: 3.25 }],
  ['path', { d: 'M8 10.25V8a4 4 0 0 1 8 0v2.25' }],
  dot(12, 15.1),
]);
// Round bow, one shaft, one tooth.
export const IconKey = createIcon('key', [
  ['circle', { cx: 8, cy: 16, r: 3.75 }],
  ['path', { d: 'M10.65 13.35 19.25 4.75M16.5 7.5 18.75 9.75' }],
]);
export const IconEye = createIcon('eye', [['path', { d: eyeLens }], ['circle', { cx: 12, cy: 12, r: 2.75 }]]);
// Eye-off drops the pupil so the slash reads cleanly at 16px.
export const IconEyeOff = createIcon('eye-off', [['path', { d: eyeLens }], ['path', { d: 'M5 4.75 19 19.25' }]]);
// Soft star: outer points rounded wide, inner joins rounded tight.
export const IconStar = createIcon('star', [
  ['path', { d: 'M11.15 5.32Q12 3.4 12.85 5.32L14.12 8.21Q14.53 9.12 15.52 9.22L18.66 9.54Q20.75 9.76 19.19 11.16L16.83 13.26Q16.09 13.93 16.3 14.91L16.97 17.99Q17.41 20.04 15.59 18.99L12.86 17.4Q12 16.9 11.14 17.4L8.41 18.99Q6.59 20.04 7.03 17.99L7.7 14.91Q7.91 13.93 7.17 13.26L4.81 11.16Q3.25 9.76 5.34 9.54L8.48 9.22Q9.47 9.12 9.88 8.21Z' }],
]);
// One large + one small four-point star with concave curved sides.
export const IconSparkles = createIcon('sparkles', [
  ['path', { d: 'M10 6.5Q11.1 12.15 16.75 13.25Q11.1 14.35 10 20Q8.9 14.35 3.25 13.25Q8.9 12.15 10 6.5Z' }],
  ['path', { d: 'M17.5 2.75Q18 5.25 20.5 5.75Q18 6.25 17.5 8.75Q17 6.25 14.5 5.75Q17 5.25 17.5 2.75Z' }],
]);
// Upright push-pin: cap bar, flared body, needle.
export const IconPin = createIcon('pin', [
  ['path', { d: 'M8.5 4.5h7M9.75 4.5v4c0 1.9-2.25 2.9-3.25 5.25h11c-1-2.35-3.25-3.35-3.25-5.25v-4' }],
  ['path', { d: 'M12 13.75v6.25' }],
]);
export const IconClock = createIcon('clock', [ring, ['path', { d: 'M12 7.75V12l2.75 1.75' }]]);
// Core user shifted left, second person as a half-head and one shoulder arc behind.
export const IconUsers = createIcon('users', [
  ['circle', { cx: 9.5, cy: 8.5, r: 3.25 }],
  ['path', { d: 'M3.5 19.5a6 6 0 0 1 12 0' }],
  ['path', { d: 'M15.5 5.25a3.25 3.25 0 0 1 0 6.5M17.5 13.9c1.85.95 3 2.95 3 5.6' }],
]);
export const IconUserPlus = createIcon('user-plus', [
  ['circle', { cx: 10, cy: 8.25, r: 3.5 }],
  ['path', { d: 'M3.5 19.75a6.5 6.5 0 0 1 13 0' }],
  ['path', { d: 'M18.75 8.25v4.5M16.5 10.5h4.5' }],
]);
// Envelope flap is one soft curve, not a V.
export const IconMail = createIcon('mail', [
  ['rect', { x: 3.5, y: 5.5, width: 17, height: 13, rx: 4.5 }],
  ['path', { d: 'M7.25 9.5c1.7 1.3 3.1 2.4 4.75 2.4s3.05-1.1 4.75-2.4' }],
]);
export const IconAt = createIcon('at', [
  ['circle', { cx: 12, cy: 12, r: 3.5 }],
  ['path', { d: 'M15.5 12v1.25a2.5 2.5 0 0 0 5 0V12a8.5 8.5 0 1 0-3.9 7.15' }],
]);
// Rounded box with a smooth tray notch.
export const IconInbox = createIcon('inbox', [
  ['rect', { x: 3.75, y: 4.5, width: 16.5, height: 15, rx: 4.5 }],
  ['path', { d: 'M3.75 13h4c.9 0 1.3.9 1.6 1.5.45.9 1.4 1.5 2.65 1.5s2.2-.6 2.65-1.5c.3-.6.7-1.5 1.6-1.5h4' }],
]);
export const IconArchive = createIcon('archive', [
  ['rect', { x: 3.5, y: 4, width: 17, height: 4.5, rx: 2.25 }],
  ['path', { d: 'M5 8.5v8a3.5 3.5 0 0 0 3.5 3.5h7a3.5 3.5 0 0 0 3.5-3.5v-8' }],
  ['path', { d: 'M10 12h4' }],
]);
// Every corner of the house arced, including the roof peak; arched door.
export const IconHome = createIcon('home', [
  ['path', { d: 'M4.75 10.4v6.35A3.25 3.25 0 0 0 8 20h8a3.25 3.25 0 0 0 3.25-3.25V10.4a2.5 2.5 0 0 0-.92-1.94l-4.75-3.9a2.5 2.5 0 0 0-3.16 0l-4.75 3.9A2.5 2.5 0 0 0 4.75 10.4Z' }],
  ['path', { d: 'M10 20v-3.5a2 2 0 0 1 4 0V20' }],
]);
export const IconWorld = createIcon('world', [ring, ['ellipse', { cx: 12, cy: 12, rx: 3.75, ry: 8.75 }], ['path', { d: 'M3.25 12h17.5' }]]);
export const IconSun = createIcon('sun', [
  ['circle', { cx: 12, cy: 12, r: 3.75 }],
  ['path', { d: 'M18.4 12h2M16.53 16.53l1.41 1.41M12 18.4v2M7.47 16.53l-1.41 1.41M5.6 12h-2M7.47 7.47 6.06 6.06M12 5.6v-2M16.53 7.47l1.41-1.41' }],
]);
// Crescent: outer arc is the r=8.75 keyline circle.
export const IconMoon = createIcon('moon', [['path', { d: 'M12 3.25a6.75 6.75 0 0 0 8.75 8.75A8.75 8.75 0 1 1 12 3.25Z' }]]);
// A smooth line with one dip, ending in core upload's right-angle arrowhead.
export const IconTrendingUp = createIcon('trending-up', [
  ['path', { d: 'M4 17C6.6 16.8 7.9 12.75 10.1 12.75c1.9 0 2.6 1.75 4.5 1.75C16.4 14.5 18.25 9.25 20 7.5' }],
  ['path', { d: 'M16.25 7.5H20v3.75' }],
]);
export const IconTrendingDown = createIcon('trending-down', [
  ['path', { d: 'M4 7C6.6 7.2 7.9 11.25 10.1 11.25c1.9 0 2.6-1.75 4.5-1.75C16.4 9.5 18.25 14.75 20 16.5' }],
  ['path', { d: 'M16.25 16.5H20v-3.75' }],
]);

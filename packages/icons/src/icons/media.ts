/** Domain: communication & media. Spec: ../create-icon.tsx; reference drawings: ./core.ts (Anuj-approved). */
import { createIcon } from '../create-icon';

// Shared parts.
// Filled dots as ONE path (a row of r≈1 discs), so a glyph with dots still stays ≤ 3 subpaths.
const dots = (r: number, ...at: [number, number][]) =>
  ['path', { d: at.map(([x, y]) => `M${x + r} ${y}a${r} ${r} 0 1 1-${2 * r} 0 ${r} ${r} 0 1 1 ${2 * r} 0`).join(''), fill: 'currentColor', stroke: 'none' }] as const;
// status.ts ring and eye-off slash: every "-off" icon here uses this exact slash.
const ring = ['circle', { cx: 12, cy: 12, r: 8.75 }] as const;
const SLASH = 'M5 4.75 19 19.25';
// Soft bubble: 4.5-corner box whose bottom edge sweeps down into a curved, round-tipped tail at the lower left.
const BUBBLE =
  'M8.25 4.5h7.5a4.5 4.5 0 0 1 4.5 4.5v3a4.5 4.5 0 0 1-4.5 4.5H12.5C11.1 17.85 9.55 18.95 7.9 19.6Q6.9 20 7.3 19C7.8 17.9 8.25 17.2 8.25 16.5A4.5 4.5 0 0 1 3.75 12V9a4.5 4.5 0 0 1 4.5-4.5Z';
// Handset: two rounded pads joined by an outer arc and a softer inner arc; symmetric about the anti-diagonal.
const HANDSET =
  'M4.25 6.75C4.25 5.1 5.4 4 7 4h1.3c.6 0 1.1.35 1.3.9l1.1 2.9c.2.55 0 1.15-.45 1.5L9.1 10.1c1.15 2.2 2.6 3.65 4.8 4.8l.8-1.15c.35-.45.95-.65 1.5-.45l2.9 1.1c.55.2.9.7.9 1.3V17c0 1.6-1.1 2.75-2.75 2.75C10.2 19.75 4.25 13.8 4.25 6.75Z';
// Microphone capsule + holder arc + stem.
const MIC_CAPSULE = ['rect', { x: 9, y: 3.5, width: 6, height: 10.5, rx: 3 }] as const;
const MIC_HOLDER = 'M5.75 11a6.25 6.25 0 0 0 12.5 0M12 17.25v3';
// Speaker: small box + flared cone, all joins rounded; symmetric about y=12.
const SPEAKER =
  'M3.5 10.25A1.75 1.75 0 0 1 5.25 8.5h1.6c.4 0 .8-.15 1.1-.4l3.1-2.7c.65-.55 1.65-.1 1.65.75v11.7c0 .85-1 1.3-1.65.75l-3.1-2.7c-.3-.25-.7-.4-1.1-.4h-1.6a1.75 1.75 0 0 1-1.75-1.75Z';
// core bell, unchanged.
const BELL = 'M5.75 17c1.1-1.05 1.5-2.7 1.5-5v-1.25a4.75 4.75 0 0 1 9.5 0V12c0 2.3.4 3.95 1.5 5z';

export const IconMessage = createIcon('message', [['path', { d: BUBBLE }]]);
export const IconMessageDots = createIcon('message-dots', [['path', { d: BUBBLE }], dots(0.95, [8.5, 10.5], [12, 10.5], [15.5, 10.5])]);
export const IconPhone = createIcon('phone', [['path', { d: HANDSET }]]);
// Handset + two waves radiating from the top-right, centred on the pad's inner corner.
export const IconPhoneCall = createIcon('phone-call', [['path', { d: HANDSET }], ['path', { d: 'M13.75 7.25a3 3 0 0 1 3 3M13.75 3.75a6.5 6.5 0 0 1 6.5 6.5' }]]);
// Camera body (medium radius) + a soft trapezoid lens on the right.
export const IconVideo = createIcon('video', [
  ['rect', { x: 3.25, y: 6, width: 12.25, height: 12, rx: 3.25 }],
  ['path', { d: 'M15.5 10.5 18.9 8.4c.7-.4 1.35 0 1.35.8v5.6c0 .8-.65 1.2-1.35.8L15.5 13.5' }],
]);
export const IconMicrophone = createIcon('microphone', [MIC_CAPSULE, ['path', { d: MIC_HOLDER }]]);
export const IconMicrophoneOff = createIcon('microphone-off', [MIC_CAPSULE, ['path', { d: `${MIC_HOLDER}${SLASH}` }]]);
// A vertical clip of three true semicircles (r 1.9 / 3.8 / 5.4), turned 45°.
export const IconPaperclip = createIcon('paperclip', [
  ['path', { d: 'M14 8.87 9.41 13.46A1.9 1.9 0 0 0 12.09 16.15L17.75 10.49A3.8 3.8 0 0 0 12.38 5.12L6.72 10.78A5.4 5.4 0 0 0 14.36 18.41L18.6 14.17' }],
]);
// Frame + one rolling hill + a sun dot.
export const IconPhoto = createIcon('photo', [
  ['rect', { x: 3.5, y: 4.5, width: 17, height: 15, rx: 4.5 }],
  ['path', { d: 'M3.75 16.5C5.9 13.8 7.7 12.25 9.6 12.25c2.4 0 4.1 3 6.9 7' }],
  dots(1.25, [15.25, 9.25]),
]);
// Body with a soft viewfinder hump (every step curved) + lens.
export const IconCamera = createIcon('camera', [
  ['path', { d: 'M3.25 10.25A3.25 3.25 0 0 1 6.5 7h1.4c.55 0 1.05-.3 1.3-.8l.45-.9c.3-.6.9-.95 1.55-.95h1.6c.65 0 1.25.35 1.55.95l.45.9c.25.5.75.8 1.3.8h1.4a3.25 3.25 0 0 1 3.25 3.25v6.5A3.25 3.25 0 0 1 17.5 20h-11a3.25 3.25 0 0 1-3.25-3.25Z' }],
  ['circle', { cx: 12, cy: 13.25, r: 3.25 }],
]);
// Two heads, two stems, one beam with rounded shoulders.
export const IconMusic = createIcon('music', [
  ['circle', { cx: 7, cy: 17.25, r: 2.5 }],
  ['circle', { cx: 17, cy: 15.25, r: 2.5 }],
  ['path', { d: 'M9.5 17.25V7.4a1.5 1.5 0 0 1 1.2-1.47l7.5-1.5a1.5 1.5 0 0 1 1.8 1.47v9.35' }],
]);
// Player family: triangles with soft quadratic corners (as status alert-triangle), full pills, a medium-radius square.
export const IconPlayerPlay = createIcon('player-play', [
  ['path', { d: 'M7.5 6.35V17.65Q7.5 19.25 8.87 18.42L18.13 12.83Q19.5 12 18.13 11.17L8.87 5.58Q7.5 4.75 7.5 6.35Z' }],
]);
export const IconPlayerPause = createIcon('player-pause', [
  ['rect', { x: 6.5, y: 5, width: 4, height: 14, rx: 2 }],
  ['rect', { x: 13.5, y: 5, width: 4, height: 14, rx: 2 }],
]);
export const IconPlayerStop = createIcon('player-stop', [['rect', { x: 5.25, y: 5.25, width: 13.5, height: 13.5, rx: 3.25 }]]);
export const IconPlayerSkipForward = createIcon('player-skip-forward', [
  ['path', { d: 'M5.25 6.75V17.25Q5.25 18.75 6.52 17.95L14.73 12.8Q16 12 14.73 11.2L6.52 6.05Q5.25 5.25 5.25 6.75Z' }],
  ['path', { d: 'M19 5.25v13.5' }],
]);
export const IconVolume = createIcon('volume', [['path', { d: SPEAKER }], ['path', { d: 'M15.5 9.25a3.9 3.9 0 0 1 0 5.5M18 6.5a7.6 7.6 0 0 1 0 11' }]]);
// Speaker, no waves, eye-off's slash.
export const IconVolumeOff = createIcon('volume-off', [['path', { d: SPEAKER }], ['path', { d: SLASH }]]);
// Clapperboard: body box + the open clapper band hinged at its top-left corner, two stripes in the band.
export const IconMovie = createIcon('movie', [
  ['rect', { x: 3.75, y: 10.5, width: 16.5, height: 9.5, rx: 3.25 }],
  ['path', { d: 'M4.1 9.6 19.6 6.3 19 3.4 3.5 6.7Z' }],
  ['path', { d: 'M9.48 8.46 10.35 5.24M14.37 7.42 15.24 4.2' }],
]);
// One band arc, two pill cups.
export const IconHeadphones = createIcon('headphones', [
  ['path', { d: 'M4.25 16v-3.75a7.75 7.75 0 0 1 15.5 0V16' }],
  ['rect', { x: 4.25, y: 13, width: 4.25, height: 7, rx: 2.125 }],
  ['rect', { x: 15.5, y: 13, width: 4.25, height: 7, rx: 2.125 }],
]);
// ((•)): two arc pairs on circles around the centre dot.
export const IconBroadcast = createIcon('broadcast', [
  ['path', { d: 'M8.5 8.5a4.95 4.95 0 0 0 0 7M15.5 8.5a4.95 4.95 0 0 1 0 7M5.75 5.75a8.84 8.84 0 0 0 0 12.5M18.25 5.75a8.84 8.84 0 0 1 0 12.5' }],
  dots(1.25, [12, 12]),
]);
// Dot + two quarter arcs sharing one centre.
export const IconRss = createIcon('rss', [['path', { d: 'M5 12a7 7 0 0 1 7 7M5 5a14 14 0 0 1 14 14' }], dots(1.25, [6.25, 17.75])]);
// Front sheet that rolls into a back column on the right; two text lines.
export const IconNews = createIcon('news', [
  ['path', { d: 'M18.5 20H7a3.25 3.25 0 0 1-3.25-3.25V6.5A2.5 2.5 0 0 1 6.25 4h8a2.5 2.5 0 0 1 2.5 2.5v11.75a1.75 1.75 0 0 0 1.75 1.75M16.75 8.5h1.75a1.75 1.75 0 0 1 1.75 1.75v8a1.75 1.75 0 0 1-1.75 1.75' }],
  ['path', { d: 'M7.25 8.5h6M7.25 12h6M7.25 15.5h3.5' }],
]);
// Open book: two pages that dip into the spine, small-radius outer corners.
export const IconBook = createIcon('book', [
  ['path', { d: 'M12 6.5C10.4 5.3 8.4 4.75 6.25 4.75a2.5 2.5 0 0 0-2.5 2.5v8a2.5 2.5 0 0 0 2.5 2.5c2.35 0 4.4.5 5.75 1.75 1.35-1.25 3.4-1.75 5.75-1.75a2.5 2.5 0 0 0 2.5-2.5v-8a2.5 2.5 0 0 0-2.5-2.5C15.6 4.75 13.6 5.3 12 6.5Z' }],
  ['path', { d: 'M12 6.5v13' }],
]);
export const IconBookmark = createIcon('bookmark', [
  ['path', { d: 'M6.25 7.5A3.25 3.25 0 0 1 9.5 4.25h5a3.25 3.25 0 0 1 3.25 3.25v11.2c0 .85-.95 1.3-1.6.8l-3.55-2.75c-.5-.4-1.2-.4-1.7 0l-3.55 2.75c-.65.5-1.6.05-1.6-.8Z' }],
]);
// Pole + a pennant with gently bowed edges and a rounded tip, one stroke.
export const IconFlag = createIcon('flag', [['path', { d: 'M5.5 20.25V4.75C9.6 5.4 13.7 6.7 17.6 8.4Q19.1 9.1 17.6 9.8C13.7 11.5 9.6 12.8 5.5 13.45' }]]);
export const IconBellOff = createIcon('bell-off', [['path', { d: BELL }], ['path', { d: `M10.5 20a1.75 1.75 0 0 0 3 0${SLASH}` }]]);
// Pill cuff + a hand whose thumb is one rounded lobe.
export const IconThumbUp = createIcon('thumb-up', [
  ['rect', { x: 4.25, y: 10.5, width: 3.25, height: 9.5, rx: 1.625 }],
  ['path', { d: 'M7.5 10.75c1.9-.4 3.1-2.2 3.6-4.2l.3-1.3c.25-.95 1.55-1.35 2.3-.55.85.9 1.1 2.7.55 4.55l-.35 1.25h3.6a2.25 2.25 0 0 1 2.2 2.7l-1.1 5.3A2.5 2.5 0 0 1 16.15 20H7.5' }],
]);
export const IconMoodSmile = createIcon('mood-smile', [ring, dots(0.95, [9, 10], [15, 10]), ['path', { d: 'M8.75 14.25c1.8 2 4.7 2 6.5 0' }]]);

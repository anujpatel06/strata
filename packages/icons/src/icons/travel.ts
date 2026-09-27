/** Domain: travel, places & nature. Spec: ../create-icon.tsx; reference drawings: ./core.ts (Anuj-approved).
 * Shared parts: status.ts ring (r=8.75) and r≈1 filled dot; core calendar; navigation's arrowhead (core chevron scaled). */
import { createIcon } from '../create-icon';

const ring = ['circle', { cx: 12, cy: 12, r: 8.75 }] as const;
const dot = (cx: number, cy: number, r = 0.95) => ['circle', { cx, cy, r, fill: 'currentColor', stroke: 'none' }] as const;

// Three-panel folded map; every fold a soft vertex, fold lines meet the outline at its apex.
export const IconMap = createIcon('map', [['path', { d: 'M3.75 8.5Q3.75 6.75 5.36 6.06L7.85 4.99Q9 4.5 10.19 4.9L13.81 6.1Q15 6.5 16.17 6.06L18.61 5.12Q20.25 4.5 20.25 6.25L20.25 15.5Q20.25 17.25 18.64 17.94L16.15 19.01Q15 19.5 13.81 19.1L10.19 17.9Q9 17.5 7.83 17.94L5.39 18.88Q3.75 19.5 3.75 17.75Z' }], ['path', { d: 'M9.01 4.72V17.71M15 6.29V19.28' }]]);
// Soft teardrop (round head, rounded tip) with a centre dot; status pin is the push-pin.
export const IconMapPin = createIcon('map-pin', [['path', { d: 'M12.8 20.1Q12 20.85 11.2 20.1C8.1 17.2 5 13.9 5 10a7 7 0 0 1 14 0c0 3.9-3.1 7.2-6.2 10.1Z' }], dot(12, 10, 1.6)]);
// Ring plus one soft diamond needle.
export const IconCompass = createIcon('compass', [ring, ['path', { d: 'M15.17 8.35Q16 8 15.65 8.83L13.84 13.05Q13.6 13.6 13.05 13.84L8.83 15.65Q8 16 8.35 15.17L10.16 10.95Q10.4 10.4 10.95 10.16Z' }]]);
// Top-down airliner turned 45° (heading up-right); every corner softened, rounded nose.
export const IconPlane = createIcon('plane', [['path', { d: 'M17.54 6.46Q18.38 7.3 17.54 8.14L15.36 10.32Q14.85 10.82 15.03 11.51L16.47 17.13Q16.7 18.05 16.03 18.72L16.37 18.38Q15.69 19.05 15.18 18.25L12.55 14.11Q12.17 13.51 11.66 14.02L9.72 15.96Q9.31 16.37 9.41 16.93L9.69 18.52Q9.82 19.22 9.31 19.73L9.48 19.56Q8.98 20.06 8.54 19.5L7.37 17.96Q6.79 17.21 6.04 16.63L4.5 15.46Q3.94 15.02 4.44 14.52L4.27 14.69Q4.78 14.18 5.48 14.31L7.07 14.59Q7.63 14.69 8.04 14.28L9.98 12.34Q10.49 11.83 9.89 11.45L5.75 8.82Q4.95 8.31 5.62 7.63L5.28 7.97Q5.95 7.3 6.87 7.53L12.49 8.97Q13.18 9.15 13.68 8.64L15.86 6.46Q16.7 5.62 17.54 6.46Z' }]]);
// Side silhouette: soft cabin, wheel arches that clear the wheels, no windows.
export const IconCar = createIcon('car', [['path', { d: 'M4.75 16.5H4.5a1.25 1.25 0 0 1-1.25-1.25v-2a2.5 2.5 0 0 1 2.5-2.5h.75Q7.25 10.75 7.6 10.05L8.4 8.5C9.1 7.2 10.2 6.5 11.75 6.5h1C14.3 6.5 15.4 7.2 16.1 8.5l.8 1.55Q17.25 10.75 18 10.75h.25a2.5 2.5 0 0 1 2.5 2.5v2a1.25 1.25 0 0 1-1.25 1.25h-.25a2.75 2.75 0 0 0-5.5 0h-3.5a2.75 2.75 0 0 0-5.5 0Z' }], ['circle', { cx: 7.5, cy: 16.5, r: 1.75 }], ['circle', { cx: 16.5, cy: 16.5, r: 1.75 }]]);
// Front view: boxy body, one windscreen line, two lamps, straight wheels.
export const IconBus = createIcon('bus', [['rect', { x: 5, y: 3.5, width: 14, height: 15, rx: 3.25 }], ['path', { d: 'M5 11.25h14M8 18.5v2M16 18.5v2' }], dot(8.75, 14.9), dot(15.25, 14.9)]);
// Front view: arched cab (unlike the boxy bus), lamps, legs splayed onto the rails.
export const IconTrain = createIcon('train', [['path', { d: 'M6 14.5V9a5.5 5.5 0 0 1 5.5-5.5h1A5.5 5.5 0 0 1 18 9v5.5a2.75 2.75 0 0 1-2.75 2.75h-6.5A2.75 2.75 0 0 1 6 14.5Z' }], ['path', { d: 'M6 10.5h12M9 17.25 7.25 20.5M15 17.25l1.75 3.25' }], dot(9.25, 14), dot(14.75, 14)]);
// Two wheels; one frame stroke (chainstay, down tube, fork), seat tube with saddle, stem with bar.
export const IconBike = createIcon('bike', [['circle', { cx: 6, cy: 15, r: 3.25 }], ['circle', { cx: 18, cy: 15, r: 3.25 }], ['path', { d: 'M6 15h5.5l3.75-6.25L18 15' }], ['path', { d: 'M8.9 7.75l2.6 7.25M7.75 7.75h2.5M15.25 8.75l-.75-2.25h1.75' }]]);
// Tall tower: window pills, arched door.
export const IconBuilding = createIcon('building', [['rect', { x: 5.5, y: 3.5, width: 13, height: 16.75, rx: 3.25 }], ['path', { d: 'M9.5 8h.5M14 8h.5M9.5 12h.5M14 12h.5' }], ['path', { d: 'M10.5 20.25V18a1.5 1.5 0 0 1 3 0v2.25' }]]);
// Tall tower with a low block beside it; window pills on the tower only.
export const IconBuildings = createIcon('buildings', [['rect', { x: 3.75, y: 3.5, width: 10, height: 16.75, rx: 3.25 }], ['path', { d: 'M13.75 9.5h3.25A3.25 3.25 0 0 1 20.25 12.75v4.25A3.25 3.25 0 0 1 17 20.25h-3.25' }], ['path', { d: 'M7.5 8h2.5M7.5 12h2.5M7.5 16h2.5' }]]);
// Handle arch and a curved seam (a smile, not a rule).
export const IconBriefcase = createIcon('briefcase', [['rect', { x: 3.5, y: 7, width: 17, height: 12.75, rx: 3.25 }], ['path', { d: 'M8.75 7V6a2 2 0 0 1 2-2h2.5a2 2 0 0 1 2 2v1' }], ['path', { d: 'M3.75 12.25c5.3 2.3 11.2 2.3 16.5 0' }]]);
// Upright roller case: grab handle, two straps, two wheel dots.
export const IconLuggage = createIcon('luggage', [['rect', { x: 6, y: 6.5, width: 12, height: 12.75, rx: 3.25 }], ['path', { d: 'M9.75 6.5V5a1.5 1.5 0 0 1 1.5-1.5h1.5a1.5 1.5 0 0 1 1.5 1.5v1.5M10 10.25v5.25M14 10.25v5.25' }], dot(9, 20.85, 0.9), dot(15, 20.85, 0.9)]);
export const IconCloud = createIcon('cloud', [['path', { d: 'M7.25 18.75A4 4 0 0 1 6.5 10.82A5.5 5.5 0 0 1 17.37 9.79A4.5 4.5 0 0 1 16.75 18.75Z' }]]);
// Smaller cloud raised; three short rounded drops, slanted.
export const IconCloudRain = createIcon('cloud-rain', [['path', { d: 'M7.5 15.75A3.5 3.5 0 0 1 7.28 8.76A4.75 4.75 0 0 1 16.51 7.76A4 4 0 0 1 16.25 15.75Z' }], ['path', { d: 'M8.5 18.5l-.75 2M12.25 18.5l-.75 2M16 18.5l-.75 2' }]]);
// Three strokes through the centre; each arm ends in a small round-jointed chevron.
export const IconSnowflake = createIcon('snowflake', [['path', { d: 'M12 3.25L12 20.75M19.58 7.62L4.42 16.38M19.58 16.38L4.42 7.63' }], ['path', { d: 'M10.4 4.6L12 6.2L13.6 4.6M17.61 6.91L17.02 9.1L19.21 9.69M19.21 14.31L17.02 14.9L17.61 17.09M13.6 19.4L12 17.8L10.4 19.4M6.39 17.09L6.98 14.9L4.79 14.31M4.79 9.69L6.98 9.1L6.39 6.91' }]]);
// Lightning as one soft polygon, all six corners rounded.
export const IconBolt = createIcon('bolt', [['path', { d: 'M13.57 4.09Q13.75 3 13.06 3.86L6.19 12.39Q5.5 13.25 6.6 13.25L10.8 13.25Q11.5 13.25 11.39 13.94L10.43 19.91Q10.25 21 10.94 20.14L17.81 11.61Q18.5 10.75 17.4 10.75L13.2 10.75Q12.5 10.75 12.61 10.06Z' }]]);
// One curved lens with a stem that runs on as the midrib.
export const IconLeaf = createIcon('leaf', [['path', { d: 'M7.25 16.75C4.75 10.75 9 5 18.5 4.75Q19.25 4.75 19.25 5.5C19.25 14.75 13.25 19.35 7.25 16.75Z' }], ['path', { d: 'M4.5 19.5C8.4 15.4 11.6 12.4 15.25 9.25' }]]);
// Round canopy, trunk with one branch.
export const IconTree = createIcon('tree', [['circle', { cx: 12, cy: 9.25, r: 6 }], ['path', { d: 'M12 20.5V11.25M12 15.5l2.5-2.5' }]]);
// Soft teardrop flame leaning left, rounded tip, inner flame sharing the base.
export const IconFlame = createIcon('flame', [['path', { d: 'M12 20.75A6.25 6.25 0 0 1 5.75 14.5c0-3.9 2.85-6 4.35-9.9Q10.4 3.8 11.1 4.25c3.4 2.25 7.15 5.35 7.15 10.25A6.25 6.25 0 0 1 12 20.75Z' }], ['path', { d: 'M12 20.75a2.5 2.5 0 0 1-2.5-2.5c0-1.9 1.6-2.6 2.25-4.5 1.3 1 2.75 2.4 2.75 4.5a2.5 2.5 0 0 1-2.5 2.5' }]]);
// Upright teardrop with a rounded tip.
export const IconDroplet = createIcon('droplet', [['path', { d: 'M12.75 4.1Q12 3.3 11.25 4.1C8.5 7 5.75 10.6 5.75 14.25a6.25 6.25 0 0 0 12.5 0c0-3.65-2.75-7.25-5.5-10.15Z' }]]);
// Two peaks, one soft outline.
export const IconMountain = createIcon('mountain', [['path', { d: 'M4.5 19.25Q3.25 19.25 3.78 18.12L8.61 7.86Q9.25 6.5 10.04 7.78L12.73 12.15Q13.25 13 13.89 12.23L14.95 10.96Q15.75 10 16.34 11.1L20.16 18.15Q20.75 19.25 19.5 19.25Z' }]]);
// Dome with a scalloped hem, shaft ending in a J hook.
export const IconUmbrella = createIcon('umbrella', [['path', { d: 'M3.5 12a8.5 8.5 0 0 1 17 0c-.9-1.1-1.9-1.6-2.83-1.6S15.73 10.9 14.83 12c-.9-1.1-1.9-1.6-2.83-1.6S10.07 10.9 9.17 12c-.9-1.1-1.9-1.6-2.84-1.6S4.4 10.9 3.5 12Z' }], ['path', { d: 'M12 10.4v7.85a1.75 1.75 0 0 1-3.5 0' }]]);
// Ring, shaft with stock, one arc for the arms.
export const IconAnchor = createIcon('anchor', [['circle', { cx: 12, cy: 5.5, r: 2 }], ['path', { d: 'M12 7.5V20M9 10.75h6' }], ['path', { d: 'M4.75 13a7.25 7.25 0 0 0 14.5 0' }]]);
// Rounded ticket with semicircle notches and a dashed tear line.
export const IconTicket = createIcon('ticket', [['path', { d: 'M6.75 6h10.5a3.25 3.25 0 0 1 3.25 3.25V10a2 2 0 0 0 0 4v.75A3.25 3.25 0 0 1 17.25 18H6.75a3.25 3.25 0 0 1-3.25-3.25V14a2 2 0 0 0 0-4v-.75A3.25 3.25 0 0 1 6.75 6Z' }], ['path', { d: 'M14.75 8.75v.75M14.75 11.63v.75M14.75 14.5v.75' }]]);
// Core calendar plus a filled dot for the event.
export const IconCalendarEvent = createIcon('calendar-event', [['rect', { x: 4, y: 5.5, width: 16, height: 14.5, rx: 4.5 }], ['path', { d: 'M4.5 10.25h15M8.75 3.5v3M15.25 3.5v3' }], dot(12, 15.1, 1.25)]);
// Half sun on the horizon, two rays, and the shared arrowhead rising from it.
export const IconSunrise = createIcon('sunrise', [['path', { d: 'M3.25 18h17.5M7.5 18a4.5 4.5 0 0 1 9 0' }], ['path', { d: 'M5.5 14.25L3.99 13.38M18.5 14.25L20.01 13.38' }], ['path', { d: 'M12 11V4.19M9.28 6.4C10.3 5.3 11.1 4.55 11.63 4.03A0.53 0.53 0 0 1 12.37 4.03C12.9 4.55 13.7 5.3 14.72 6.4' }]]);
// Three gusts; the long ones curl back on themselves.
export const IconWind = createIcon('wind', [['path', { d: 'M3.5 9.25h10a2.75 2.75 0 1 0-2.75-2.75' }], ['path', { d: 'M3.5 12.75h13.75a2.75 2.75 0 1 1-2.75 2.75' }], ['path', { d: 'M3.5 16.25h6' }]]);
// Start and end rings joined by a soft S of two arcs.
export const IconRoute = createIcon('route', [['circle', { cx: 6, cy: 18.25, r: 2 }], ['circle', { cx: 18, cy: 5.75, r: 2 }], ['path', { d: 'M8 18.25h7a3.13 3.13 0 0 0 0-6.25H9a3.13 3.13 0 0 1 0-6.25h7' }]]);

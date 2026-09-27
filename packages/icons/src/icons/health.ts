/** Domain: health. Spec: ../create-icon.tsx; reference drawings: ./core.ts (Anuj-approved). */
import { createIcon } from '../create-icon';

// Shared parts, identical to status.ts / objects.ts so the families line up.
const ring = ['circle', { cx: 12, cy: 12, r: 8.75 }] as const;
const dot = (cx: number, cy: number, r = 0.95) => ['circle', { cx, cy, r, fill: 'currentColor', stroke: 'none' }] as const;
const PAGE = 'M13 3.75H8.5a3.25 3.25 0 0 0-3.25 3.25v10a3.25 3.25 0 0 0 3.25 3.25h7a3.25 3.25 0 0 0 3.25-3.25V9.5z';
const FOLD = 'M13 3.75v2.9a2.85 2.85 0 0 0 2.85 2.85h2.9';
// Soft heart: two semicircle lobes, a rounded tip (no point). Shared by heart and heart-pulse.
const HEART = 'M12 7.1A4.25 4.25 0 0 0 3.75 9.1C3.75 13 7 15.9 11.1 18.9Q12 19.55 12.9 18.9C17 15.9 20.25 13 20.25 9.1A4.25 4.25 0 0 0 12 7.1Z';

// Binaural U, a tube that swoops down and back up into the chest piece.
export const IconStethoscope = createIcon('stethoscope', [
  ['path', { d: 'M4.75 4v4.5a3.5 3.5 0 0 0 7 0V4' }],
  ['path', { d: 'M8.25 12v2.75a4.25 4.25 0 0 0 8.5 0V13.5' }],
  ['circle', { cx: 16.75, cy: 11.25, r: 2.25 }],
]);
// The everyday "pill": a two-tone capsule on the diagonal, one seam.
export const IconPill = createIcon('pill', [
  ['path', { d: 'M5.46 13.24 13.24 5.46a3.75 3.75 0 0 1 5.3 5.3L10.76 18.54a3.75 3.75 0 0 1-5.3-5.3Z' }],
  ['path', { d: 'M9.35 9.35l5.3 5.3' }],
]);
// Capsule lies flat (pill stands on the diagonal) so the pair never reads as one icon.
export const IconCapsule = createIcon('capsule', [
  ['rect', { x: 3.5, y: 7.25, width: 17, height: 9.5, rx: 4.75 }],
  ['path', { d: 'M12 7.25v9.5' }],
]);
// Barrel, plunger T and needle on one diagonal axis.
export const IconSyringe = createIcon('syringe', [
  ['path', { d: 'M6.72 13.39 12.02 8.09a1.5 1.5 0 0 1 2.12 0l1.77 1.77a1.5 1.5 0 0 1 0 2.12L10.61 17.28a1.5 1.5 0 0 1-2.12 0L6.72 15.51a1.5 1.5 0 0 1 0-2.12Z' }],
  ['path', { d: 'M4.95 19.05 7.6 16.4M15.03 8.97l3.36-3.36' }],
  ['path', { d: 'M16.27 3.49 20.51 7.73' }],
]);
// Heart with a gentle pulse inside: a soft blip, not a sharp ECG spike.
export const IconHeartPulse = createIcon('heart-pulse', [
  ['path', { d: HEART }],
  ['path', { d: 'M7 12.25h1.75l1.5-2.25 2.5 4.25 1.5-2h2.75' }],
]);
export const IconHeart = createIcon('heart', [['path', { d: HEART }]]);
// A tall main block between two low wings, one outline on a ground line; soft cross up top, arched door below.
export const IconHospital = createIcon('hospital', [
  ['path', { d: 'M3.25 20h17.5M4.25 20v-7.25a2.5 2.5 0 0 1 2.5-2.5H7.5V6.75A3.25 3.25 0 0 1 10.75 3.5h2.5a3.25 3.25 0 0 1 3.25 3.25v3.5h.75a2.5 2.5 0 0 1 2.5 2.5V20' }],
  ['path', { d: 'M12 7.25v4M10 9.25h4' }],
  ['path', { d: 'M10.25 20v-2.25a1.75 1.75 0 0 1 3.5 0V20' }],
]);
// Rounded case, arched handle, plus.
export const IconFirstAidKit = createIcon('first-aid-kit', [
  ['rect', { x: 3, y: 6.5, width: 18, height: 13.5, rx: 4.5 }],
  ['path', { d: 'M9 6.5V5.5a1.75 1.75 0 0 1 1.75-1.75h2.5A1.75 1.75 0 0 1 15 5.5v1' }],
  ['path', { d: 'M12 10.75v5M9.5 13.25h5' }],
]);
// Tube flowing into a round bulb; a dot of mercury in the bulb.
export const IconThermometer = createIcon('thermometer', [
  ['path', { d: 'M10 14.13V6a2 2 0 0 1 4 0v8.13a3.5 3.5 0 1 1-4 0Z' }],
  dot(12, 17, 1.25),
]);
// Molar: two soft crown bumps, two rounded roots, one outline.
export const IconTooth = createIcon('tooth', [
  ['path', { d: 'M12 5.75C10.75 4.6 9.4 4 8 4 5.6 4 4 5.9 4 8.4c0 2.2 1.1 3.9 1.8 6.2.5 1.8.8 5.4 2.45 5.4 1.45 0 1.55-4.5 3.75-4.5s2.3 4.5 3.75 4.5c1.65 0 1.95-3.6 2.45-5.4.7-2.3 1.8-4 1.8-6.2C20 5.9 18.4 4 16 4c-1.4 0-2.75.6-4 1.75Z' }],
]);
// Two strands crossing twice; three rungs in the open loops.
export const IconDna = createIcon('dna', [
  ['path', { d: 'M7 3.75C7 8.5 17 7.5 17 12s-10 3.5-10 8.25' }],
  ['path', { d: 'M17 3.75C17 8.5 7 7.5 7 12s10 3.5 10 8.25' }],
  ['path', { d: 'M9.5 4.75h5M9 12h6M9.5 19.25h5' }],
]);
// Tilted tube, an arm that curves down to the base, a stage.
export const IconMicroscope = createIcon('microscope', [
  ['path', { d: 'M6.36 10.19 8.86 5.86a1.75 1.75 0 0 1 3.03 1.75L9.39 11.94a1.75 1.75 0 0 1-3.03-1.75Z' }],
  ['path', { d: 'M11.25 9.9a5.5 5.5 0 0 1 3.25 10.1' }],
  ['path', { d: 'M5 20h14M6.75 15.75h4.5' }],
]);
// Adhesive strip on the other diagonal from pill; two pad edges mark it as a bandage.
export const IconBandage = createIcon('bandage', [
  ['path', { d: 'M11.29 5.28 18.72 12.71a4.25 4.25 0 0 1-6.01 6.01L5.28 11.29a4.25 4.25 0 0 1 6.01-6.01Z' }],
  ['path', { d: 'M12.71 6.7 6.7 12.71M17.3 11.29 11.29 17.3' }],
]);
// Side-view rider (the ISA wheelchair symbol, softened): head, body into a folded leg, an open wheel.
export const IconWheelchair = createIcon('wheelchair', [
  ['circle', { cx: 9.5, cy: 4.75, r: 1.75 }],
  ['path', { d: 'M9.5 8.25V12a1 1 0 0 0 1 1h3.75l1.75 4.75H18' }],
  ['path', { d: 'M11.71 19.7A5 5 0 1 1 7.5 10.67' }],
]);
// Baby face: the ring, a single curl of hair, dot eyes, small smile.
export const IconBaby = createIcon('baby', [
  ring,
  ['path', { d: 'M12 3.25c-1.4 0-2 1.6-.9 2.3' }],
  dot(9.25, 11.5),
  dot(14.75, 11.5),
  ['path', { d: 'M9.75 15a3 3 0 0 0 4.5 0' }],
]);
// Round fruit with a gentle top dip, and a leaf for a stem (no bite: not the brand).
export const IconApple = createIcon('apple', [
  ['path', { d: 'M12 7.5C10.9 6.8 9.8 6.5 8.6 6.5c-2.7 0-4.35 2.3-4.35 5.4 0 4.3 2.65 8.35 5.15 8.35 1 0 1.6-.5 2.6-.5s1.6.5 2.6.5c2.5 0 5.15-4.05 5.15-8.35 0-3.1-1.65-5.4-4.35-5.4-1.2 0-2.3.3-3.4 1Z' }],
  ['path', { d: 'M12 7.25C12 5 13.1 3.75 15.25 3.5c0 2.1-1.15 3.35-3.25 3.75Z' }],
]);
// Two tall plates, a bar, short end stubs.
export const IconDumbbell = createIcon('dumbbell', [
  ['rect', { x: 5.5, y: 5.5, width: 3, height: 13, rx: 1.5 }],
  ['rect', { x: 15.5, y: 5.5, width: 3, height: 13, rx: 1.5 }],
  ['path', { d: 'M8.5 12h7M3.25 12H5.5M18.5 12h2.25' }],
]);
// Headboard, base, a quilt that arcs over the foot; a pillow.
export const IconBed = createIcon('bed', [
  ['path', { d: 'M3.5 5v14.5M3.5 16.5h17M20.5 19.5v-6.25a3.25 3.25 0 0 0-3.25-3.25h-6.75v6.5' }],
  ['rect', { x: 5.75, y: 11, width: 3.5, height: 3.25, rx: 1.5 }],
]);
// Box body, a sloped cab, two wheels, a plus on the side.
export const IconAmbulance = createIcon('ambulance', [
  ['path', { d: 'M5.5 17.5H5A1.5 1.5 0 0 1 3.5 16V7.75A2.75 2.75 0 0 1 6.25 5h8a1.5 1.5 0 0 1 1.5 1.5v3h1.6a2 2 0 0 1 1.7.95l1.3 2.1c.3.45.4 1 .4 1.5V16a1.5 1.5 0 0 1-1.5 1.5h-.5M9.5 17.5h5' }],
  ['circle', { cx: 7.5, cy: 17.5, r: 2 }],
  ['circle', { cx: 16.5, cy: 17.5, r: 2 }],
  ['path', { d: 'M9.5 8.25v4.5M7.25 10.5h4.5' }],
]);
// Tube on the diagonal with a lip and a liquid line.
export const IconTestTube = createIcon('test-tube', [
  ['path', { d: 'M7.4 3.87 18.36 14.83a2.5 2.5 0 0 1-3.53 3.53L3.87 7.4' }],
  ['path', { d: 'M7.93 3.34 3.34 7.93' }],
  ['path', { d: 'M14.12 10.59 10.59 14.12' }],
]);
// Windpipe that forks into two soft lobes.
export const IconLungs = createIcon('lungs', [
  ['path', { d: 'M12 3.5V9c0 1.6-1 2.75-2.25 3.25M12 9c0 1.6 1 2.75 2.25 3.25' }],
  ['path', { d: 'M9.75 9.5c0-1.6-.65-2.75-1.65-2.75-2.3 0-4.35 4.85-4.35 10.15 0 2 1.35 3.2 3.35 2.8 1.6-.3 2.65-1.4 2.65-3Z' }],
  ['path', { d: 'M14.25 9.5c0-1.6.65-2.75 1.65-2.75 2.3 0 4.35 4.85 4.35 10.15 0 2-1.35 3.2-3.35 2.8-1.6-.3-2.65-1.4-2.65-3Z' }],
]);
// Two cloud-soft hemispheres meeting at a centre line.
export const IconBrain = createIcon('brain', [
  ['path', { d: 'M12 5.5C11.4 4.6 10.5 4.1 9.4 4.1 7.7 4.1 6.3 5.3 6 6.9 4.6 7.3 3.6 8.6 3.6 10.1c0 .9.3 1.7.9 2.3-.6.6-.9 1.5-.9 2.4 0 1.8 1.3 3.2 3 3.4.5 1.2 1.7 2 3 2 1 0 1.9-.5 2.4-1.2' }],
  ['path', { d: 'M12 5.5c.6-.9 1.5-1.4 2.6-1.4 1.7 0 3.1 1.2 3.4 2.8 1.4.4 2.4 1.7 2.4 3.2 0 .9-.3 1.7-.9 2.3.6.6.9 1.5.9 2.4 0 1.8-1.3 3.2-3 3.4-.5 1.2-1.7 2-3 2-1 0-1.9-.5-2.4-1.2' }],
  ['path', { d: 'M12 5.5V19' }],
]);
// Friendly virus: round body, short spokes ending in filled knobs (the knobs keep it from reading as a sun).
export const IconVirus = createIcon('virus', [
  ['circle', { cx: 12, cy: 12, r: 4.25 }],
  ['path', { d: 'M12 7.75v-2M15 9l1.42-1.42M16.25 12h2M15 15l1.42 1.42M12 16.25v2M9 15l-1.42 1.42M7.75 12h-2M9 9 7.58 7.58' }],
  ...([[12, 4.25], [17.48, 6.52], [19.75, 12], [17.48, 17.48], [12, 19.75], [6.52, 17.48], [4.25, 12], [6.52, 6.52]] as const).map(([x, y]) => dot(x, y, 1.15)),
]);
// Surgical mask: soft body, two pleats, ear loops.
export const IconFaceMask = createIcon('face-mask', [
  ['path', { d: 'M7.5 7.75c3-.75 6-.75 9 0A2 2 0 0 1 18 9.7v4.6a2 2 0 0 1-1.5 1.95c-3 .75-6 .75-9 0A2 2 0 0 1 6 14.3V9.7a2 2 0 0 1 1.5-1.95Z' }],
  ['path', { d: 'M9 10.75h6M9 13.25h6' }],
  ['path', { d: 'M6 9.25h-.5a2.75 2.75 0 0 0 0 5.5H6M18 9.25h.5a2.75 2.75 0 0 1 0 5.5H18' }],
]);
// Two round lenses, an arched bridge, temples sweeping back.
export const IconGlasses = createIcon('glasses', [
  ['circle', { cx: 6.75, cy: 14.75, r: 3.75 }],
  ['circle', { cx: 17.25, cy: 14.75, r: 3.75 }],
  ['path', { d: 'M10.5 14.25a2 2 0 0 1 3 0M3.1 13.9C3.4 11.9 3.95 10.2 4.75 8.75M20.9 13.9C20.6 11.9 20.05 10.2 19.25 8.75' }],
]);
// Core file page and fold with an Rx mark: an R whose leg is crossed.
export const IconPrescription = createIcon('prescription', [
  ['path', { d: PAGE }],
  ['path', { d: FOLD }],
  ['path', { d: 'M9.25 17.5v-5.75h2a1.6 1.6 0 0 1 0 3.2h-2M11.25 14.95l3.5 3.3M15 14.75l-3 3.25' }],
]);
// The UN accessibility figure in the ring: head dot, open arms, body, legs.
export const IconAccessible = createIcon('accessible', [
  ring,
  dot(12, 7.25, 1.1),
  ['path', { d: 'M7.75 9.75c2.9.85 5.6.85 8.5 0M12 10.25v3M9.75 17c.8-1.5 1.4-2.6 2.25-3.75.85 1.15 1.45 2.25 2.25 3.75' }],
]);
// Mid-stride figure: head, leaning body into a back leg, bent front leg, swinging arms.
export const IconWalk = createIcon('walk', [
  ['circle', { cx: 13.25, cy: 4.5, r: 1.75 }],
  ['path', { d: 'M8.25 20c1.1-2.4 2-4.3 2.75-6.5.6-1.8 1-3.6 1.5-5.5M11 13.5l2.5 2.75.25 3.75' }],
  ['path', { d: 'M8.25 11.5C9.6 9.7 11 8.6 12.5 8c.9 1.3 1.7 2.35 2.6 3 .6.45 1.35.7 2.15.75' }],
]);

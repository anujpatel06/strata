/** Batch: navigation. Spec: ../create-icon.tsx; reference drawings: ./core.ts.
 * Every chevron and arrowhead is core chevron-right, rotated/scaled (arrowheads at 0.5–0.62), so the family shares one tip. */
import { createIcon } from '../create-icon';

// core chevron-right rotated 90°.
export const IconChevronDown = createIcon('chevron-down', [["path",{"d":"M18 10C15.9 12.3 14.1 14 12.7 15.35A1 1 0 0 1 11.3 15.35C9.9 14 8.1 12.3 6 10"}]]);
// core chevron-right mirrored.
export const IconChevronLeft = createIcon('chevron-left', [["path",{"d":"M14 18C11.7 15.9 10 14.1 8.65 12.7A1 1 0 0 1 8.65 11.3C10 9.9 11.7 8.1 14 6"}]]);
// Shared arrowhead: core chevron at 0.62.
export const IconArrowRight = createIcon('arrow-right', [["path",{"d":"M5 12L18.81 12M15.51 8.28C16.93 9.58 17.99 10.7 18.82 11.57A0.62 0.62 0 0 1 18.82 12.43C17.99 13.3 16.93 14.42 15.51 15.72"}]]);
export const IconArrowLeft = createIcon('arrow-left', [["path",{"d":"M19 12L5.19 12M8.49 15.72C7.07 14.42 6.01 13.3 5.18 12.43A0.62 0.62 0 0 1 5.18 11.57C6.01 10.7 7.07 9.58 8.49 8.28"}]]);
export const IconArrowUp = createIcon('arrow-up', [["path",{"d":"M12 19L12 5.19M8.28 8.49C9.58 7.07 10.7 6.01 11.57 5.18A0.62 0.62 0 0 1 12.43 5.18C13.3 6.01 14.42 7.07 15.72 8.49"}]]);
// Diagonals are the same arrow turned 45°.
export const IconArrowUpRight = createIcon('arrow-up-right', [["path",{"d":"M7.4 16.6L16.46 7.54M11.49 7.24C13.42 7.16 14.96 7.2 16.16 7.22A0.62 0.62 0 0 1 16.78 7.84C16.8 9.04 16.84 10.58 16.76 12.51"}]]);
export const IconArrowDownLeft = createIcon('arrow-down-left', [["path",{"d":"M16.6 7.4L7.54 16.46M12.51 16.76C10.58 16.84 9.04 16.8 7.84 16.78A0.62 0.62 0 0 1 7.22 16.16C7.2 14.96 7.16 13.42 7.24 11.49"}]]);
export const IconArrowDownRight = createIcon('arrow-down-right', [["path",{"d":"M7.4 7.4L16.46 16.46M16.76 11.49C16.84 13.42 16.8 14.96 16.78 16.16A0.62 0.62 0 0 1 16.16 16.78C14.96 16.8 13.42 16.84 11.49 16.76"}]]);
// Longer shaft, smaller head.
export const IconArrowNarrowRight = createIcon('arrow-narrow-right', [["path",{"d":"M3.75 12L20.1 12M17.43 9C18.58 10.05 19.43 10.95 20.11 11.65A0.5 0.5 0 0 1 20.11 12.35C19.43 13.05 18.58 13.95 17.43 15"}]]);
// Up and down arrows side by side.
export const IconArrowsSort = createIcon('arrows-sort', [["path",{"d":"M8 19L8 5.17M4.7 8.1C5.86 6.83 6.85 5.9 7.62 5.16A0.55 0.55 0 0 1 8.39 5.16C9.16 5.9 10.15 6.83 11.3 8.1"}],["path",{"d":"M16 5L16 18.84M19.3 15.9C18.15 17.17 17.16 18.1 16.39 18.84A0.55 0.55 0 0 1 15.62 18.84C14.85 18.1 13.86 17.17 12.7 15.9"}]]);
// Two opposing arrows, stacked.
export const IconArrowsExchange = createIcon('arrows-exchange', [["path",{"d":"M4.25 8L19.59 8M16.65 4.7C17.92 5.86 18.85 6.85 19.59 7.62A0.55 0.55 0 0 1 19.59 8.39C18.85 9.16 17.92 10.15 16.65 11.3"}],["path",{"d":"M19.75 16L4.42 16M7.35 19.3C6.08 18.15 5.15 17.16 4.41 16.39A0.55 0.55 0 0 1 4.41 15.62C5.15 14.85 6.08 13.86 7.35 12.7"}]]);
// Up + down chevrons.
export const IconSelector = createIcon('selector', [["path",{"d":"M8.4 8.13C9.66 6.75 10.74 5.73 11.58 4.92A0.6 0.6 0 0 1 12.42 4.92C13.26 5.73 14.34 6.75 15.6 8.13M15.6 15.87C14.34 17.25 13.26 18.27 12.42 19.08A0.6 0.6 0 0 1 11.58 19.08C10.74 18.27 9.66 17.25 8.4 15.87"}]]);
// Open box (3.25 corners) with the arrow leaving its corner.
export const IconExternalLink = createIcon('external-link', [["path",{"d":"M11 4.75H8A3.25 3.25 0 0 0 4.75 8v8A3.25 3.25 0 0 0 8 19.25h8A3.25 3.25 0 0 0 19.25 16v-3"}],["path",{"d":"M11.25 12.75L19.38 4.62M14.97 4.36C16.69 4.28 18.05 4.32 19.12 4.34A0.55 0.55 0 0 1 19.66 4.88C19.68 5.95 19.72 7.31 19.64 9.03"}]]);
// Mirror of core upload: same tray, arrow into it.
export const IconDownload = createIcon('download', [["path",{"d":"M12 5L12 14.31M15.72 11.01C14.42 12.43 13.3 13.49 12.43 14.32A0.62 0.62 0 0 1 11.57 14.32C10.7 13.49 9.58 12.43 8.28 11.01"}],["path",{"d":"M5 14c0 3.4 1.6 5.5 4.5 5.5h5c2.9 0 4.5-2.1 4.5-5.5"}]]);
// Open door bracket, arrow out to the right.
export const IconLogout = createIcon('logout', [["path",{"d":"M12.75 4.75H8.25A3.25 3.25 0 0 0 5 8v8a3.25 3.25 0 0 0 3.25 3.25h4.5"}],["path",{"d":"M10 12L19.84 12M16.9 8.7C18.17 9.86 19.1 10.85 19.84 11.62A0.55 0.55 0 0 1 19.84 12.39C19.1 13.16 18.17 14.15 16.9 15.3"}]]);
// Two clockwise arcs chasing each other.
export const IconRefresh = createIcon('refresh', [["path",{"d":"M5.24 10.19A7 7 0 0 1 16.24 6.43L17.96 8.38M18.47 4.24C18.44 5.86 18.32 7.14 18.24 8.15A0.52 0.52 0 0 1 17.69 8.63C16.68 8.58 15.39 8.54 13.78 8.36"}],["path",{"d":"M18.76 13.81A7 7 0 0 1 7.76 17.57L6.04 15.62M5.53 19.76C5.56 18.14 5.68 16.86 5.76 15.85A0.52 0.52 0 0 1 6.31 15.37C7.32 15.42 8.61 15.46 10.22 15.64"}]]);
// One counter-clockwise arc (used as "reset").
export const IconRotate = createIcon('rotate', [["path",{"d":"M7.84 17.94A7.25 7.25 0 1 0 7.53 6.29L5.82 8.26M10 8.21C8.39 8.39 7.1 8.45 6.09 8.5A0.52 0.52 0 0 1 5.54 8.02C5.45 7.02 5.33 5.74 5.29 4.12"}]]);
export const IconPlus = createIcon('plus', [["path",{"d":"M12 5.25v13.5M5.25 12h13.5"}]]);
export const IconDots = createIcon('dots', [["circle",{"cx":5.5,"cy":12,"r":1.2,"fill":"currentColor","stroke":"none"}],["circle",{"cx":12,"cy":12,"r":1.2,"fill":"currentColor","stroke":"none"}],["circle",{"cx":18.5,"cy":12,"r":1.2,"fill":"currentColor","stroke":"none"}]]);
export const IconDotsVertical = createIcon('dots-vertical', [["circle",{"cx":12,"cy":5.5,"r":1.2,"fill":"currentColor","stroke":"none"}],["circle",{"cx":12,"cy":12,"r":1.2,"fill":"currentColor","stroke":"none"}],["circle",{"cx":12,"cy":18.5,"r":1.2,"fill":"currentColor","stroke":"none"}]]);
export const IconMenu2 = createIcon('menu-2', [["path",{"d":"M4.75 6.5h14.5M4.75 12h14.5M4.75 17.5h14.5"}]]);
// Funnel with rounded rim and stem.
export const IconFilter = createIcon('filter', [["path",{"d":"M5.75 5L18.25 5Q19.75 5 18.8 6.16L14.79 11.03Q14 12 14 13.25L14 17.1Q14 18 13.2 18.4L10.8 19.6Q10 20 10 19.1L10 13.25Q10 12 9.21 11.03L5.2 6.16Q4.25 5 5.75 5Z"}]]);
// Two sliders (not three): fewer strokes, still reads as settings.
export const IconAdjustmentsHorizontal = createIcon('adjustments-horizontal', [["path",{"d":"M4.5 8h8M17.5 8h2M4.5 16h2M11.5 16h8"}],["circle",{"cx":15,"cy":8,"r":2.5}],["circle",{"cx":9,"cy":16,"r":2.5}]]);
// Two 3.25-corner cards; the back one only where it shows.
export const IconCopy = createIcon('copy', [["rect",{"x":8.75,"y":8.75,"width":11,"height":11,"rx":3.25}],["path",{"d":"M15.25 8.75V7.5A3.25 3.25 0 0 0 12 4.25H7.5A3.25 3.25 0 0 0 4.25 7.5V12a3.25 3.25 0 0 0 3.25 3.25h1.25"}]]);
// Pencil as one outline: rounded back, soft tip, no ferrule lines.
export const IconPencil = createIcon('pencil', [["path",{"d":"M18.29 9.1L11.58 15.82Q10.69 16.7 9.5 17.09L6.11 18.21Q5.64 18.36 5.79 17.89L6.91 14.5Q7.3 13.31 8.18 12.42L14.9 5.71A2.4 2.4 0 0 1 18.29 9.1Z"}]]);
// Two open chain loops and a bar, turned 45°.
export const IconLink = createIcon('link', [["path",{"d":"M8.82 10.94L5.64 14.12A3 3 0 0 0 9.88 18.36L13.06 15.18M10.94 8.82L14.12 5.64A3 3 0 0 1 18.36 9.88L15.18 13.06M9.53 14.47L14.47 9.53"}]]);
// Three nodes joined: the share graph, not a box-and-arrow.
export const IconShare = createIcon('share', [["circle",{"cx":17.25,"cy":6,"r":2.5}],["circle",{"cx":6.75,"cy":12,"r":2.5}],["circle",{"cx":17.25,"cy":18,"r":2.5}],["path",{"d":"M8.92 10.76L15.08 7.24M8.92 13.24L15.08 16.76"}]]);
// Paper plane pointing right, with a notch tail.
export const IconSend = createIcon('send', [["path",{"d":"M18.64 12.64L5.77 18.66Q4.5 19.25 5.14 18.01L7.97 12.53Q8.25 12 7.97 11.47L5.14 5.99Q4.5 4.75 5.77 5.34L18.64 11.36Q20 12 18.64 12.64Z"}]]);

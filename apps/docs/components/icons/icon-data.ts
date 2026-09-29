/**
 * Server-only: the icon set's structure and style numbers, read from packages/icons at build time so the page
 * can't drift from the package. Groups follow the source files in the order src/index.ts exports them — the
 * subject groups, then the two style layers, Filled and Duotone. The grid, live area and stroke come from the
 * spec in create-icon.tsx.
 */
import { readRepoFile } from '@/lib/repo';

export interface IconGroup {
  id: string;
  label: string;
  /** Export names, e.g. "IconBell", in source order. */
  names: string[];
}

export interface IconSpec {
  /** viewBox size, e.g. 24. */
  grid: number;
  /** The central live area the drawing stays inside, e.g. 20. */
  live: number;
  /** Default stroke width, e.g. 1.5. */
  stroke: number;
  /** Large / medium / small box corner radii, as written in the spec. */
  radii: string;
  /** Keyline circle radius. */
  keylineRadius: number;
}

const GROUP_LABEL: Record<string, string> = {
  core: 'Core',
  navigation: 'Navigation',
  status: 'Status',
  objects: 'Objects',
  filled: 'Filled',
  duotone: 'Duotone',
};

export function getIconGroups(): IconGroup[] {
  const index = readRepoFile('packages', 'icons', 'src', 'index.ts') ?? '';
  const files = [...index.matchAll(/export \* from '\.\/icons\/([\w-]+)'/g)].map((m) => m[1]!);
  return files.map((id) => {
    const source = readRepoFile('packages', 'icons', 'src', 'icons', `${id}.ts`) ?? '';
    // Most icons are a createIcon() call; the duotone layer composes its outline twin instead (duotone-kit.ts).
    const names = [...source.matchAll(/export const (Icon\w+)\s*=\s*(?:createIcon|duotone|untinted)\(/g)].map((m) => m[1]!);
    return { id, label: GROUP_LABEL[id] ?? id.charAt(0).toUpperCase() + id.slice(1), names };
  });
}

export interface DuotoneFacts {
  /** Twins in the duotone layer. */
  total: number;
  /** Twins with no tint: marks that enclose no area, so there is nothing to fill (ADR-036). */
  untinted: number;
  /** The tint token's declaration, read from the kit so the page can't quote a stale default. */
  tint: string;
}

export function getDuotoneFacts(): DuotoneFacts {
  const source = readRepoFile('packages', 'icons', 'src', 'icons', 'duotone.ts') ?? '';
  const kit = readRepoFile('packages', 'icons', 'src', 'icons', 'duotone-kit.ts') ?? '';
  return {
    total: [...source.matchAll(/export const Icon\w+\s*=\s*(?:duotone|untinted)\(/g)].length,
    untinted: [...source.matchAll(/export const Icon\w+\s*=\s*untinted\(/g)].length,
    tint: /export const TINT = '([^']+)'/.exec(kit)?.[1] ?? '',
  };
}

export function getIconSpec(): IconSpec {
  const src = readRepoFile('packages', 'icons', 'src', 'create-icon.tsx') ?? '';
  const num = (re: RegExp, fallback: number) => {
    const m = re.exec(src);
    return m ? Number(m[1]) : fallback;
  };
  return {
    grid: num(/viewBox="0 0 (\d+) \d+"/, 24),
    live: num(/central (\d+)×\d+/, 20),
    stroke: num(/strokeWidth=\{([\d.]+)\}/, 1.5),
    radii: /Box corners are ([\d.]+ \([a-z]+\) \/ [\d.]+ \([a-z]+\) \/ [\d.]+ \([a-z]+\))/.exec(src)?.[1] ?? '',
    keylineRadius: num(/circle r=(\d+(?:\.\d+)?)/, 9),
  };
}

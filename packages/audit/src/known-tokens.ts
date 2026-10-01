/**
 * The set of `--syntara-*` names the theme engine actually emits.
 *
 * Why this exists: an undefined custom property is not a CSS error. `var(--syntara-radius-md)` parses, and the
 * declaration holding it is then invalid at computed-value time — it computes to `unset`, so the declaration does
 * nothing and nothing says so. In a focus-ring rule that is a WCAG 2.2 AA 2.4.7 failure, because the module rule
 * still wins the cascade over the site's `:where(…:focus-visible)` fallback and then throws the ring away.
 *
 * The list is taken from `toCssVariables`, the same function the exporters and the Brand Generator use, so it
 * cannot drift from what ships. It is unioned over every tenant, both schemes and both densities, because a few
 * names (the chart series) depend on the solved palette.
 */
import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { toCssVariables } from '@syntara/theme-engine';
import type { Density, Scheme } from '@syntara/theme-engine';
import { loadTheme, tenantsDir } from './tokens';

const SCHEMES: readonly Scheme[] = ['light', 'dark'];
const DENSITIES: readonly Density[] = ['comfortable', 'compact'];

let cache: ReadonlySet<string> | null = null;

/** Tenant ids on disk. Empty when the folder can't be read; the caller still adds the audited tenant. */
function tenantIds(): string[] {
  try {
    return readdirSync(tenantsDir(), { withFileTypes: true })
      .filter((e) => e.isDirectory() && /^[a-z0-9][a-z0-9-]*$/i.test(e.name))
      .map((e) => e.name);
  } catch {
    return [];
  }
}

/** Every name the engine emits, for every tenant on disk plus `tenant`. Computed once per process. */
export function knownTokenNames(tenant = 'house'): ReadonlySet<string> {
  if (cache) return cache;
  const names = new Set<string>();
  const ids = new Set([...tenantIds(), tenant]);
  let loaded = 0;
  for (const id of ids) {
    let theme;
    try {
      theme = loadTheme(id);
    } catch {
      continue; // a folder without a readable brand.json contributes nothing
    }
    loaded++;
    for (const scheme of SCHEMES) {
      for (const density of DENSITIES) {
        for (const name of Object.keys(toCssVariables(theme, scheme, density))) names.add(name);
      }
    }
  }
  // No tenant could be loaded (no tenants folder, or SYNTARA_TENANTS_DIR points somewhere empty). An empty set
  // would make the rule flag every token in the file, so the caller treats it as "cannot check" instead.
  if (loaded === 0) {
    cache = new Set<string>();
    return cache;
  }
  cache = names;
  return cache;
}

/** Test seam: forget the memoised set so a test can change the tenants folder. */
export function resetKnownTokenNames(): void {
  cache = null;
}

/**
 * Names to offer alongside the finding. When the invented name has a family the engine does emit
 * (`--syntara-radius-md` → `--syntara-radius-*`), the whole family is listed, because the right answer is a
 * choice between roles and an edit distance is a bad guide to it: `--syntara-radius-container` is the furthest
 * of the five from "md" by spelling and the nearest by meaning.
 *
 * With no family, candidates are ranked by how many words of the name they share, so
 * `--syntara-focus-ring-width` offers `--syntara-color-focus-ring` rather than whatever is nearest by spelling.
 * When nothing shares a word, the list is empty and the message says so instead of guessing.
 *
 * The auditor never picks for you: which role is right depends on what the element is.
 */
export function nearestNames(name: string, known: ReadonlySet<string>, limit = 6): string[] {
  const family = name.replace(/-[^-]+$/, ''); // --syntara-radius-md → --syntara-radius
  const siblings = [...known].filter((c) => c.startsWith(`${family}-`) && !c.slice(family.length + 1).includes('-'));
  if (siblings.length > 0) {
    return siblings.map((c) => ({ c, d: distance(name, c) })).sort((a, b) => a.d - b.d).slice(0, limit).map((s) => s.c).sort();
  }
  const words = new Set(name.replace('--syntara-', '').split('-'));
  const scored = [...known]
    .map((candidate) => {
      const shared = candidate.replace('--syntara-', '').split('-').filter((w) => words.has(w)).length;
      return { candidate, shared, d: distance(name, candidate) };
    })
    .filter((s) => s.shared > 0)
    .sort((a, b) => b.shared - a.shared || a.d - b.d || a.candidate.localeCompare(b.candidate));
  return scored.slice(0, limit).map((s) => s.candidate);
}

/** Levenshtein distance, two rows. */
function distance(a: string, b: string): number {
  if (a === b) return 0;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const row = [i];
    for (let j = 1; j <= b.length; j++) {
      row[j] = Math.min(prev[j]! + 1, row[j - 1]! + 1, prev[j - 1]! + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    prev = row;
  }
  return prev[b.length]!;
}

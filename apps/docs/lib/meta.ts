/**
 * Server-only: component metadata from packages/react/meta/<name>.meta.json (ADR-007).
 * Every file present at build time becomes a page; half-written or invalid files are skipped with a warning.
 */
import { cache } from 'react';
import { listRepoDir, readRepoFile } from './repo';
import { CATEGORY_LABEL, CATEGORY_ORDER, type Category, type ComponentMeta, type ComponentSummary } from './meta-types';

function isMeta(value: unknown): value is ComponentMeta {
  if (!value || typeof value !== 'object') return false;
  const m = value as Partial<ComponentMeta>;
  return (
    typeof m.name === 'string' &&
    typeof m.title === 'string' &&
    typeof m.description === 'string' &&
    typeof m.category === 'string' &&
    (CATEGORY_ORDER as readonly string[]).includes(m.category) &&
    typeof m.maturity === 'string'
  );
}

/** Fills optional arrays so pages never crash on a partially written meta file. */
function normalise(m: ComponentMeta): ComponentMeta {
  return {
    ...m,
    exports: m.exports ?? [],
    files: m.files ?? [],
    dependencies: m.dependencies ?? [],
    registryDependencies: m.registryDependencies ?? [],
    usage: m.usage ?? '',
    examples: m.examples ?? [],
    props: m.props ?? [],
    accessibility: { keyboard: m.accessibility?.keyboard ?? [], notes: m.accessibility?.notes ?? [] },
    guidelines: { do: m.guidelines?.do ?? [], dont: m.guidelines?.dont ?? [] },
    tokens: m.tokens ?? [],
  };
}

export const getAllMeta = cache((): ComponentMeta[] => {
  const out: ComponentMeta[] = [];
  for (const file of listRepoDir('packages', 'react', 'meta')) {
    if (!file.endsWith('.meta.json')) continue;
    const raw = readRepoFile('packages', 'react', 'meta', file);
    if (!raw) continue;
    try {
      const parsed: unknown = JSON.parse(raw);
      if (isMeta(parsed)) out.push(normalise(parsed));
      else console.warn(`[docs] skipped packages/react/meta/${file}: missing name/title/description/category/maturity`);
    } catch (error) {
      console.warn(`[docs] skipped packages/react/meta/${file}: ${(error as Error).message}`);
    }
  }
  return out.sort((a, b) => a.title.localeCompare(b.title));
});

export function getMeta(name: string): ComponentMeta | undefined {
  return getAllMeta().find((m) => m.name === name);
}

export function toSummary(m: ComponentMeta): ComponentSummary {
  return { name: m.name, title: m.title, description: m.description, category: m.category, maturity: m.maturity };
}

export interface CategoryGroup {
  category: Category;
  label: string;
  items: ComponentSummary[];
}

/** Components grouped by category in CATEGORY_ORDER, alphabetical within a group. */
export const getComponentGroups = cache((): CategoryGroup[] => {
  const all = getAllMeta();
  return CATEGORY_ORDER.map((category) => ({
    category,
    label: CATEGORY_LABEL[category],
    items: all.filter((m) => m.category === category).map(toSummary),
  })).filter((g) => g.items.length > 0);
});

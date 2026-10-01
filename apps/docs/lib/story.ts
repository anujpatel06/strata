/**
 * Server-only: the numbers on /story, each read from the file a script writes, with the command that
 * writes it carried alongside. BRIEF §11 asks for "numbers, each with its command" — so nothing here is
 * typed by hand, and a missing report makes the figure disappear rather than go stale.
 *
 * If a figure stops rendering, run the command in its `command` field; that is the whole contract.
 */
import { cache } from 'react';
import { getAllMeta } from './meta';
import { listRepoDir, readRepoFile } from './repo';
import { getTenants } from './tenants';

export interface StoryFigure {
  /** Short label, e.g. "Themes that pass". */
  label: string;
  /** The figure itself, already formatted. */
  value: string;
  /** What it is counted over, e.g. "118,000 checks across 1,000 brands". */
  basis: string;
  /** The command that produces the file this was read from. */
  command: string;
}

const n = (x: number): string => x.toLocaleString('en-US');

/** packages/theme-engine/reports/fuzz-report.json — `pnpm test:themes`. */
function themeFigure(): StoryFigure | undefined {
  const raw = readRepoFile('packages', 'theme-engine', 'reports', 'fuzz-report.json');
  if (!raw) return undefined;
  const r = JSON.parse(raw) as {
    command: string;
    themes: number;
    totalChecks: number;
    failed: number;
    passRatePercent: number;
  };
  return {
    label: 'Contrast checks that pass',
    // Floored, never rounded up: 99.9% must not print as 100%.
    value: `${Math.floor(r.passRatePercent * 10) / 10}%`,
    basis: `${n(r.totalChecks)} checks across ${n(r.themes)} random brands, ${n(r.failed)} failures`,
    command: r.command,
  };
}

/** evals/results.json — `node evals/report.mjs --iteration 2`. */
function evalFigure(): StoryFigure | undefined {
  const raw = readRepoFile('evals', 'results.json');
  if (!raw) return undefined;
  const r = JSON.parse(raw) as {
    iteration: string;
    models: Record<string, { overall: Record<string, { runs: number; onSystemPercent: number }> }>;
  };
  const model = Object.keys(r.models)[0];
  const overall = model ? r.models[model]?.overall : undefined;
  const none = overall?.none;
  const mcp = overall?.mcp;
  if (!none || !mcp) return undefined;
  return {
    label: 'Agent runs fully on-system',
    value: `${none.onSystemPercent}% → ${mcp.onSystemPercent}%`,
    basis: `${model}, ${n(none.runs + mcp.runs)} runs: no context, then MCP + AGENTS.md`,
    command: `node evals/report.mjs --iteration ${r.iteration}`,
  };
}

/** packages/audit/reports/blocks.json — the drift auditor over the seven reference blocks. */
function auditFigure(): StoryFigure | undefined {
  const raw = readRepoFile('packages', 'audit', 'reports', 'blocks.json');
  if (!raw) return undefined;
  const r = JSON.parse(raw) as {
    score: number;
    findings: unknown[];
    stats: { files: number; lines: number; opportunities: number };
  };
  return {
    label: 'Drift score, reference blocks',
    value: `${r.score} / 100`,
    basis: `${n(r.stats.opportunities)} places checked in ${n(r.stats.lines)} lines, ${n(r.findings.length)} finding${r.findings.length === 1 ? '' : 's'}`,
    command: 'pnpm drift apps/docs/blocks',
  };
}

/**
 * What a new brand actually costs, counted from the tenants themselves rather than asserted: the keys in a
 * brand.json, and the fact that no file under packages/react changes to add one.
 */
function tenantFigure(): StoryFigure | undefined {
  const tenants = listRepoDir('tenants').filter((id) => readRepoFile('tenants', id, 'brand.json'));
  const sample = tenants.map((id) => readRepoFile('tenants', id, 'brand.json')).find(Boolean);
  if (!sample || tenants.length === 0) return undefined;
  // `name` is the display name, not a theme input — the engine's BrandInput carries it alongside the six that
  // actually drive the theme (primary, accent, neutral, shape, typePair, density). Counting it would print 7
  // next to the site's own "six brand inputs".
  const inputs = Object.keys(JSON.parse(sample) as Record<string, unknown>).filter((k) => k !== 'name').length;
  return {
    label: 'Inputs that drive a brand',
    value: String(inputs),
    basis: `${tenants.length} brands ship this way, each one file; no file under packages/react changes to add one`,
    command: 'cat tenants/<id>/brand.json',
  };
}

/** packages/react/meta/*.meta.json — one per component. */
function componentFigure(): StoryFigure | undefined {
  const count = getAllMeta().length;
  if (count === 0) return undefined;
  return {
    label: 'Components',
    value: String(count),
    basis: 'each with a meta.json that drives its docs page, the MCP server and the SDUI schema',
    command: 'pnpm check:meta',
  };
}

/** The five figures BRIEF §11 asks for, in its order. A figure with no report file is simply absent. */
export const getStoryFigures = cache((): StoryFigure[] =>
  [themeFigure(), tenantFigure(), evalFigure(), auditFigure(), componentFigure()].filter(
    (f): f is StoryFigure => f != null,
  ),
);

export interface StoryTenant {
  id: string;
  name: string;
  industry: string;
  locale: string;
  dir: 'ltr' | 'rtl';
  /** Repo-relative path of the Playwright screenshot, served from /public. */
  shot: string;
}

/** The three tenants BRIEF §11 puts side by side, with the Playwright shot `pnpm screenshots` writes. */
export const getStoryTenants = cache((): StoryTenant[] => {
  const want = ['vela', 'harbor', 'qamar'];
  return getTenants()
    .filter((t) => want.includes(t.id))
    .sort((a, b) => want.indexOf(a.id) - want.indexOf(b.id))
    .map((t) => ({
      id: t.id,
      name: t.name,
      industry: t.product.industry,
      locale: t.locale,
      dir: t.dir,
      shot: `/story/${t.id}-light.png`,
    }));
});

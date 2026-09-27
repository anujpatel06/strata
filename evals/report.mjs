#!/usr/bin/env node
/**
 * Turns the scored runs of an iteration into evals/results.md, evals/results.json and evals/results.svg.
 *
 *   node evals/report.mjs [--iteration 1]
 *
 * Every number is reported per model and never pooled across models (ADR-018). Rates and scores are floored, never
 * rounded up. Failures are listed, not hidden: a run the agent didn't finish counts as a run.
 */
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { CACHE, CONDITIONS, EVALS, RUNS, flag, floor, median, readJson } from './lib/common.mjs';

const iteration = String(flag('iteration', 1));
const root = path.join(RUNS, `iter-${iteration}`);

function collect(dir) {
  if (!existsSync(dir)) return [];
  if (existsSync(path.join(dir, 'result.json'))) {
    const score = readJson(path.join(dir, 'score.json'));
    return score ? [{ dir, result: readJson(path.join(dir, 'result.json')), score }] : [];
  }
  return readdirSync(dir).flatMap((f) => (statSync(path.join(dir, f)).isDirectory() ? collect(path.join(dir, f)) : []));
}

const runs = collect(root);
if (runs.length === 0) throw new Error(`No scored runs under ${root}. Run score.mjs first.`);

const pct = (n, d) => (d === 0 ? null : floor((100 * n) / d, 1));
const num = (v) => (v === null || v === undefined || Number.isNaN(v) ? '—' : String(v));

function summarise(set) {
  const n = set.length;
  const built = set.filter((r) => r.score.built);
  const audits = built.map((r) => r.score.audit?.score).filter((v) => typeof v === 'number');
  const axe = built.map((r) => r.score.axeNodes).filter((v) => typeof v === 'number');
  const byRule = {};
  for (const r of built) for (const [rule, c] of Object.entries(r.score.audit?.byRule ?? {})) byRule[rule] = (byRule[rule] ?? 0) + c;
  return {
    runs: n,
    agentFailed: set.filter((r) => r.score.agentFailed).length,
    contaminated: set.filter((r) => r.score.contaminated).length,
    importsStrata: set.filter((r) => r.score.importsStrata).length,
    readPackages: set.every((r) => r.score.readPackages === null) ? null : set.filter((r) => r.score.readPackages).length,
    built: built.length,
    // Every rate below is out of ALL runs, so a screen that was never built counts against the condition.
    rendersPercent: pct(set.filter((r) => r.score.renders).length, n),
    typecheckPassPercent: pct(set.filter((r) => r.score.typeErrors === 0).length, n),
    onSystemPercent: pct(set.filter((r) => r.score.onSystem).length, n),
    axeCleanPercent: pct(set.filter((r) => r.score.axeNodes === 0).length, n),
    noOverflowPercent: pct(set.filter((r) => r.score.overflowPx === 0).length, n),
    noBrandNamesPercent: pct(set.filter((r) => r.score.built && r.score.brandNames === 0).length, n),
    // Medians are over the screens that exist: there is no audit score for a screen that wasn't built.
    auditMedian: audits.length ? floor(median(audits), 1) : null,
    auditMin: audits.length ? floor(Math.min(...audits), 1) : null,
    auditMax: audits.length ? floor(Math.max(...audits), 1) : null,
    axeMeanPerScreen: axe.length ? floor(axe.reduce((a, b) => a + b, 0) / axe.length, 2) : null,
    findingsByRule: byRule,
    turnsMedian: median(set.map((r) => r.result.cli?.turns).filter((v) => typeof v === 'number')),
    costUsdMedian: floor(median(set.map((r) => r.result.cli?.costUsd).filter((v) => typeof v === 'number')), 3),
    wallSecondsMedian: Math.round(median(set.map((r) => r.result.wallMs)) / 1000),
    outputTokensMedian: median(set.map((r) => r.result.cli?.usage?.output_tokens).filter((v) => typeof v === 'number')),
  };
}

const models = [...new Set(runs.map((r) => r.result.model))].sort();
const conditions = Object.keys(CONDITIONS).filter((c) => runs.some((r) => r.result.condition === c));
const tags = [...new Set(runs.flatMap((r) => r.result.tags))].sort();
const of = (model, condition, tag) => runs.filter((r) => r.result.model === model && r.result.condition === condition && (!tag || r.result.tags.includes(tag)));

const data = { iteration, generatedAt: new Date().toISOString(), source: readJson(path.join(CACHE, 'source.json')), models: {} };
for (const model of models) {
  data.models[model] = { overall: {}, byTag: {}, spread: {} };
  for (const c of conditions) {
    data.models[model].overall[c] = summarise(of(model, c));
    for (const t of tags) (data.models[model].byTag[t] ??= {})[c] = summarise(of(model, c, t));
    // Spread between repeats of the same prompt: how much one run can be trusted.
    const ranges = [];
    const prompts = [...new Set(of(model, c).map((r) => r.result.prompt))];
    let flips = 0;
    for (const p of prompts) {
      const reps = of(model, c).filter((r) => r.result.prompt === p);
      const scores = reps.map((r) => r.score.audit?.score).filter((v) => typeof v === 'number');
      if (scores.length > 1) ranges.push(Math.max(...scores) - Math.min(...scores));
      if (new Set(reps.map((r) => r.score.onSystem)).size > 1) flips++;
    }
    data.models[model].spread[c] = { prompts: prompts.length, auditRangeMedian: ranges.length ? floor(median(ranges), 1) : null, auditRangeMax: ranges.length ? floor(Math.max(...ranges), 1) : null, onSystemDisagreed: flips };
  }
}
writeFileSync(path.join(EVALS, 'results.json'), JSON.stringify(data, null, 2) + '\n');

/* ---- chart: small multiples, one measure per panel, one axis each --------------------------------------- */
// Colours are the house theme's chart series 1 and 2 (packages/tokens/dist/house/tokens.css), which the theme
// engine solves and the dataviz validator passes. Text uses text tokens, never the series colour.
const INK = '#1f1f21';
const SUBTLE = '#5a5a5d';
const GRID = '#dfdfe2';
const SURFACE = '#fdfdff';
const SERIES = ['#3280dc', '#ce5604', '#3280dc', '#ce5604'];
const PANELS = [
  { key: 'onSystemPercent', title: 'Runs fully on-system', unit: '%', max: 100 },
  { key: 'axeCleanPercent', title: 'Runs with no axe violations', unit: '%', max: 100 },
  { key: 'typecheckPassPercent', title: 'Runs that pass typecheck', unit: '%', max: 100 },
];
function chart(model) {
  const W = 760;
  const panelW = 220;
  const gap = 30;
  const top = 86;
  const plotH = 200;
  const H = top + plotH + 58;
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
  const out = [`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-labelledby="t d" font-family="ui-sans-serif, system-ui, sans-serif">`];
  out.push(`<title id="t">Agent eval, iteration ${iteration}: ${esc(model)}</title>`);
  out.push(`<desc id="d">${PANELS.map((p) => `${p.title}: ${conditions.map((c) => `${CONDITIONS[c].label} ${num(data.models[model].overall[c][p.key])}${p.unit}`).join(', ')}`).join('. ')}.</desc>`);
  out.push(`<rect width="${W}" height="${H}" fill="${SURFACE}"/>`);
  out.push(`<text x="24" y="32" font-size="15" font-weight="600" fill="${INK}">Agent eval, iteration ${iteration} · ${esc(model)}</text>`);
  // Legend: always present for two or more series; a swatch beside text in ink.
  conditions.forEach((c, i) => {
    const x = 24 + i * 170;
    out.push(`<rect x="${x}" y="46" width="10" height="10" rx="2" fill="${SERIES[i]}"/>`);
    out.push(`<text x="${x + 16}" y="55" font-size="12" fill="${SUBTLE}">${esc(CONDITIONS[c].label)} (${data.models[model].overall[c].runs} runs)</text>`);
  });
  PANELS.forEach((p, pi) => {
    const x0 = 24 + pi * (panelW + gap);
    const base = top + plotH;
    out.push(`<text x="${x0}" y="${top - 8}" font-size="12" font-weight="600" fill="${INK}">${esc(p.title)}</text>`);
    for (const tick of [0, 50, 100]) {
      const y = base - (tick / p.max) * (plotH - 24);
      out.push(`<line x1="${x0}" x2="${x0 + panelW}" y1="${y}" y2="${y}" stroke="${GRID}" stroke-width="1"/>`);
      out.push(`<text x="${x0 + panelW}" y="${y - 4}" font-size="10" text-anchor="end" fill="${SUBTLE}">${tick}${p.unit}</text>`);
    }
    const barW = 44;
    const step = 64;
    const startX = x0 + 28;
    conditions.forEach((c, i) => {
      const v = data.models[model].overall[c][p.key];
      const x = startX + i * step;
      if (typeof v === 'number') {
        const h = Math.max(1, (v / p.max) * (plotH - 24));
        const r = Math.min(4, h);
        // Rounded at the data end, square on the baseline.
        out.push(`<path d="M${x},${base} V${base - h + r} Q${x},${base - h} ${x + r},${base - h} H${x + barW - r} Q${x + barW},${base - h} ${x + barW},${base - h + r} V${base} Z" fill="${SERIES[i]}"/>`);
        out.push(`<text x="${x + barW / 2}" y="${base - h - 6}" font-size="12" font-weight="600" text-anchor="middle" fill="${INK}">${v}${p.unit}</text>`);
      } else {
        out.push(`<text x="${x + barW / 2}" y="${base - 6}" font-size="12" text-anchor="middle" fill="${SUBTLE}">no data</text>`);
      }
      out.push(`<text x="${x + barW / 2}" y="${base + 16}" font-size="11" text-anchor="middle" fill="${SUBTLE}">${esc(CONDITIONS[c].label.replace(' + AGENTS.md', '').replace(' only', ''))}</text>`);
    });
    out.push(`<line x1="${x0}" x2="${x0 + panelW}" y1="${base}" y2="${base}" stroke="${SUBTLE}" stroke-width="1"/>`);
  });
  out.push(`<text x="24" y="${H - 12}" font-size="10" fill="${SUBTLE}">Share of all runs, floored. Source: evals/results.json.</text>`);
  out.push('</svg>');
  return out.join('\n');
}
for (const model of models) writeFileSync(path.join(EVALS, models.length === 1 ? 'results.svg' : `results.${model}.svg`), chart(model) + '\n');

/* ---- markdown ------------------------------------------------------------------------------------------- */
const ROWS = [
  ['Runs', 'runs'],
  ['Runs the agent didn’t finish (error or timeout)', 'agentFailed'],
  ['Runs that read outside their workspace (kept in the numbers, listed below)', 'contaminated'],
  ['Screens built', 'built'],
  ['Screens that import from @strata/react', 'importsStrata'],
  ['Runs that read the installed packages', 'readPackages'],
  ['Median audit score (0–100)', 'auditMedian'],
  ['Lowest / highest audit score', (s) => `${num(s.auditMin)} / ${num(s.auditMax)}`],
  ['Fully on-system, % of runs', 'onSystemPercent'],
  ['Renders in every view, % of runs', 'rendersPercent'],
  ['Passes typecheck, % of runs', 'typecheckPassPercent'],
  ['No axe violations, % of runs', 'axeCleanPercent'],
  ['Axe violation nodes per built screen, mean', 'axeMeanPerScreen'],
  ['No horizontal scroll at 390px, % of runs', 'noOverflowPercent'],
  ['No brand names in code, % of runs', 'noBrandNamesPercent'],
  ['Median turns', 'turnsMedian'],
  ['Median output tokens', 'outputTokensMedian'],
  ['Median cost per run, USD (as the CLI reports it)', 'costUsdMedian'],
  ['Median wall time, seconds', 'wallSecondsMedian'],
];
const table = (getSummary) => {
  const head = `| Measure | ${conditions.map((c) => CONDITIONS[c].label).join(' | ')} |\n|---|${conditions.map(() => '---').join('|')}|`;
  return [head, ...ROWS.map(([label, key]) => `| ${label} | ${conditions.map((c) => (typeof key === 'function' ? key(getSummary(c)) : num(getSummary(c)[key]))).join(' | ')} |`)].join('\n');
};

const src = data.source ?? {};
const md = [];
md.push('# Agent eval results', '');
md.push(`Generated by \`node evals/report.mjs --iteration ${iteration}\` from the scored runs in \`evals/runs/iter-${iteration}/\`. Do not edit by hand. The method, and how to reproduce it, is in [README.md](README.md).`, '');
md.push(`- **Iteration:** ${iteration}`, `- **Runs scored:** ${runs.length}`, `- **Models:** ${models.map((m) => `\`${m}\``).join(', ')}`, `- **Conditions:** ${conditions.map((c) => CONDITIONS[c].label).join(', ')}`);
md.push(`- **Packages packed from:** \`${(src.commit ?? 'unknown').slice(0, 7)}\`${src.clean ? ', a fresh checkout with nothing uncommitted' : src.dirty?.length ? `, the working tree, with ${src.dirty.length} uncommitted change(s) in the packages. That makes this run harder to reproduce exactly.` : ', the working tree, clean'}`, '');
md.push('Rates are out of all runs, so a screen that was never built counts against its condition. Medians of the audit score are over the screens that were built. Scores and rates are floored, never rounded up.', '');
for (const model of models) {
  md.push(`## ${model}`, '');
  md.push(`![Agent eval chart for ${model}](${models.length === 1 ? 'results.svg' : `results.${model}.svg`})`, '');
  md.push(table((c) => data.models[model].overall[c]), '');
  md.push('### By tag', '');
  for (const t of tags) md.push(`**${t}**`, '', table((c) => data.models[model].byTag[t][c]), '');
  md.push('### How much repeats disagree', '', 'The same prompt, condition and model, run more than once. A large range means a single run says little.', '');
  md.push(`| Measure | ${conditions.map((c) => CONDITIONS[c].label).join(' | ')} |`, `|---|${conditions.map(() => '---').join('|')}|`);
  md.push(`| Prompts | ${conditions.map((c) => data.models[model].spread[c].prompts).join(' | ')} |`);
  md.push(`| Audit score range between repeats, median | ${conditions.map((c) => num(data.models[model].spread[c].auditRangeMedian)).join(' | ')} |`);
  md.push(`| Audit score range between repeats, largest | ${conditions.map((c) => num(data.models[model].spread[c].auditRangeMax)).join(' | ')} |`);
  md.push(`| Prompts where repeats disagreed on "fully on-system" | ${conditions.map((c) => data.models[model].spread[c].onSystemDisagreed).join(' | ')} |`, '');
  md.push('### Findings by rule', '', `| Rule | ${conditions.map((c) => CONDITIONS[c].label).join(' | ')} |`, `|---|${conditions.map(() => '---').join('|')}|`);
  const rules = [...new Set(conditions.flatMap((c) => Object.keys(data.models[model].overall[c].findingsByRule)))].sort();
  for (const r of rules) md.push(`| \`${r}\` | ${conditions.map((c) => data.models[model].overall[c].findingsByRule[r] ?? 0).join(' | ')} |`);
  if (rules.length === 0) md.push(`| none | ${conditions.map(() => 0).join(' | ')} |`);
  md.push('');
}
const notesFile = path.join(root, 'NOTES.md');
if (existsSync(notesFile)) md.push('## Notes on this iteration', '', `From \`runs/iter-${iteration}/NOTES.md\`, written by hand.`, '', readFileSync(notesFile, 'utf8').replace(/^# .*\n+/, '').trim(), '');
md.push('## Runs that failed or leaked', '');
const leaked = runs.filter((r) => r.score.contaminated);
md.push(leaked.length === 0 ? 'No run read a file outside its workspace and the installed packages.' : `${leaked.length} run(s) read outside their workspace and the installed packages:`, '');
for (const r of leaked) md.push(`- ${r.result.prompt} · ${CONDITIONS[r.result.condition].label} · #${r.result.repeat}: ${r.score.leaks.map((p) => `\`${p.replace(/^.*\/(\.claude|T)\//, '…/$1/')}\``).join(', ')}`);
if (leaked.length) md.push('');
const failed = runs.filter((r) => r.score.agentFailed || !r.score.built || !r.score.renders);
if (failed.length === 0) md.push('None.', '');
else {
  md.push('| Prompt | Condition | Model | Repeat | What happened |', '|---|---|---|---|---|');
  for (const r of failed) {
    const why = r.score.agentFailed ? (r.result.timedOut ? 'timed out' : `agent error (${r.result.cli?.subtype ?? `exit ${r.result.exitCode}`})`) : !r.score.built ? 'no screen written' : !r.score.builds ? 'the app didn’t build' : 'page error or empty screen';
    md.push(`| ${r.result.prompt} | ${CONDITIONS[r.result.condition].label} | \`${r.result.model}\` | ${r.result.repeat} | ${why} |`);
  }
  md.push('');
}
writeFileSync(path.join(EVALS, 'results.md'), md.join('\n'));
console.log(`results.md, results.json and ${models.length === 1 ? 'results.svg' : 'one chart per model'} written for ${runs.length} run(s).`);

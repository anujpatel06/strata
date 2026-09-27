/**
 * The HTML report: one file, no requests. It is styled with Strata's own tokens: the house tenant's CSS
 * variables from the theme engine are inlined, and the page's CSS uses tokens and logical properties only
 * (test/report.test.ts runs the auditor on it). Light and dark follow the reader's system through the
 * tokens' data-strata-scheme="auto".
 */
import { toCSS } from '@strata/theme-engine';
import { RULES } from '../collector';
import { WEIGHTS } from '../score';
import { loadTheme } from '../tokens';
import type { AuditResult, Finding, Severity } from '../types';
import { byFile, byRule, totals } from './summary';

export interface HtmlOptions {
  /** What was audited, as typed, e.g. "apps/docs". */
  title: string;
  /** The command that made the report. */
  command?: string;
  /** Shown as written. Left out when absent, so the same input gives the same file. */
  generatedAt?: string;
  minScore?: number;
  tenant?: string;
}

const esc = (s: string): string =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

/** The page's own CSS. Tokens only, logical properties only. */
export const REPORT_CSS = `
*, *::before, *::after { box-sizing: border-box; }
html { -webkit-text-size-adjust: 100%; text-size-adjust: 100%; }
body {
  margin: 0;
  background: var(--strata-color-surface-canvas);
  color: var(--strata-color-text-default);
  font-family: var(--strata-font-body);
  font-size: var(--strata-font-size-md);
  letter-spacing: var(--strata-font-tracking-md);
  line-height: var(--strata-line-height-normal);
}
main {
  max-inline-size: calc(var(--strata-space-16) * 18);
  margin-inline: auto;
  padding-block: var(--strata-space-10) var(--strata-space-16);
  padding-inline: var(--strata-space-6);
  display: grid;
  gap: var(--strata-section-gap);
}
h1, h2, h3, p { margin: 0; }
h1, h2 {
  font-family: var(--strata-font-heading);
  font-weight: var(--strata-font-weight-semibold);
  line-height: var(--strata-line-height-tight);
}
h1 { font-size: var(--strata-font-size-3xl); letter-spacing: var(--strata-font-tracking-3xl); overflow-wrap: anywhere; }
h2 { font-size: var(--strata-font-size-xl); letter-spacing: var(--strata-font-tracking-xl); }
code, .mono {
  font-family: var(--strata-font-mono);
  font-size: var(--strata-font-size-sm);
  letter-spacing: 0;
}
code { overflow-wrap: anywhere; }
.subtle { color: var(--strata-color-text-subtle); }
.eyebrow {
  color: var(--strata-color-text-subtle);
  font-size: var(--strata-font-size-xs);
  font-weight: var(--strata-font-weight-medium);
  letter-spacing: var(--strata-font-tracking-caps);
  text-transform: uppercase;
}
.head { display: grid; gap: var(--strata-space-2); }
.section { display: grid; gap: var(--strata-space-4); min-inline-size: 0; }
.card {
  background: var(--strata-color-surface-raised);
  border: 1px solid transparent;
  border-radius: var(--strata-radius-container);
  box-shadow: 0 0 0 var(--strata-hairline) var(--strata-color-border-subtle), var(--strata-shadow-raised);
  min-inline-size: 0;
}
.score {
  padding: var(--strata-card-inset);
  display: grid;
  gap: var(--strata-space-4);
}
.score-value {
  font-family: var(--strata-font-heading);
  font-size: var(--strata-font-size-5xl);
  font-weight: var(--strata-font-weight-semibold);
  letter-spacing: var(--strata-font-tracking-5xl);
  line-height: var(--strata-line-height-tight);
  font-variant-numeric: tabular-nums;
}
.score-value small {
  color: var(--strata-color-text-subtle);
  font-size: var(--strata-font-size-xl);
  font-weight: var(--strata-font-weight-regular);
  letter-spacing: var(--strata-font-tracking-xl);
}
.bar {
  block-size: var(--strata-space-2);
  border-radius: var(--strata-radius-pill);
  background: var(--strata-color-surface-sunken);
  box-shadow: inset 0 0 0 var(--strata-hairline) var(--strata-color-border-default);
  overflow: hidden;
}
.bar span { display: block; block-size: 100%; background: var(--strata-color-text-default); border-radius: inherit; }
.gate { display: flex; flex-wrap: wrap; align-items: center; gap: var(--strata-space-2); }
.stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(calc(var(--strata-space-16) * 2.25), 1fr));
  gap: var(--strata-space-3);
  margin: 0;
}
.stat { padding: var(--strata-space-4) var(--strata-space-5); display: grid; gap: var(--strata-space-1); }
.stat dt { color: var(--strata-color-text-subtle); font-size: var(--strata-font-size-sm); letter-spacing: var(--strata-font-tracking-sm); }
.stat dd {
  margin: 0;
  font-size: var(--strata-font-size-2xl);
  font-weight: var(--strata-font-weight-semibold);
  letter-spacing: var(--strata-font-tracking-2xl);
  line-height: var(--strata-line-height-tight);
  font-variant-numeric: tabular-nums;
}
.stat dd small {
  display: block;
  color: var(--strata-color-text-subtle);
  font-size: var(--strata-font-size-xs);
  font-weight: var(--strata-font-weight-regular);
  letter-spacing: var(--strata-font-tracking-xs);
  line-height: var(--strata-line-height-normal);
}
table { inline-size: 100%; border-collapse: collapse; }
table.findings { table-layout: fixed; }
.w-line { inline-size: calc(var(--strata-space-16) * 1.5); }
.w-severity { inline-size: calc(var(--strata-space-16) * 2); }
.w-rule { inline-size: calc(var(--strata-space-16) * 3); }
.w-finding { inline-size: 30%; }
td code:not(.snippet), th code { overflow-wrap: normal; white-space: nowrap; }
caption { text-align: start; padding: var(--strata-space-4) var(--strata-space-5) var(--strata-space-2); color: var(--strata-color-text-subtle); font-size: var(--strata-font-size-sm); }
th, td {
  padding: var(--strata-space-3) var(--strata-space-4);
  text-align: start;
  vertical-align: top;
  box-shadow: inset 0 var(--strata-hairline) 0 var(--strata-color-border-subtle);
}
th:first-child, td:first-child { padding-inline-start: var(--strata-space-5); }
th:last-child, td:last-child { padding-inline-end: var(--strata-space-5); }
thead th {
  color: var(--strata-color-text-subtle);
  font-size: var(--strata-font-size-sm);
  font-weight: var(--strata-font-weight-medium);
  letter-spacing: var(--strata-font-tracking-sm);
  white-space: nowrap;
  box-shadow: none;
}
tbody th { font-weight: var(--strata-font-weight-medium); }
.num { text-align: end; font-variant-numeric: tabular-nums; white-space: nowrap; }
.rule-name { display: grid; gap: calc(var(--strata-space-1) * 0.5); }
.rule-name span { color: var(--strata-color-text-subtle); font-size: var(--strata-font-size-sm); font-weight: var(--strata-font-weight-regular); }
.badge {
  display: inline-flex;
  align-items: center;
  gap: var(--strata-space-1);
  padding-block: calc(var(--strata-space-1) * 0.5);
  padding-inline: var(--strata-space-2);
  border-radius: var(--strata-radius-pill);
  font-size: var(--strata-font-size-xs);
  font-weight: var(--strata-font-weight-medium);
  letter-spacing: var(--strata-font-tracking-xs);
  white-space: nowrap;
}
.badge svg { inline-size: 1em; block-size: 1em; flex: none; }
.badge.error { background: var(--strata-color-feedback-danger-bg); color: var(--strata-color-feedback-danger-fg); }
.badge.warning { background: var(--strata-color-feedback-warning-bg); color: var(--strata-color-feedback-warning-fg); }
.badge.safe { background: var(--strata-color-feedback-success-bg); color: var(--strata-color-feedback-success-fg); }
.badge.suggest { background: var(--strata-color-surface-sunken); color: var(--strata-color-text-subtle); }
.badge.info { background: var(--strata-color-feedback-info-bg); color: var(--strata-color-feedback-info-fg); }
.formula { padding: var(--strata-card-inset); display: grid; gap: var(--strata-space-3); }
.formula pre {
  margin: 0;
  padding: var(--strata-space-4);
  border-radius: var(--strata-radius-field);
  background: var(--strata-color-surface-sunken);
  font-family: var(--strata-font-mono);
  font-size: var(--strata-font-size-sm);
  overflow: auto;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}
.files { display: grid; gap: var(--strata-space-3); }
details > summary {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--strata-space-2) var(--strata-space-3);
  padding: var(--strata-space-4) var(--strata-space-5);
  min-block-size: var(--strata-control-height);
  border-radius: inherit;
  cursor: pointer;
  list-style: none;
}
details > summary::-webkit-details-marker { display: none; }
details > summary::before {
  content: '';
  inline-size: var(--strata-space-2);
  block-size: var(--strata-space-2);
  border-inline-end: 2px solid var(--strata-color-text-subtle);
  border-block-end: 2px solid var(--strata-color-text-subtle);
  rotate: -45deg;
  flex: none;
}
details > summary:dir(rtl)::before { rotate: 135deg; }
details[open] > summary::before { rotate: 45deg; }
details > summary:focus-visible, .scroll:focus-visible {
  outline: 2px solid var(--strata-color-focus-ring);
  outline-offset: 2px;
}
summary .path { flex: 1 1 calc(var(--strata-space-16) * 3); min-inline-size: 0; overflow-wrap: break-word; font-weight: var(--strata-font-weight-medium); }
summary .counts { display: flex; flex-wrap: wrap; gap: var(--strata-space-2); }
.snippet {
  display: block;
  margin-block-start: var(--strata-space-2);
  padding: var(--strata-space-1) var(--strata-space-2);
  border-radius: var(--strata-radius-badge);
  background: var(--strata-color-surface-sunken);
  color: var(--strata-color-text-default);
  inline-size: fit-content;
  max-inline-size: 100%;
}
.fix { display: grid; gap: var(--strata-space-2); justify-items: start; }
.where { white-space: nowrap; font-variant-numeric: tabular-nums; }
.notes { padding: var(--strata-card-inset); display: grid; gap: var(--strata-space-2); }
.notes ul { margin: 0; padding-inline-start: var(--strata-space-5); display: grid; gap: var(--strata-space-1); }
.empty { padding: var(--strata-card-inset); }
.hidden {
  position: absolute;
  inline-size: 1px;
  block-size: 1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}
footer { color: var(--strata-color-text-subtle); font-size: var(--strata-font-size-sm); display: grid; gap: var(--strata-space-1); }

@media (max-width: 760px) {
  main { padding-inline: var(--strata-space-4); padding-block-start: var(--strata-space-6); }
  h1 { font-size: var(--strata-font-size-2xl); letter-spacing: var(--strata-font-tracking-2xl); }
  .score, .formula, .notes, .empty { padding: var(--strata-space-5); }
  /* Tables become one block per row. The roles in the markup keep them tables for screen readers. */
  table, tbody, tr, th, td, caption { display: block; }
  thead {
    position: absolute;
    inline-size: 1px;
    block-size: 1px;
    overflow: hidden;
    clip-path: inset(50%);
  }
  tr {
    padding: var(--strata-space-4) var(--strata-space-5);
    display: grid;
    gap: var(--strata-space-3);
    box-shadow: inset 0 var(--strata-hairline) 0 var(--strata-color-border-subtle);
  }
  tbody th, tbody td, th:first-child, td:first-child, th:last-child, td:last-child { padding: 0; box-shadow: none; }
  td[data-label] { display: grid; grid-template-columns: calc(var(--strata-space-16) * 1.5) minmax(0, 1fr); gap: var(--strata-space-3); align-items: start; justify-items: start; }
  td[data-label]::before {
    content: attr(data-label);
    color: var(--strata-color-text-subtle);
    font-size: var(--strata-font-size-sm);
    letter-spacing: var(--strata-font-tracking-sm);
  }
  .num { text-align: start; }
  td.stack { grid-template-columns: minmax(0, 1fr); gap: var(--strata-space-1); }
}
@media print {
  details > summary::before { display: none; }
  .card { box-shadow: 0 0 0 var(--strata-hairline) var(--strata-color-border-default); }
}
`;

const ICONS: Readonly<Record<string, string>> = {
  // Each status has its own shape, so it is never told by colour alone.
  error: '<svg viewBox="0 0 16 16" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M5.2 1.5h5.6l3.7 3.7v5.6l-3.7 3.7H5.2l-3.7-3.7V5.2z" stroke-linejoin="round"/><path d="M6 6l4 4M10 6l-4 4"/></svg>',
  warning: '<svg viewBox="0 0 16 16" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M8 2.2 14.3 13.5H1.7z"/><path d="M8 6.5v3.2M8 11.6v.1"/></svg>',
  safe: '<svg viewBox="0 0 16 16" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="8" r="6.2"/><path d="m5.4 8.2 1.8 1.8 3.4-3.8"/></svg>',
  suggest: '<svg viewBox="0 0 16 16" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11.5 10.8 3.7l1.5 1.5L4.5 13H3z"/></svg>',
  info: '<svg viewBox="0 0 16 16" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><circle cx="8" cy="8" r="6.2"/><path d="M8 7.4v3.4M8 5.2v.1"/></svg>',
};

const badge = (kind: keyof typeof ICONS, label: string): string => `<span class="badge ${kind}">${ICONS[kind]}${esc(label)}</span>`;
const severityBadge = (s: Severity): string => badge(s, s === 'error' ? 'Error' : 'Warning');
const plural = (n: number, one: string, many = one + 's'): string => `${n.toLocaleString('en')} ${n === 1 ? one : many}`;
const n = (x: number): string => x.toLocaleString('en');

function findingRow(f: Finding): string {
  return [
    '<tr role="row">',
    `<th role="rowheader" scope="row" class="where mono"><span class="hidden">Line </span>${f.line}:${f.column}</th>`,
    `<td role="cell" data-label="Severity">${severityBadge(f.severity)}</td>`,
    `<td role="cell" data-label="Rule"><code>${esc(f.rule)}</code></td>`,
    `<td role="cell" class="stack" data-label="Finding"><div>${esc(f.message)}${f.snippet ? `<code class="snippet">${esc(f.snippet)}</code>` : ''}</div></td>`,
    `<td role="cell" class="stack" data-label="Fix"><div class="fix">${f.fix.safe ? badge('safe', 'Safe fix') : badge('suggest', 'Suggestion')}<span>${esc(f.fix.description)}</span></div></td>`,
    '</tr>',
  ].join('');
}

function fileBlock(file: string, findings: Finding[], open: boolean): string {
  const errors = findings.filter((f) => f.severity === 'error').length;
  const warnings = findings.length - errors;
  const counts = [errors > 0 ? badge('error', plural(errors, 'error')) : '', warnings > 0 ? badge('warning', plural(warnings, 'warning')) : ''].join('');
  return [
    `<details class="card"${open ? ' open' : ''}>`,
    `<summary><span class="path mono">${esc(file).replace(/\//g, '/<wbr>')}</span><span class="counts">${counts}</span></summary>`,
    '<table role="table" class="findings">',
    `<caption class="hidden">Findings in ${esc(file)}</caption>`,
    '<thead role="rowgroup"><tr role="row"><th role="columnheader" scope="col" class="w-line">Line</th><th role="columnheader" scope="col" class="w-severity">Severity</th><th role="columnheader" scope="col" class="w-rule">Rule</th><th role="columnheader" scope="col" class="w-finding">Finding</th><th role="columnheader" scope="col">Fix</th></tr></thead>',
    `<tbody role="rowgroup">${findings.map(findingRow).join('')}</tbody>`,
    '</table>',
    '</details>',
  ].join('');
}

export function toHtml(result: AuditResult, options: HtmlOptions): string {
  const theme = loadTheme('house');
  const tokensCss = toCSS(theme, { selector: ':root' });
  const t = totals(result);
  const rows = byRule(result);
  const files = byFile(result.findings);
  const score = result.score.toFixed(1);

  const failed = WEIGHTS.error * t.errors + WEIGHTS.warning * t.warnings;
  const total = rows.reduce((sum, r) => sum + WEIGHTS[r.severity] * r.opportunities, 0);
  const errorPlaces = rows.filter((r) => r.severity === 'error').reduce((s, r) => s + r.opportunities, 0);
  const warningPlaces = rows.filter((r) => r.severity === 'warning').reduce((s, r) => s + r.opportunities, 0);

  let gate = '';
  if (options.minScore !== undefined) {
    const ok = result.score >= options.minScore;
    gate = `<p class="gate">${ok ? badge('safe', 'Meets the minimum') : badge('error', 'Below the minimum')}<span>The minimum score is ${esc(String(options.minScore))}.</span></p>`;
  }

  const ruleRows = rows
    .map((r) =>
      [
        '<tr role="row">',
        `<th role="rowheader" scope="row"><div class="rule-name"><code>${esc(r.rule)}</code><span>${esc(RULES[r.rule].summary)}</span></div></th>`,
        `<td role="cell" data-label="Severity">${severityBadge(r.severity)}</td>`,
        `<td role="cell" class="num" data-label="Findings">${n(r.findings)}</td>`,
        `<td role="cell" class="num" data-label="Places looked at">${n(r.opportunities)}</td>`,
        `<td role="cell" class="num" data-label="Safe fixes">${n(r.safeFixes)}</td>`,
        '</tr>',
      ].join(''),
    )
    .join('');

  const openAll = files.length <= 12;
  const findingsSection = files.length === 0
    ? `<div class="card empty"><p class="gate">${badge('safe', 'No findings')}<span>Nothing in ${plural(result.stats.files, 'file')} broke a rule.</span></p></div>`
    : `<div class="files">${files.map(([file, list]) => fileBlock(file, list, openAll)).join('')}</div>`;

  const notes = (result.notes ?? []).length > 0
    ? `<section class="section" aria-labelledby="notes"><h2 id="notes">Notes</h2><div class="card notes"><ul>${result.notes!.map((x) => `<li>${esc(x)}</li>`).join('')}</ul></div></section>`
    : '';

  return `<!doctype html>
<html lang="en" dir="ltr" data-strata-scheme="auto">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light dark">
<title>Drift audit: ${esc(options.title)}</title>
<style>
${tokensCss}
</style>
<style>${REPORT_CSS}</style>
</head>
<body>
<main>
<header class="head">
<p class="eyebrow">Strata drift audit</p>
<h1>${esc(options.title)}</h1>
<p class="subtle">${[
    options.generatedAt ? `Made ${esc(options.generatedAt)}.` : '',
    `Raw values are matched against the ${esc(options.tenant ?? 'house')} tenant.`,
  ].filter(Boolean).join(' ')}</p>
${options.command ? `<p><code>${esc(options.command)}</code></p>` : ''}
</header>

<section class="section" aria-labelledby="score">
<h2 id="score" class="hidden">Score</h2>
<div class="card score">
<p class="score-value">${score} <small>out of 100</small></p>
<div class="bar" aria-hidden="true"><span style="inline-size: ${Math.max(0, Math.min(100, result.score))}%"></span></div>
${gate}
<p class="subtle">${plural(result.findings.length, 'finding')} in ${plural(result.stats.opportunities, 'place')} looked at. The score is never rounded up.</p>
</div>
<dl class="stats">
<div class="card stat"><dt>Files</dt><dd>${n(result.stats.files)}<small>${n(result.stats.lines)} lines</small></dd></div>
<div class="card stat"><dt>Errors</dt><dd>${n(t.errors)}<small>weight ${WEIGHTS.error} each</small></dd></div>
<div class="card stat"><dt>Warnings</dt><dd>${n(t.warnings)}<small>weight ${WEIGHTS.warning} each</small></dd></div>
<div class="card stat"><dt>Safe fixes</dt><dd>${n(t.safeFixes)}<small>applied by --fix</small></dd></div>
<div class="card stat"><dt>Silenced</dt><dd>${n(result.stats.suppressed ?? 0)}<small>by a comment with a reason</small></dd></div>
</dl>
</section>

<section class="section" aria-labelledby="rules">
<h2 id="rules">By rule</h2>
<div class="card">
<table role="table">
<caption class="hidden">Findings, places looked at and safe fixes for each rule</caption>
<thead role="rowgroup"><tr role="row"><th role="columnheader" scope="col">Rule</th><th role="columnheader" scope="col">Severity</th><th role="columnheader" scope="col" class="num">Findings</th><th role="columnheader" scope="col" class="num">Places looked at</th><th role="columnheader" scope="col" class="num">Safe fixes</th></tr></thead>
<tbody role="rowgroup">${ruleRows}</tbody>
</table>
</div>
</section>

<section class="section" aria-labelledby="formula">
<h2 id="formula">How the score is worked out</h2>
<div class="card formula">
<p>Findings are weighed against every place a rule looked at. An error weighs ${WEIGHTS.error} and a warning weighs ${WEIGHTS.warning}.</p>
<pre>failed = ${WEIGHTS.error} × ${n(t.errors)} errors + ${WEIGHTS.warning} × ${n(t.warnings)} warnings = ${n(failed)}
total  = ${WEIGHTS.error} × ${n(errorPlaces)} places for error rules + ${WEIGHTS.warning} × ${n(warningPlaces)} places for warning rules = ${n(total)}
score  = floor(1000 × (1 − failed ÷ total)) ÷ 10 = ${score}</pre>
</div>
</section>

<section class="section" aria-labelledby="findings">
<h2 id="findings">Findings by file</h2>
${findingsSection}
</section>
${notes}
<footer>
<p>Made by @strata/audit. A safe fix has one right answer and does not change behaviour. A suggestion needs a person to check it.</p>
<p>The accessible-name check reads one file at a time. It cannot see names that arrive through props.</p>
</footer>
</main>
</body>
</html>
`;
}

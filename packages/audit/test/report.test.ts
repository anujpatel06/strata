import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { auditSource } from '../src/index';
import type { AuditResult } from '../src/index';
import { REPORT_CSS, toHtml } from '../src/report/html';
import { toText } from '../src/report/text';

const cli = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../bin/cli.mjs');

const result = (): AuditResult => {
  const r = auditSource('.a {\n  color: #5a5a5d;\n  margin-left: 10px;\n  font-family: "<b>Arial</b>";\n}\n', { filename: 'a&b.css' });
  return { findings: r.findings, stats: r.stats, score: 12.3 };
};

describe('HTML report', () => {
  it('is styled with tokens and logical properties only: the auditor finds nothing in its CSS', () => {
    const r = auditSource(REPORT_CSS, { language: 'css' });
    expect(r.findings).toEqual([]);
    expect(r.stats.opportunities).toBeGreaterThan(100);
    expect(REPORT_CSS).not.toMatch(/prefers-color-scheme/);
  });

  it('is one file: no scripts, no links, no requests', () => {
    const html = toHtml(result(), { title: 'x' });
    expect(html).not.toMatch(/<script|<link|<img|@import|url\(/i);
    expect(html).toContain('--strata-color-surface-canvas');
    expect(html).toContain('data-strata-scheme="auto"');
    expect(html).toContain('[data-strata-scheme="dark"]');
  });

  it('escapes what it prints', () => {
    const html = toHtml(result(), { title: '<script>alert(1)</script>', command: 'a "b" <c>' });
    expect(html).not.toContain('<script>');
    expect(html).not.toContain('<b>Arial</b>');
    expect(html).toContain('&lt;b&gt;Arial&lt;/b&gt;');
    expect(html).toContain('a&amp;b.css');
  });

  it('uses table markup with headers, and says status in words', () => {
    const html = toHtml(result(), { title: 'x', minScore: 95 });
    expect(html).toMatch(/<caption/);
    expect(html).toMatch(/<th role="columnheader" scope="col"/);
    expect(html).toMatch(/<th role="rowheader" scope="row"/);
    expect(html).toContain('>Error</span>');
    expect(html).toContain('>Warning</span>');
    expect(html).toContain('>Safe fix</span>');
    expect(html).toContain('>Suggestion</span>');
    expect(html).toContain('Below the minimum');
    expect(html).toContain('12.3');
  });

  it('gives the same file for the same input', () => {
    expect(toHtml(result(), { title: 'x' })).toBe(toHtml(result(), { title: 'x' }));
  });
});

describe('text report', () => {
  it('groups by file, then sums by rule, then the score', () => {
    const text = toText(result());
    expect(text).toMatch(/^a&b\.css\n {2}2:10 +error +raw-color/);
    expect(text).toMatch(/raw-color +error +1 +1 +1/);
    expect(text).toMatch(/Score 12\.3 \/ 100\n$/);
  });
});

describe('CLI', () => {
  let dir: string;
  beforeAll(() => {
    dir = realpathSync(mkdtempSync(path.join(tmpdir(), 'strata-audit-cli-')));
    writeFileSync(path.join(dir, 'a.css'), '.a {\n  color: #5a5a5d;\n  margin-left: 10px;\n}\n');
    writeFileSync(path.join(dir, 'clean.css'), '.a { color: var(--strata-color-text-default); }\n');
  });
  afterAll(() => rmSync(dir, { recursive: true, force: true }));
  const run = (...args: string[]) => spawnSync('node', [cli, ...args], { cwd: dir, encoding: 'utf8' });

  it('--format json prints the AuditResult and nothing else on stdout', () => {
    const out = execFileSync('node', [cli, '.', '--format', 'json'], { cwd: dir, encoding: 'utf8' });
    const json = JSON.parse(out) as AuditResult;
    expect(json.findings.map((f) => f.rule).sort()).toEqual(['off-scale-space', 'physical-property', 'raw-color']);
    expect(json.stats.files).toBe(2);
    expect(typeof json.stats.opportunities).toBe('number');
    expect(typeof json.score).toBe('number');
  });

  it('--min-score exits 1 below the minimum and 0 at or above it', () => {
    expect(run('a.css', '--min-score', '95').status).toBe(1);
    expect(run('clean.css', '--min-score', '100').status).toBe(0);
    expect(run('a.css').status).toBe(0);
  });

  it('exits 2 for a bad option or no path', () => {
    expect(run().status).toBe(2);
    expect(run('a.css', '--format', 'xml').status).toBe(2);
    expect(run('a.css', '--nope').status).toBe(2);
    expect(run('missing-folder').status).toBe(2);
    expect(run('a.css', '--tenant', 'nobody').status).toBe(2);
  });

  it('--out writes the report to a file and keeps stdout empty', () => {
    const r = run('a.css', '--format=html', '--out', 'report/out.html');
    expect(r.status).toBe(0);
    expect(r.stdout).toBe('');
    expect(readFileSync(path.join(dir, 'report/out.html'), 'utf8')).toMatch(/^<!doctype html>/);
  });

  it('--fix writes the safe fixes, says what it changed and what it left, and a second run changes nothing', () => {
    const r = run('a.css', '--fix', '--format', 'json');
    expect(r.status).toBe(0);
    const after = '.a {\n  color: var(--strata-color-text-subtle);\n  margin-inline-start: 10px;\n}\n';
    expect(readFileSync(path.join(dir, 'a.css'), 'utf8')).toBe(after);
    expect(r.stderr).toMatch(/applied 2 safe fixes/);
    expect(r.stderr).toMatch(/left 1 finding/);
    expect((JSON.parse(r.stdout) as AuditResult).findings.map((f) => f.rule)).toEqual(['off-scale-space']);
    const again = run('a.css', '--fix');
    expect(again.stderr).toMatch(/no safe fixes/);
    expect(readFileSync(path.join(dir, 'a.css'), 'utf8')).toBe(after);
  });
});

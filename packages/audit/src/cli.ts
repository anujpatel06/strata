/**
 * syntara-audit <path…> [--format text|json|html] [--out <file>] [--fix] [--min-score <n>] [--tenant <id>]
 *                      [--scheme light|dark] [--ignore <glob>]…
 *
 * Exit codes: 0 done, 1 the score is below --min-score, 2 the command could not run.
 * With --format json, stdout holds the JSON and nothing else.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { applyFixesDetailed } from './fix';
import { auditPaths } from './index';
import { toHtml } from './report/html';
import { toText } from './report/text';
import type { Finding } from './types';

const USAGE = `Usage: syntara-audit <path…> [options]

  --format text|json|html   How to print the result. Default: text.
  --out <file>              Write the report to a file, not to stdout.
  --fix                     Write the safe fixes to the files, then report what is left.
  --min-score <n>           Exit 1 when the score is below n.
  --tenant <id>             Match raw values against this tenant's tokens. Default: house.
  --scheme light|dark       Default: light.
  --ignore <glob>           Skip matching paths. Can be given more than once.
  --help

Always skipped: node_modules, dist, build, .next*, *.generated.*, fixtures.
`;

class UsageError extends Error {}

interface Args {
  paths: string[];
  format: 'text' | 'json' | 'html';
  out?: string;
  fix: boolean;
  minScore?: number;
  tenant?: string;
  scheme?: 'light' | 'dark';
  ignore: string[];
  help: boolean;
}

function parse(argv: string[]): Args {
  const args: Args = { paths: [], format: 'text', fix: false, ignore: [], help: false };
  for (let i = 0; i < argv.length; i++) {
    let arg = argv[i]!;
    let inline: string | undefined;
    const eq = arg.startsWith('--') ? arg.indexOf('=') : -1;
    if (eq > -1) {
      inline = arg.slice(eq + 1);
      arg = arg.slice(0, eq);
    }
    const value = (): string => {
      const v = inline ?? argv[++i];
      if (v === undefined || v === '') throw new UsageError(`${arg} needs a value.`);
      return v;
    };
    switch (arg) {
      case '--': break;
      case '--help': case '-h': args.help = true; break;
      case '--fix': args.fix = true; break;
      case '--format': {
        const v = value();
        if (v !== 'text' && v !== 'json' && v !== 'html') throw new UsageError(`--format is text, json or html, not "${v}".`);
        args.format = v;
        break;
      }
      case '--out': args.out = value(); break;
      case '--min-score': {
        const v = Number(value());
        if (!Number.isFinite(v) || v < 0 || v > 100) throw new UsageError('--min-score is a number from 0 to 100.');
        args.minScore = v;
        break;
      }
      case '--tenant': args.tenant = value(); break;
      case '--scheme': {
        const v = value();
        if (v !== 'light' && v !== 'dark') throw new UsageError(`--scheme is light or dark, not "${v}".`);
        args.scheme = v;
        break;
      }
      case '--ignore': args.ignore.push(value()); break;
      default:
        if (arg.startsWith('-')) throw new UsageError(`Unknown option ${arg}.`);
        args.paths.push(arg);
    }
  }
  return args;
}

function fixFiles(findings: Finding[]): { log: string[]; applied: number } {
  const log: string[] = [];
  let applied = 0;
  const files = new Map<string, Finding[]>();
  for (const f of findings) files.set(f.file, [...(files.get(f.file) ?? []), f]);
  for (const [file, list] of files) {
    if (!list.some((f) => f.fix.safe)) continue;
    const path = resolve(file);
    const before = readFileSync(path, 'utf8');
    const result = applyFixesDetailed(before, list);
    if (result.code === before) continue;
    writeFileSync(path, result.code);
    applied += result.applied.length;
    log.push(file);
    for (const f of result.applied) log.push(`  ${f.line}:${f.column}  ${f.rule}  ${f.snippet} → ${f.fix.replacement ?? ''}`);
  }
  return { log, applied };
}

export function main(argv: string[]): number {
  let args: Args;
  try {
    args = parse(argv);
  } catch (error) {
    process.stderr.write(`${(error as Error).message}\n\n${USAGE}`);
    return 2;
  }
  if (args.help) {
    process.stdout.write(USAGE);
    return 0;
  }
  if (args.paths.length === 0) {
    process.stderr.write(`Give at least one file or folder.\n\n${USAGE}`);
    return 2;
  }

  const options = {
    ignore: args.ignore,
    ...(args.tenant ? { tenant: args.tenant } : {}),
    ...(args.scheme ? { scheme: args.scheme } : {}),
  };
  // Anything that is not the report goes to stderr, so stdout stays clean for --format json.
  const say = (text: string): void => void process.stderr.write(text + '\n');

  let result;
  try {
    result = auditPaths(args.paths, options);
    if (args.fix) {
      const { log, applied } = fixFiles(result.findings);
      if (applied === 0) say('--fix: no safe fixes to apply.');
      else {
        say(`--fix: applied ${applied} safe ${applied === 1 ? 'fix' : 'fixes'}.`);
        for (const line of log) say(line);
      }
      // Audit again, so the report and the score describe the files as they are now.
      result = auditPaths(args.paths, options);
      say(`--fix: left ${result.findings.length} ${result.findings.length === 1 ? 'finding' : 'findings'} for a person. They are in the report.`);
    }
  } catch (error) {
    process.stderr.write(`syntara-audit: ${(error as Error).message}\n`);
    return 2;
  }

  const command = ['syntara-audit', ...argv.filter((a, i) => a !== '--out' && argv[i - 1] !== '--out' && !a.startsWith('--out='))].join(' ');
  const report = args.format === 'json'
    ? JSON.stringify(result, null, 2) + '\n'
    : args.format === 'html'
      ? toHtml(result, {
          title: args.paths.join(', '),
          command,
          generatedAt: new Date().toISOString().slice(0, 10),
          ...(args.minScore !== undefined ? { minScore: args.minScore } : {}),
          ...(args.tenant ? { tenant: args.tenant } : {}),
        })
      : toText(result);

  if (args.out) {
    const out = resolve(args.out);
    mkdirSync(dirname(out), { recursive: true });
    writeFileSync(out, report);
    say(`Wrote ${args.out}. Score ${result.score.toFixed(1)} / 100, ${result.findings.length} findings.`);
  } else {
    process.stdout.write(report);
  }

  if (args.minScore !== undefined && result.score < args.minScore) {
    say(`Score ${result.score.toFixed(1)} is below the minimum of ${args.minScore}.`);
    return 1;
  }
  return 0;
}

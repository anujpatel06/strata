#!/usr/bin/env node
/**
 * Runs the agent eval: each prompt, under each condition, with each model, several times.
 *
 *   node evals/run.mjs --models claude-sonnet-5 --conditions none,mcp --repeats 2 [--prompts id,id] [--iteration 1]
 *                      [--concurrency 3] [--timeout-min 15] [--dry]
 *
 * One run = one headless Claude Code session (`claude -p`) in a fresh copy of the template app, outside this repo.
 * Every run gets the same tools, the same README and the same prompt text. Only the condition differs:
 *   none    nothing extra
 *   agents  AGENTS.md in the workspace, loaded through CLAUDE.md
 *   llms    llms.txt in the workspace, named in CLAUDE.md
 *   mcp     the Syntara MCP server, plus AGENTS.md
 * `--strict-mcp-config` is set in every condition, so no MCP server from the user's own setup leaks in.
 *
 * A run that already has a result.json is skipped, so an interrupted eval can be continued with the same command.
 * If the account's usage limit is reached or the CLI's sign-in has expired, the eval stops, records nothing for the
 * runs it cut short, and exits 3.
 * `--dry` creates the workspaces and prints the commands without calling the model.
 * This script calls a paid model once per run. It prints the number of runs first.
 */
import { execFileSync, spawn } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { CACHE, CONDITIONS, INSTALLED, PREPARED, REPO, RUNS, TOOLS, flag, list, newWorkspace, readJson, readPrompts } from './lib/common.mjs';

const models = list(flag('models', 'claude-sonnet-5'));
const conditions = list(flag('conditions', 'none,mcp'));
const repeats = Number(flag('repeats', 2));
const iteration = String(flag('iteration', 1));
const concurrency = Number(flag('concurrency', 3));
const timeoutMs = Number(flag('timeout-min', 15)) * 60_000;
const dry = flag('dry', false) === true;
const only = list(flag('prompts', ''));

for (const c of conditions) if (!CONDITIONS[c]) throw new Error(`Unknown condition "${c}". Use: ${Object.keys(CONDITIONS).join(', ')}`);
const source = readJson(path.join(CACHE, 'source.json'));
if (!source || !existsSync(path.join(INSTALLED, 'node_modules'))) throw new Error('Run `node evals/setup.mjs` first.');

const prompts = readPrompts().filter((p) => only.length === 0 || only.includes(p.id));
if (prompts.length === 0) throw new Error('No prompts matched.');

/** The words every run ends with. The same in every condition. */
const SUFFIX = [
  '',
  'Build this in the app in the current folder. Read README.md first.',
  'Write the screen in src/screens/Screen.tsx as the default export, with its styles in src/screens/Screen.module.css.',
  'Use mock data written in the file. Do not edit src/main.tsx, src/app.css, package.json or the config files.',
  'Work only inside the current folder. Do not read or write anything outside it.',
  'When the screen is complete, stop. You cannot run the app.',
].join('\n');

const jobs = [];
for (const prompt of prompts) for (const condition of conditions) for (const model of models) for (let rep = 1; rep <= repeats; rep++) {
  const dir = path.join(RUNS, `iter-${iteration}`, prompt.id, condition, model, String(rep));
  jobs.push({ prompt, condition, model, rep, dir });
}
const todo = jobs.filter((j) => !existsSync(path.join(j.dir, 'result.json')));
console.log(`${prompts.length} prompt(s) × ${conditions.length} condition(s) × ${models.length} model(s) × ${repeats} repeat(s) = ${jobs.length} run(s); ${jobs.length - todo.length} already done, ${todo.length} to run${dry ? ' (dry)' : ''}.`);

function makeWorkspace(job) {
  const ws = newWorkspace();
  mkdirSync(ws, { recursive: true });
  for (const f of readdirSync(INSTALLED)) {
    if (f === 'node_modules' || f === 'pnpm-lock.yaml') continue;
    cpSync(path.join(INSTALLED, f), path.join(ws, f), { recursive: true });
  }
  // A real copy, not a link. Iteration 1 linked node_modules, and file search doesn't follow links: 31 of its 50
  // runs without context reported that the packages weren't installed. On APFS `cp -c` clones, so this is quick.
  try {
    execFileSync('cp', ['-Rc', path.join(INSTALLED, 'node_modules'), path.join(ws, 'node_modules')]);
  } catch {
    cpSync(path.join(INSTALLED, 'node_modules'), path.join(ws, 'node_modules'), { recursive: true, verbatimSymlinks: true });
  }
  const c = CONDITIONS[job.condition];
  if (c.agentsMd) {
    cpSync(path.join(source.root, 'AGENTS.md'), path.join(ws, 'AGENTS.md'));
    writeFileSync(path.join(ws, 'CLAUDE.md'), '@AGENTS.md\n');
  }
  if (c.llmsTxt) {
    cpSync(path.join(CACHE, 'llms.txt'), path.join(ws, 'llms.txt'));
    writeFileSync(path.join(ws, 'CLAUDE.md'), 'The design system’s reference is in llms.txt in this folder. Read it before you write code.\n');
  }
  let mcpConfig;
  if (c.mcp) {
    // Kept outside the workspace and the run's own parent folder.
    mcpConfig = path.join(PREPARED, `mcp-${path.basename(path.dirname(ws))}.json`);
    writeFileSync(mcpConfig, JSON.stringify({ mcpServers: { syntara: { command: 'node', args: [path.join(source.root, 'packages/mcp/bin/cli.mjs')], env: { SYNTARA_ROOT: source.root } } } }));
  }
  return { ws, mcpConfig };
}

function commandFor(job, mcpConfig) {
  const allowed = [...TOOLS, ...(mcpConfig ? ['mcp__syntara'] : [])];
  return [
    '-p', job.prompt.body + '\n' + SUFFIX,
    '--model', job.model,
    // stream-json records every tool call, so the result can list what the run read.
    '--output-format', 'stream-json',
    '--verbose',
    '--tools', TOOLS.join(','),
    '--allowedTools', allowed.join(','),
    // A real consumer doesn't have this repo. Deny it, then check the record to prove nothing got through.
    // Both spellings of the checkout's path: on macOS the temp folder is a link into /private.
    '--disallowedTools', `Read(/${REPO}/**)`, `Read(/${path.join(PREPARED, 'source')}/**)`, `Read(/${path.join(realpathSync(PREPARED), 'source')}/**)`,
    '--permission-mode', 'acceptEdits',
    '--setting-sources', 'project',
    '--disable-slash-commands',
    '--no-session-persistence',
    '--strict-mcp-config',
    ...(mcpConfig ? ['--mcp-config', mcpConfig] : []),
  ];
}

function runOne(job) {
  return new Promise((resolve) => {
    // Checked again here, so a second runner started beside this one never repeats a finished run.
    if (!dry && existsSync(path.join(job.dir, 'result.json'))) return resolve();
    const { ws, mcpConfig } = makeWorkspace(job);
    const args = commandFor(job, mcpConfig);
    const label = `${job.prompt.id} · ${job.condition} · ${job.model} · #${job.rep}`;
    if (dry) {
      console.log(`DRY ${label}\n    cwd ${ws}\n    claude ${args.map((a) => (a.includes('\n') ? '<prompt>' : a)).join(' ')}`);
      return resolve();
    }
    const started = Date.now();
    // No memory between runs: a note saved by one run must never reach another.
    const child = spawn('claude', args, { cwd: ws, stdio: ['ignore', 'pipe', 'pipe'], env: { ...process.env, CLAUDE_CODE_DISABLE_AUTO_MEMORY: '1' } });
    let out = '';
    let err = '';
    child.stdout.on('data', (d) => (out += d));
    child.stderr.on('data', (d) => (err += d));
    const timer = setTimeout(() => child.kill('SIGTERM'), timeoutMs);
    child.on('close', (code, signal) => {
      clearTimeout(timer);
      // One JSON event per line. The last `result` event is the summary; tool_use events are the record.
      let cli = null;
      const toolCalls = {};
      const paths = new Set();
      for (const line of out.split('\n')) {
        if (!line.trim()) continue;
        let ev;
        try {
          ev = JSON.parse(line);
        } catch {
          continue;
        }
        if (ev.type === 'result') cli = ev;
        for (const block of ev.type === 'assistant' ? (ev.message?.content ?? []) : []) {
          if (block.type !== 'tool_use') continue;
          toolCalls[block.name] = (toolCalls[block.name] ?? 0) + 1;
          for (const key of ['file_path', 'path']) if (typeof block.input?.[key] === 'string') paths.add(block.input[key]);
        }
      }
      // Resolve links through the nearest folder that exists, so a path to a file that isn't there still lands
      // where it would be. Iteration 2 showed such paths as foreign because /var is a link to /private/var.
      const real = (p) => {
        let head = path.resolve(ws, p);
        const tail = [];
        while (head !== path.dirname(head)) {
          try {
            return path.join(realpathSync(head), ...tail);
          } catch {
            tail.unshift(path.basename(head));
            head = path.dirname(head);
          }
        }
        return path.resolve(ws, p);
      };
      const wsReal = realpathSync(ws);
      // Everything a run may read is inside its workspace, the installed packages included.
      const outside = [...paths].map(real).filter((p) => !p.startsWith(wsReal));
      // A usage limit isn't a result. Record nothing, stop starting new runs, and say so. Found in iteration 2,
      // where 84 runs "finished" in seconds with this message and would have counted as failures.
      // Two shapes were seen: the CLI's own message, and a run that was cut off part-way and said so in its last words.
      // A third shape, from iteration 3: the CLI's sign-in had expired, and all 50 runs "finished" in seconds.
      if (/usage limit|session limit|hit (my|your|the) [^.]{0,30}limit|failed to authenticate|session expired|not logged in|invalid api key/i.test(String(cli?.result ?? '')) || cli?.subtype === 'rate_limit') {
        if (!limited) console.log(`STOP the model couldn't be reached: ${String(cli?.result ?? '').slice(0, 120)}`);
        limited = true;
        rmSync(path.dirname(ws), { recursive: true, force: true });
        if (mcpConfig) rmSync(mcpConfig, { force: true });
        return resolve();
      }
      mkdirSync(job.dir, { recursive: true });
      const screens = path.join(ws, 'src/screens');
      rmSync(path.join(job.dir, 'src'), { recursive: true, force: true });
      if (existsSync(screens)) cpSync(screens, path.join(job.dir, 'src/screens'), { recursive: true });
      // Files the run was told not to edit: record whether it did.
      const touched = ['src/main.tsx', 'src/app.css', 'package.json', 'vite.config.ts', 'tsconfig.json'].filter(
        (f) => !existsSync(path.join(ws, f)) || readFileSync(path.join(ws, f), 'utf8') !== readFileSync(path.join(INSTALLED, f), 'utf8'),
      );
      const result = {
        prompt: job.prompt.id,
        tags: job.prompt.tags,
        condition: job.condition,
        model: job.model,
        repeat: job.rep,
        iteration,
        source: { commit: source.commit, dirty: source.dirty },
        startedAt: new Date(started).toISOString(),
        wallMs: Date.now() - started,
        exitCode: code,
        timedOut: signal === 'SIGTERM',
        editedProtectedFiles: touched,
        workspaceId: path.basename(path.dirname(ws)).replace(/^se-/, ''),
        toolCalls,
        // Paths the run asked for that are neither in its workspace nor in the installed packages.
        pathsOutsideWorkspace: outside,
        touchedRepo: outside.some((p) => p.startsWith(REPO) || p.includes(`${path.sep}syntara-evals-prepared${path.sep}source`)),
        usedMemory: outside.some((p) => p.includes(`${path.sep}.claude${path.sep}`)),
        // Did the run look inside the installed packages at all? Iteration 1's defect would show up here as false.
        readPackages: [...paths].some((p) => p.includes('node_modules')),
        cli: cli
          ? { isError: cli.is_error, subtype: cli.subtype, turns: cli.num_turns, durationMs: cli.duration_ms, costUsd: cli.total_cost_usd, usage: cli.usage, modelUsage: cli.modelUsage, finalMessage: typeof cli.result === 'string' ? cli.result.slice(0, 2000) : undefined }
          : { isError: true, subtype: 'no result event' },
        stderr: err.slice(0, 2000) || (cli ? undefined : out.slice(-2000)),
      };
      writeFileSync(path.join(job.dir, 'result.json'), JSON.stringify(result, null, 2) + '\n');
      rmSync(path.dirname(ws), { recursive: true, force: true });
      if (mcpConfig) rmSync(mcpConfig, { force: true });
      // Claude Code keeps a folder per project path under ~/.claude/projects. Remove the one this run created.
      const slug = wsReal.replace(/[^A-Za-z0-9]/g, '-');
      rmSync(path.join(os.homedir(), '.claude', 'projects', slug), { recursive: true, force: true });
      console.log(`${code === 0 && !result.cli.isError ? 'ok  ' : 'FAIL'} ${label}  ${Math.round(result.wallMs / 1000)}s${cli?.num_turns ? `  ${cli.num_turns} turns` : ''}`);
      resolve();
    });
  });
}

let limited = false;
let next = 0;
await Promise.all(
  Array.from({ length: Math.min(concurrency, todo.length) }, async () => {
    while (next < todo.length && !limited) await runOne(todo[next++]);
  }),
);
if (limited) {
  console.log('Stopped: the model couldn’t be reached (a usage limit or an expired sign-in). Nothing was recorded for the runs it cut short. Fix the cause, then run the same command again to continue.');
  process.exitCode = 3;
} else console.log(dry ? 'Dry run finished. Nothing was sent to a model.' : `Finished. Score with: node evals/score.mjs --iteration ${iteration}`);

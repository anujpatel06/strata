// A browser sweep only means anything against the build it was meant to test. A backgrounded `... start &` exits
// with EADDRINUSE when something already holds the port, and because it is backgrounded that failure is easy to
// miss: the sweep then measures whichever server was already there and reports its faults as this build's. Two
// sweeps run that way agree with each other perfectly, which reads like a confirmed bug rather than a stale port.
// So every script that drives a running site checks the served build id against the one on disk first.
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const distDir = () => process.env.NEXT_DIST_DIR ?? '.next';

export function localBuildId() {
  const file = join('apps/docs', distDir(), 'BUILD_ID');
  return existsSync(file) ? readFileSync(file, 'utf8').trim() : null;
}

/** Next puts the build id in the flight payload as "b":"<id>", escaped as \"b\":\"<id>\" inside the inline script. */
export function buildIdFrom(html) {
  return html.match(/\\?"b\\?":\\?"([A-Za-z0-9_-]{8,})\\?"/)?.[1] ?? null;
}

/** Exits non-zero unless `base` is serving the build in apps/docs/<distDir>. Returns the build id. */
export async function assertServedBuild(base) {
  const local = localBuildId();
  if (!local) {
    console.error(`No build at apps/docs/${distDir()}. Run: pnpm --filter @syntara/docs build`);
    process.exit(1);
  }
  let html;
  try {
    html = await fetch(base, { cache: 'no-store' }).then((r) => r.text());
  } catch (e) {
    console.error(`Nothing answering at ${base} (${e.message}).`);
    console.error('Start the site: pnpm --filter @syntara/docs start   (serves apps/docs/out)');
    process.exit(1);
  }
  // The id is the reliable signal; the regex is only for naming the other build in the message.
  if (!html.includes(local)) {
    const served = buildIdFrom(html);
    console.error(`${base} is serving build ${served ?? '(unknown)'}, but apps/docs/${distDir()} holds ${local}.`);
    console.error('Another server is on that port: yours exited with EADDRINUSE and left the old one answering.');
    console.error('Find it with: lsof -nP -iTCP:3000 -sTCP:LISTEN   (it may be an orphan whose parent you killed)');
    console.error('Or point this script elsewhere with SYNTARA_BASE_URL.');
    process.exit(1);
  }
  return local;
}

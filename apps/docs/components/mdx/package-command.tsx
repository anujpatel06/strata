import { highlight } from '@/lib/highlight';
import { withSiteUrl } from './code-block';
import { PackageTabs, type PackageManager } from './package-tabs';

const MANAGERS: readonly PackageManager[] = ['pnpm', 'npm', 'yarn', 'bun'];

function variants(kind: 'add' | 'dlx' | 'run', args: string): Record<PackageManager, string> {
  if (kind === 'add') return { pnpm: `pnpm add ${args}`, npm: `npm install ${args}`, yarn: `yarn add ${args}`, bun: `bun add ${args}` };
  if (kind === 'run') return { pnpm: `pnpm ${args}`, npm: `npm run ${args}`, yarn: `yarn ${args}`, bun: `bun run ${args}` };
  return { pnpm: `pnpm dlx ${args}`, npm: `npx ${args}`, yarn: `yarn dlx ${args}`, bun: `bunx --bun ${args}` };
}

export interface PackageCommandProps {
  /** Packages to install, e.g. "@syntara/react @syntara/tokens". */
  add?: string;
  /** A package binary to execute, e.g. "tsx scripts/build.ts". */
  dlx?: string;
  /** A package.json script, e.g. "test:themes". */
  run?: string;
}

/** One command, four package managers, highlighted at build time. The chosen manager is remembered. */
export async function PackageCommand({ add, dlx, run }: PackageCommandProps) {
  const kind = add != null ? 'add' : run != null ? 'run' : 'dlx';
  const commands = variants(kind, withSiteUrl(add ?? run ?? dlx ?? ''));
  const html = Object.fromEntries(
    await Promise.all(MANAGERS.map(async (pm) => [pm, await highlight(commands[pm], 'bash')] as const)),
  ) as Record<PackageManager, string>;
  return <PackageTabs html={html} />;
}

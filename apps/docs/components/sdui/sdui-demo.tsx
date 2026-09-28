import { HOUSE_ID } from '@/lib/house';
import { listRepoDir, readRepoFile } from '@/lib/repo';
import { getHouseBrand, getTenants } from '@/lib/tenants';
import { SduiDemoClient, type DemoExample, type DemoTenant } from './sdui-demo-client';

/** Every document in packages/sdui/examples, read at build time. A new file there shows up in the picker. */
function readExamples(): DemoExample[] {
  const out: DemoExample[] = [];
  for (const file of listRepoDir('packages', 'sdui', 'examples')) {
    if (!file.endsWith('.json')) continue;
    const raw = readRepoFile('packages', 'sdui', 'examples', file);
    if (!raw) continue;
    const doc = JSON.parse(raw) as Record<string, unknown>;
    const screen = doc.screen as { title?: unknown } | undefined;
    const id = file.slice(0, -'.json'.length);
    out.push({ id, title: typeof screen?.title === 'string' ? screen.title : id, doc });
  }
  return out;
}

function demoTenants(): DemoTenant[] {
  return [
    ...getTenants().map((t) => ({ id: t.id, name: t.name, density: t.brand.density, dir: t.dir, locale: t.locale })),
    { id: HOUSE_ID, name: 'House', density: getHouseBrand().density, dir: 'ltr' as const, locale: 'en-US' },
  ];
}

/** The live demo on /docs/server-driven-ui. Data is read here, on the server; the demo itself is a client component. */
export function SduiDemo() {
  return <SduiDemoClient examples={readExamples()} tenants={demoTenants()} />;
}

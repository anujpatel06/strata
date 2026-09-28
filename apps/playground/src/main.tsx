import { StrictMode, type ComponentType } from 'react';
import { createRoot } from 'react-dom/client';
import { generateTheme, toCSS, googleFontsHref, type BrandInput } from '@syntara/theme-engine';
import { ThemeScope } from '@syntara/react';
import vela from '../../../tenants/vela/brand.json';
import harbor from '../../../tenants/harbor/brand.json';
import qamar from '../../../tenants/qamar/brand.json';
import care from '../../../tenants/care/brand.json';
import haat from '../../../tenants/haat/brand.json';

/**
 * Playground: renders every example in apps/docs/examples/<c>/ for one tenant × scheme × dir × density.
 *   /?c=button&tenant=qamar&scheme=dark&dir=rtl&density=compact
 * No `c` → index of components that have examples.
 */
const TENANTS: Record<string, BrandInput> = { vela, harbor, qamar, care, haat } as Record<string, BrandInput>;
const modules = import.meta.glob<{ default: ComponentType }>('../../docs/examples/*/*.tsx', { eager: true });

const q = new URLSearchParams(location.search);
const c = q.get('c');
const tenant = TENANTS[q.get('tenant') ?? ''] ? (q.get('tenant') as string) : 'vela';
const scheme = q.get('scheme') === 'dark' ? 'dark' : 'light';
const dir = q.get('dir') === 'rtl' ? 'rtl' : 'ltr';
const density = q.get('density') === 'compact' ? 'compact' : q.get('density') === 'comfortable' ? 'comfortable' : undefined;

const css = Object.entries(TENANTS)
  .map(([id, brand]) => toCSS(generateTheme(brand), { selector: `[data-syntara-theme="${id}"]` }))
  .join('\n');
const style = document.createElement('style');
style.textContent = css + `\nhtml,body{margin:0}`;
document.head.append(style);
for (const brand of Object.values(TENANTS)) {
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = googleFontsHref(generateTheme(brand).typePair);
  document.head.append(link);
}

const examples = Object.entries(modules)
  .map(([file, mod]) => {
    const [, comp, name] = /examples\/([^/]+)\/([^/]+)\.tsx$/.exec(file) ?? [];
    return { comp: comp ?? '', name: name ?? '', Component: mod.default };
  })
  .sort((a, b) => (a.name.endsWith('-demo') ? -1 : b.name.endsWith('-demo') ? 1 : a.name.localeCompare(b.name)));

function App() {
  if (!c) {
    const comps = [...new Set(examples.map((e) => e.comp))].sort();
    return (
      <ThemeScope theme={tenant} scheme={scheme} style={{ minHeight: '100vh', padding: 24 }}>
        <h1 style={{ marginTop: 0 }}>Syntara playground</h1>
        <ul>{comps.map((x) => <li key={x}><a href={`?c=${x}&tenant=${tenant}&scheme=${scheme}`}>{x}</a></li>)}</ul>
      </ThemeScope>
    );
  }
  const list = examples.filter((e) => e.comp === c);
  return (
    <ThemeScope theme={tenant} scheme={scheme} density={density} locale={dir === 'rtl' ? 'ar-AE' : 'en-US'} style={{ minHeight: '100vh', padding: 24 }}>
      <div style={{ display: 'grid', gap: 24 }}>
        {list.length === 0 && <p>No examples found for “{c}”.</p>}
        {list.map(({ name, Component }) => (
          <section key={name} data-example={name} style={{ display: 'grid', gap: 12 }}>
            <p style={{ margin: 0, fontFamily: 'var(--syntara-font-mono)', fontSize: 12, color: 'var(--syntara-color-text-subtle)' }}>{name}</p>
            <div style={{ border: '1px solid var(--syntara-color-border-default)', borderRadius: 'var(--syntara-radius-container)', padding: 32, minHeight: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--syntara-color-surface-default)' }}>
              <div style={{ inlineSize: '100%', maxInlineSize: 720, display: 'flex', justifyContent: 'center' }}><Component /></div>
            </div>
          </section>
        ))}
      </div>
    </ThemeScope>
  );
}

createRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>);

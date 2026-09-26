/**
 * Server-only syntax highlighting with Shiki, run while pages prerender (nothing ships to the client).
 * Dual theme through CSS light-dark(): tokens follow the computed `color-scheme`, which the Strata
 * theme CSS sets from data-strata-scheme — so code follows the site toggle and any ThemeScope.
 *
 * Light uses github-light-default (Primer colours), not github-light: github-light's orange #e36209
 * is 3.4:1 on our code surface and fails WCAG 1.4.3. Its comment grey #6e7781 is 4.48:1 there, so it is
 * swapped for #57606a (6.29:1). Dark uses github-dark-dimmed, whose token colours all pass on the dark surface.
 */
import { createHighlighter, type BundledLanguage, type Highlighter } from 'shiki';

const LANGS = ['tsx', 'ts', 'jsx', 'js', 'json', 'bash', 'css', 'html', 'mdx', 'diff'] as const;
const ALIASES: Record<string, string> = {
  typescript: 'ts',
  javascript: 'js',
  sh: 'bash',
  shell: 'bash',
  zsh: 'bash',
  console: 'bash',
  jsonc: 'json',
};

let highlighter: Promise<Highlighter> | undefined;

function getHighlighter(): Promise<Highlighter> {
  highlighter ??= createHighlighter({ themes: ['github-light-default', 'github-dark-dimmed'], langs: [...LANGS] });
  return highlighter;
}

export function normaliseLang(lang: string | undefined): string {
  const l = (lang ?? '').toLowerCase().trim();
  const resolved = ALIASES[l] ?? l;
  return (LANGS as readonly string[]).includes(resolved) ? resolved : 'text';
}

/** Returns Shiki's <pre class="shiki">…</pre> HTML with no inline background (the frame owns it). */
export async function highlight(code: string, lang?: string): Promise<string> {
  const h = await getHighlighter();
  return h.codeToHtml(code.replace(/\n+$/, ''), {
    lang: normaliseLang(lang) as BundledLanguage | 'text',
    themes: { light: 'github-light-default', dark: 'github-dark-dimmed' },
    defaultColor: 'light-dark()',
    colorReplacements: { 'github-light-default': { '#6e7781': '#57606a' } },
    transformers: [
      {
        pre(node) {
          delete node.properties.style;
        },
      },
    ],
  });
}

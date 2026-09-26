/**
 * A few-dozen-line highlighter for the two languages the exporters emit (CSS and JSON), so the Export tab can
 * re-colour on every keystroke without shipping Shiki to the browser. Token colours are Strata roles that are
 * contrast-checked against surface.default, the code viewer's background.
 */
import type { ReactNode } from 'react';
import styles from './code-viewer.module.css';

export type CodeLang = 'css' | 'json';

const JSON_TOKEN = /("(?:\\.|[^"\\])*")(\s*:)?|(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)|\b(true|false|null)\b/g;
const CSS_DECL = /^(\s*)(-{0,2}[a-zA-Z][\w-]*)(\s*:\s*)(.*?)(;?)$/;
const COLOR_VALUE = /^(#[0-9a-f]{3,8}|oklch\([^)]*\))$/i;

function json(code: string): ReactNode[] {
  const out: ReactNode[] = [];
  let last = 0;
  let key = 0;
  for (const m of code.matchAll(JSON_TOKEN)) {
    const index = m.index ?? 0;
    if (index > last) out.push(code.slice(last, index));
    if (m[1] !== undefined) {
      out.push(
        <span key={key++} className={m[2] ? styles.key : styles.str}>
          {m[1]}
        </span>,
      );
      if (m[2]) out.push(m[2]);
    } else {
      out.push(
        <span key={key++} className={styles.num}>
          {m[0]}
        </span>,
      );
    }
    last = index + m[0].length;
  }
  if (last < code.length) out.push(code.slice(last));
  return out;
}

function css(code: string): ReactNode[] {
  const out: ReactNode[] = [];
  const lines = code.split('\n');
  lines.forEach((line, i) => {
    const nl = i < lines.length - 1 ? '\n' : '';
    const trimmed = line.trim();
    if (trimmed.startsWith('/*') || trimmed.startsWith('*')) {
      out.push(
        <span key={i} className={styles.com}>
          {line}
        </span>,
        nl,
      );
      return;
    }
    if (trimmed.endsWith('{')) {
      out.push(
        <span key={i} className={styles.sel}>
          {line}
        </span>,
        nl,
      );
      return;
    }
    const decl = CSS_DECL.exec(line);
    if (decl) {
      const [, indent = '', prop = '', colon = '', value = '', semi = ''] = decl;
      const swatch = COLOR_VALUE.test(value) ? (
        <span className={styles.swatch} style={{ backgroundColor: value }} aria-hidden="true" />
      ) : null;
      out.push(
        <span key={i}>
          {indent}
          <span className={styles.prop}>{prop}</span>
          {colon}
          {swatch}
          {value}
          {semi}
        </span>,
        nl,
      );
      return;
    }
    out.push(line + nl);
  });
  return out;
}

export function highlight(code: string, lang: CodeLang): ReactNode[] {
  return lang === 'json' ? json(code) : css(code);
}

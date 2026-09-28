/**
 * Pretty-prints a screen document for the demo's editor: two-space indent, and any object or array that fits on
 * one line stays on one line, the way the files in packages/sdui/examples are written. Isomorphic and
 * deterministic, so the server and the client print the same text.
 *
 * It also records the line each JSON pointer starts on, so the demo can scroll the editor to what a preset changed.
 */
export interface FormattedJson {
  text: string;
  /** JSON pointer → 0-based line number. "" is the document. */
  lines: Map<string, number>;
}

const escapeKey = (k: string) => k.replace(/~/g, '~0').replace(/\//g, '~1');
const isObject = (v: unknown): v is Record<string, unknown> => v !== null && typeof v === 'object' && !Array.isArray(v);

function flat(v: unknown): string {
  if (Array.isArray(v)) return v.length ? `[${v.map(flat).join(', ')}]` : '[]';
  if (isObject(v)) {
    const entries = Object.entries(v);
    return entries.length ? `{ ${entries.map(([k, x]) => `${JSON.stringify(k)}: ${flat(x)}`).join(', ')} }` : '{}';
  }
  return JSON.stringify(v) ?? 'null';
}

export function formatJson(value: unknown, width = 72): FormattedJson {
  const out: string[] = [];
  const lines = new Map<string, number>();

  const mark = (v: unknown, pointer: string, line: number) => {
    lines.set(pointer, line);
    if (Array.isArray(v)) v.forEach((x, i) => mark(x, `${pointer}/${i}`, line));
    else if (isObject(v)) for (const [k, x] of Object.entries(v)) mark(x, `${pointer}/${escapeKey(k)}`, line);
  };

  const emit = (v: unknown, prefix: string, indent: string, pointer: string, suffix: string) => {
    const one = flat(v);
    const container = Array.isArray(v) || isObject(v);
    if (!container || prefix.length + one.length + suffix.length <= width) {
      mark(v, pointer, out.length);
      out.push(prefix + one + suffix);
      return;
    }
    lines.set(pointer, out.length);
    const inner = `${indent}  `;
    if (Array.isArray(v)) {
      out.push(`${prefix}[`);
      v.forEach((x, i) => emit(x, inner, inner, `${pointer}/${i}`, i < v.length - 1 ? ',' : ''));
      out.push(`${indent}]${suffix}`);
    } else {
      const entries = Object.entries(v as Record<string, unknown>);
      out.push(`${prefix}{`);
      entries.forEach(([k, x], i) =>
        emit(x, `${inner}${JSON.stringify(k)}: `, inner, `${pointer}/${escapeKey(k)}`, i < entries.length - 1 ? ',' : ''),
      );
      out.push(`${indent}}${suffix}`);
    }
  };

  emit(value, '', '', '', '');
  return { text: `${out.join('\n')}\n`, lines };
}

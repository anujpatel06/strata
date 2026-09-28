/**
 * BRIEF §10a acceptance: for the components in the slice, every prop that a docs example
 * (apps/docs/examples/<component>/*.tsx) passes is either on the wire or on a written exclusion list with a reason.
 * Literal values are checked too: an enum value an example uses must be in the schema, or excluded with a reason.
 *
 * The examples are parsed with the TypeScript compiler; nothing about them is hard-coded here.
 */
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
import { manifest } from '../src/index';
import type { Literal } from '../src/manifest-types';
import { EXCLUDED_NODES, NODES } from '../src/wire';

const EXAMPLES = path.resolve(__dirname, '../../../apps/docs/examples');
const components = [...new Set(NODES.map((n) => n.meta).filter((m): m is string => !!m))];

interface Use {
  file: string;
  tag: string;
  prop: string;
  value?: Literal;
  spread?: boolean;
}

/** Every JSX element in a file, with its attribute names and literal values, plus `children` when it has any. */
function uses(file: string): Use[] {
  const source = ts.createSourceFile(file, readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const out: Use[] = [];
  const rel = path.relative(EXAMPLES, file);
  const visit = (node: ts.Node) => {
    let open: ts.JsxOpeningLikeElement | undefined;
    let hasChildren = false;
    if (ts.isJsxElement(node)) {
      open = node.openingElement;
      hasChildren = node.children.some((c) => !(ts.isJsxText(c) && c.containsOnlyTriviaWhiteSpaces));
    } else if (ts.isJsxSelfClosingElement(node)) open = node;
    if (open) {
      const tag = open.tagName.getText(source);
      for (const attr of open.attributes.properties) {
        if (ts.isJsxSpreadAttribute(attr)) {
          out.push({ file: rel, tag, prop: '{...spread}', spread: true });
          continue;
        }
        const init = attr.initializer;
        let value: Literal | undefined;
        if (!init) value = true;
        else if (ts.isStringLiteral(init)) value = init.text;
        else if (ts.isJsxExpression(init) && init.expression) {
          const e = init.expression;
          if (ts.isNumericLiteral(e)) value = Number(e.text);
          else if (e.kind === ts.SyntaxKind.TrueKeyword) value = true;
          else if (e.kind === ts.SyntaxKind.FalseKeyword) value = false;
          else if (ts.isStringLiteral(e) || ts.isNoSubstitutionTemplateLiteral(e)) value = e.text;
          else if (ts.isPrefixUnaryExpression(e) && e.operator === ts.SyntaxKind.MinusToken && ts.isNumericLiteral(e.operand)) value = -Number(e.operand.text);
        }
        out.push({ file: rel, tag, prop: attr.name.getText(source), ...(value !== undefined ? { value } : {}) });
      }
      if (hasChildren) out.push({ file: rel, tag, prop: 'children' });
    }
    ts.forEachChild(node, visit);
  };
  visit(source);
  return out;
}

const everywhere = new Map(manifest.excludedEverywhere.map((x) => [x.prop, x.reason]));

/** How the wire accounts for one prop an example uses, or null. */
function account(u: Use): { how: string; reason?: string } | null {
  if (EXCLUDED_NODES[u.tag]) return { how: 'node excluded', reason: EXCLUDED_NODES[u.tag] };
  const node = manifest.nodes[u.tag]!;
  if (u.prop === 'children' && node.children.kind !== 'none') return { how: `children (${node.children.kind})` };
  const wire = Object.entries(node.props).find(([name, p]) => p.from === u.prop || name === u.prop);
  if (wire) return { how: `props.${wire[0]}` };
  if (Object.values(node.slots).some((s) => s.from === u.prop)) return { how: `slots.${u.prop}` };
  if (node.action?.from.includes(u.prop)) return { how: 'action' };
  const excluded = node.excluded.find((x) => x.prop === u.prop && x.value === undefined);
  if (excluded) return { how: 'excluded', reason: excluded.reason };
  if (everywhere.has(u.prop)) return { how: 'excluded everywhere', reason: everywhere.get(u.prop) };
  return null;
}

/** Whether a literal value an example uses is accepted by the wire prop, or excluded with a reason. */
function valueProblem(u: Use): string | null {
  if (u.value === undefined || EXCLUDED_NODES[u.tag]) return null;
  const node = manifest.nodes[u.tag]!;
  const entry = Object.entries(node.props).find(([name, p]) => p.from === u.prop || name === u.prop);
  if (!entry) return null;
  const [name, p] = entry;
  if (p.kind === 'enum') {
    if ((p.values ?? []).includes(u.value)) return null;
    if (node.excluded.some((x) => x.prop === u.prop && x.value === u.value)) return null;
    return `${u.tag} props.${name} ${JSON.stringify(u.value)} is not in the schema (${JSON.stringify(p.values)})`;
  }
  const type = typeof u.value;
  const expected = p.kind === 'boolean' ? 'boolean' : p.kind === 'number' ? 'number' : ['string', 'text', 'image-url'].includes(p.kind) ? 'string' : null;
  return expected && type !== expected ? `${u.tag} props.${name} ${JSON.stringify(u.value)} should be a ${expected}` : null;
}

describe('BRIEF §10a: docs example props against the wire schema', () => {
  const all = components.flatMap((c) => {
    const dir = path.join(EXAMPLES, c);
    return existsSync(dir)
      ? readdirSync(dir)
          .filter((f) => f.endsWith('.tsx'))
          .flatMap((f) => uses(path.join(dir, f)))
      : [];
  });
  const relevant = all.filter((u) => manifest.nodes[u.tag] || EXCLUDED_NODES[u.tag]);

  it('finds the examples of every component in the slice', () => {
    for (const c of components) {
      const dir = path.join(EXAMPLES, c);
      expect(existsSync(dir), dir).toBe(true);
      expect(readdirSync(dir).filter((f) => f.endsWith('.tsx')).length, c).toBeGreaterThan(0);
    }
    // Every wire component (not the schema's own nodes) is used by at least one example.
    const used = new Set(relevant.map((u) => u.tag));
    for (const spec of NODES.filter((n) => n.meta)) expect(used.has(spec.type), spec.type).toBe(true);
  });

  it('accounts for every prop: on the wire, or excluded with a reason', () => {
    const unaccounted = relevant.filter((u) => !u.spread && account(u) === null).map((u) => `${u.file}: <${u.tag} ${u.prop}>`);
    expect(unaccounted).toEqual([]);
    for (const u of relevant) {
      const a = account(u);
      if (a?.reason !== undefined) expect(a.reason.length, `${u.tag}.${u.prop}`).toBeGreaterThan(20);
    }
    expect(relevant.length).toBeGreaterThan(100);
  });

  it('checks literal values against the schema', () => {
    expect(relevant.map(valueProblem).filter(Boolean)).toEqual([]);
  });

  it('has no spread props it cannot check', () => {
    expect(relevant.filter((u) => u.spread).map((u) => `${u.file}: <${u.tag} {...}>`)).toEqual([]);
  });
});

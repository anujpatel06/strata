/**
 * button-variant-danger-to-tone — RFC-001.
 *
 *   <Button variant="danger">        →  <Button tone="danger">
 *   <Button variant={'danger'}>      →  <Button tone="danger">
 *
 * `variant` is dropped because `primary` is the default, and tone="danger" on primary is what variant="danger" was.
 *
 * Rewrites only what it can be sure of: a literal 'danger' on a Button imported from Syntara. Everything else that
 * might be a danger button is reported with its file and line, and left alone:
 *   - variant is an expression              variant={isBad ? 'danger' : 'primary'}   variant={v}
 *     (not reported when every outcome is a literal and none is 'danger': variant={on ? 'primary' : 'outline'})
 *   - props arrive through a spread          <Button {...props} />   (only when no literal variant follows the spread)
 *   - the element already has a tone         <Button variant="danger" tone="neutral">
 *   - props are an object, not JSX           createElement(Button, { variant: 'danger' })
 *
 * It doesn't look at CSS ([data-variant='danger'] keeps working until 1.0.0) or at values that reach Button through
 * your own wrapper components.
 *
 * Options:
 *   --source=<module>   Also treat Button imported from this module as Syntara's, e.g. a registry install at
 *                       "@/components/ui/button". Repeat with commas for several.
 */
import type { API, ASTPath, FileInfo, JSXAttribute, JSXOpeningElement, Options } from 'jscodeshift';

export const parser = 'tsx';

const DEFAULT_SOURCES = ['@syntara/react', '@syntara/react/ui/button'];

export default function transform(file: FileInfo, api: API, options: Options): string | undefined {
  const j = api.jscodeshift;
  const root = j(file.source);
  const extra = typeof options.source === 'string' ? options.source.split(',').map((s) => s.trim()).filter(Boolean) : [];
  const sources = new Set([...DEFAULT_SOURCES, ...extra]);

  // Local names that mean Syntara's Button: `Button`, `Button as Danger`, and namespaces (`* as S` → S.Button).
  const buttons = new Set<string>();
  const namespaces = new Set<string>();
  root.find(j.ImportDeclaration).forEach((p) => {
    if (typeof p.node.source.value !== 'string' || !sources.has(p.node.source.value)) return;
    for (const s of p.node.specifiers ?? []) {
      if (s.type === 'ImportSpecifier' && s.imported.name === 'Button') buttons.add(String((s.local ?? s.imported).name));
      if (s.type === 'ImportNamespaceSpecifier' && s.local) namespaces.add(String(s.local.name));
    }
  });
  if (buttons.size === 0 && namespaces.size === 0) return undefined;

  const notes: string[] = [];
  const note = (node: { loc?: { start: { line: number } } | null }, message: string) =>
    notes.push(`${file.path}:${node.loc?.start.line ?? '?'}  ${message}`);

  const isButton = (el: JSXOpeningElement): boolean => {
    const n = el.name;
    if (n.type === 'JSXIdentifier') return buttons.has(n.name);
    return n.type === 'JSXMemberExpression' && n.object.type === 'JSXIdentifier' && namespaces.has(n.object.name) && n.property.name === 'Button';
  };

  /** 'danger' | 'other' for a literal value, 'dynamic' for anything that's decided at run time. */
  const read = (attr: JSXAttribute): 'danger' | 'other' | 'dynamic' => {
    const v = attr.value;
    if (!v) return 'other';
    if (v.type === 'StringLiteral' || v.type === 'Literal') return v.value === 'danger' ? 'danger' : 'other';
    if (v.type !== 'JSXExpressionContainer') return 'dynamic';
    const e = v.expression;
    if (e.type === 'StringLiteral' || e.type === 'Literal') return e.value === 'danger' ? 'danger' : 'other';
    if (e.type === 'TemplateLiteral' && e.expressions.length === 0) return e.quasis[0]?.value.cooked === 'danger' ? 'danger' : 'other';
    // A choice between literals that are all written out and none of them 'danger' can never be danger.
    return e.type !== 'JSXEmptyExpression' && neverDanger(e) ? 'other' : 'dynamic';
  };

  /** True when every value the expression can produce is a string literal written in place, and none is 'danger'. */
  const neverDanger = (node: object): boolean => {
    type Node = { type: string; [key: string]: unknown };
    const e = node as Node;
    if (e.type === 'StringLiteral' || e.type === 'Literal') return typeof e.value === 'string' && e.value !== 'danger';
    if (e.type === 'ConditionalExpression') return neverDanger(e.consequent as Node) && neverDanger(e.alternate as Node);
    if (e.type === 'LogicalExpression' && (e.operator === '||' || e.operator === '??')) return neverDanger(e.left as Node) && neverDanger(e.right as Node);
    if (e.type === 'TSAsExpression' || e.type === 'TSSatisfiesExpression' || e.type === 'ParenthesizedExpression') return neverDanger(e.expression as Node);
    return false;
  };

  let changed = false;

  root.find(j.JSXOpeningElement).forEach((p: ASTPath<JSXOpeningElement>) => {
    const el = p.node;
    if (!isButton(el)) return;
    const attrs = el.attributes ?? [];
    const named = (name: string) =>
      attrs.filter((a): a is JSXAttribute => a.type === 'JSXAttribute' && a.name.type === 'JSXIdentifier' && a.name.name === name);
    const variants = named('variant');
    // In JSX the last attribute wins, so the last `variant` is the one that renders.
    const variant = variants.at(-1);
    const lastSpread = attrs.map((a) => a.type).lastIndexOf('JSXSpreadAttribute');

    if (!variant) {
      if (lastSpread > -1) note(el, 'props arrive through a spread, so variant can’t be read. Check by hand.');
      return;
    }
    if (lastSpread > attrs.indexOf(variant)) {
      note(el, 'a spread after variant may override it. Check by hand.');
      return;
    }
    const kind = read(variant);
    if (kind === 'other') return;
    if (kind === 'dynamic') {
      note(variant, 'variant is an expression. If it can be "danger", move that case to tone="danger" by hand.');
      return;
    }
    if (variants.length > 1) {
      note(el, 'variant is set more than once. Check by hand.');
      return;
    }
    if (named('tone').length > 0) {
      note(el, 'has variant="danger" and a tone already. Check by hand.');
      return;
    }
    variant.name = j.jsxIdentifier('tone');
    variant.value = j.stringLiteral('danger');
    changed = true;
  });

  // Props written as an object: reported, never rewritten (the object may be shared with other components).
  root.find(j.CallExpression).forEach((p) => {
    const [first, second] = p.node.arguments;
    if (!first || !second || second.type !== 'ObjectExpression') return;
    const target =
      first.type === 'Identifier'
        ? buttons.has(first.name)
        : first.type === 'MemberExpression' && first.object.type === 'Identifier' && namespaces.has(first.object.name) && first.property.type === 'Identifier' && first.property.name === 'Button';
    if (!target) return;
    const hit = second.properties.some(
      (prop) =>
        (prop.type === 'ObjectProperty' || prop.type === 'Property') &&
        ((prop.key.type === 'Identifier' && prop.key.name === 'variant') || (prop.key.type === 'StringLiteral' && prop.key.value === 'variant')) &&
        (prop.value.type === 'StringLiteral' || prop.value.type === 'Literal') &&
        prop.value.value === 'danger',
    );
    if (hit) note(p.node, 'Button is created with a props object that has variant: "danger". Change it to tone: "danger" by hand.');
  });

  if (notes.length) api.report(`\n  ${notes.join('\n  ')}`);
  return changed ? root.toSource({ quote: 'double' }) : undefined;
}

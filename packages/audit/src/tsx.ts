/**
 * Audits TSX with the TypeScript parser: inline style objects, native elements, accessible names and
 * deprecated props. className strings are out of scope. It reads one file, so anything that arrives through
 * props, a spread or another module is not seen.
 */
import { dirname, resolve, sep } from 'node:path';
import ts from 'typescript';
import type { Collector } from './collector';
import { categoryOf, checkDeclaration, type Declaration } from './declarations';
import { INPUT_TYPE_TO_COMPONENT, NATIVE_TO_COMPONENT, loadMeta, metaDir, type Meta, type SyntaraComponent } from './meta';

type Element = ts.JsxOpeningElement | ts.JsxSelfClosingElement;

interface Imported {
  module: string;
  /** The exported name, or "*" for a namespace import. */
  name: string;
}

const SYNTARA_REACT = /^@syntara\/react(\/|$)/;
const SYNTARA_ICONS = /^@syntara\/icons(\/|$)/;

/** Attributes on native elements that take a colour. */
const COLOR_ATTRIBUTES: Readonly<Record<string, string>> = {
  fill: 'fill',
  stroke: 'stroke',
  color: 'color',
  stopColor: 'stop-color',
  floodColor: 'flood-color',
  lightingColor: 'lighting-color',
};

const kebab = (key: string): string => {
  if (key.startsWith('--')) return key;
  const k = key.replace(/[A-Z]/g, (m) => '-' + m.toLowerCase());
  return /^(webkit|moz|ms|o)-/.test(k) ? '-' + k : k;
};

class TsxAudit {
  private readonly imports = new Map<string, Imported>();
  private readonly constants = new Map<string, ts.Expression>();
  private readonly meta: Meta;
  private readonly uiDir: string;

  constructor(
    private readonly file: ts.SourceFile,
    private readonly collector: Collector,
  ) {
    this.meta = loadMeta();
    this.uiDir = resolve(metaDir(), '../src/ui');
  }

  run(): void {
    this.readTopLevel();
    const visit = (node: ts.Node): void => {
      if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) this.element(node);
      ts.forEachChild(node, visit);
    };
    visit(this.file);
  }

  /* ---------------- imports and constants ---------------- */

  private readTopLevel(): void {
    const visit = (node: ts.Node): void => {
      if (ts.isImportDeclaration(node) && ts.isStringLiteral(node.moduleSpecifier)) {
        const module = node.moduleSpecifier.text;
        const clause = node.importClause;
        if (clause?.name) this.imports.set(clause.name.text, { module, name: 'default' });
        const bindings = clause?.namedBindings;
        if (bindings && ts.isNamespaceImport(bindings)) this.imports.set(bindings.name.text, { module, name: '*' });
        if (bindings && ts.isNamedImports(bindings)) {
          for (const el of bindings.elements) this.imports.set(el.name.text, { module, name: (el.propertyName ?? el.name).text });
        }
      }
      if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && node.initializer) {
        const list = node.parent;
        if (ts.isVariableDeclarationList(list) && list.flags & ts.NodeFlags.Const) this.constants.set(node.name.text, node.initializer);
      }
      ts.forEachChild(node, visit);
    };
    visit(this.file);
  }

  private isSyntaraModule(module: string): boolean {
    if (SYNTARA_REACT.test(module)) return true;
    // Inside the library, components import each other as siblings: './button'.
    if (module.startsWith('.') && this.collector.file !== '<snippet>') {
      const target = resolve(dirname(resolve(this.collector.file)), module);
      return target.startsWith(this.uiDir + sep);
    }
    return false;
  }

  /** The Syntara export a tag refers to, e.g. "Button", or null. */
  private syntaraExport(tag: ts.JsxTagNameExpression): string | null {
    if (ts.isIdentifier(tag)) {
      const imported = this.imports.get(tag.text);
      if (!imported || imported.name === '*' || imported.name === 'default') return null;
      return this.isSyntaraModule(imported.module) && this.meta.exports.has(imported.name) ? imported.name : null;
    }
    if (ts.isPropertyAccessExpression(tag) && ts.isIdentifier(tag.expression)) {
      const imported = this.imports.get(tag.expression.text);
      if (imported?.name === '*' && this.isSyntaraModule(imported.module) && this.meta.exports.has(tag.name.text)) return tag.name.text;
    }
    return null;
  }

  private isIcon(tag: ts.JsxTagNameExpression): boolean {
    if (ts.isIdentifier(tag)) {
      if (tag.text === 'svg') return true;
      const imported = this.imports.get(tag.text);
      return !!imported && SYNTARA_ICONS.test(imported.module);
    }
    if (ts.isPropertyAccessExpression(tag) && ts.isIdentifier(tag.expression)) {
      const imported = this.imports.get(tag.expression.text);
      return !!imported && SYNTARA_ICONS.test(imported.module);
    }
    return false;
  }

  /* ---------------- attributes ---------------- */

  private attribute(el: Element, name: string): ts.JsxAttribute | undefined {
    for (const prop of el.attributes.properties) {
      if (ts.isJsxAttribute(prop) && prop.name.getText(this.file) === name) return prop;
    }
    return undefined;
  }

  private hasSpread(el: Element): boolean {
    return el.attributes.properties.some((p) => ts.isJsxSpreadAttribute(p));
  }

  /** The attribute's value when it is a literal string; undefined when it is anything else. */
  private literal(attr: ts.JsxAttribute | undefined): string | undefined {
    const init = attr?.initializer;
    if (!init) return undefined;
    if (ts.isStringLiteral(init)) return init.text;
    if (ts.isJsxExpression(init) && init.expression) {
      const e = init.expression;
      if (ts.isStringLiteral(e) || ts.isNoSubstitutionTemplateLiteral(e)) return e.text;
    }
    return undefined;
  }

  /** True when the attribute is present and not an empty literal. */
  private filled(el: Element, name: string): boolean {
    const attr = this.attribute(el, name);
    if (!attr) return false;
    const text = this.literal(attr);
    return text === undefined ? attr.initializer !== undefined : text.trim() !== '';
  }

  private named(el: Element): boolean {
    return this.filled(el, 'aria-label') || this.filled(el, 'aria-labelledby') || this.filled(el, 'title');
  }

  private hidden(el: Element): boolean {
    const hidden = this.attribute(el, 'aria-hidden');
    if (hidden && this.literal(hidden) !== 'false') return true;
    const role = this.literal(this.attribute(el, 'role'));
    return role === 'presentation' || role === 'none';
  }

  /* ---------------- children ---------------- */

  private children(el: Element): readonly ts.JsxChild[] {
    return ts.isJsxOpeningElement(el) ? el.parent.children : [];
  }

  /**
   * What text the children hold, as far as one file shows: 'text' when there is some, 'unknown' when an
   * expression could produce some, 'none' when there are only elements.
   */
  private textIn(children: readonly ts.JsxChild[]): 'text' | 'unknown' | 'none' {
    let result: 'text' | 'unknown' | 'none' = 'none';
    const expression = (e: ts.Expression): 'text' | 'unknown' | 'none' => {
      if (ts.isParenthesizedExpression(e)) return expression(e.expression);
      if (ts.isStringLiteral(e) || ts.isNoSubstitutionTemplateLiteral(e)) return e.text.trim() === '' ? 'none' : 'text';
      if (ts.isJsxElement(e)) return this.textIn([e]);
      if (ts.isJsxSelfClosingElement(e)) return this.textIn([e]);
      if (ts.isJsxFragment(e)) return this.textIn(e.children);
      if (e.kind === ts.SyntaxKind.NullKeyword || e.kind === ts.SyntaxKind.FalseKeyword) return 'none';
      if (ts.isConditionalExpression(e)) return worst(expression(e.whenTrue), expression(e.whenFalse));
      if (ts.isBinaryExpression(e) && (e.operatorToken.kind === ts.SyntaxKind.AmpersandAmpersandToken || e.operatorToken.kind === ts.SyntaxKind.BarBarToken || e.operatorToken.kind === ts.SyntaxKind.QuestionQuestionToken)) {
        return expression(e.right);
      }
      return 'unknown';
    };
    const worst = (a: 'text' | 'unknown' | 'none', b: 'text' | 'unknown' | 'none'): 'text' | 'unknown' | 'none' =>
      a === 'text' || b === 'text' ? 'text' : a === 'unknown' || b === 'unknown' ? 'unknown' : 'none';

    for (const child of children) {
      let found: 'text' | 'unknown' | 'none' = 'none';
      if (ts.isJsxText(child)) found = child.text.trim() === '' ? 'none' : 'text';
      else if (ts.isJsxExpression(child)) found = child.expression ? expression(child.expression) : 'none';
      else if (ts.isJsxFragment(child)) found = this.textIn(child.children);
      else if (ts.isJsxElement(child)) {
        const open = child.openingElement;
        if (this.named(open) && !this.hidden(open)) found = 'text';
        else if (this.hasSpread(open)) found = 'unknown';
        else if (this.attribute(open, 'children') || this.attribute(open, 'dangerouslySetInnerHTML')) found = 'unknown';
        else if (this.hidden(open)) found = 'none';
        else if (this.isSvg(open) && this.svgTitle(child)) found = 'text';
        else found = this.textIn(child.children);
      } else if (ts.isJsxSelfClosingElement(child)) {
        if (this.hidden(child)) found = 'none';
        else if (this.named(child) || this.filled(child, 'alt')) found = 'text';
        else if (this.hasSpread(child)) found = 'unknown';
        else if (this.isIcon(child.tagName) || this.isNative(child.tagName)) found = 'none';
        // A self-closing component we know nothing about may render text of its own.
        else found = 'unknown';
      }
      result = worst(result, found);
      if (result === 'text') return result;
    }
    return result;
  }

  private isNative(tag: ts.JsxTagNameExpression): boolean {
    return ts.isIdentifier(tag) && /^[a-z]/.test(tag.text);
  }

  private isSvg(el: Element): boolean {
    return ts.isIdentifier(el.tagName) && el.tagName.text === 'svg';
  }

  private svgTitle(svg: ts.JsxElement): boolean {
    return svg.children.some((c) => ts.isJsxElement(c) && c.openingElement.tagName.getText(this.file) === 'title');
  }

  private insideLabel(el: Element): boolean {
    let node: ts.Node | undefined = el.parent;
    while (node) {
      if (ts.isJsxElement(node) && node.openingElement !== el) {
        const tag = node.openingElement.tagName;
        if (ts.isIdentifier(tag) && tag.text === 'label') return true;
        if (this.syntaraExport(tag) === 'Label') return true;
      }
      node = node.parent;
    }
    return false;
  }

  /* ---------------- the element ---------------- */

  private element(el: Element): void {
    const tag = el.tagName;
    const native = this.isNative(tag) ? (tag as ts.Identifier).text : null;
    const syntara = native ? null : this.syntaraExport(tag);
    const start = el.getStart(this.file);
    const tagEnd = tag.getEnd();

    if (native) this.nativeElement(el, native, start, tagEnd);
    else if (syntara) this.syntaraElement(el, syntara);

    this.accessibleName(el, native, syntara, start, tagEnd);
    if (syntara) this.deprecated(el, syntara);
    if (native) this.colorAttributes(el);
    this.style(el);
  }

  private replacementFor(el: Element, native: string): SyntaraComponent | undefined {
    let name = NATIVE_TO_COMPONENT[native];
    if (native === 'input') {
      const typeAttr = this.attribute(el, 'type');
      const type = this.literal(typeAttr);
      if (type === 'hidden') return undefined;
      if (type !== undefined) name = INPUT_TYPE_TO_COMPONENT[type.toLowerCase()];
    }
    return name ? this.meta.components.get(name) : undefined;
  }

  private nativeElement(el: Element, native: string, start: number, tagEnd: number): void {
    if (!(native in NATIVE_TO_COMPONENT)) return;
    const component = this.replacementFor(el, native);
    if (!component) return;
    // A component's own file renders the element it wraps.
    const base = this.collector.file.split(/[\\/]/).pop() ?? '';
    if (component.files.includes(base) && resolve(this.collector.file).startsWith(this.uiDir + sep)) return;
    this.collector.report(
      'native-element',
      start,
      tagEnd,
      `<${native}> is a native element. Syntara has ${component.exportName} for this.`,
      {
        description: `Use <${component.exportName}>: import { ${component.exportName} } from '@syntara/react'. Its props differ from the native element's, so this is a rewrite by hand.`,
        safe: false,
      },
    );
  }

  private syntaraElement(_el: Element, syntara: string): void {
    const component = this.meta.exports.get(syntara);
    if (!component || component.exportName !== syntara) return;
    const targets = new Set([...Object.values(NATIVE_TO_COMPONENT), ...Object.values(INPUT_TYPE_TO_COMPONENT)]);
    if (targets.has(component.name)) this.collector.pass('native-element');
  }

  private accessibleName(el: Element, native: string | null, syntara: string | null, start: number, tagEnd: number): void {
    const rule = 'missing-accessible-name' as const;
    const spread = this.hasSpread(el);

    if (native === 'img') {
      if (spread || this.attribute(el, 'alt') || this.named(el) || this.hidden(el)) this.collector.pass(rule);
      else {
        this.collector.report(rule, start, tagEnd, '<img> has no alt attribute.', {
          description: 'Add alt="…" with what the image shows, or alt="" when it is decoration.',
          safe: false,
        });
      }
      return;
    }

    if (native === 'input' || native === 'select' || native === 'textarea') {
      const type = native === 'input' ? this.literal(this.attribute(el, 'type')) : undefined;
      if (type === 'hidden') return;
      const byValue = (type === 'submit' || type === 'reset') || (type === 'button' && this.filled(el, 'value')) || (type === 'image' && this.filled(el, 'alt'));
      if (spread || byValue || this.named(el) || this.attribute(el, 'id') || this.insideLabel(el)) this.collector.pass(rule);
      else {
        this.collector.report(rule, start, tagEnd, `<${native}> has no label that this file shows: no aria-label, aria-labelledby or id, and no <label> around it.`, {
          description: 'Wrap it in a <label>, or give it an id that a <label htmlFor> points to, or add aria-label. A placeholder is not a label.',
          safe: false,
        });
      }
      return;
    }

    const buttonExports = this.meta.components.get('button');
    const linkExports = this.meta.components.get('link');
    const isSyntaraButton = !!syntara && syntara === buttonExports?.exportName;
    const isSyntaraLink = !!syntara && syntara === linkExports?.exportName;
    const interactive = native === 'button' || native === 'a' || native === 'summary' || isSyntaraButton || isSyntaraLink;
    if (!interactive) return;

    const shown = native ? `<${native}>` : `<${syntara}>`;
    const kids = this.children(el);
    const childrenProp = this.attribute(el, 'children');
    const text = childrenProp ? 'unknown' : this.textIn(kids);

    if (isSyntaraButton && this.literal(this.attribute(el, 'size')) === 'icon') {
      if (spread || this.named(el) || text !== 'none') this.collector.pass(rule);
      else {
        this.collector.report(rule, start, tagEnd, `${shown} with size="icon" has no aria-label or aria-labelledby.`, {
          description: 'Add aria-label="…" that says what the button does, e.g. aria-label="Close".',
          safe: false,
        });
      }
      return;
    }

    // An svg or icon as the only child.
    const solid = kids.filter((c) => !(ts.isJsxText(c) && c.text.trim() === ''));
    const only = solid.length === 1 ? solid[0]! : undefined;
    const icon = only && (ts.isJsxElement(only) ? only.openingElement : ts.isJsxSelfClosingElement(only) ? only : undefined);
    if (!icon || !this.isIcon(icon.tagName)) return;
    const iconNamed = (this.named(icon) && !this.hidden(icon)) || (ts.isJsxElement(only!) && this.svgTitle(only)) || this.hasSpread(icon);
    if (spread || this.named(el) || iconNamed) this.collector.pass(rule);
    else {
      this.collector.report(rule, start, tagEnd, `${shown} holds only an icon and has no aria-label or aria-labelledby.`, {
        description: `Add aria-label="…" to ${shown} that says what it does. Keep the icon aria-hidden.`,
        safe: false,
      });
    }
  }

  private deprecated(el: Element, syntara: string): void {
    const records = this.meta.deprecations.filter((d) => d.component === syntara);
    if (records.length === 0) return;
    let fired = false;
    for (const d of records) {
      const attr = this.attribute(el, d.prop);
      if (!attr) continue;
      const text = this.literal(attr);
      if (d.value !== undefined && text !== d.value) continue;
      fired = true;
      const { record } = d;
      const what = d.value !== undefined ? `${d.prop}="${d.value}"` : d.prop;
      const codemod = `npx @syntara/codemods ${record.codemod} <path>`;
      const newProp = /^([A-Za-z][\w-]*)=/.exec(record.replacement)?.[1];
      const clash = newProp !== undefined && newProp !== d.prop && this.attribute(el, newProp) !== undefined;
      const canRewrite = d.value !== undefined && /^[A-Za-z][\w-]*=("[^"]*"|\{.*\})$/s.test(record.replacement);
      const safe = canRewrite && !this.hasSpread(el) && !clash;
      const why = !canRewrite
        ? ' The new value depends on the old one, so write it by hand.'
        : this.hasSpread(el)
          ? ' Props also arrive through a spread here, so check the result.'
          : clash
            ? ` The element already has ${newProp}, so decide which one stays.`
            : '';
      this.collector.report(
        'deprecated-api',
        attr.getStart(this.file),
        attr.getEnd(),
        `${syntara} ${what} is deprecated since ${record.since} and will be removed in ${record.removal}. ${record.reason}`,
        {
          description: `Use ${record.replacement}.${why} The codemod does the same across files: ${codemod} (${record.rfc}).`,
          ...(canRewrite ? { replacement: record.replacement, start: attr.getStart(this.file), end: attr.getEnd() } : {}),
          safe,
        },
      );
    }
    if (!fired) this.collector.pass('deprecated-api');
  }

  /* ---------------- colours in attributes, and style objects ---------------- */

  private stringDeclaration(prop: string, node: ts.StringLiteral | ts.NoSubstitutionTemplateLiteral, propStart: number, propEnd: number, tsxKey?: Declaration['tsxKey']): Declaration {
    const start = node.getStart(this.file);
    const raw = this.file.text.slice(start + 1, node.getEnd() - 1);
    return {
      prop,
      value: node.text,
      propStart,
      propEnd,
      valueStart: raw === node.text ? start + 1 : null,
      wholeStart: start,
      wholeEnd: node.getEnd(),
      kind: 'tsx-string',
      ...(tsxKey ? { tsxKey } : {}),
    };
  }

  private colorAttributes(el: Element): void {
    for (const prop of el.attributes.properties) {
      if (!ts.isJsxAttribute(prop)) continue;
      const cssProp = COLOR_ATTRIBUTES[prop.name.getText(this.file)];
      const init = prop.initializer;
      if (!cssProp || !init) continue;
      const node = ts.isStringLiteral(init) ? init : ts.isJsxExpression(init) && init.expression && (ts.isStringLiteral(init.expression) || ts.isNoSubstitutionTemplateLiteral(init.expression)) ? init.expression : undefined;
      if (!node) continue;
      checkDeclaration(this.stringDeclaration(cssProp, node, prop.name.getStart(this.file), prop.name.getEnd()), this.collector);
    }
  }

  private unwrap(e: ts.Expression, depth = 0): ts.Expression {
    if (ts.isParenthesizedExpression(e) || ts.isAsExpression(e) || ts.isSatisfiesExpression(e) || ts.isNonNullExpression(e)) return this.unwrap(e.expression, depth);
    if (ts.isIdentifier(e) && depth < 3) {
      const init = this.constants.get(e.text);
      if (init) return this.unwrap(init, depth + 1);
    }
    return e;
  }

  private style(el: Element): void {
    const attr = this.attribute(el, 'style');
    const init = attr?.initializer;
    if (!init || !ts.isJsxExpression(init) || !init.expression) return;
    const object = this.unwrap(init.expression);
    if (!ts.isObjectLiteralExpression(object)) return;
    for (const member of object.properties) {
      if (!ts.isPropertyAssignment(member)) continue;
      const name = member.name;
      const key = ts.isIdentifier(name) ? name.text : ts.isStringLiteral(name) ? name.text : undefined;
      if (key === undefined) continue;
      const prop = kebab(key);
      const tsxKey = prop.startsWith('--') ? undefined : { text: key, quoted: ts.isStringLiteral(name) };
      let firstValue = true;
      for (const value of this.literals(member.initializer)) {
        const propStart = name.getStart(this.file);
        const propEnd = name.getEnd();
        // A conditional has several values for one key; the property is checked once.
        const decl = this.valueDeclaration(prop, value, propStart, propEnd, tsxKey);
        if (!decl) continue;
        checkDeclaration(firstValue ? decl : { ...decl, propertyChecked: true }, this.collector);
        firstValue = false;
      }
    }
  }

  private literals(e: ts.Expression): ts.Expression[] {
    const inner = this.unwrap(e);
    if (ts.isConditionalExpression(inner)) return [...this.literals(inner.whenTrue), ...this.literals(inner.whenFalse)];
    return [inner];
  }

  private valueDeclaration(prop: string, value: ts.Expression, propStart: number, propEnd: number, tsxKey: Declaration['tsxKey']): Declaration | null {
    if (ts.isStringLiteral(value) || ts.isNoSubstitutionTemplateLiteral(value)) {
      return this.stringDeclaration(prop, value, propStart, propEnd, tsxKey);
    }
    let n: number | null = null;
    if (ts.isNumericLiteral(value)) n = Number(value.text);
    else if (ts.isPrefixUnaryExpression(value) && value.operator === ts.SyntaxKind.MinusToken && ts.isNumericLiteral(value.operand)) n = -Number(value.operand.text);
    if (n === null) return null;
    const category = categoryOf(prop);
    const px = category === 'space' || category === 'radius' || category === 'font-size';
    return {
      prop,
      value: px && n !== 0 ? `${n}px` : String(n),
      propStart,
      propEnd,
      valueStart: null,
      wholeStart: value.getStart(this.file),
      wholeEnd: value.getEnd(),
      kind: 'tsx-number',
      ...(tsxKey ? { tsxKey } : {}),
    };
  }
}

export function auditTsx(code: string, collector: Collector): void {
  const file = ts.createSourceFile(collector.file === '<snippet>' ? 'snippet.tsx' : collector.file, code, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  new TsxAudit(file, collector).run();
}

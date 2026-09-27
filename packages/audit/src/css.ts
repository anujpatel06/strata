/** Audits CSS and CSS Modules. Every declaration goes through checkDeclaration. */
import postcss from 'postcss';
import type { Collector } from './collector';
import { checkDeclaration } from './declarations';

export function auditCss(code: string, collector: Collector): void {
  let root: postcss.Root;
  try {
    root = postcss.parse(code, { from: collector.file });
  } catch (error) {
    collector.notes.push(`${collector.file} could not be parsed as CSS and was not checked: ${(error as Error).message}`);
    return;
  }
  root.walkDecls((decl) => {
    const start = decl.source?.start?.offset;
    const end = decl.source?.end?.offset;
    if (start === undefined || end === undefined) return;
    // The text as written, so offsets hold even when the value has a comment in it.
    const text = code.slice(start, end + 1);
    const between = decl.raws.between ?? ':';
    const valueStart = start + decl.prop.length + between.length;
    const raw = decl.raws.value?.raw ?? decl.value;
    if (code.slice(valueStart, valueStart + raw.length) !== raw || !text.startsWith(decl.prop)) return;
    checkDeclaration(
      {
        prop: decl.prop.startsWith('--') ? decl.prop : decl.prop.toLowerCase(),
        value: raw,
        propStart: start,
        propEnd: start + decl.prop.length,
        valueStart,
        wholeStart: valueStart,
        wholeEnd: valueStart + raw.length,
        declEnd: valueStart + raw.length,
        kind: 'css',
      },
      collector,
    );
  });
}

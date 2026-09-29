import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import * as icons from '@syntara/icons';
import type { ComponentMeta } from '../../react/meta/schema';
import {
  PKG_DIR,
  SCHEMA_DIR,
  buildSchemas,
  deprecationPolicy,
  deriveType,
  evolutionProblems,
  iconNamesFrom,
  readGapTokens,
  readMetas,
  readPrevious,
  schemasModule,
  serialise,
  type Inputs,
} from '../scripts/build-schemas';
import { SCHEMA_VERSION, urn } from '../src/contract';
import type { Manifest } from '../src/manifest-types';
import { createAjv } from '../src/validate';
import { EXCLUDED_NODES, NODES } from '../src/wire';

const inputs = (): Inputs => ({
  metas: readMetas(),
  iconNames: iconNamesFrom(icons as Record<string, unknown>),
  gapTokens: readGapTokens(),
  previous: readPrevious(),
});
const committed = (rel: string) => readFileSync(path.join(SCHEMA_DIR, rel), 'utf8');

describe('generated files', () => {
  const files = buildSchemas(inputs());

  it('are not stale: regenerating in memory gives the committed files', () => {
    for (const [rel, value] of Object.entries(files)) expect(committed(rel), `schema/${rel} is stale: run pnpm --filter @syntara/sdui generate`).toBe(serialise(value));
    expect(readFileSync(path.join(PKG_DIR, 'src/schemas.generated.ts'), 'utf8')).toBe(schemasModule(files));
  });

  it('has no leftover node files', () => {
    const onDisk = readdirSync(path.join(SCHEMA_DIR, 'nodes')).map((f) => `nodes/${f}`).sort();
    expect(onDisk).toEqual(Object.keys(files).filter((f) => f.startsWith('nodes/')).sort());
  });

  it('are stable: two runs give the same output', () => {
    expect(serialise(buildSchemas(inputs()))).toBe(serialise(files));
  });

  it('writes one schema per node, with title, description and x-syntara metadata from meta', () => {
    const metas = readMetas();
    for (const spec of NODES) {
      const file = Object.entries(files).find(([, s]) => s.$id === urn(`node:${spec.type}`));
      expect(file, spec.type).toBeDefined();
      const schema = file![1];
      expect(schema.$schema).toBe('https://json-schema.org/draft/2020-12/schema');
      expect(schema.title).toBe(spec.type);
      const meta = spec.meta ? metas.get(spec.meta) : undefined;
      expect(schema.description).toBe(spec.description ?? meta?.description);
      expect(schema['x-syntara']).toMatchObject({
        node: spec.type,
        component: spec.meta ?? null,
        maturity: meta?.maturity ?? 'alpha',
        schemaVersion: SCHEMA_VERSION,
      });
    }
  });

  it('compiles every schema in ajv strict mode', () => {
    const ajv = createAjv();
    expect(ajv.opts.strict).toBe(true);
    for (const value of Object.values(files)) {
      if (typeof value.$id !== 'string') continue; // manifest.json isn't a schema
      expect(() => ajv.getSchema(value.$id as string), value.$id as string).not.toThrow();
      expect(ajv.getSchema(value.$id as string)).toBeTypeOf('function');
    }
  });

  it('takes icon names from the real exports of @syntara/icons', () => {
    const defs = files['defs.schema.json'] as { $defs: { IconName: { enum: string[] } } };
    const names = Object.values(icons)
      .filter((v) => typeof v === 'function' && 'iconName' in v)
      .map((v) => (v as unknown as { iconName: string }).iconName)
      .sort();
    expect(names.length).toBeGreaterThan(0);
    expect(defs.$defs.IconName.enum).toEqual([...new Set(names)]);
    // createIcon is an export too, but not an icon.
    expect(defs.$defs.IconName.enum).not.toContain('createIcon');
  });

  it('takes gap tokens from the theme engine token contract', () => {
    const gaps = readGapTokens();
    expect(gaps).toContain('space-4');
    expect(gaps).toContain('section-gap');
    expect(gaps.every((g) => /^space-\d+$|^section-gap$/.test(g))).toBe(true);
  });

  it('leaves deprecated values out: Button variant "danger" is not in the schema', () => {
    const button = files['nodes/button.schema.json'] as { properties: { props: { properties: { variant: { enum: string[] } } } } };
    expect(button.properties.props.properties.variant.enum).not.toContain('danger');
    expect(button.properties.props.properties.variant.enum).toContain('primary');
    const manifest = files['manifest.json'] as unknown as Manifest;
    expect(manifest.nodes.Button!.excluded).toContainEqual(expect.objectContaining({ prop: 'variant', value: 'danger' }));
    expect(manifest.nodes.Button!.props.variant!.values).not.toContain('danger');
  });
});

describe('every meta prop in the slice is decided', () => {
  const manifest = buildSchemas(inputs())['manifest.json'] as unknown as Manifest;
  const metas = readMetas();

  it('is on the wire, maps to action, children or a slot, or is excluded with a reason', () => {
    for (const spec of NODES.filter((n) => n.meta)) {
      const node = manifest.nodes[spec.type]!;
      for (const prop of metas.get(spec.meta!)!.props.filter((p) => p.component === spec.type)) {
        const wire = Object.values(node.props).some((p) => p.from === prop.name);
        const slot = Object.values(node.slots).some((s) => s.from === prop.name);
        const action = node.action?.from.includes(prop.name) ?? false;
        const children = prop.name === 'children' && node.children.kind !== 'none';
        const excluded = node.excluded.find((x) => x.prop === prop.name && x.value === undefined);
        expect(wire || slot || action || children || !!excluded, `${spec.type}.${prop.name}`).toBe(true);
        if (excluded) expect(excluded.reason.length, `${spec.type}.${prop.name} reason`).toBeGreaterThan(20);
      }
    }
  });

  it('covers every component export of the in-scope meta files, or excludes it with a reason', () => {
    const inScope = new Set(NODES.map((n) => n.meta).filter(Boolean));
    for (const name of inScope) {
      for (const exp of metas.get(name!)!.exports.filter((e) => /^[A-Z]/.test(e))) {
        const onWire = NODES.some((n) => n.type === exp);
        expect(onWire || EXCLUDED_NODES[exp] !== undefined, exp).toBe(true);
      }
    }
  });

  it('stops when a meta type can\'t be derived and has no rule', () => {
    const metas = readMetas();
    const badge = structuredClone(metas.get('badge')!) as ComponentMeta;
    badge.props.push({ component: 'Badge', name: 'render', type: '(state) => ReactNode', description: 'A render prop.' });
    metas.set('badge', badge);
    expect(() => buildSchemas({ ...inputs(), metas })).toThrow(/Badge\.render: meta type .* can't be derived safely/);
  });
});

describe('deriveType', () => {
  it('derives the safe types only', () => {
    expect(deriveType('boolean')).toMatchObject({ schema: { type: 'boolean' } });
    expect(deriveType('number')).toMatchObject({ schema: { type: 'number' } });
    expect(deriveType('string')).toMatchObject({ schema: { type: 'string' } });
    expect(deriveType('number[]')).toMatchObject({ schema: { type: 'array', items: { type: 'number' } } });
    expect(deriveType("'sm' | 'md'")).toMatchObject({ schema: { type: 'string', enum: ['sm', 'md'] } });
    expect(deriveType('1 | 2 | 3')).toMatchObject({ schema: { type: 'integer', enum: [1, 2, 3] } });
    expect(deriveType("boolean | 'assertive' | 'polite'")).toMatchObject({ schema: { enum: [true, false, 'assertive', 'polite'] } });
    for (const t of ['ReactNode', 'ReactNode | false', '(e: PressEvent) => void', 'Intl.NumberFormatOptions', "Omit<Intl.NumberFormatOptions, 'style'>"])
      expect(deriveType(t), t).toBeNull();
  });
});

describe('deprecations across versions (GOVERNANCE.md §5)', () => {
  const record = {
    value: "'danger'",
    since: '0.2.0',
    removal: '1.0.0',
    replacement: 'tone="danger"',
    reason: 'Tone is separate from emphasis.',
    codemod: 'button-variant-danger-to-tone',
    rfc: '001-button-tone',
  };
  const previous = (version: string, values: string[]): Manifest =>
    ({
      schemaVersion: version,
      nodes: { Button: { props: { variant: { from: 'variant', kind: 'enum', values } } } },
    }) as unknown as Manifest;

  it('leaves out a value deprecated before this major had it: a new contract starts clean', () => {
    const r = deprecationPolicy('Button', 'variant', ['primary', 'danger'], [record], undefined, '1.0.0');
    expect(r.keep).toEqual(['primary']);
    expect(r.excluded.map((x) => x.value)).toEqual(['danger']);
  });

  it('keeps a value this major already had, marked deprecated, until the next major', () => {
    const r = deprecationPolicy('Button', 'variant', ['primary', 'danger'], [record], previous('1.2.0', ['primary', 'danger']), '1.3.0');
    expect(r.keep).toEqual(['primary']);
    expect(r.deprecated.map((x) => x.value)).toEqual(['danger']);
    expect(r.excluded).toEqual([]);
  });

  it('removes it in the next major', () => {
    const r = deprecationPolicy('Button', 'variant', ['primary', 'danger'], [record], previous('1.3.0', ['primary', 'danger']), '2.0.0');
    expect(r.excluded.map((x) => x.value)).toEqual(['danger']);
  });

  it('writes a kept deprecated value as a deprecated branch of the schema', () => {
    const base = inputs();
    const prev = structuredClone(buildSchemas(base)['manifest.json']) as unknown as Manifest;
    prev.nodes.Button!.props.variant!.values!.push('danger');
    const files = buildSchemas({ ...base, previous: prev, schemaVersion: '1.1.0' });
    const variant = (files['nodes/button.schema.json'] as { properties: { props: { properties: { variant: { anyOf: unknown[] } } } } })
      .properties.props.properties.variant;
    expect(variant.anyOf).toContainEqual(expect.objectContaining({ const: 'danger', deprecated: true }));
    const manifest = files['manifest.json'] as unknown as Manifest;
    expect(manifest.nodes.Button!.props.variant!.deprecatedValues).toEqual([{ value: 'danger', replacement: 'tone="danger"' }]);
  });
});

describe('minor versions only add', () => {
  const base = () => structuredClone(buildSchemas(inputs())['manifest.json']) as unknown as Manifest;

  it('refuses to remove anything within a major', () => {
    const prev = base();
    const next = base();
    delete next.nodes.Badge!.props.dot;
    next.schemaVersion = '1.1.0';
    expect(evolutionProblems(prev, next).join()).toMatch(/major change.*Badge: prop dot/);
  });

  it('allows a removal in a new major', () => {
    const prev = base();
    const next = base();
    delete next.nodes.Badge!.props.dot;
    next.schemaVersion = '2.0.0';
    expect(evolutionProblems(prev, next)).toEqual([]);
  });

  it('asks for a minor bump when the wire gains something', () => {
    // Derived from the shipping version, not hard-coded, so this keeps testing the rule after each real bump.
    const [major, minor] = SCHEMA_VERSION.split('.').map(Number) as [number, number];
    const nextMinor = `${major}.${minor + 1}.0`;
    const prev = base();
    const next = base();
    next.icons = [...next.icons, 'new-icon'];
    expect(evolutionProblems(prev, next).join()).toMatch(
      new RegExp(`Bump SCHEMA_VERSION .* to ${nextMinor.replace(/\./g, '\\.')}`),
    );
    next.schemaVersion = nextMinor;
    expect(evolutionProblems(prev, next)).toEqual([]);
  });
});

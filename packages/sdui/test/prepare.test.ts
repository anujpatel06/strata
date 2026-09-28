import { MAX_DEPTH, prepareScreen, type Issue, type Prepared } from '../src/index';

const doc = (root: unknown, version = '1.0.0', extra: Record<string, unknown> = {}) => ({
  schemaVersion: version,
  screen: { id: 'test', title: 'Test' },
  root,
  ...extra,
});
const text = (children: string, more: Record<string, unknown> = {}) => ({ type: 'Text', children, ...more });
const codes = (p: Prepared) => p.issues.map((i: Issue) => i.code);
const ok = (p: Prepared) => {
  if (!p.ok) throw new Error(`expected ok, got ${JSON.stringify(p.issues)}`);
  return p.document;
};

describe('versions', () => {
  it('draws a newer minor and reports it once', () => {
    const p = prepareScreen(doc(text('Hi'), '1.4.0'));
    expect(p.ok).toBe(true);
    expect(codes(p)).toEqual(['newer-minor']);
  });

  it('refuses another major', () => {
    for (const v of ['2.0.0', '0.9.0']) {
      const p = prepareScreen(doc(text('Hi'), v));
      expect(p.ok).toBe(false);
      expect(codes(p)).toEqual(['unsupported-version']);
    }
  });

  it('refuses a document with no usable version', () => {
    expect(codes(prepareScreen(doc(text('Hi'), 'latest')))).toEqual(['invalid-document']);
    expect(codes(prepareScreen('not json'))).toEqual(['invalid-document']);
    expect(codes(prepareScreen(null))).toEqual(['invalid-document']);
  });
});

describe('unknown components', () => {
  it('draws the fallback node in its place', () => {
    const p = prepareScreen(doc({ type: 'Stack', children: [{ type: 'Carousel', props: { items: 3 }, fallback: text('3 offers') }] }));
    expect(ok(p).root.children).toEqual([{ type: 'Text', children: '3 offers' }]);
    expect(p.issues).toContainEqual(expect.objectContaining({ code: 'unknown-component', path: '/root/children/0', nodeType: 'Carousel' }));
  });

  it('draws nothing without a fallback', () => {
    const p = prepareScreen(doc({ type: 'Stack', children: [{ type: 'Carousel' }, text('After')] }));
    expect(ok(p).root.children).toEqual([{ type: 'Text', children: 'After' }]);
    expect(p.issues[0]?.message).toMatch(/Unknown node type "Carousel"\. Nothing is drawn\./);
  });

  it('falls back the whole screen when the root itself is unknown and has no fallback', () => {
    const p = prepareScreen(doc({ type: 'Carousel' }));
    expect(p.ok).toBe(false);
    expect(codes(p)).toEqual(['unknown-component', 'invalid-document']);
  });

  it('treats a node with an unknown action type as unknown', () => {
    const p = prepareScreen(
      doc({ type: 'Stack', children: [{ type: 'Button', children: 'Share', action: { type: 'share', url: '/x' }, fallback: text('Share from the menu') }] }),
    );
    expect(ok(p).root.children).toEqual([{ type: 'Text', children: 'Share from the menu' }]);
    expect(codes(p)).toEqual(['unknown-action']);
  });

  it('never looks a type up on the prototype', () => {
    for (const type of ['__proto__', 'constructor', 'toString', 'hasOwnProperty', 'ThemeScope']) {
      const p = prepareScreen(doc({ type: 'Stack', children: [{ type }] }));
      expect(ok(p).root.children, type).toEqual([]);
      expect(codes(p), type).toEqual(['unknown-component']);
    }
  });
});

describe('unknown props, values and fields', () => {
  it('ignores an unknown prop and reports it', () => {
    const p = prepareScreen(doc(text('Hi', { props: { tone: 'subtle', shimmer: true } })));
    expect(ok(p).root.props).toEqual({ tone: 'subtle' });
    expect(p.issues).toContainEqual(expect.objectContaining({ code: 'unknown-prop', path: '/root/props/shimmer' }));
  });

  it('drops an unknown enum value so the component default applies', () => {
    const p = prepareScreen(doc({ type: 'Button', props: { variant: 'glass', size: 'sm' }, children: 'Go', action: { type: 'event', name: 'go' } }));
    expect(ok(p).root.props).toEqual({ size: 'sm' });
    expect(p.issues).toContainEqual(
      expect.objectContaining({ code: 'unknown-value', path: '/root/props/variant', message: expect.stringMatching(/default \("primary"\) is used/) }),
    );
  });

  it('drops an unknown icon', () => {
    const p = prepareScreen(doc({ type: 'Badge', props: { icon: { icon: 'unicorn' } }, children: 'New' }));
    expect(ok(p).root.props).toEqual({});
    const q = prepareScreen(doc({ type: 'Button', children: [{ icon: 'unicorn' }, 'Go'], action: { type: 'event', name: 'go' } }));
    expect(ok(q).root.children).toEqual(['Go']);
    expect(codes(q)).toEqual(['unknown-value']);
  });

  it('ignores theme and tenant fields and says why', () => {
    const p = prepareScreen(doc(text('Hi', { theme: 'vela' }), '1.0.0', { tenant: 'vela' }));
    expect(p.ok).toBe(true);
    expect(p.issues.map((i) => i.message).join()).toMatch(/belong to the client/);
    expect(JSON.stringify(ok(p))).not.toMatch(/vela/);
  });

  it('never passes style, className or markup on', () => {
    const p = prepareScreen(doc(text('Hi', { props: { style: { color: 'red' }, className: 'x', html: '<b>x</b>' }, dangerouslySetInnerHTML: { __html: 'x' } })));
    expect(ok(p).root).toEqual({ type: 'Text', props: {}, children: 'Hi' });
    expect(codes(p)).toEqual(['unknown-prop', 'unknown-prop', 'unknown-prop', 'unknown-field']);
  });

  it("doesn't let a __proto__ key reach an object's prototype", () => {
    const raw = JSON.parse('{"schemaVersion":"1.0.0","screen":{"id":"t","title":"T"},"root":{"type":"Text","props":{"__proto__":{"polluted":true}},"children":"Hi"}}');
    const p = prepareScreen(raw);
    expect(ok(p).root.props).toEqual({});
    expect(({} as Record<string, unknown>).polluted).toBeUndefined();
    expect(Object.getPrototypeOf(ok(p).root.props)).toBe(Object.prototype);
  });
});

describe('what is left is checked strictly', () => {
  it('falls back the screen when an accessible name is missing', () => {
    const p = prepareScreen(doc({ type: 'Button', props: { size: 'icon' }, children: [{ icon: 'x' }], action: { type: 'event', name: 'close' } }));
    expect(p.ok).toBe(false);
    expect(p.issues).toContainEqual(expect.objectContaining({ code: 'invalid-document', rule: 'button-icon-size-name' }));
  });

  it('falls back the screen on an unsafe link', () => {
    const p = prepareScreen(doc({ type: 'Link', children: 'Pay', action: { type: 'navigate', href: 'javascript:pay()' } }));
    expect(p.ok).toBe(false);
    expect(p.issues[0]?.message).toMatch(/https:\/\//);
  });

  it('cuts off trees deeper than MAX_DEPTH', () => {
    let node: unknown = text('Deep');
    for (let i = 0; i < MAX_DEPTH + 2; i++) node = { type: 'Stack', children: [node] };
    const p = prepareScreen(doc(node));
    expect(p.ok).toBe(true);
    expect(codes(p)).toContain('too-deep');
  });

  it('reports duplicate sibling ids', () => {
    const p = prepareScreen(doc({ type: 'Stack', children: [text('A', { id: 'row' }), text('B', { id: 'row' })] }));
    expect(p.ok).toBe(true);
    expect(codes(p)).toEqual(['duplicate-id']);
  });
});

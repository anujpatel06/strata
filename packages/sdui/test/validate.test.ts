import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { validateScreen } from '../src/index';

const EXAMPLES = path.resolve(__dirname, '../examples');
const examples = readdirSync(EXAMPLES).filter((f) => f.endsWith('.json'));

/** A valid screen around one node. */
const screen = (root: unknown, extra: Record<string, unknown> = {}) => ({
  schemaVersion: '1.0.0',
  screen: { id: 'test', title: 'Test' },
  root,
  ...extra,
});
const button = (props: Record<string, unknown> = {}, children: unknown = 'Pay now', action: unknown = { type: 'event', name: 'pay' }) => ({
  type: 'Button',
  props,
  children,
  action,
});
const link = (href: string) => ({ type: 'Link', children: 'Details', action: { type: 'navigate', href } });

function expectInvalid(doc: unknown, pattern: RegExp) {
  const r = validateScreen(doc);
  expect(r.valid).toBe(false);
  const text = r.errors.map((e) => `${e.path} ${e.message}`).join('\n');
  expect(text).toMatch(pattern);
  // Messages are written for people: no raw ajv phrasing.
  expect(text).not.toMatch(/must match "then" schema|must match a schema in anyOf|must NOT have additional properties/);
  return r;
}

describe('examples', () => {
  it('has three example documents', () => {
    expect(examples.sort()).toEqual(['account-overview.json', 'loyalty-summary.json', 'order-status.json']);
  });
  it.each(examples)('%s validates', (file) => {
    const r = validateScreen(JSON.parse(readFileSync(path.join(EXAMPLES, file), 'utf8')));
    expect(r.errors).toEqual([]);
    expect(r.valid).toBe(true);
  });
});

describe('errors', () => {
  it('point at the node and say what to send instead', () => {
    const r = validateScreen(screen({ type: 'Stack', children: [button({ size: 'icon' }, [{ icon: 'x' }])] }));
    expect(r.errors).toContainEqual({
      path: '/root/children/0',
      rule: 'button-icon-size-name',
      message: 'A Button with size "icon" shows no text, so it needs props.ariaLabel.',
    });
  });
});

describe('errors inside a slot named "action"', () => {
  // Found while building the docs demo: the error was blamed on the Alert, with the Alert's rule and message.
  it('name the Button in the slot, not the Alert that holds it', () => {
    const alert = { type: 'Alert', props: { tone: 'warning', title: 'Card expiring' }, children: 'Order a replacement.', slots: { action: button({ size: 'icon' }, [{ icon: 'x' }]) } };
    const r = validateScreen(screen({ type: 'Stack', children: [alert] }));
    expect(r.valid).toBe(false);
    expect(r.errors).toContainEqual({
      path: '/root/children/0/slots/action',
      rule: 'button-icon-size-name',
      message: 'A Button with size "icon" shows no text, so it needs props.ariaLabel.',
    });
    expect(r.errors.map((e) => e.message).join(' ')).not.toMatch(/An Alert needs/);
  });

  it('still skip a node\'s own action field, which has a type but is not a node', () => {
    const r = validateScreen(screen(button({}, 'Pay now', { type: 'event', name: 'pay', payload: { nested: { no: true } } })));
    expect(r.valid).toBe(false);
    expect(r.errors.every((e) => !e.path.endsWith('/action') || e.path === '/root/action')).toBe(true);
    expect(r.errors[0]?.path.startsWith('/root')).toBe(true);
  });
});

describe('links: only https and app paths', () => {
  it.each([
    'javascript:alert(1)',
    'JavaScript:alert(1)',
    ' javascript:alert(1)',
    'data:text/html,<script>alert(1)</script>',
    'vbscript:msgbox',
    'http://example.com',
    '//evil.example',
    '/\\evil.example',
    'mailto:help@example.com',
    'tel:+911234567890',
    'https://',
    'https://exa mple.com',
    '/orders\t/1',
    'orders/1',
  ])('rejects %j', (href) => {
    expectInvalid(screen(link(href)), /must be an https:\/\/ URL or an app path/);
    expectInvalid(screen(button({}, 'Go', { type: 'navigate', href })), /must be an https:\/\/ URL or an app path/);
  });

  it.each(['https://example.com/help', '/orders/58-2931', '/', '/search?q=milk#top'])('accepts %j', (href) => {
    expect(validateScreen(screen(link(href))).errors).toEqual([]);
  });

  it('rejects an event on a Link: a link navigates', () => {
    expectInvalid(screen({ type: 'Link', children: 'Details', action: { type: 'event', name: 'open' } }), /action type must be "navigate"/);
  });

  it('rejects an unknown action type and nested payloads', () => {
    expectInvalid(screen(button({}, 'Go', { type: 'script', code: 'x' })), /action type "script" isn't known/);
    expectInvalid(screen(button({}, 'Go', { type: 'event', name: 'go', payload: { nested: { a: 1 } } })), /payload|nested/);
  });

  it('requires an action on a Button', () => {
    expectInvalid(screen({ type: 'Button', children: 'Go' }), /"action" is required/);
  });

  it('rejects http and data: image URLs', () => {
    expectInvalid(screen({ type: 'Avatar', props: { name: 'Priya Raman', src: 'http://example.com/a.png' } }), /src must be an https:\/\/ URL/);
    expectInvalid(
      screen({ type: 'IconTile', props: { src: 'data:image/svg+xml,<svg onload=alert(1)>', alt: 'Shop' } }),
      /src must be an https:\/\/ URL/,
    );
  });
});

describe('no markup, no styling, no functions', () => {
  it('rejects html and dangerouslySetInnerHTML', () => {
    expectInvalid(screen({ type: 'Text', props: { html: '<b>Hi</b>' }, children: 'Hi' }), /Markup and functions never cross the wire/);
    expectInvalid(screen({ type: 'Text', dangerouslySetInnerHTML: { __html: '<b>Hi</b>' }, children: 'Hi' }), /Markup and functions/);
  });

  it('rejects style and className, on props and on the node', () => {
    expectInvalid(screen({ type: 'Text', props: { style: { color: 'red' } }, children: 'Hi' }), /"style" isn't allowed\. Raw CSS/);
    expectInvalid(screen({ type: 'Text', style: { color: 'red' }, children: 'Hi' }), /"style" isn't allowed/);
    expectInvalid(screen(button({ className: 'w-full' })), /"className" isn't allowed/);
  });

  it('rejects onPress: functions never cross the wire', () => {
    expectInvalid(screen(button({ onPress: 'pay()' })), /onPress/);
  });

  it('rejects children that are objects pretending to be markup', () => {
    expectInvalid(screen({ type: 'Text', children: { __html: '<img src=x onerror=alert(1)>' } }), /children must be string/);
  });
});

describe('tokens only', () => {
  it('rejects raw colours and sizes', () => {
    expectInvalid(screen({ type: 'Badge', props: { tone: '#ff0000' }, children: 'Paid' }), /tone "#ff0000" isn't one of/);
    expectInvalid(screen({ type: 'Text', props: { size: '14px' }, children: 'Hi' }), /size "14px" isn't one of/);
    expectInvalid(screen({ type: 'Stack', props: { gap: '13px' }, children: [] }), /gap "13px" isn't one of "space-0"/);
    expectInvalid(screen({ type: 'Text', props: { color: 'red' }, children: 'Hi' }), /"color" isn't part of Text's props/);
  });
});

describe('no brand or tenant in a screen', () => {
  it.each(['theme', 'tenant', 'brand', 'scheme', 'density'])('rejects %s at the top level, in screen and in props', (key) => {
    expectInvalid(screen({ type: 'Text', children: 'Hi' }, { [key]: 'vela' }), /belong to the client/);
    expectInvalid({ ...screen({ type: 'Text', children: 'Hi' }), screen: { id: 't', title: 'T', [key]: 'vela' } }, /belong to the client/);
    expectInvalid(screen({ type: 'Text', props: { [key]: 'vela' }, children: 'Hi' }), /belong to the client/);
  });
});

describe('deprecated API is not in the contract', () => {
  it('rejects Button variant "danger" and names the replacement', () => {
    expectInvalid(screen(button({ variant: 'danger' })), /variant "danger" isn't accepted\. Deprecated in @strata\/react 0\.2\.0 \(use tone="danger"/);
    expect(validateScreen(screen(button({ variant: 'primary', tone: 'danger' }))).valid).toBe(true);
  });
});

describe('accessibility is part of the contract', () => {
  it('an icon-only Button needs ariaLabel', () => {
    expectInvalid(screen(button({}, [{ icon: 'x' }])), /needs props\.ariaLabel/);
    expectInvalid(screen(button({ ariaLabel: '   ' }, [{ icon: 'x' }])), /needs props\.ariaLabel/);
    expectInvalid(screen(button({ size: 'icon' }, 'Close')), /size "icon" shows no text/);
    expect(validateScreen(screen(button({ size: 'icon', ariaLabel: 'Close' }, [{ icon: 'x' }]))).valid).toBe(true);
    expect(validateScreen(screen(button({}, [{ icon: 'download' }, 'Download']))).valid).toBe(true);
  });

  it('a Link needs text', () => {
    expectInvalid(screen({ type: 'Link', children: [{ icon: 'external-link' }], action: { type: 'navigate', href: '/a' } }), /A Link needs text/);
  });

  it('an Avatar needs a name or alt', () => {
    expectInvalid(screen({ type: 'Avatar', props: { size: 'lg' } }), /An Avatar needs props\.name or props\.alt/);
    expectInvalid(screen({ type: 'Avatar' }), /An Avatar needs props\.name or props\.alt/);
    expectInvalid(screen({ type: 'Avatar', props: { alt: '' } }), /An Avatar needs props\.name or props\.alt/);
    expect(validateScreen(screen({ type: 'Avatar', props: { name: 'Ravi Kumar', alt: '' } })).valid).toBe(true);
    expect(validateScreen(screen({ type: 'Avatar', props: { alt: 'Support team' } })).valid).toBe(true);
  });

  it('a ProgressBar and a Meter need a label', () => {
    expectInvalid(screen({ type: 'ProgressBar', props: { value: 40 } }), /A ProgressBar needs a name/);
    expectInvalid(screen({ type: 'Meter', props: { value: 40 } }), /A Meter needs a name/);
    expectInvalid(screen({ type: 'Meter', props: { value: 40, label: ' ' } }), /A Meter needs a name/);
    expect(validateScreen(screen({ type: 'Meter', props: { value: 40, ariaLabel: 'Wallet used' } })).valid).toBe(true);
  });

  it('status is never colour alone: Badge and Alert need text', () => {
    expectInvalid(screen({ type: 'Badge', props: { tone: 'success' } }), /A Badge needs text/);
    expectInvalid(screen({ type: 'Badge', props: { tone: 'success' }, children: '' }), /A Badge needs text/);
    expectInvalid(screen({ type: 'Alert', props: { tone: 'danger' } }), /An Alert needs props\.title or text/);
    expect(validateScreen(screen({ type: 'Alert', props: { tone: 'danger' }, children: 'Payment failed.' })).valid).toBe(true);
  });

  it('headings, stat tiles and empty states need their text', () => {
    expectInvalid(screen({ type: 'Heading', children: '' }), /A Heading needs text/);
    expectInvalid(screen({ type: 'StatTile', props: { label: 'Balance', value: '' } }), /A StatTile needs props\.label and props\.value/);
    expectInvalid(screen({ type: 'EmptyState', props: { description: 'Nothing here' } }), /An EmptyState needs props\.title/);
  });

  it('an image IconTile says whether it is decorative', () => {
    expectInvalid(screen({ type: 'IconTile', props: { src: 'https://example.com/logo.png' } }), /needs props\.alt/);
    expect(validateScreen(screen({ type: 'IconTile', props: { src: 'https://example.com/logo.png', alt: '' } })).valid).toBe(true);
  });
});

describe('structure and versions', () => {
  it('rejects unknown node types, including names that exist in @strata/react but are not on the wire', () => {
    expectInvalid(screen({ type: 'Carousel' }), /Unknown node type "Carousel"/);
    expectInvalid(screen({ type: 'ThemeScope' }), /Unknown node type "ThemeScope"/);
    expectInvalid(screen({ type: '__proto__' }), /Unknown node type "__proto__"/);
    expectInvalid(screen({ type: 'CardMedia' }), /"CardMedia" isn't on the wire/);
  });

  it('keeps card parts inside a card', () => {
    expectInvalid(screen({ type: 'CardTitle', children: 'Balance' }), /"CardTitle".*only goes inside its parent/);
    expectInvalid(screen({ type: 'Card', children: [{ type: 'Text', children: 'Hi' }] }), /Unknown node type "Text".*Allowed here: CardHeader, CardContent, CardFooter/);
  });

  it('rejects a document for another major, or with no version', () => {
    expectInvalid({ ...screen({ type: 'Text', children: 'Hi' }), schemaVersion: '2.0.0' }, /must be a 1\.x\.y version/);
    expectInvalid({ ...screen({ type: 'Text', children: 'Hi' }), schemaVersion: '1.0' }, /must be a 1\.x\.y version/);
    const { schemaVersion: _, ...noVersion } = screen({ type: 'Text', children: 'Hi' });
    expectInvalid(noVersion, /"schemaVersion" is required/);
  });

  it('rejects unknown icons', () => {
    expectInvalid(screen({ type: 'Badge', props: { icon: { icon: 'unicorn' } }, children: 'New' }), /unknown icon "unicorn"/);
  });

  it('rejects unknown props with the list of known ones', () => {
    expectInvalid(screen({ type: 'Badge', props: { glow: true }, children: 'New' }), /"glow" isn't part of Badge's props\. Known: tone, variant, size, icon, dot/);
  });

  it('explains excluded props', () => {
    expectInvalid(screen({ type: 'Amount', props: { value: 1, currency: 'INR', locale: 'en-IN' } }), /props\.locale stays on the client\. The client's locale/);
    expectInvalid(screen({ type: 'Link', props: { href: '/a' }, children: 'A', action: { type: 'navigate', href: '/a' } }), /props\.href isn't sent\. Use the node's "action"/);
  });
});

describe('the entry point', () => {
  it('imports no React', () => {
    const src = path.resolve(__dirname, '../src');
    for (const f of readdirSync(src).filter((f) => f.endsWith('.ts'))) {
      const code = readFileSync(path.join(src, f), 'utf8');
      expect(code, f).not.toMatch(/from ['"](react|react-dom|@strata\/react|@strata\/icons)['"]/);
    }
  });
});

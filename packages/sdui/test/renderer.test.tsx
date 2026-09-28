import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeScope } from '@syntara/react';
import { manifest } from '../src/index';
import { REGISTRY, SyntaraScreen, type Issue } from '../src/react';

const doc = (root: unknown, version = '1.0.0') => ({ schemaVersion: version, screen: { id: 'test', title: 'Test', locale: 'en-IN' }, root });
const stack = (...children: unknown[]) => ({ type: 'Stack', children });
const event = (name: string, payload?: Record<string, unknown>) => ({ type: 'event', name, ...(payload ? { payload } : {}) });

function draw(root: unknown, props: Partial<Parameters<typeof SyntaraScreen>[0]> = {}) {
  const issues: Issue[] = [];
  const onIssue = vi.fn((i: Issue) => issues.push(i));
  const onAction = vi.fn();
  const utils = render(<SyntaraScreen document={doc(root)} onIssue={onIssue} onAction={onAction} {...props} />);
  return { ...utils, issues, onIssue, onAction };
}

describe('the registry', () => {
  it('has exactly one renderer per wire node, and nothing else', () => {
    expect([...REGISTRY.keys()].sort()).toEqual(Object.keys(manifest.nodes).sort());
  });
});

describe('each node draws with its role and accessible name', () => {
  it('Button, including icon-only', () => {
    draw(
      stack(
        { type: 'Button', props: { variant: 'outline' }, children: [{ icon: 'download' }, 'Download statement'], action: event('download') },
        { type: 'Button', props: { size: 'icon', ariaLabel: 'Close' }, children: [{ icon: 'x' }], action: event('close') },
      ),
    );
    const download = screen.getByRole('button', { name: 'Download statement' });
    expect(download).toHaveAttribute('data-variant', 'outline');
    expect(download.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
    expect(screen.getByRole('button', { name: 'Close' })).toBeInTheDocument();
  });

  it('Link, with a real href', () => {
    draw({ type: 'Link', props: { variant: 'standalone' }, children: ['View all', { icon: 'chevron-right' }], action: { type: 'navigate', href: '/activity' } });
    expect(screen.getByRole('link', { name: 'View all' })).toHaveAttribute('href', '/activity');
  });

  it('Badge, Tag and Eyebrow as text', () => {
    draw(
      stack(
        { type: 'Badge', props: { tone: 'success', icon: { icon: 'check' } }, children: 'Paid' },
        { type: 'Tag', props: { leading: { icon: 'truck' } }, children: 'Free delivery' },
        { type: 'Eyebrow', props: { lead: 'rule' }, children: 'Order 58-2931' },
      ),
    );
    expect(screen.getByText('Paid').closest('[data-tone]')).toHaveAttribute('data-tone', 'success');
    expect(screen.getByText('Free delivery')).toBeInTheDocument();
    expect(screen.getByText('Order 58-2931')).toBeInTheDocument();
  });

  it('Alert, with its action slot and a live role', () => {
    draw({
      type: 'Alert',
      props: { tone: 'warning', title: 'KYC due', live: 'polite' },
      children: 'Update your PAN details.',
      slots: { action: { type: 'Button', props: { size: 'sm' }, children: 'Update now', action: event('kyc.start') } },
    });
    const alert = screen.getByRole('status', { name: 'KYC due' });
    expect(alert).toHaveTextContent('Update your PAN details.');
    expect(within(alert).getByRole('button', { name: 'Update now' })).toBeInTheDocument();
  });

  it('Card and its parts', () => {
    draw({
      type: 'Card',
      props: { variant: 'outline' },
      children: [
        {
          type: 'CardHeader',
          children: [
            { type: 'CardTitle', props: { level: 2 }, children: 'Recent activity' },
            { type: 'CardDescription', children: 'Last 3 transactions' },
            { type: 'CardAction', children: [{ type: 'Badge', children: '3 new' }] },
          ],
        },
        { type: 'CardContent', children: [{ type: 'Text', children: 'Groceries' }] },
        { type: 'CardFooter', children: [{ type: 'Button', children: 'Open', action: event('open') }] },
      ],
    });
    expect(screen.getByRole('heading', { level: 2, name: 'Recent activity' })).toBeInTheDocument();
    expect(screen.getByText('Last 3 transactions').tagName).toBe('P');
    expect(screen.getByText('3 new')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Open' })).toBeInTheDocument();
  });

  it('StatTile and StatTileGroup as one description list', () => {
    const { container } = draw({
      type: 'StatTileGroup',
      children: [
        { type: 'StatTile', props: { label: 'Balance', value: '₹1,84,250', delta: 0.064, deltaLabel: 'vs last month' } },
        { type: 'StatTile', props: { label: 'Points', value: '2,140', caption: 'Worth ₹535' } },
      ],
    });
    expect(container.querySelectorAll('dl')).toHaveLength(1);
    expect(screen.getAllByRole('term').map((t) => t.textContent)).toEqual(['Balance', 'Points']);
    expect(screen.getByText('₹1,84,250')).toBeInTheDocument();
    expect(screen.getByText('vs last month')).toBeInTheDocument();
  });

  it('Avatar as an image named by its name', () => {
    draw({ type: 'Avatar', props: { name: 'Priya Raman' } });
    expect(screen.getByRole('img', { name: 'Priya Raman' })).toBeInTheDocument();
  });

  it('Separator, plain and labelled', () => {
    draw(stack({ type: 'Separator' }, { type: 'Separator', props: { label: 'or' } }));
    expect(screen.getByRole('separator')).toBeInTheDocument();
    expect(screen.getByText('or')).toBeInTheDocument();
  });

  it('ProgressBar and Meter, named by label or ariaLabel', () => {
    draw(
      stack(
        { type: 'ProgressBar', props: { label: 'Delivery progress', value: 70, valueLabel: 'Out for delivery', showValue: true } },
        { type: 'Meter', props: { ariaLabel: 'Wallet used', value: 40, valueLabel: '₹7,400 used' } },
      ),
    );
    const progress = screen.getByRole('progressbar', { name: 'Delivery progress' });
    expect(progress).toHaveAttribute('aria-valuetext', 'Out for delivery');
    expect(screen.getByRole('meter', { name: 'Wallet used' })).toHaveAttribute('aria-valuetext', '₹7,400 used');
  });

  it('EmptyState with a heading and its action', () => {
    draw({
      type: 'EmptyState',
      props: { title: 'No vouchers yet', description: 'Win one in the weekly draw.', icon: { icon: 'gift' }, level: 2 },
      slots: { action: { type: 'Link', children: 'See the draw', action: { type: 'navigate', href: '/draw' } } },
    });
    expect(screen.getByRole('heading', { level: 2, name: 'No vouchers yet' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'See the draw' })).toBeInTheDocument();
  });

  it('Amount read as one string', () => {
    draw({ type: 'Amount', props: { value: 1840, currency: 'INR' } });
    expect(screen.getByText(/1,840/, { selector: 'span:not([aria-hidden])' })).toBeInTheDocument();
  });

  it('IconTile: decorative by default, an image when it has alt', () => {
    const { container } = draw(
      stack(
        { type: 'IconTile', children: { icon: 'wallet' } },
        { type: 'IconTile', props: { alt: 'Wallet' }, children: { icon: 'wallet' } },
      ),
    );
    expect(screen.getAllByRole('img')).toHaveLength(1);
    expect(screen.getByRole('img', { name: 'Wallet' })).toBeInTheDocument();
    expect(container.querySelector('[aria-hidden="true"][data-tint]')).not.toBeNull();
  });

  it('Stack, Inline, Text and Heading with token styles only', () => {
    const { container } = draw({
      type: 'Stack',
      props: { gap: 'section-gap' },
      children: [
        { type: 'Heading', props: { level: 1 }, children: 'Your rewards' },
        {
          type: 'Inline',
          props: { justify: 'between', gap: 'space-3' },
          children: [
            { type: 'Text', props: { tone: 'subtle' }, children: 'Item total' },
            { type: 'Text', props: { numeric: true }, children: '₹642' },
          ],
        },
      ],
    });
    expect(screen.getByRole('heading', { level: 1, name: 'Your rewards' })).toBeInTheDocument();
    const stackEl = container.querySelector('[data-sdui-node="Stack"]') as HTMLElement;
    const inlineEl = container.querySelector('[data-sdui-node="Inline"]') as HTMLElement;
    expect(stackEl.style.gap).toBe('var(--syntara-section-gap)');
    expect(inlineEl.style.gap).toBe('var(--syntara-space-3)');
    expect(inlineEl.style.justifyContent).toBe('space-between');
    expect(screen.getByText('Item total').style.color).toBe('var(--syntara-color-text-subtle)');
    // Every style value the renderer writes is a token, a keyword or a flex value: no raw sizes or colours.
    for (const el of container.querySelectorAll<HTMLElement>('[data-sdui-node]')) {
      for (const prop of Array.from(el.style)) expect(el.style.getPropertyValue(prop), `${prop}`).toMatch(/^(var\(--syntara-[a-z0-9-]+\)|[a-z-]+|0(px)?)$/);
    }
  });
});

describe('actions', () => {
  it('an event calls the host handler with its name, payload and node', async () => {
    const { onAction } = draw({ type: 'Button', id: 'pay', children: 'Pay ₹646', action: event('order.pay', { orderId: '58-2931', amount: 646 }) });
    await userEvent.click(screen.getByRole('button', { name: 'Pay ₹646' }));
    expect(onAction).toHaveBeenCalledTimes(1);
    expect(onAction).toHaveBeenCalledWith(
      { type: 'event', name: 'order.pay', payload: { orderId: '58-2931', amount: 646 } },
      { nodeType: 'Button', nodeId: 'pay' },
    );
  });

  it('works from the keyboard', async () => {
    const { onAction } = draw({ type: 'Button', children: 'Retry', action: event('retry') });
    await userEvent.tab();
    await userEvent.keyboard('{Enter}');
    expect(onAction).toHaveBeenCalledWith({ type: 'event', name: 'retry' }, { nodeType: 'Button' });
  });

  it('navigate on a Button calls the host handler with href', async () => {
    const { onAction } = draw({ type: 'Button', children: 'View all benefits', action: { type: 'navigate', href: '/rewards/benefits' } });
    await userEvent.click(screen.getByRole('button', { name: 'View all benefits' }));
    expect(onAction).toHaveBeenCalledWith({ type: 'navigate', href: '/rewards/benefits' }, { nodeType: 'Button' });
  });

  it('a Link hands a plain click to the host instead of navigating', () => {
    const { onAction } = draw({ type: 'Link', children: 'Help', action: { type: 'navigate', href: '/help/orders/58-2931' } });
    const link = screen.getByRole('link', { name: 'Help' });
    const notCancelled = fireEvent.click(link);
    expect(notCancelled).toBe(false); // default prevented: the host routes
    expect(onAction).toHaveBeenCalledWith({ type: 'navigate', href: '/help/orders/58-2931' }, { nodeType: 'Link' });
  });

  it('a modified click on a Link stays with the browser (new tab)', () => {
    const { onAction } = draw({ type: 'Link', children: 'Help', action: { type: 'navigate', href: 'https://example.com/help' } });
    const link = screen.getByRole('link', { name: 'Help' });
    link.addEventListener('click', (e) => e.preventDefault()); // keep jsdom from navigating after our check
    fireEvent.click(link, { metaKey: true });
    expect(onAction).not.toHaveBeenCalled();
  });

  it('without a handler, a Button reports no-action-handler and a Link still has its href', async () => {
    const issues: Issue[] = [];
    render(
      <SyntaraScreen
        document={doc(stack({ type: 'Button', children: 'Go', action: event('go') }, { type: 'Link', children: 'Help', action: { type: 'navigate', href: '/help' } }))}
        onIssue={(i) => issues.push(i)}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Go' }));
    expect(issues.map((i) => i.code)).toEqual(['no-action-handler']);
    expect(screen.getByRole('link', { name: 'Help' })).toHaveAttribute('href', '/help');
  });

  it('a disabled Button does not act', async () => {
    const { onAction } = draw({ type: 'Button', props: { isDisabled: true }, children: 'Pay', action: event('pay') });
    await userEvent.click(screen.getByRole('button', { name: 'Pay' }));
    expect(onAction).not.toHaveBeenCalled();
  });
});

describe('unknowns and fallbacks', () => {
  it('draws the fallback of an unknown node, never its JSON', () => {
    const { container, issues } = draw(stack({ type: 'Carousel', props: { items: ['a', 'b'] }, fallback: { type: 'Text', children: '2 offers for you' } }));
    expect(screen.getByText('2 offers for you')).toBeInTheDocument();
    expect(container.textContent).not.toMatch(/Carousel|\{|"type"/);
    expect(issues.map((i) => i.code)).toEqual(['unknown-component']);
  });

  it('draws nothing for an unknown node without a fallback', () => {
    const { container, issues } = draw(stack({ type: 'Carousel' }, { type: 'Text', children: 'After' }));
    expect(container.textContent).toBe('After');
    expect(issues).toHaveLength(1);
  });

  it.each(['ThemeScope', '__proto__', 'constructor', 'toString', 'Dialog'])('draws nothing for a node of type %j', (type) => {
    const { container } = draw(stack({ type }, { type: 'Text', children: 'Only this' }));
    expect(container.textContent).toBe('Only this');
    expect(container.querySelector('[data-syntara-theme]')).toBeNull();
  });

  it('ignores an unknown prop and uses the default for an unknown value', () => {
    const { issues } = draw({ type: 'Button', props: { variant: 'glass', sparkle: true }, children: 'Go', action: event('go') });
    expect(screen.getByRole('button', { name: 'Go' })).toHaveAttribute('data-variant', 'primary');
    expect(issues.map((i) => i.code).sort()).toEqual(['unknown-prop', 'unknown-value']);
  });

  it('draws the host fallback for an invalid document and reports every error', () => {
    const issues: Issue[] = [];
    render(
      <SyntaraScreen
        document={doc({ type: 'Button', props: { size: 'icon' }, children: [{ icon: 'x' }], action: event('close') })}
        onIssue={(i) => issues.push(i)}
        fallback={<p>This screen isn't available.</p>}
      />,
    );
    expect(screen.getByText("This screen isn't available.")).toBeInTheDocument();
    expect(screen.queryByRole('button')).toBeNull();
    expect(issues.every((i) => i.code === 'invalid-document')).toBe(true);
    expect(issues.map((i) => i.rule)).toContain('button-icon-size-name');
  });

  it('draws the host fallback for a newer major', () => {
    const issues: Issue[] = [];
    render(<SyntaraScreen document={doc({ type: 'Text', children: 'Hi' }, '2.0.0')} onIssue={(i) => issues.push(i)} fallback={<p>Update the app</p>} />);
    expect(screen.getByText('Update the app')).toBeInTheDocument();
    expect(screen.queryByText('Hi')).toBeNull();
    expect(issues.map((i) => i.code)).toEqual(['unsupported-version']);
  });

  it('draws nothing (not an error) when no fallback is given', () => {
    const { container } = render(<SyntaraScreen document={{ nonsense: true }} />);
    expect(container.innerHTML).toBe('');
  });
});

describe('safety', () => {
  it('renders strings as text: nothing in a document can inject markup', () => {
    const payload = '<img src=x onerror="window.__pwned=1"><script>window.__pwned=1</script>';
    const { container } = draw(
      stack(
        { type: 'Text', children: payload },
        { type: 'Heading', children: payload },
        { type: 'Badge', children: payload },
        { type: 'Button', props: { ariaLabel: payload }, children: payload, action: event('x') },
        { type: 'Alert', props: { title: payload }, children: payload },
      ),
    );
    expect(container.querySelector('img, script')).toBeNull();
    expect(screen.getAllByText(payload, { exact: true }).length).toBeGreaterThanOrEqual(4);
    expect((window as unknown as { __pwned?: number }).__pwned).toBeUndefined();
  });

  it('never renders a DOM id from the document', () => {
    const { container } = draw({ type: 'Text', id: 'root', children: 'Hi' });
    expect(container.querySelector('#root')).toBeNull();
  });
});

describe('RTL and locale', () => {
  const noLocale = (root: unknown) => ({ schemaVersion: '1.0.0', screen: { id: 'test', title: 'Test' }, root });
  const inLocale = (locale: string, root: unknown) => ({ schemaVersion: '1.0.0', screen: { id: 'test', title: 'Test', locale }, root });
  const arabic = { type: 'Inline', children: [{ type: 'Text', children: 'الرصيد المتاح' }, { type: 'Badge', children: 'مدفوع' }] };

  it('a document with no locale follows the ThemeScope around it', () => {
    render(
      <ThemeScope locale="ar-AE">
        <SyntaraScreen document={noLocale(arabic)} />
      </ThemeScope>,
    );
    const root = screen.getByText('الرصيد المتاح').closest('[data-syntara-screen]');
    expect(root).not.toHaveAttribute('dir');
    expect(root).not.toHaveAttribute('lang');
    expect(root?.closest('[dir]')).toHaveAttribute('dir', 'rtl');
  });

  it('English copy stays left to right inside a right-to-left client', () => {
    render(
      <ThemeScope locale="ar-AE">
        <SyntaraScreen document={inLocale('en-IN', { type: 'Text', children: '−₹1,240 on 1 Oct.' })} />
      </ThemeScope>,
    );
    const root = screen.getByText('−₹1,240 on 1 Oct.').closest('[data-syntara-screen]');
    expect(root).toHaveAttribute('lang', 'en-IN');
    expect(root).toHaveAttribute('dir', 'ltr');
  });

  it('Arabic copy runs right to left inside a left-to-right client', () => {
    render(
      <ThemeScope locale="en-IN">
        <SyntaraScreen document={inLocale('ar-AE', arabic)} />
      </ThemeScope>,
    );
    expect(screen.getByText('الرصيد المتاح').closest('[data-syntara-screen]')).toHaveAttribute('dir', 'rtl');
  });

  it('reads direction from the script when the locale names one, and ignores a locale it can’t read', async () => {
    const { directionOf } = await import('../src/index');
    expect(directionOf('pa-Arab-PK')).toBe('rtl');
    expect(directionOf('pa-IN')).toBe('ltr');
    expect(directionOf('hi-IN')).toBe('ltr');
    expect(directionOf('ur')).toBe('rtl');
    expect(directionOf('he-IL')).toBe('rtl');
    expect(directionOf('not a locale')).toBeUndefined();
    expect(directionOf(undefined)).toBeUndefined();
    expect(directionOf('')).toBeUndefined();
  });

  it('carries no theme of its own', () => {
    const { container } = draw({ type: 'Text', children: 'Hi' });
    expect(container.querySelector('[data-syntara-theme], [data-syntara-scheme]')).toBeNull();
  });
});

describe('keys', () => {
  it('keeps DOM nodes across re-renders and reorders, keyed by id', () => {
    const a = { type: 'Button', id: 'a', children: 'First', action: event('a') };
    const b = { type: 'Button', id: 'b', children: 'Second', action: event('b') };
    const { rerender } = render(<SyntaraScreen document={doc(stack(a, b))} />);
    const first = screen.getByRole('button', { name: 'First' });
    rerender(<SyntaraScreen document={doc(stack(a, b))} />);
    expect(screen.getByRole('button', { name: 'First' })).toBe(first);
    rerender(<SyntaraScreen document={doc(stack(b, a))} />);
    expect(screen.getByRole('button', { name: 'First' })).toBe(first);
    expect(screen.getAllByRole('button').map((x) => x.textContent)).toEqual(['Second', 'First']);
  });
});

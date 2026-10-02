import { act, render, screen } from '@testing-library/react';
import { I18nProvider } from 'react-aria-components';
import { generateTheme, type BrandInput } from '@syntara/theme-engine';
import { contrastRatio } from '../../theme-engine/src/color';
import {
  ResponseSource,
  ResponseSources,
  ResponseText,
  StreamingResponse,
  type StreamingResponseProps,
} from '../src/ui/streaming-response';
import { TENANTS, loadFuzzInputs, readUiCss } from './status-icon-contrast';

/** Renders, and returns a rerender that keeps the locale, plus a reader for what the live region has said. */
function setup(props: Partial<StreamingResponseProps> = {}, locale = 'en-US') {
  const wrap = (p: Partial<StreamingResponseProps>) => (
    <I18nProvider locale={locale}>
      <StreamingResponse status="streaming" text="" {...props} {...p} />
    </I18nProvider>
  );
  const utils = render(wrap({}));
  const live = utils.container.querySelector('[aria-live="polite"]')!;
  return {
    ...utils,
    update: (p: Partial<StreamingResponseProps>) => utils.rerender(wrap(p)),
    said: () => Array.from(live.querySelectorAll('p'), (n) => n.textContent),
    live,
  };
}

describe('StreamingResponse', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('is a named article whose visible text is not a live region', () => {
    const { live } = setup({ status: 'complete', text: 'Your card ships tomorrow.' });
    const article = screen.getByRole('article', { name: 'Response' });
    expect(article).toHaveTextContent('Your card ships tomorrow.');
    expect(article.querySelector('[aria-live]')).toBe(live);
    expect(live).toHaveAttribute('aria-relevant', 'additions');
    expect(screen.getByText('Your card ships tomorrow.').closest('[aria-live]')).toBeNull();
  });

  it('says nothing for a response that was already complete when it mounted', () => {
    const { said } = setup({ status: 'complete', text: 'Earlier answer.' });
    act(() => vi.advanceTimersByTime(5000));
    expect(said()).toEqual([]);
  });

  it('speaks the start, each finished sentence once, then the rest and the end', () => {
    const { update, said } = setup();
    expect(said()).toEqual(['Writing response']);
    act(() => vi.advanceTimersByTime(1000));
    update({ text: 'Your refund is approved. It reaches' });
    expect(said()).toEqual(['Writing response', 'Your refund is approved.']);
    update({ text: 'Your refund is approved. It reaches your account' });
    act(() => vi.advanceTimersByTime(5000));
    expect(said()).toEqual(['Writing response', 'Your refund is approved.']);
    update({ status: 'complete', text: 'Your refund is approved. It reaches your account in 3.5 days.' });
    expect(said().slice(-1)).toEqual(['It reaches your account in 3.5 days. Response complete']);
  });

  it('batches sentences that finish inside the interval', () => {
    const { update, said } = setup();
    update({ text: 'One. Two. ' });
    update({ text: 'One. Two. Three. Fo' });
    expect(said()).toEqual(['Writing response']);
    act(() => vi.advanceTimersByTime(1000));
    expect(said()).toEqual(['Writing response', 'One. Two. Three.']);
  });

  it('ends Hindi sentences at the danda and Arabic ones at the Arabic question mark', () => {
    const hi = setup({}, 'hi-IN');
    act(() => vi.advanceTimersByTime(1000));
    hi.update({ text: 'आपका रिफ़ंड मंज़ूर हो गया है। यह तीन' });
    expect(hi.said().slice(-1)).toEqual(['आपका रिफ़ंड मंज़ूर हो गया है।']);
    hi.unmount();

    const ar = setup({}, 'ar-AE');
    act(() => vi.advanceTimersByTime(1000));
    ar.update({ text: 'هل تريد تتبع الطلب؟ سيصل' });
    expect(ar.said().slice(-1)).toEqual(['هل تريد تتبع الطلب؟']);
  });

  it('announce="status" speaks only the start and the end', () => {
    const { update, said } = setup({ announce: 'status' });
    act(() => vi.advanceTimersByTime(1000));
    update({ announce: 'status', text: 'First sentence. Second' });
    act(() => vi.advanceTimersByTime(5000));
    update({ announce: 'status', status: 'complete', text: 'First sentence. Second sentence.' });
    expect(said()).toEqual(['Writing response', 'Response complete']);
  });

  it('shows a status line in words while writing, stopped or failed, and hides it once complete', () => {
    const { update, said } = setup({ text: 'Checking' });
    expect(screen.getByText('Writing…')).toBeInTheDocument();
    update({ status: 'stopped', text: 'Checking your' });
    expect(screen.getByText('Stopped')).toBeInTheDocument();
    expect(said().slice(-1)).toEqual(['Checking your Stopped']);

    update({ status: 'streaming', text: '' });
    update({ status: 'error', text: 'Half a sent', errorMessage: 'The connection dropped.' });
    expect(screen.getByText("Couldn't finish")).toBeInTheDocument();
    expect(screen.getByText('The connection dropped.')).toBeInTheDocument();
    // A failed response's unfinished sentence isn't read out as if it were the answer.
    expect(said().at(-1)).toMatch(/Couldn't finish\. The connection dropped\.$/);
    expect(said().join(' ')).not.toContain('Half a sent');

    update({ status: 'complete', text: 'Done.' });
    expect(screen.queryByText("Couldn't finish")).toBeNull();
    expect(screen.queryByText('Writing…')).toBeNull();
  });

  it('renders children in place of the text and passes className through', () => {
    setup({ status: 'complete', text: 'Plain', className: 'mine', children: <strong>Rendered</strong> });
    const article = screen.getByRole('article');
    expect(article).toHaveClass('mine');
    expect(article).toHaveTextContent('Rendered');
    expect(article).not.toHaveTextContent('Plain');
  });

  it('reads the roles it proves from the CSS', () => {
    const css = readUiCss('streaming-response.module.css');
    expect(css).toContain('color: var(--syntara-color-feedback-danger-fg);');
    expect(css).toContain('--syntara-icon-on: var(--syntara-color-feedback-danger-bg);');
    expect(css).toContain('color: var(--syntara-color-text-brand);');
  });

  it('marks ≥ 3:1 on page and card surfaces, glyph ≥ 4.5:1 on the shape, every tenant × scheme and 1,000 fuzz brands', async () => {
    vi.useRealTimers();
    const worst = { mark: Infinity, glyph: Infinity };
    const inputs: BrandInput[] = [...Object.values(TENANTS), ...(await loadFuzzInputs())];
    for (const input of inputs) {
      const theme = generateTheme(input);
      for (const scheme of ['light', 'dark'] as const) {
        const roles = theme.schemes[scheme].roles;
        for (const face of [roles['surface.default'].hex, roles['surface.raised'].hex]) {
          for (const mark of [roles['feedback.danger.fg'].hex, roles['text.brand'].hex]) {
            worst.mark = Math.min(worst.mark, contrastRatio(mark, face));
          }
        }
        worst.glyph = Math.min(worst.glyph, contrastRatio(roles['feedback.danger.bg'].hex, roles['feedback.danger.fg'].hex));
      }
    }
    expect(worst.mark).toBeGreaterThanOrEqual(3);
    expect(worst.glyph).toBeGreaterThanOrEqual(4.5);
  }, 60_000);
});

describe('ResponseText', () => {
  it('wraps each word once and keeps earlier words in place as the text grows', () => {
    const { container, rerender } = render(<ResponseText text="You can change" />);
    const words = () => [...container.querySelectorAll('span > span')];
    expect(words().map((w) => w.textContent)).toEqual(['You', 'can', 'change']);
    expect(container.textContent).toBe('You can change');
    const first = words()[0];
    rerender(<ResponseText text={'You can change the\naddress'} />);
    // The same node, so its arrival animation never replays.
    expect(words()[0]).toBe(first);
    expect(container.textContent).toBe('You can change the\naddress');
  });

  it('keeps Devanagari and Arabic words whole', () => {
    const { container } = render(<ResponseText text="पता बदलें। افتح الطلب" />);
    expect([...container.querySelectorAll('span > span')].map((w) => w.textContent)).toEqual([
      'पता',
      'बदलें।',
      'افتح',
      'الطلب',
    ]);
  });
});

describe('ResponseSources', () => {
  it('is a named list of links, each named "number title"', () => {
    render(
      <ResponseSources label="Sources">
        <ResponseSource index={1} href="/help/address">
          Changing your address
        </ResponseSource>
        <ResponseSource href="/help/pickup">Pickup points</ResponseSource>
      </ResponseSources>,
    );
    const list = screen.getByRole('list', { name: 'Sources' });
    expect(list.querySelectorAll('li')).toHaveLength(2);
    expect(screen.getByRole('link', { name: '1 Changing your address' })).toHaveAttribute('href', '/help/address');
    expect(screen.getByRole('link', { name: 'Pickup points' })).toBeInTheDocument();
  });
});

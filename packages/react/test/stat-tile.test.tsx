import { render, screen, within } from '@testing-library/react';
import { I18nProvider } from 'react-aria-components';
import { generateTheme, type BrandInput } from '@strata/theme-engine';
import { contrastRatio } from '../../theme-engine/src/color';
import { StatTile, StatTileGroup, formatDelta } from '../src/ui/stat-tile';
import { TENANTS, loadFuzzInputs, readUiCss } from './status-icon-contrast';

const MINUS = '−';

describe('formatDelta', () => {
  it('formats fractions as signed percentages with a true minus', () => {
    expect(formatDelta(0.064, 'en-US')).toBe('+6.4%');
    expect(formatDelta(-0.032, 'en-US')).toBe(`${MINUS}3.2%`);
    expect(formatDelta(0, 'en-US')).toBe('0%');
    expect(formatDelta(0.1234, 'en-US', { maximumFractionDigits: 0 })).toBe('+12%');
  });
});

describe('StatTile', () => {
  it('renders a standalone <dl> with the label as the term', () => {
    const { container } = render(<StatTile label="Available balance" value="₹1,84,250" />);
    const dl = container.firstElementChild!;
    expect(dl.tagName).toBe('DL');
    expect(within(dl as HTMLElement).getByRole('term')).toHaveTextContent('Available balance');
    expect(screen.getByText('₹1,84,250').tagName).toBe('DD');
  });

  it('shows a rising delta as good news by default', () => {
    render(<StatTile label="Balance" value="₹1,84,250" delta={0.064} deltaLabel="vs last month" />);
    const pill = screen.getByText('+6.4%').closest('[data-tone]');
    expect(pill).toHaveAttribute('data-tone', 'success');
    expect(screen.getByText('vs last month')).toBeInTheDocument();
  });

  it('treats a rise as bad news when positiveIsGood is false, and a fall as good', () => {
    const { rerender } = render(<StatTile label="Churn" value="3%" delta={0.02} positiveIsGood={false} />);
    expect(screen.getByText('+2%').closest('[data-tone]')).toHaveAttribute('data-tone', 'danger');
    rerender(<StatTile label="Churn" value="3%" delta={-0.02} positiveIsGood={false} />);
    expect(screen.getByText(`${MINUS}2%`).closest('[data-tone]')).toHaveAttribute('data-tone', 'success');
  });

  it('is neutral for no change', () => {
    render(<StatTile label="Wallet" value="₹8,500" delta={0} />);
    expect(screen.getByText('0%').closest('[data-tone]')).toHaveAttribute('data-tone', 'neutral');
  });

  it('isolates the delta in the locale direction, so the sign stays put on RTL pages', () => {
    render(
      <div dir="rtl" lang="ar">
        <I18nProvider locale="en-US">
          <StatTile label="Balance" value="1,286" delta={-0.032} />
        </I18nProvider>
      </div>,
    );
    expect(screen.getByText(`${MINUS}3.2%`)).toHaveAttribute('dir', 'ltr');
  });

  it('formats in the locale and direction of an Arabic locale', () => {
    render(
      <I18nProvider locale="ar-EG">
        <StatTile label="الرصيد" value="١٬٢٨٦" delta={0.064} />
      </I18nProvider>,
    );
    const expected = formatDelta(0.064, 'ar-EG');
    expect(expected).not.toBe('+6.4%');
    expect(screen.getByText(expected)).toHaveAttribute('dir', 'rtl');
  });

  it('shows a caption instead of a delta', () => {
    render(<StatTile label="Members" value="4" caption="2 adults, 2 children" />);
    expect(screen.getByText('2 adults, 2 children')).toBeInTheDocument();
    expect(document.querySelector('[data-tone]')).toBeNull();
  });

  it('draws a decorative sparkline from finite values', () => {
    const { container } = render(<StatTile label="Paid" value="₹4,12,800" sparkline={[1, 3, Number.NaN, 2, 5]} />);
    const spark = container.querySelector('.spark')!;
    expect(spark).toHaveAttribute('aria-hidden', 'true');
    expect(spark.querySelector('polyline')!.getAttribute('points')!.split(' ')).toHaveLength(4);
    // Normalised length, so CSS can draw the line in (stroke-dashoffset 1 → 0) whatever its real length.
    expect(spark.querySelector('polyline')).toHaveAttribute('pathLength', '1');
    expect(container.firstElementChild).toHaveAttribute('data-sparkline');
  });

  it('skips the sparkline with fewer than two points', () => {
    const { container } = render(<StatTile label="Paid" value="1" sparkline={[4]} />);
    expect(container.querySelector('svg')).toBeNull();
  });

  it('becomes a <div> of dt/dd inside a StatTileGroup <dl>, and passes className through', () => {
    const { container } = render(
      <StatTileGroup>
        <StatTile label="Paid" value="10" className="mine" />
        <StatTile label="Rejected" value="2" />
      </StatTileGroup>,
    );
    const dl = container.firstElementChild!;
    expect(dl.tagName).toBe('DL');
    expect(dl.querySelectorAll('dl')).toHaveLength(0);
    expect(dl.children[0]!.tagName).toBe('DIV');
    expect(dl.children[0]).toHaveClass('tile', 'mine');
    expect(within(dl as HTMLElement).getAllByRole('term')).toHaveLength(2);
  });

  it('editorial: the label is still the term read before its value, and the variant is reflected', () => {
    const { container } = render(
      <StatTileGroup>
        <StatTile variant="editorial" value="−42%" label="time to file" />
        <StatTile variant="editorial" value="3 min" label="median claim" />
      </StatTileGroup>,
    );
    const tile = container.firstElementChild!.children[0]!;
    expect(tile).toHaveAttribute('data-variant', 'editorial');
    // DOM order stays dt, dd (label, value): CSS draws the value first, assistive tech reads "time to file, −42%".
    expect(tile.children[0]!.tagName).toBe('DT');
    expect(tile.children[0]).toHaveTextContent('time to file');
    expect(tile.children[1]!.tagName).toBe('DD');
    expect(tile.children[1]).toHaveTextContent('−42%');
    expect(within(container.firstElementChild as HTMLElement).getAllByRole('definition')).toHaveLength(2);
  });
});

describe('StatTile: good or bad news is not shown by colour alone (WCAG 1.4.1)', () => {
  const pill = (text: string) => screen.getByText(text).closest('[data-tone]') as HTMLElement;
  const mark = (el: HTMLElement) => el.querySelector('[data-strata-icon]')?.getAttribute('data-strata-icon') ?? null;

  it('good news keeps the trend arrow; bad news shows an alert mark instead; no change shows neither', () => {
    const { rerender } = render(<StatTile label="Revenue" value="₹12,48,300" delta={0.064} />);
    expect(mark(pill('+6.4%'))).toBe('trending-up');
    rerender(<StatTile label="Refunds" value="₹38,420" delta={0.064} positiveIsGood={false} />);
    expect(mark(pill('+6.4%'))).toBe('alert-circle-filled');
    rerender(<StatTile label="Failed payments" value="42" delta={-0.12} positiveIsGood={false} />);
    expect(mark(pill(`${MINUS}12%`))).toBe('trending-down');
    rerender(<StatTile label="Revenue" value="₹9,10,000" delta={-0.12} />);
    expect(mark(pill(`${MINUS}12%`))).toBe('alert-circle-filled');
    rerender(<StatTile label="Active cards" value="1,286" delta={0} />);
    expect(mark(pill('0%'))).toBeNull();
  });

  it('the same rise, good and bad, differs in more than colour', () => {
    render(
      <StatTileGroup>
        <StatTile label="Revenue" value="1" delta={0.031} />
        <StatTile label="Refunds" value="2" delta={0.031} positiveIsGood={false} />
      </StatTileGroup>,
    );
    const [good, bad] = screen.getAllByText('+3.1%').map((t) => t.closest('[data-tone]')!);
    // Strip the colour signal and the words for screen readers: what's left must still differ (the mark's shape).
    const shape = (el: Element) => {
      const c = el.cloneNode(true) as Element;
      c.removeAttribute('data-tone');
      c.querySelector('.srOnly')?.remove();
      return c.outerHTML;
    };
    expect(shape(good!)).not.toBe(shape(bad!));
  });

  it('says better or worse to screen readers, from translatable props, and nothing for no change', () => {
    const { rerender } = render(<StatTile label="Revenue" value="1" delta={0.064} deltaLabel="vs last month" />);
    expect(pill('+6.4%')).toHaveTextContent(/^\+6\.4% better$/);
    rerender(<StatTile label="Refunds" value="1" delta={0.031} positiveIsGood={false} deltaLabel="vs last month" />);
    expect(pill('+3.1%')).toHaveTextContent(/^\+3\.1% worse$/);
    expect(screen.getByText('worse')).toHaveClass('srOnly');
    // The definition reads "+3.1% worse", then "vs last month" (the pill and the label are separate flex items).
    expect(pill('+3.1%').closest('dd')).toHaveTextContent(/^\+3\.1% worse\s*vs last month$/);
    rerender(<StatTile label="Refunds" value="1" delta={0.031} positiveIsGood={false} betterLabel="أفضل" worseLabel="أسوأ" />);
    expect(pill('+3.1%')).toHaveTextContent(/أسوأ$/);
    rerender(<StatTile label="Wallet" value="1" delta={0} />);
    expect(pill('0%')).toHaveTextContent(/^0%$/);
    expect(document.querySelector('.srOnly')).toBeNull();
  });
});

describe('StatTile: delta marks meet contrast on the pill, every tenant and 1,000 fuzz brands', () => {
  const css = readUiCss('stat-tile.module.css');
  const badgeCss = readUiCss('badge.module.css');

  it('reads the roles it proves from the CSS', () => {
    // The pill is a soft Badge: the mark is its text colour (fg) on its face (bg); the alert's "!" is knocked out to bg.
    for (const t of ['success', 'danger']) {
      expect(badgeCss).toContain(`.badge[data-variant='soft'][data-tone='${t}'] {\n  --_bg: var(--strata-color-feedback-${t}-bg);\n  --_fg: var(--strata-color-feedback-${t}-fg);`);
    }
    expect(css).toMatch(/\.delta\[data-tone='danger'\] \{\n  --strata-icon-on: var\(--strata-color-feedback-danger-bg\);/);
  });

  function worst(inputs: BrandInput[], names?: string[]) {
    const w = { arrow: Infinity, alert: Infinity, glyph: Infinity, at: '' };
    inputs.forEach((input, i) => {
      const theme = generateTheme(input);
      for (const scheme of ['light', 'dark'] as const) {
        const r = theme.schemes[scheme].roles;
        // Good news: the trend arrow (stroke, feedback.success.fg) on the pill's face (feedback.success.bg).
        w.arrow = Math.min(w.arrow, contrastRatio(r['feedback.success.fg'].hex, r['feedback.success.bg'].hex));
        // Bad news: the alert disc (feedback.danger.fg) on the face, and the knocked-out "!" (the face) on the disc.
        const alert = contrastRatio(r['feedback.danger.fg'].hex, r['feedback.danger.bg'].hex);
        if (alert < w.alert) Object.assign(w, { alert, at: `${names?.[i] ?? `fuzz#${i}`} ${scheme}` });
        w.glyph = Math.min(w.glyph, contrastRatio(r['feedback.danger.bg'].hex, r['feedback.danger.fg'].hex));
      }
    });
    return w;
  }

  it('arrow and alert disc ≥ 3:1 on the pill (WCAG 1.4.11), the knocked-out "!" ≥ 4.5:1 on the disc', async () => {
    const tenants = worst(Object.values(TENANTS), Object.keys(TENANTS));
    const fuzz = worst(await loadFuzzInputs());
    // Measured 2026-09-28: arrow ≥ 5.43:1, alert disc ≥ 6.18:1, "!" ≥ 6.18:1 (worst: light), tenants and fuzz alike:
    // the feedback hues don't follow the brand. Truncated, never rounded up.
    expect(Math.min(tenants.arrow, fuzz.arrow)).toBeGreaterThanOrEqual(3);
    expect(Math.min(tenants.alert, fuzz.alert)).toBeGreaterThanOrEqual(3);
    expect(Math.min(tenants.glyph, fuzz.glyph)).toBeGreaterThanOrEqual(4.5);
  }, 60_000);
});

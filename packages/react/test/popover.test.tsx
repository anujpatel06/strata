import { render, screen, waitFor } from '@testing-library/react';
import type { BrandInput } from '@strata/theme-engine';
import userEvent from '@testing-library/user-event';
import { Button } from '../src/ui/button';
import { DialogTrigger } from '../src/ui/dialog';
import { Popover, type PopoverProps } from '../src/ui/popover';

function Example(props: Partial<PopoverProps>) {
  return (
    <DialogTrigger>
      <Button>Details</Button>
      <Popover {...props}>
        <p>Submitted on 12 March.</p>
        <button type="button">Copy reference</button>
      </Popover>
    </DialogTrigger>
  );
}

describe('Popover', () => {
  it('opens from the keyboard as a dialog and closes on Escape, restoring focus', async () => {
    const user = userEvent.setup();
    render(<Example />);
    const trigger = screen.getByRole('button', { name: 'Details' });
    await user.tab();
    await user.keyboard('{Enter}');
    expect(screen.getByRole('dialog', { name: 'Details' })).toBeInTheDocument();
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    await waitFor(() => expect(trigger).toHaveFocus());
  });

  it('draws an arrow only when showArrow is set, and passes className through', async () => {
    const user = userEvent.setup();
    const { unmount } = render(<Example className="custom" />);
    await user.click(screen.getByRole('button', { name: 'Details' }));
    const popover = screen.getByRole('dialog');
    expect(popover).toHaveClass('popover', 'custom');
    expect(popover.querySelector('.arrow')).toBeNull();
    unmount();

    render(<Example showArrow />);
    await user.click(screen.getByRole('button', { name: 'Details' }));
    expect(screen.getByRole('dialog').querySelector('.arrow svg')).not.toBeNull();
  });

  it('carries the ThemeScope attributes of its trigger', async () => {
    const user = userEvent.setup();
    render(
      <div data-strata-theme="harbor" data-strata-scheme="dark" lang="en-GB">
        <Example />
      </div>,
    );
    await user.click(screen.getByRole('button', { name: 'Details' }));
    const popover = screen.getByRole('dialog');
    expect(popover).toHaveAttribute('data-strata-theme', 'harbor');
    expect(popover).toHaveAttribute('data-strata-scheme', 'dark');
    expect(popover).toHaveAttribute('lang', 'en-GB');
  });
});

/*
 * Glass + sheen contrast proof (surface recipe). Every glass surface layers the engine's sheen (dark: a band of
 * text.default at its peak %) over a face of surface.raised at (glass opacity + OFFSET points). The engine solves
 * the glass opacity so text.default and text.subtle just reach 4.5:1 over black and white backdrops; the sheen would
 * take that margin (3.67:1 at the 8% peak without the offset), so the offset buys it back. This re-derives both numbers from the CSS
 * and the engine, composites in 8-bit sRGB like glass.ts (backdrop → face → sheen), and checks the 5 tenants and the
 * 1,000 fuzz brands in dark (light has no sheen; the offset only adds margin there).
 */
describe('glass + sheen contrast', () => {
  const node = (
    globalThis as unknown as {
      process: {
        cwd(): string;
        getBuiltinModule(id: 'node:fs'): { readFileSync(file: string, encoding: 'utf8'): string };
      };
    }
  ).process;
  const read = (f: string) => node.getBuiltinModule('node:fs').readFileSync(`${node.cwd()}/${f}`, 'utf8');
  const FILES = ['popover', 'select', 'combobox', 'date-picker', 'dialog', 'sheet', 'command'];
  const FACE = /--_glass: color-mix\(in srgb, var\(--strata-color-surface-raised\) calc\(var\(--strata-glass-opacity\) \* 100% \+ (\d+)%\), transparent\);/;

  it('every glass surface uses the same face and layers the sheen over it', () => {
    const offsets = FILES.map((f) => {
      const css = read(`src/ui/${f}.module.css`);
      expect(css, f).toMatch(/background: var\(--strata-sheen\), var\(--_glass\);/);
      expect(css, f).not.toMatch(/var\(--strata-glass-bg\)/);
      return Number(FACE.exec(css)?.[1]);
    });
    expect(new Set(offsets)).toEqual(new Set([8]));
  });

  it('text.default and text.subtle stay ≥ 4.5:1 under the sheen peak over any backdrop (tenants + fuzz, dark)', async () => {
    const { generateTheme, toCssVariables } = await import('@strata/theme-engine');
    const { contrastRatio, hexToRgb8, rgb8ToHex } = await import('../../theme-engine/src/color');
    // A variable specifier keeps tsc out of the fuzz script (it's Node-only; this package has no Node types).
    const fuzzModule = `${node.cwd()}/../theme-engine/scripts/fuzz.ts`;
    const { fuzzInputs } = (await import(/* @vite-ignore */ fuzzModule)) as { fuzzInputs(): BrandInput[] };
    const tenants = await Promise.all(
      ['vela', 'harbor', 'qamar', 'care', 'house'].map(async (t) => (await import(`../../../tenants/${t}/brand.json`)).default),
    );
    const offset = Number(FACE.exec(read('src/ui/popover.module.css'))?.[1]) / 100;
    const over = (fg: string, bg: string, a: number) => {
      const f = hexToRgb8(fg);
      const b = hexToRgb8(bg);
      return rgb8ToHex([0, 1, 2].map((i) => f[i]! * a + b[i]! * (1 - a)) as [number, number, number]);
    };
    let worst = Infinity;
    for (const input of [...tenants, ...fuzzInputs()]) {
      const theme = generateTheme(input);
      const peak = Number(/(\d+)%, transparent\) 20%/.exec(toCssVariables(theme, 'dark')['--strata-sheen']!)![1]) / 100;
      const { roles, glass } = theme.schemes.dark;
      const face = Math.min(1, Math.round(glass.opacity * 100) / 100 + offset);
      for (const backdrop of ['#000000', '#ffffff']) {
        const lit = over(roles['text.default'].hex, over(roles['surface.raised'].hex, backdrop, face), peak);
        for (const role of ['text.default', 'text.subtle'] as const) worst = Math.min(worst, contrastRatio(roles[role].hex, lit));
      }
    }
    expect(worst).toBeGreaterThanOrEqual(4.5);
  }, 30_000);
});

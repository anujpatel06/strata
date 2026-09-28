import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { IconPlus } from '@syntara/icons';
import { generateTheme, type BrandInput } from '@syntara/theme-engine';
import { contrastRatio } from '../../theme-engine/src/color';
import { Button } from '../src/ui/button';
import { TENANTS, loadFuzzInputs, readUiCss } from './status-icon-contrast';

describe('Button', () => {
  it('renders a button named by its text, primary + md by default', () => {
    render(<Button>Save changes</Button>);
    const button = screen.getByRole('button', { name: 'Save changes' });
    expect(button).toHaveAttribute('data-variant', 'primary');
    expect(button).toHaveAttribute('data-size', 'md');
    expect(button).toHaveAttribute('type', 'button');
  });

  it('fires onPress from Enter and Space', async () => {
    const onPress = vi.fn();
    const user = userEvent.setup();
    render(<Button onPress={onPress}>Save</Button>);
    await user.tab();
    expect(screen.getByRole('button')).toHaveFocus();
    await user.keyboard('{Enter}');
    await user.keyboard(' ');
    expect(onPress).toHaveBeenCalledTimes(2);
  });

  it('shows the focus-visible state only for keyboard focus', async () => {
    const user = userEvent.setup();
    render(<Button>Save</Button>);
    await user.tab();
    expect(screen.getByRole('button')).toHaveAttribute('data-focus-visible');
  });

  it('is disabled for assistive tech and ignores presses', async () => {
    const onPress = vi.fn();
    const user = userEvent.setup();
    render(
      <Button isDisabled onPress={onPress}>
        Save
      </Button>,
    );
    const button = screen.getByRole('button', { name: 'Save' });
    expect(button).toBeDisabled();
    await user.click(button);
    expect(onPress).not.toHaveBeenCalled();
  });

  it('when pending: stays focusable, is busy + aria-disabled, blocks presses and swaps the leading icon for a spinner', async () => {
    const onPress = vi.fn();
    const user = userEvent.setup();
    const { container } = render(
      <Button isPending onPress={onPress}>
        <IconPlus aria-hidden />
        Add payee
      </Button>,
    );
    const button = screen.getByRole('button', { name: 'Add payee' });
    expect(button).toHaveAttribute('aria-busy', 'true');
    expect(button).toHaveAttribute('aria-disabled', 'true');
    expect(button).toHaveAttribute('data-pending');
    await user.tab();
    expect(button).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(onPress).not.toHaveBeenCalled();
    expect(container.querySelector('[data-syntara-icon="plus"]')).toBeNull();
    expect(container.querySelector('.spinner')).not.toBeNull();
  });

  it('when pending without a leading icon, overlays the spinner and keeps the label in the name', () => {
    const { container } = render(<Button isPending>Save</Button>);
    expect(container.querySelector('.spinnerOverlay')).not.toBeNull();
    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
  });

  it('icon size is named by aria-label', () => {
    render(
      <Button size="icon" variant="ghost" aria-label="Add payee">
        <IconPlus aria-hidden />
      </Button>,
    );
    expect(screen.getByRole('button', { name: 'Add payee' })).toHaveAttribute('data-size', 'icon');
  });

  it('passes className through (string and function forms)', () => {
    render(
      <>
        <Button className="w-full">One</Button>
        <Button className={({ isPending }) => (isPending ? 'busy' : 'idle')}>Two</Button>
      </>,
    );
    expect(screen.getByRole('button', { name: 'One' })).toHaveClass('root', 'w-full');
    expect(screen.getByRole('button', { name: 'Two' })).toHaveClass('root', 'idle');
  });

  it('renders the contrast variant as a named, pressable button that respects isDisabled', async () => {
    const user = userEvent.setup();
    const onPress = vi.fn();
    const { rerender } = render(
      <Button variant="contrast" size="lg" onPress={onPress}>
        Review transfer
      </Button>,
    );
    const button = screen.getByRole('button', { name: 'Review transfer' });
    expect(button).toHaveAttribute('data-variant', 'contrast');
    expect(button).toHaveAttribute('data-size', 'lg');
    await user.tab();
    expect(button).toHaveFocus();
    await user.keyboard('{Enter}');
    await user.keyboard(' ');
    expect(onPress).toHaveBeenCalledTimes(2);
    rerender(
      <Button variant="contrast" size="lg" onPress={onPress} isDisabled>
        Review transfer
      </Button>,
    );
    expect(screen.getByRole('button', { name: 'Review transfer' })).toBeDisabled();
  });
});

describe('Button: tone', () => {
  let warn: ReturnType<typeof vi.spyOn>;
  beforeEach(() => {
    warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
  });
  afterEach(() => {
    warn.mockRestore();
    vi.unstubAllEnvs();
  });

  /** A fresh copy of the module, so the once-per-page-load flags start unset. */
  async function freshButton(): Promise<typeof Button> {
    vi.resetModules();
    return (await import('../src/ui/button')).Button;
  }

  it('is neutral by default and emits no data-tone', () => {
    render(
      <>
        <Button>Save</Button>
        <Button tone="neutral" variant="outline">
          Cancel
        </Button>
      </>,
    );
    expect(screen.getByRole('button', { name: 'Save' })).not.toHaveAttribute('data-tone');
    expect(screen.getByRole('button', { name: 'Cancel' })).not.toHaveAttribute('data-tone');
  });

  it.each(['primary', 'outline', 'ghost'] as const)('%s + tone="danger" emits data-variant and data-tone, without warning', async (variant) => {
    const Fresh = await freshButton();
    render(
      <Fresh variant={variant} tone="danger">
        Delete account
      </Fresh>,
    );
    const button = screen.getByRole('button', { name: 'Delete account' });
    expect(button).toHaveAttribute('data-variant', variant);
    expect(button).toHaveAttribute('data-tone', 'danger');
    expect(warn).not.toHaveBeenCalled();
  });

  it('tone="danger" alone is the solid danger button (primary is the default variant)', () => {
    render(<Button tone="danger">Delete account</Button>);
    const button = screen.getByRole('button', { name: 'Delete account' });
    expect(button).toHaveAttribute('data-variant', 'primary');
    expect(button).toHaveAttribute('data-tone', 'danger');
  });

  it.each(['secondary', 'link', 'contrast'] as const)('%s ignores tone: no data-tone', (variant) => {
    render(
      <Button variant={variant} tone="danger">
        Remove card
      </Button>,
    );
    const button = screen.getByRole('button', { name: 'Remove card' });
    expect(button).toHaveAttribute('data-variant', variant);
    expect(button).not.toHaveAttribute('data-tone');
  });

  it('warns once in development when tone is ignored, however many buttons and renders', async () => {
    const Fresh = await freshButton();
    const { rerender } = render(
      <>
        <Fresh variant="secondary" tone="danger">
          One
        </Fresh>
        <Fresh variant="link" tone="danger">
          Two
        </Fresh>
      </>,
    );
    rerender(
      <Fresh variant="contrast" tone="danger">
        Three
      </Fresh>,
    );
    expect(warn).toHaveBeenCalledTimes(1);
    expect(String(warn.mock.calls[0]?.[0])).toMatch(/tone="danger" has no effect on variant="secondary"/);
  });

  it('deprecated variant="danger" renders as before: data-variant="danger", no data-tone', () => {
    // Deliberately the deprecated prop: this test is the proof that old code renders the same. Keep codemods off this file.
    render(<Button variant="danger">Delete</Button>);
    const button = screen.getByRole('button', { name: 'Delete' });
    expect(button).toHaveAttribute('data-variant', 'danger');
    expect(button).not.toHaveAttribute('data-tone');
    expect(button).toHaveClass('root');
  });

  it('deprecated variant="danger" warns exactly once across instances, re-renders and remounts', async () => {
    const Fresh = await freshButton();
    const { rerender, unmount } = render(
      <>
        <Fresh variant="danger">One</Fresh>
        <Fresh variant="danger">Two</Fresh>
      </>,
    );
    for (const label of ['A', 'B', 'C']) rerender(<Fresh variant="danger">{label}</Fresh>);
    unmount();
    render(<Fresh variant="danger">Again</Fresh>);
    expect(warn).toHaveBeenCalledTimes(1);
    const message = String(warn.mock.calls[0]?.[0]);
    expect(message).toContain('variant="danger" is deprecated');
    expect(message).toContain('tone="danger"');
    expect(message).toContain('1.0.0');
    expect(message).toContain('npx @syntara/codemods button-variant-danger-to-tone <path>');
  });

  it('does not warn in production', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    const Fresh = await freshButton();
    render(
      <>
        <Fresh variant="danger">Delete</Fresh>
        <Fresh variant="secondary" tone="danger">
          Remove
        </Fresh>
      </>,
    );
    expect(screen.getByRole('button', { name: 'Delete' })).toHaveAttribute('data-variant', 'danger');
    expect(warn).not.toHaveBeenCalled();
  });

  it('does not warn or throw where `process` does not exist', async () => {
    // React and React Aria read process.env themselves when unbundled, so `process` can't simply be removed.
    // Instead it reads as undefined only when the caller is button.tsx (the frame right above the getter).
    const real = Object.getOwnPropertyDescriptor(globalThis, 'process')!;
    const realProcess = (globalThis as { process?: unknown }).process;
    let hidden = 0;
    Object.defineProperty(globalThis, 'process', {
      configurable: true,
      get() {
        const caller = new Error().stack?.split('\n')[2] ?? '';
        if (!caller.includes('/src/ui/button.tsx')) return realProcess;
        hidden += 1;
        return undefined;
      },
    });
    try {
      const Fresh = await freshButton();
      render(<Fresh variant="danger">Delete</Fresh>);
    } finally {
      Object.defineProperty(globalThis, 'process', real);
    }
    expect(hidden).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: 'Delete' })).toHaveAttribute('data-variant', 'danger');
    expect(warn).not.toHaveBeenCalled();
  });

  it.each(['primary', 'outline', 'ghost'] as const)('%s + danger fires onPress from Enter and Space, and shows keyboard focus', async (variant) => {
    const onPress = vi.fn();
    const user = userEvent.setup();
    render(
      <Button variant={variant} tone="danger" onPress={onPress}>
        Discard draft
      </Button>,
    );
    await user.tab();
    const button = screen.getByRole('button', { name: 'Discard draft' });
    expect(button).toHaveFocus();
    expect(button).toHaveAttribute('data-focus-visible');
    await user.keyboard('{Enter}');
    await user.keyboard(' ');
    expect(onPress).toHaveBeenCalledTimes(2);
  });

  it('disabled and pending work with a tone', async () => {
    const onPress = vi.fn();
    const user = userEvent.setup();
    render(
      <>
        <Button variant="outline" tone="danger" isDisabled onPress={onPress}>
          Remove card
        </Button>
        <Button variant="ghost" tone="danger" isPending onPress={onPress}>
          Discard draft
        </Button>
      </>,
    );
    const disabled = screen.getByRole('button', { name: 'Remove card' });
    expect(disabled).toBeDisabled();
    expect(disabled).toHaveAttribute('data-disabled');
    expect(disabled).toHaveAttribute('data-tone', 'danger');
    const pending = screen.getByRole('button', { name: 'Discard draft' });
    expect(pending).toHaveAttribute('aria-busy', 'true');
    expect(pending).toHaveAttribute('aria-disabled', 'true');
    await user.click(disabled);
    await user.click(pending);
    expect(onPress).not.toHaveBeenCalled();
  });

  it('passes className through with a tone', () => {
    render(
      <Button variant="outline" tone="danger" className="w-full">
        Remove card
      </Button>,
    );
    expect(screen.getByRole('button', { name: 'Remove card' })).toHaveClass('root', 'w-full');
  });
});

/*
 * Contrast proof for the quiet danger buttons (WCAG 1.4.3, text ≥ 4.5:1). The label colour and the faces are read
 * from button.module.css, so the proof can't drift from the styles. A ghost button is transparent at rest, so its
 * face is whatever surface it sits on: the five opaque surfaces are listed here (glass is excluded by the
 * guidelines). Every tenant × light/dark and the engine's 1,000 fuzz brands. Ratios are never rounded.
 */
describe('Button: tone="danger" contrast proof', () => {
  const css = readUiCss('button.module.css');
  const GHOST_SURFACES = ['surface.canvas', 'surface.default', 'surface.raised', 'surface.sunken', 'surface.selected'];

  /** Declarations of every rule whose selector matches all the given parts. */
  function declarations(...parts: string[]): string {
    const out: string[] = [];
    for (const m of css.replace(/\/\*[\s\S]*?\*\//g, '').matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
      if (parts.every((p) => m[1]!.includes(p))) out.push(m[2]!);
    }
    return out.join('\n');
  }
  /** Roles a private hook is set to, e.g. --_fg → ['feedback.danger.fg']. Throws on anything that isn't a plain role. */
  function roles(block: string, hook: '--_fg' | '--_bg'): string[] {
    const known = Object.keys(generateTheme(TENANTS.vela!).schemes.light.roles);
    const kebab = (role: string) => role.replace(/\./g, '-').replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);
    return [...block.matchAll(new RegExp(`${hook}:\\s*([^;]+);`, 'g'))].map((m) => {
      const value = m[1]!.trim();
      const role = known.find((r) => value === `var(--syntara-color-${kebab(r)})`);
      if (!role) throw new Error(`${hook} is not a plain colour role: ${value}`);
      return role;
    });
  }

  const outline = declarations("[data-variant='outline']", "[data-tone='danger']");
  const ghost = declarations("[data-variant='ghost']", "[data-tone='danger']");
  const labels = [...new Set([...roles(outline, '--_fg'), ...roles(ghost, '--_fg')])];
  const outlineFaces = [...new Set(roles(outline, '--_bg'))];
  const ghostFaces = [...new Set([...roles(ghost, '--_bg'), ...GHOST_SURFACES])];
  const faces = [...new Set([...outlineFaces, ...ghostFaces])];

  function worstByFace(inputs: BrandInput[], names?: string[]): Record<string, { ratio: number; at: string }> {
    const worst: Record<string, { ratio: number; at: string }> = {};
    for (const face of faces) worst[face] = { ratio: Infinity, at: '' };
    inputs.forEach((input, i) => {
      const theme = generateTheme(input);
      for (const scheme of ['light', 'dark'] as const) {
        const r = theme.schemes[scheme].roles as Record<string, { hex: string }>;
        for (const face of faces) {
          const ratio = contrastRatio(r[labels[0]!]!.hex, r[face]!.hex);
          if (ratio < worst[face]!.ratio) worst[face] = { ratio, at: `${names?.[i] ?? `fuzz#${i}`} ${scheme}` };
        }
      }
    });
    return worst;
  }

  it('reads the label and the faces from the CSS: opaque roles only, no tints', () => {
    expect(labels).toEqual(['feedback.danger.fg']);
    expect(outlineFaces.sort()).toEqual(['feedback.danger.bg', 'surface.default']);
    // Ghost sets a face for hover and press only; at rest it is transparent.
    expect(roles(ghost, '--_bg')).toContain('feedback.danger.bg');
    expect(outline + ghost).not.toMatch(/color-mix|transparent/);
    // The solid rule set serves the deprecated variant and its replacement together.
    expect(css).toContain(":is([data-variant='danger'], [data-variant='primary'][data-tone='danger'])");
    expect(css.replace(/\/\*[\s\S]*?\*\//g, '')).not.toMatch(/\.root\[data-variant='danger'\]/);
  });

  it('label ≥ 4.5:1 on every face, every tenant × scheme and 1,000 fuzz brands', async () => {
    const tenants = worstByFace(Object.values(TENANTS), Object.keys(TENANTS));
    const fuzzInputs = await loadFuzzInputs();
    expect(fuzzInputs).toHaveLength(1000);
    const fuzz = worstByFace(fuzzInputs);
    const report = faces.map((face) => {
      const w = tenants[face]!.ratio <= fuzz[face]!.ratio ? tenants[face]! : fuzz[face]!;
      return { pair: `feedback.danger.fg on ${face}`, worst: w.ratio, at: w.at, tenantsWorst: tenants[face]!.ratio, tenantsAt: tenants[face]!.at };
    });
    console.info(`Button tone="danger" contrast, worst per face (unrounded):\n${report.map((r) => `  ${r.pair}: ${r.worst} (${r.at}); tenants ${r.tenantsWorst} (${r.tenantsAt})`).join('\n')}`);
    const failing = report.filter((r) => !(r.worst >= 4.5));
    expect(failing).toEqual([]);
  }, 120_000);
});

import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import { generateTheme, type BrandInput } from '@strata/theme-engine';
import {
  contrastRatio,
  hexToRgb8,
  linearRgbToOklab,
  linearToSrgb,
  oklabToLinearRgb,
  rgb8ToHex,
  srgbToLinear,
} from '../../theme-engine/src/color';
import vela from '../../../tenants/vela/brand.json';
import harbor from '../../../tenants/harbor/brand.json';
import qamar from '../../../tenants/qamar/brand.json';
import care from '../../../tenants/care/brand.json';
import house from '../../../tenants/house/brand.json';
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../src/ui/card';

describe('Card', () => {
  it('composes header, content and footer with an h3 title by default', () => {
    render(
      <Card data-testid="card">
        <CardHeader>
          <CardTitle>Family plan</CardTitle>
          <CardDescription>Renews in April</CardDescription>
          <CardAction>
            <button type="button">Manage</button>
          </CardAction>
        </CardHeader>
        <CardContent>Four members</CardContent>
        <CardFooter divider>
          <button type="button">Download</button>
        </CardFooter>
      </Card>,
    );
    expect(screen.getByRole('heading', { level: 3, name: 'Family plan' })).toBeInTheDocument();
    expect(screen.getByText('Renews in April').tagName).toBe('P');
    expect(screen.getByRole('button', { name: 'Manage' }).parentElement).toHaveClass('action');
    expect(screen.getByText('Four members')).toHaveClass('content');
    expect(screen.getByRole('button', { name: 'Download' }).parentElement).toHaveAttribute('data-divider', 'true');
    expect(screen.getByTestId('card')).toHaveAttribute('data-variant', 'default');
  });

  it('takes a heading level for the title', () => {
    render(<CardTitle level={2}>Summary</CardTitle>);
    expect(screen.getByRole('heading', { level: 2, name: 'Summary' })).toBeInTheDocument();
  });

  it('reflects the variant, passes className and forwards refs', () => {
    const ref = createRef<HTMLDivElement>();
    render(<Card ref={ref} variant="ghost" className="mine" aria-label="Plan" role="region" />);
    const card = screen.getByRole('region', { name: 'Plan' });
    expect(card).toBe(ref.current);
    expect(card).toHaveAttribute('data-variant', 'ghost');
    expect(card).toHaveClass('card', 'mine');
  });

  it('marks interactive cards, whose title link is the single tab stop', () => {
    render(
      <Card interactive data-testid="card">
        <CardHeader>
          <CardTitle>
            <a href="#health">Health cover</a>
          </CardTitle>
        </CardHeader>
      </Card>,
    );
    expect(screen.getByTestId('card')).toHaveAttribute('data-interactive', 'true');
    expect(screen.getByRole('link', { name: 'Health cover' })).toBeInTheDocument();
    render(<Card data-testid="plain" />);
    expect(screen.getByTestId('plain')).not.toHaveAttribute('data-interactive');
  });

  it('CardContent is plain by default and opts into the inset surface', () => {
    render(
      <Card>
        <CardContent data-testid="plain">Balance</CardContent>
        <CardContent variant="inset" data-testid="inset" className="mine">
          <ul aria-label="Files">
            <li>summary.tsx</li>
          </ul>
        </CardContent>
      </Card>,
    );
    expect(screen.getByTestId('plain')).not.toHaveAttribute('data-variant');
    const inset = screen.getByTestId('inset');
    expect(inset).toHaveAttribute('data-variant', 'inset');
    expect(inset).toHaveClass('content', 'mine');
    expect(screen.getByRole('list', { name: 'Files' })).toBeInTheDocument();
  });

  it('feature: rim always on, stars only when asked; rim is opt-in elsewhere', () => {
    render(
      <>
        <Card data-testid="feature" variant="feature" stars />
        <Card data-testid="feature-plain" variant="feature" />
        <Card data-testid="rim" rim />
        <Card data-testid="plain" />
        <Card data-testid="stars-ignored" stars />
      </>,
    );
    const feature = screen.getByTestId('feature');
    expect(feature).toHaveAttribute('data-variant', 'feature');
    expect(feature).toHaveAttribute('data-rim', 'true');
    expect(feature).toHaveAttribute('data-stars', 'true');
    expect(screen.getByTestId('feature-plain')).not.toHaveAttribute('data-stars');
    expect(screen.getByTestId('rim')).toHaveAttribute('data-rim', 'true');
    expect(screen.getByTestId('plain')).not.toHaveAttribute('data-rim');
    expect(screen.getByTestId('stars-ignored')).not.toHaveAttribute('data-stars');
    // The star field is a pseudo-element: nothing extra in the DOM or the accessibility tree.
    expect(feature.childElementCount).toBe(0);
  });
});

/*
 * Feature card contrast proof. Reads the glow and star numbers straight from card.module.css, so changing them
 * re-runs the proof. For every tenant × scheme it samples the glow along its radius (t = 0 is the corner):
 *   glow(t)  = color-mix(in oklab, action.primary.bg S%, surface.raised) fading to surface.raised at STOP%,
 *              interpolated both ways a browser may (sRGB, and OKLab because color-mix stops are non-legacy);
 *   star(t)  = a dot at the star alpha × its mask (dark: text.default, clear at the glow → full at the far edge;
 *              light: surface.raised, full at the glow → clear), composited in 8-bit sRGB like glass.ts.
 * text.default, text.subtle and text.brand must reach 4.5:1 on every sampled glow and dot pixel.
 */
describe('feature card contrast', () => {
  const TENANTS = { vela, harbor, qamar, care, house } as Record<string, BrandInput>;
  // The CSS is read as text (a ?raw import goes through the CSS Modules pipeline here). This package has no Node
  // types, so fs comes from Node's getBuiltinModule with a minimal signature.
  // Vitest runs from packages/react (its config root).
  const node = (
    globalThis as unknown as {
      process: {
        cwd(): string;
        getBuiltinModule(id: 'node:fs'): { readFileSync(file: string, encoding: 'utf8'): string };
      };
    }
  ).process;
  const css = node.getBuiltinModule('node:fs').readFileSync(`${node.cwd()}/src/ui/card.module.css`, 'utf8');
  const num = (re: RegExp): number => {
    const m = re.exec(css);
    if (!m) throw new Error(`card.module.css: ${re} not found`);
    return Number(m[1]);
  };
  const glowBlock = /--_glow: light-dark\(([\s\S]*?)\);\n/.exec(css)?.[1] ?? '';
  const [SL, SD] = [...glowBlock.matchAll(/action-primary-bg\) (\d+)%/g)].map((m) => Number(m[1]));
  const STOP = num(/var\(--_glow\) 0%, var\(--strata-color-surface-raised\) (\d+)%/);
  const AL = num(/--_star: light-dark\(\s*color-mix\(in srgb, var\(--strata-color-surface-raised\) (\d+)%/) / 100;
  const AD = num(/color-mix\(in srgb, var\(--strata-color-text-default\) (\d+)%, transparent\)\s*\);/) / 100;

  type Rgb = [number, number, number];
  const toLab = (hex: string) => linearRgbToOklab(hexToRgb8(hex).map((v) => srgbToLinear(v / 255)) as Rgb);
  const mix = (a: string, b: string, p: number): string => {
    const A = toLab(a);
    const B = toLab(b);
    const t = p / 100;
    const lab = { l: A.l * t + B.l * (1 - t), a: A.a * t + B.a * (1 - t), b: A.b * t + B.b * (1 - t) };
    return rgb8ToHex(oklabToLinearRgb(lab).map((v) => Math.max(0, Math.min(1, linearToSrgb(v))) * 255) as Rgb);
  };
  const over = (fg: string, bg: string, alpha: number): string => {
    const f = hexToRgb8(fg);
    const b = hexToRgb8(bg);
    return rgb8ToHex([0, 1, 2].map((i) => f[i]! * alpha + b[i]! * (1 - alpha)) as Rgb);
  };

  // The sheen (surface recipe) is proven on plain surface.raised by the engine, not on the glow: over the dark glow it
  // would drop text.subtle and text.brand to 4.15:1 (qamar, at a 6% peak, measured 2026-09-27; the peak is now 8%). So the feature variant opts out.
  it('layers the sheen on default cards and keeps it off the feature glow', () => {
    expect(css).toMatch(/--_sheen: var\(--strata-sheen\);/);
    expect(css).toMatch(/var\(--_sheen\) padding-box,\s*var\(--_face\) padding-box/);
    const feature = /\.card\[data-variant='feature'\] \{([\s\S]*?)\n\}/.exec(css)?.[1] ?? '';
    expect(feature).toMatch(/--_sheen: none;/);
  });

  it('reads the numbers it proves from the CSS', () => {
    expect([SL, SD, STOP, AL, AD]).toEqual([6, 30, 70, 0.6, 0.2]);
  });

  for (const tenant of ['vela', 'harbor', 'qamar', 'care', 'house']) {
    it(`${tenant}: text.default, text.subtle and text.brand stay ≥ 4.5:1 on the glow and the stars`, () => {
      const theme = generateTheme(TENANTS[tenant]!);
      for (const scheme of ['light', 'dark'] as const) {
        const hex = (role: keyof typeof theme.schemes.light.roles) => theme.schemes[scheme].roles[role].hex;
        const dark = scheme === 'dark';
        const S = dark ? SD! : SL!;
        const A = dark ? AD : AL;
        const base = hex('surface.raised');
        const corner = mix(hex('action.primary.bg'), base, S);
        const dot = dark ? hex('text.default') : base;
        for (const role of ['text.default', 'text.subtle', 'text.brand'] as const) {
          let worst = Infinity;
          for (let i = 0; i <= 200; i++) {
            const x = i / 200;
            const k = Math.max(0, 1 - x / (STOP / 100));
            const alpha = A * (dark ? x : 1 - x);
            for (const g of [over(corner, base, k), mix(hex('action.primary.bg'), base, S * k)]) {
              worst = Math.min(worst, contrastRatio(hex(role), g), contrastRatio(hex(role), over(dot, g, alpha)));
            }
          }
          expect({ tenant, scheme, role, pass: worst >= 4.5, worst }).toMatchObject({ pass: true });
        }
      }
    });
  }
});


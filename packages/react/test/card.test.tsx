import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import { generateTheme, toCssVariables, type BrandInput } from '@syntara/theme-engine';
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
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardMedia, CardTitle } from '../src/ui/card';
import { loadFuzzInputs } from './status-icon-contrast';

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
  const STOP = num(/var\(--_glow\) 0%, var\(--syntara-color-surface-raised\) (\d+)%/);
  const AL = num(/--_star: light-dark\(\s*color-mix\(in srgb, var\(--syntara-color-surface-raised\) (\d+)%/) / 100;
  const AD = num(/color-mix\(in srgb, var\(--syntara-color-text-default\) (\d+)%, transparent\)\s*\);/) / 100;

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

  // The sheen is no longer painted (ADR-038: the diagonal band read as brushed metal). The slot stays in the layer
  // stack, so the recipe's shape is unchanged and restoring it is one line per file. This guards against it coming
  // back by accident; the contrast proofs below still composite its old peak, so they are floors now.
  it('holds the sheen slot open but paints nothing in it', () => {
    expect(css).toMatch(/--_sheen: none;/);
    expect(css).not.toMatch(/--_sheen: var\(--syntara-sheen\);/);
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


describe('showcase card and CardMedia', () => {
  it('renders media first, with the glow as a data attribute and no extra DOM', () => {
    render(
      <Card variant="showcase" data-testid="card">
        <CardMedia data-testid="media" className="mine">
          <img src="data:," alt="The claim screen on a laptop" />
        </CardMedia>
        <CardHeader>
          <CardTitle>Claims</CardTitle>
        </CardHeader>
        <CardFooter divider>
          <a href="#case">Case study</a>
        </CardFooter>
      </Card>,
    );
    const card = screen.getByTestId('card');
    expect(card).toHaveAttribute('data-variant', 'showcase');
    // The showcase rim is its own (top-weighted), not the rim prop's.
    expect(card).not.toHaveAttribute('data-rim');
    const media = screen.getByTestId('media');
    expect(card.firstElementChild).toBe(media);
    expect(media).toHaveClass('media', 'mine');
    expect(media).toHaveAttribute('data-glow', 'brand');
    // The glow is a pseudo-element: the only child is the user's media, with its own alt.
    expect(media.childElementCount).toBe(1);
    expect(screen.getByRole('img', { name: 'The claim screen on a laptop' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Case study' }).parentElement).toHaveAttribute('data-divider', 'true');
  });

  it('takes accent and none glows', () => {
    render(
      <>
        <CardMedia data-testid="accent" glow="accent" />
        <CardMedia data-testid="none" glow="none" />
      </>,
    );
    expect(screen.getByTestId('accent')).toHaveAttribute('data-glow', 'accent');
    expect(screen.getByTestId('none')).not.toHaveAttribute('data-glow');
  });

  it('interactive showcase: the title link is the one tab stop and names the card', () => {
    render(
      <Card variant="showcase" interactive data-testid="card">
        <CardMedia>
          <div role="img" aria-label="A phone" />
        </CardMedia>
        <CardHeader>
          <CardTitle>
            <a href="#renewals">Renewals in one tap</a>
          </CardTitle>
        </CardHeader>
      </Card>,
    );
    expect(screen.getByTestId('card')).toHaveAttribute('data-interactive', 'true');
    expect(screen.getAllByRole('link')).toHaveLength(1);
    expect(screen.getByRole('link', { name: 'Renewals in one tap' })).toBeInTheDocument();
  });
});

/*
 * Showcase card contrast proof. All showcase text sits on the solid face; the face roles are read from the CSS
 * (`--_fill: light-dark(<light role>, <dark role>)` in the showcase rule). In dark the surface recipe's sheen lies
 * over the face: its peak (parsed from the engine's --syntara-sheen) is mixed into the face in sRGB, as the engine's
 * own sheen test does. text.default, text.subtle and text.brand must reach 4.5:1 on the face and on the sheen's
 * peak, for the five tenants and the engine's 1,000 fuzz brands. The glow must stay inside CardMedia.
 */
describe('showcase card contrast', () => {
  const node = (
    globalThis as unknown as {
      process: { cwd(): string; getBuiltinModule(id: 'node:fs'): { readFileSync(file: string, encoding: 'utf8'): string } };
    }
  ).process;
  const css = node.getBuiltinModule('node:fs').readFileSync(`${node.cwd()}/src/ui/card.module.css`, 'utf8');
  const rule = /\.card\[data-variant='showcase'\] \{([\s\S]*?)\n\}/.exec(css)?.[1] ?? '';
  const fill = /--_fill: light-dark\(var\(--syntara-color-([a-z-]+)\), var\(--syntara-color-([a-z-]+)\)\);/.exec(rule);
  const role = (v: string) => v.replace('-', '.') as 'surface.raised';
  const FACE = { light: role(fill?.[1] ?? ''), dark: role(fill?.[2] ?? '') };
  const TEXT = ['text.default', 'text.subtle', 'text.brand'] as const;
  type Rgb = [number, number, number];

  it('reads the face roles from the CSS and keeps every gradient except the rim out of the face', () => {
    expect(FACE).toEqual({ light: 'surface.raised', dark: 'surface.sunken' });
    // The showcase face layers: the sheen, the solid face and the rim. No radial glow, nowhere near the text.
    expect(rule).not.toMatch(/radial-gradient/);
    expect(rule).toMatch(/--_sheen|var\(--_sheen\) padding-box/);
    // The haze exists in exactly one rule: CardMedia's pseudo-element.
    const bare = css.replace(/\/\*[\s\S]*?\*\//g, '');
    const hazeRules = [...bare.matchAll(/([^{}]+)\{[^{}]*var\(--_haze\)[^{}]*\}/g)].map((m) => m[1]!.trim());
    expect(hazeRules.length).toBeGreaterThan(0);
    for (const sel of hazeRules) expect(sel).toMatch(/^\.media\[data-glow\]::before$/);
  });

  const worstFor = (inputs: BrandInput[]) => {
    const worst: Record<string, { ratio: number; at: string }> = {};
    inputs.forEach((input, i) => {
      const theme = generateTheme(input);
      for (const scheme of ['light', 'dark'] as const) {
        const r = theme.schemes[scheme].roles;
        const face = r[FACE[scheme]].hex;
        const faces = [face];
        if (scheme === 'dark') {
          const sheen = toCssVariables(theme, 'dark')['--syntara-sheen'] ?? '';
          const peak = Number(/(\d+)%, transparent\) 20%/.exec(sheen)?.[1] ?? NaN) / 100;
          if (!Number.isFinite(peak)) throw new Error(`sheen peak not found: ${sheen}`);
          const A = hexToRgb8(face);
          const B = hexToRgb8(r['text.default'].hex);
          faces.push(rgb8ToHex([0, 1, 2].map((k) => A[k]! * (1 - peak) + B[k]! * peak) as Rgb));
        }
        for (const t of TEXT) {
          for (const f of faces) {
            const v = contrastRatio(r[t].hex, f);
            const key = `${scheme} ${t}`;
            if (!worst[key] || v < worst[key].ratio) worst[key] = { ratio: v, at: `#${i}` };
          }
        }
      }
    });
    return worst;
  };

  it('tenants: text.default, text.subtle and text.brand ≥ 4.5:1 on the face and the sheen peak', () => {
    const names = ['vela', 'harbor', 'qamar', 'care', 'house'];
    const worst = worstFor(names.map((n) => ({ vela, harbor, qamar, care, house })[n] as unknown as BrandInput));
    const report = Object.fromEntries(
      Object.entries(worst).map(([k, v]) => [k, `${(Math.floor(v.ratio * 1000) / 1000).toFixed(3)} (${names[Number(v.at.slice(1))]})`]),
    );
    console.log('showcase contrast, tenants', report);
    for (const v of Object.values(worst)) expect(v.ratio).toBeGreaterThanOrEqual(4.5);
  });

  it('1,000 fuzz brands: the same three roles ≥ 4.5:1 on the face and the sheen peak', async () => {
    const worst = worstFor(await loadFuzzInputs());
    console.log(
      'showcase contrast, fuzz',
      Object.fromEntries(Object.entries(worst).map(([k, v]) => [k, `${(Math.floor(v.ratio * 1000) / 1000).toFixed(3)} (fuzz${v.at})`])),
    );
    for (const v of Object.values(worst)) expect(v.ratio).toBeGreaterThanOrEqual(4.5);
  }, 60_000);
});

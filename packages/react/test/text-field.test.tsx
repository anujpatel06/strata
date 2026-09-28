import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TextField as RACTextField } from 'react-aria-components';
import { generateTheme, type BrandInput, type Theme } from '@syntara/theme-engine';
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
import { Description, FieldError, FieldGroup, Input, Label, TextField } from '../src/ui/text-field';

describe('TextField', () => {
  it('links label and description to the input', () => {
    render(<TextField label="Email" description="We only use it for receipts." type="email" placeholder="you@example.com" />);
    const input = screen.getByRole('textbox', { name: 'Email' });
    expect(input).toHaveAttribute('type', 'email');
    expect(input).toHaveAttribute('placeholder', 'you@example.com');
    expect(input).toHaveAccessibleDescription('We only use it for receipts.');
  });

  it('accepts typing and reports changes', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<TextField label="Name" onChange={onChange} />);
    await user.tab();
    const input = screen.getByRole('textbox', { name: 'Name' });
    expect(input).toHaveFocus();
    expect(input).toHaveAttribute('data-focused');
    await user.keyboard('Asha');
    expect(input).toHaveValue('Asha');
    expect(onChange).toHaveBeenLastCalledWith('Asha');
  });

  it('shows the error message with an icon, marks the input invalid and describes it', () => {
    const { container } = render(<TextField label="Email" isInvalid errorMessage="Enter a valid email address." />);
    const input = screen.getByRole('textbox', { name: 'Email' });
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAccessibleDescription('Enter a valid email address.');
    expect(container.querySelector('.error svg[aria-hidden="true"]')).not.toBeNull();
  });

  it('shows native validation after a failed submit and marks required visually', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <form onSubmit={(e) => e.preventDefault()}>
        <TextField label="Account name" isRequired />
        <button type="submit">Submit</button>
      </form>,
    );
    const input = screen.getByRole('textbox', { name: 'Account name' });
    expect(input).toBeRequired();
    expect(screen.getByText('*')).toHaveAttribute('aria-hidden', 'true');
    await user.click(screen.getByRole('button', { name: 'Submit' }));
    expect(input.closest('.field')).toHaveAttribute('data-invalid');
    expect(container.querySelector('.error')).not.toBeNull();
  });

  it('reflects disabled state', () => {
    render(<TextField label="Reference" isDisabled defaultValue="REF-2041" />);
    expect(screen.getByRole('textbox', { name: 'Reference' })).toBeDisabled();
  });

  it('renders prefix and suffix inside the box, and a click on the prefix focuses the input', async () => {
    const user = userEvent.setup();
    render(<TextField label="Amount" prefix="₹" suffix="INR" inputMode="decimal" />);
    const input = screen.getByRole('textbox', { name: 'Amount' });
    const group = input.closest('.group');
    expect(group).not.toBeNull();
    expect(group).toHaveTextContent('₹INR');
    await user.click(screen.getByText('₹'));
    expect(input).toHaveFocus();
  });

  it('passes className through to the root', () => {
    const { container } = render(<TextField label="City" className="extra" />);
    expect(container.firstElementChild).toHaveClass('field', 'extra');
  });
});

describe('field primitives', () => {
  it('compose inside any React Aria field', () => {
    render(
      <RACTextField isInvalid>
        <Label isRequired>Postcode</Label>
        <FieldGroup>
          <Input />
        </FieldGroup>
        <Description>Six digits.</Description>
        <FieldError>Enter a six-digit postcode.</FieldError>
      </RACTextField>,
    );
    const input = screen.getByRole('textbox', { name: 'Postcode' });
    expect(input).toHaveAccessibleDescription('Six digits. Enter a six-digit postcode.');
    expect(input).toHaveClass('input');
  });

  it('FieldError renders nothing while valid', () => {
    const { container } = render(
      <RACTextField aria-label="x">
        <Input />
        <FieldError>Never shown</FieldError>
      </RACTextField>,
    );
    expect(container.querySelector('.error')).toBeNull();
  });
});

describe('TextField size', () => {
  it('marks the field root with its size (md by default) for the box styles', () => {
    render(
      <>
        <TextField label="Default" />
        <TextField label="Small" size="sm" />
        <TextField label="Large" size="lg" prefix="$" />
      </>,
    );
    const root = (name: string) => screen.getByRole('textbox', { name }).closest('[data-field-size]');
    expect(root('Default')).toHaveAttribute('data-field-size', 'md');
    expect(root('Small')).toHaveAttribute('data-field-size', 'sm');
    expect(root('Large')).toHaveAttribute('data-field-size', 'lg');
  });
});

/*
 * Field boundary contrast (WCAG 1.4.11, "Soft outline, still AA", Anuj 2026-09-27). The field edge must reach 3:1
 * against every surface a field sits on (canvas, default, raised, sunken). It reads the dark mix straight from
 * text-field.module.css, so changing it re-runs the proof:
 *   light: border.strong;   dark: color-mix(in oklab, border.strong N%, border.default)
 * over the 5 tenants and the 1,000 seeded fuzz brands (fuzzInputs from theme-engine/scripts/fuzz.ts).
 */
describe('field boundary contrast', () => {
  const node = (
    globalThis as unknown as {
      process: {
        cwd(): string;
        getBuiltinModule(id: 'node:fs'): { readFileSync(file: string, encoding: 'utf8'): string };
      };
    }
  ).process;
  const css = node.getBuiltinModule('node:fs').readFileSync(`${node.cwd()}/src/ui/text-field.module.css`, 'utf8');
  const edge = /--_edge: light-dark\(\s*var\(--syntara-color-border-strong\),\s*color-mix\(in oklab, var\(--syntara-color-border-strong\) (\d+)%, var\(--syntara-color-border-default\)\)\s*\);/.exec(css);
  const DARK = Number(edge?.[1]);

  type Rgb = [number, number, number];
  const toLab = (hex: string) => linearRgbToOklab(hexToRgb8(hex).map((v) => srgbToLinear(v / 255)) as Rgb);
  const mix = (a: string, b: string, p: number): string => {
    const A = toLab(a);
    const B = toLab(b);
    const t = p / 100;
    const lab = { l: A.l * t + B.l * (1 - t), a: A.a * t + B.a * (1 - t), b: A.b * t + B.b * (1 - t) };
    return rgb8ToHex(oklabToLinearRgb(lab).map((v) => Math.max(0, Math.min(1, linearToSrgb(v))) * 255) as Rgb);
  };
  const SURFACES = ['surface.canvas', 'surface.default', 'surface.raised', 'surface.sunken'] as const;
  const worst = (themes: Theme[]) => {
    const out = { light: Infinity, dark: Infinity };
    for (const theme of themes) {
      for (const scheme of ['light', 'dark'] as const) {
        const hex = (role: keyof Theme['schemes']['light']['roles']) => theme.schemes[scheme].roles[role].hex;
        const line = scheme === 'light' ? hex('border.strong') : mix(hex('border.strong'), hex('border.default'), DARK);
        for (const s of SURFACES) out[scheme] = Math.min(out[scheme], contrastRatio(line, hex(s)));
      }
    }
    return out;
  };

  it('reads the dark edge mix from the CSS', () => {
    expect(DARK).toBe(80);
  });

  it('tenants: the edge is ≥ 3:1 on every surface, light and dark', () => {
    const w = worst([vela, harbor, qamar, care, house].map((b) => generateTheme(b as BrandInput)));
    expect(w.light).toBeGreaterThanOrEqual(3);
    expect(w.dark).toBeGreaterThanOrEqual(3);
  });

  it('1,000 fuzz brands: the edge is ≥ 3:1 on every surface, light and dark', async () => {
    // A computed path keeps tsc out of the Node-typed fuzz script; Vitest resolves it at run time.
    const path = `${node.cwd()}/../theme-engine/scripts/fuzz.ts`;
    const { fuzzInputs } = (await import(/* @vite-ignore */ path)) as { fuzzInputs: () => BrandInput[] };
    const inputs = fuzzInputs();
    expect(inputs).toHaveLength(1000);
    const w = worst(inputs.map((b) => generateTheme(b)));
    expect(w.light).toBeGreaterThanOrEqual(3);
    expect(w.dark).toBeGreaterThanOrEqual(3);
  }, 60_000);
});

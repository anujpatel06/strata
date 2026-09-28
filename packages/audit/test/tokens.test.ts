import { describe, expect, it } from 'vitest';
import { findToken } from '../src/index';

describe('findToken', () => {
  it('exact colour, one role', () => {
    expect(findToken('#5a5a5d')).toEqual({
      token: 'color.text.subtle',
      cssVar: '--syntara-color-text-subtle',
      value: '#5a5a5d',
      distance: 0,
      exact: true,
      reason: '#5a5a5d → color.text.subtle (ΔE 0)',
    });
  });

  it('exact colour, several roles: lists the others', () => {
    const m = findToken('#18181B')!;
    expect(m.exact).toBe(true);
    expect(m.distance).toBe(0);
    expect([m.token, ...m.alternatives!].sort()).toEqual(
      ['color.accent.bg', 'color.accent.text', 'color.action.primary.bg', 'color.action.primary.border', 'color.focus.ring', 'color.text.brand'].sort(),
    );
  });

  it('nearest colour: not exact, with the distance in the reason', () => {
    const m = findToken('#1f56e0')!;
    expect(m.exact).toBe(false);
    expect(m.distance).toBeGreaterThan(0);
    expect(m.reason).toBe(`#1f56e0 → ${m.token} (ΔE ${m.distance})`);
    expect(m.cssVar).toBe('--syntara-' + m.token.replace(/\./g, '-').replace(/[A-Z]/g, (c) => '-' + c.toLowerCase()));
  });

  it('reads rgb, hsl, oklch and names, and treats a see-through colour as not exact', () => {
    expect(findToken('rgb(90, 90, 93)')!.exact).toBe(true);
    expect(findToken('white')!.value).toBe('#ffffff');
    expect(findToken('hsl(0 0% 100%)')!.exact).toBe(true);
    expect(findToken('oklch(1 0 0)')!.value).toBe('#ffffff');
    expect(findToken('#5a5a5d80')!.exact).toBe(false);
  });

  it('uses the tenant and scheme', () => {
    expect(findToken('#5a5a5d', { scheme: 'dark' })!.exact).toBe(false);
    expect(findToken('#5a5a5d', { tenant: 'vela' })!.exact).toBe(false);
  });

  it('lengths: exact and nearest, by category, named as the MCP server names them', () => {
    expect(findToken('16px', { category: 'space' })).toMatchObject({ token: 'space.4', cssVar: '--syntara-space-4', value: '16px', exact: true, distance: 0 });
    expect(findToken('1rem', { category: 'space' })).toMatchObject({ token: 'space.4', exact: true });
    expect(findToken('18px', { category: 'space' })).toMatchObject({ exact: false, distance: 2 });
    expect(findToken('14px', { category: 'font-size' })).toMatchObject({ token: 'font.size.md', cssVar: '--syntara-font-size-md', exact: true });
    expect(findToken('8px', { category: 'radius' })).toMatchObject({ token: 'radius.badge', exact: true });
    expect(findToken('12px', { category: 'radius' })).toMatchObject({ exact: true, alternatives: ['radius.field'] });
    expect(findToken('600', { category: 'font-weight' })).toMatchObject({ token: 'font.weight.semibold', cssVar: '--syntara-font-weight-semibold', value: '600', exact: true });
    expect(findToken('650', { category: 'font-weight' })).toMatchObject({ exact: false, distance: 50 });
  });

  it('guesses the category when none is given', () => {
    expect(findToken('16px')!.token).toBe('space.4');
    expect(findToken('500')!.token).toBe('font.weight.medium');
    expect(findToken('bold')!.token).toBe('font.weight.bold');
  });

  it('returns null for what it cannot read', () => {
    expect(findToken('var(--x)')).toBeNull();
    expect(findToken('auto')).toBeNull();
    expect(findToken('50%', { category: 'space' })).toBeNull();
    expect(findToken('not-a-colour', { category: 'color' })).toBeNull();
    expect(findToken('16px', { category: 'shadow' as never })).toBeNull();
  });
});

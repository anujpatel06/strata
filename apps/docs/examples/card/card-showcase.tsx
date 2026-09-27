'use client';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardMedia, CardTitle, Link, StatTile, StatTileGroup } from '@strata/react';
import { IconArrowUpRight } from '@strata/icons';
import type { CSSProperties } from 'react';

const bar = (inlineSize: string, background = 'var(--strata-color-border-default)'): CSSProperties => ({ display: 'block', inlineSize, blockSize: 'var(--strata-space-2)', borderRadius: 'var(--strata-radius-pill)', background });
const screen: CSSProperties = { display: 'grid', gap: 'var(--strata-space-2)', padding: 'var(--strata-space-4)', inlineSize: 'min(100%, calc(var(--strata-space-16) * 5))', boxSizing: 'border-box', borderRadius: 'var(--strata-space-3) var(--strata-space-3) 0 0', background: 'var(--strata-color-surface-raised)', boxShadow: '0 0 0 1px var(--strata-color-border-default), var(--strata-shadow-raised)' };
const panel: CSSProperties = { display: 'grid', gap: 'var(--strata-space-2)', padding: 'var(--strata-space-3)', borderRadius: 'var(--strata-space-2)', background: 'var(--strata-color-action-primary-bg)' };
const base: CSSProperties = { inlineSize: 'min(112%, calc(var(--strata-space-16) * 5.6))', blockSize: 'var(--strata-space-2)', marginInline: '-6%', borderRadius: '0 0 var(--strata-space-2) var(--strata-space-2)', background: 'var(--strata-color-border-strong)' };

export default function Example() {
  return (
    <Card variant="showcase" style={{ inlineSize: '100%', maxInlineSize: 560 }}>
      <CardMedia>
        <div role="img" aria-label="The new claim screen on a laptop" style={{ display: 'grid', justifyItems: 'center', inlineSize: '100%' }}>
          <div style={screen}>
            <span style={bar('40%')} />
            <div style={panel}>
              <span style={bar('50%', 'var(--strata-color-action-primary-fg)')} />
              <span style={bar('30%', 'color-mix(in oklab, var(--strata-color-action-primary-fg) 50%, transparent)')} />
            </div>
            <span style={bar('90%')} />
            <span style={bar('70%')} />
            <span style={bar('80%')} />
          </div>
          <div style={base} />
        </div>
      </CardMedia>
      <CardHeader>
        <CardDescription>
          <span style={{ color: 'var(--strata-color-text-default)' }}>Claims</span> · Member app
        </CardDescription>
        <CardTitle level={2}>A claim form that fills itself in from the receipt</CardTitle>
        <CardDescription>Members retyped every bill by hand and gave up halfway. Now a photo of the receipt fills the form, and they only check it.</CardDescription>
      </CardHeader>
      <CardContent>
        <StatTileGroup>
          <StatTile variant="editorial" value="−42%" label="time to file" />
          <StatTile variant="editorial" value="3 min" label="median claim" />
          <StatTile variant="editorial" value="+11%" label="filed online" />
        </StatTileGroup>
      </CardContent>
      <CardContent>
        <CardDescription>Measured in production, first quarter after launch</CardDescription>
      </CardContent>
      <CardFooter divider>
        <span>2025–26</span>
        <Link variant="standalone" href="#case-study">
          Case study
          <IconArrowUpRight data-directional />
        </Link>
      </CardFooter>
    </Card>
  );
}

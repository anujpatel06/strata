/**
 * Server-only: the figures the story page quotes, read from the repo at build time. The page argues that every
 * number on this site traces to a script, so its own numbers cannot be typed by hand.
 */
import { cache } from 'react';
import { getFuzzSummary } from '@/components/home/home-data';
import { getAllMeta } from '@/lib/meta';
import { listRepoDir } from '@/lib/repo';
import { getTenants } from '@/lib/tenants';

export interface StoryFigure {
  key: string;
  value: string;
  label: string;
}

export const getStoryFigures = cache((): StoryFigure[] => {
  const fuzz = getFuzzSummary();
  // ADR-000 is the template, not a decision.
  const adrs = listRepoDir('docs', 'adr').filter((f) => f.endsWith('.md') && !f.startsWith('000')).length;
  const figures: StoryFigure[] = [
    { key: 'components', value: String(getAllMeta().length), label: 'components, one library' },
    // getTenants() leaves out `house`, the site's own brand, so this is the product brands only.
    { key: 'tenants', value: String(getTenants().length), label: 'product brands, including Arabic and Devanagari — the site runs on a sixth' },
    { key: 'adrs', value: String(adrs), label: 'decisions written down, each naming who made it' },
  ];
  if (fuzz) {
    figures.push({
      key: 'fuzz',
      value: `${fuzz.passRatePercent.toFixed(0)}%`,
      label: `of ${fuzz.totalChecks.toLocaleString('en')} contrast checks pass, over ${fuzz.themes.toLocaleString('en')} random brands`,
    });
  }
  return figures;
});

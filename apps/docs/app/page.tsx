import { getHomeTenants } from '@/components/home/home-data';
import { getAllMeta } from '@/lib/meta';
import { HomeStage } from '@/components/home/home-stage';
import { LiveShowcase } from '@/components/home/live-showcase';
import {
  AccessibilitySection,
  AgentsSection,
  BrandsSection,
  ClosingCta,
  ComponentsSection,
  FaqSection,
  Hero,
  ShowcaseHeader,
  TokensSection,
} from '@/components/home/sections';
import { PageShell } from '@/components/page/page-shell';
import styles from './page.module.css';

export default function Home() {
  const tenants = getHomeTenants();
  /* slug → title, so the showcase's name overlay labels real components and nothing else. */
  const components = Object.fromEntries(getAllMeta().map((m) => [m.name, m.title]));
  return (
    <PageShell>
      {/*
        The stage wraps the whole page, not just the hero: the brand picked in the showcase toolbar colours every
        accent below it too — section headings' one coloured word, the pass-rate figure, the closing call to
        action. Surfaces stay on the house theme deliberately. Only `text.brand` follows the pick, and only for
        tenants whose `text.brand` passes on the house canvas (see HomeStage's `accent`), so switching brands
        cannot walk a heading or a stat below AA.
      */}
      <HomeStage initialTheme={tenants[0]?.id ?? 'house'}>
        <Hero />
        <section className={styles.showcase} aria-labelledby="showcase-title">
          <ShowcaseHeader />
          <LiveShowcase tenants={tenants} components={components} />
        </section>
        <AccessibilitySection />
        <BrandsSection />
        <TokensSection />
        <AgentsSection />
        <ComponentsSection />
        <FaqSection />
        <ClosingCta />
      </HomeStage>
    </PageShell>
  );
}

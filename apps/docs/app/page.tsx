import { getHomeTenants } from '@/components/home/home-data';
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
  TokensSection,
} from '@/components/home/sections';
import { PageShell } from '@/components/page/page-shell';
import styles from './page.module.css';

export default function Home() {
  const tenants = getHomeTenants();
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
          <h2 id="showcase-title" className="visually-hidden">
            Live examples
          </h2>
          <LiveShowcase tenants={tenants} />
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

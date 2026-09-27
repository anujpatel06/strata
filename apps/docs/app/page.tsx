import { getHomeTenants } from '@/components/home/home-data';
import { HomeStage } from '@/components/home/home-stage';
import { LiveShowcase } from '@/components/home/live-showcase';
import { AccessibilitySection, AgentsSection, BrandsSection, ClosingCta, Hero, ShipSection } from '@/components/home/sections';
import { PageShell } from '@/components/page/page-shell';
import styles from './page.module.css';

export default function Home() {
  const tenants = getHomeTenants();
  return (
    <PageShell>
      {/* Hero + showcase share the selected brand: the hero's glow and accent word follow the showcase toolbar. */}
      <HomeStage initialTheme={tenants[0]?.id ?? 'house'}>
        <Hero />
        <section className={styles.showcase} aria-labelledby="showcase-title">
          <h2 id="showcase-title" className="visually-hidden">
            Live examples
          </h2>
          <LiveShowcase tenants={tenants} />
        </section>
      </HomeStage>
      <BrandsSection />
      <AccessibilitySection />
      <ShipSection />
      <AgentsSection />
      <ClosingCta />
    </PageShell>
  );
}

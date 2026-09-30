/**
 * Homepage sections (server components). Every figure is read from the repo at build time — see home-data.ts.
 */
import { IconArrowRight, IconCheck, IconX } from '@syntara/icons';
import { IconBrandGithub } from '@tabler/icons-react';
import {
  Badge,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  StatTile,
  StatTileGroup,
  ThemeScope,
} from '@syntara/react';
import { TYPE_PAIRS } from '@syntara/theme-engine';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { CodeBlock } from '@/components/mdx/code-block';
import { ButtonLink } from '@/components/page/button-link';
import { InstallCommand } from './install-command';
import { DraftCopyNote } from '@/components/page/draft-copy-note';
import { getMeta } from '@/lib/meta';
import { GITHUB_URL } from '@/lib/site';
import {
  getFuzzSummary,
  getReleaseInfo,
  getSolverQuote,
  getTenantOverviews,
  type TenantOverview,
} from './home-data';
import { HeroAccent, HeroGlow } from './home-stage';
import { TenantCard } from './tenant-card';
import styles from './sections.module.css';

const int = new Intl.NumberFormat('en-US');
/** Contrast ratios are floored, never rounded up: 4.49 fails. */
const floor1 = (n: number) => (Math.floor(n * 10) / 10).toFixed(1);

function TextLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className={styles.textLink}>
      {children}
      <IconArrowRight aria-hidden className={styles.arrow} />
    </Link>
  );
}

function SectionHeader({ id, title, children }: { id: string; title: ReactNode; children?: ReactNode }) {
  return (
    <header className={styles.sectionHeader}>
      <h2 id={id} className={styles.sectionTitle}>
        {title}
      </h2>
      {children && <p className={styles.lead}>{children}</p>}
    </header>
  );
}

/* ------------------------------------------------------------------ */

export function Hero() {
  const { version, components } = getReleaseInfo();
  return (
    <section className={styles.hero} aria-labelledby="home-title">
      <HeroGlow />
      <Link href="/docs/changelog" className={styles.pill}>
        {version && <span className={styles.pillVersion}>{version}</span>}
        {version && <span aria-hidden className={styles.pillDivider} />}
        <span>{components} components</span>
        <IconArrowRight aria-hidden className={styles.arrow} />
      </Link>
      <h1 id="home-title" className={styles.heroTitle}>
        One design system. <HeroAccent className={styles.heroBreak}>Every brand.</HeroAccent>
      </h1>
      {/* One sentence, and the specific one: the second half ("one React library renders every brand") is what
          the demo underneath shows rather than tells, and the agents claim has its own section further down. */}
      <p className={styles.heroLead}>Six brand inputs become a light and dark theme that passes WCAG 2.2 AA.</p>
      <div className={styles.heroActions}>
        <ButtonLink href="/docs" variant="inverse" size="lg">
          Get started
        </ButtonLink>
        <ButtonLink href="/docs/components" variant="ghost" size="lg">
          Browse components
        </ButtonLink>
      </div>
      {/*
        The install command used to sit here with the full "run this" treatment — bordered, monospace, a copy
        button — for a package that does not exist, and a line under it taking that back. The honest half is all
        that is left, and it costs a line rather than a block: nothing is promised, so nothing needs retracting.
        The command itself lives on /docs/installation, which is where someone installing would look.
      */}
      <p className={styles.heroNote}>
        Not on npm yet — it publishes in Phase 6.{' '}
        <TextLink href="/docs/installation#by-hand">Copy a component’s source</TextLink>.
      </p>
    </section>
  );
}

/* ------------------------------------------------------------------ */

const LANGUAGE = new Intl.DisplayNames('en', { type: 'language' });
const SHAPE_LABEL = { sharp: 'Sharp', soft: 'Soft', round: 'Round' } as const;
const DENSITY_LABEL = { comfortable: 'Comfortable', compact: 'Compact' } as const;

function tenantFacts(t: TenantOverview): string[] {
  const language = LANGUAGE.of(t.locale.split('-')[0] ?? 'en') ?? t.locale;
  return [
    SHAPE_LABEL[t.shape],
    DENSITY_LABEL[t.density],
    headingFamily(t.typePair),
    t.dir === 'rtl' ? `${language}, right to left` : language,
  ];
}

/** Spelled out so the copy reads as prose; counted from the tenants on disk so it cannot go stale. */
const COUNT_WORD = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];
const countWord = (n: number) => COUNT_WORD[n] ?? String(n);

export function BrandsSection() {
  const tenants = getTenantOverviews();
  return (
    <section className={styles.section} aria-labelledby="brands-title">
      <SectionHeader id="brands-title" title="One system, every brand">
        The same card from the same code, in {countWord(tenants.length)} tenants. A tenant is one brand.json and one
        content.json: it changes tokens and copy, never components.
      </SectionHeader>
      <div className={styles.tenantGrid}>
        {tenants.map((t) => (
          <figure key={t.id} className={styles.tenantFigure}>
            <div className={styles.tenantFrame}>
              <ThemeScope theme={t.id} data-syntara-scheme="site" locale={t.locale} className={styles.tenantScope}>
                <TenantCard tenant={t} level={3} />
              </ThemeScope>
            </div>
            <figcaption className={styles.tenantCaption}>
              <span className={styles.tenantName}>{t.name}</span>
              <span className={styles.facts}>
                {tenantFacts(t).map((f) => (
                  <span key={f} className={styles.fact}>
                    {f}
                  </span>
                ))}
              </span>
              <DraftCopyNote review={t.copyReview} className={styles.copyNote} />
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}

/** The heading family of a type pair, e.g. "Readex Pro". */
function headingFamily(id: keyof typeof TYPE_PAIRS): string {
  return TYPE_PAIRS[id]?.googleFamilies[0] ?? id;
}

/* ------------------------------------------------------------------ */

/**
 * A picture of a button, not a control: the tenant's fill with a label colour. Drawn as SVG so the
 * deliberately failing "before" sample is an illustration (WCAG 1.4.3 exempts pictures), not page text.
 */
function ButtonPicture({ fill, label }: { fill?: string; label: string }) {
  return (
    <svg viewBox="0 0 120 40" className={styles.buttonPicture} aria-hidden focusable="false">
      <rect width="120" height="40" className={styles.buttonPictureFill} style={{ fill }} />
      <text x="60" y="20" dominantBaseline="central" textAnchor="middle" className={styles.buttonPictureLabel} style={{ fill: label }}>
        Place order
      </text>
    </svg>
  );
}

export function AccessibilitySection() {
  const fuzz = getFuzzSummary();
  const quote = getSolverQuote();
  const a = quote?.adjustment;
  return (
    <section className={styles.section} aria-labelledby="a11y-title">
      <div className={styles.split}>
        <div className={styles.stack}>
          <SectionHeader id="a11y-title" title="Accessible by construction">
            A theme that fails WCAG 2.2 AA can’t be generated. The solver checks every text, control and focus-ring
            pair in light and dark, fixes what fails, and explains each fix in plain English.
          </SectionHeader>
          {fuzz && (
            <>
              <StatTileGroup className={styles.figures}>
                <StatTile variant="outline" size="lg" label="Random brands fuzzed" value={int.format(fuzz.themes)} caption="Each in light and dark" />
                <StatTile
                  variant="outline"
                  size="lg"
                  label="Contrast checks"
                  value={int.format(fuzz.totalChecks)}
                  caption={`${fuzz.checksPerTheme} per brand`}
                />
                <StatTile
                  variant="outline"
                  size="lg"
                  label="Pass rate"
                  value={`${fuzz.passRatePercent}%`}
                  caption={`${int.format(fuzz.failed)} failures`}
                />
                <StatTile
                  variant="outline"
                  size="lg"
                  label="Adjustments per brand"
                  value={`${fuzz.adjustments.median}`}
                  caption={`Median; ${fuzz.adjustments.min} to ${fuzz.adjustments.max}`}
                />
              </StatTileGroup>
              <div className={styles.commandRow}>
                <InstallCommand command={fuzz.command} label="Copy the command that reproduces these numbers" />
                <TextLink href="/docs/accessibility">How contrast is guaranteed</TextLink>
              </div>
            </>
          )}
        </div>

        {quote && a && (
          <figure className={styles.quote}>
            <figcaption className={styles.quoteCaption}>
              <span className={styles.tenantName}>{quote.tenant}</span>
              <span className={styles.fact}>{a.scheme === 'light' ? 'Light mode' : 'Dark mode'}</span>
              <span className={styles.fact}>{a.label}</span>
            </figcaption>
            <ThemeScope theme="qamar" scheme={a.scheme} className={styles.quoteScope}>
              <div className={styles.beforeAfter}>
                <div className={styles.sample}>
                  <ButtonPicture fill={quote.againstHex} label={a.fromHex} />
                  <span className={styles.verdict} data-pass="false">
                    <IconX aria-hidden stroke={2} className={styles.verdictIcon} />
                    {a.ratioBefore != null ? `${floor1(a.ratioBefore)}:1` : 'Before'}
                    <span className="visually-hidden">, fails</span>
                  </span>
                </div>
                <IconArrowRight aria-hidden className={styles.beforeAfterArrow} />
                <div className={styles.sample}>
                  <ButtonPicture fill={quote.againstHex} label={a.toHex} />
                  <span className={styles.verdict} data-pass="true">
                    <IconCheck aria-hidden stroke={2} className={styles.verdictIcon} />
                    {a.ratioAfter != null ? `${floor1(a.ratioAfter)}:1` : 'After'}
                    <span className="visually-hidden">, passes</span>
                  </span>
                </div>
              </div>
            </ThemeScope>
            <blockquote className={styles.blockquote}>
              <p>{a.message}</p>
            </blockquote>
            <p className={styles.quoteNote}>
              Written by the engine for {quote.tenant}’s brand colour at build time. Every adjustment carries a
              sentence like this.
            </p>
          </figure>
        )}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */

interface ShipOption {
  title: string;
  description: string;
  command: string;
  href: string;
  link: string;
  badge?: string;
}

const SHIP: readonly ShipOption[] = [
  {
    title: 'npm package',
    description: 'Versioned releases for teams that want upgrades they can govern: deprecations, changelogs and codemods.',
    command: 'pnpm add @syntara/react',
    href: '/docs/installation#with-npm',
    link: 'Install with npm',
    badge: 'Not on npm yet',
  },
  {
    title: 'Design tokens',
    description: 'Every tenant as CSS variables, DTCG 2025.10 JSON and Figma variables. Plain CSS, so any stack can read it.',
    command: 'pnpm add @syntara/tokens',
    href: '/docs/theming',
    link: 'How theming works',
    badge: 'Not on npm yet',
  },
  {
    title: 'Copy the source',
    description: 'Copy a component’s files into your project and own them. Each component page lists its files and dependencies.',
    command: 'pnpm add react-aria-components',
    href: '/docs/installation#by-hand',
    link: 'Install by hand',
  },
];

export function ShipSection() {
  return (
    <section className={styles.section} aria-labelledby="ship-title">
      <SectionHeader id="ship-title" title="Ship it your way">
        One source, three ways in. Pick upgrades or ownership; the components and tokens are the same.
      </SectionHeader>
      <div className={styles.shipGrid}>
        {SHIP.map((o) => (
          <Card key={o.title} variant="outline" className={styles.shipCard}>
            <CardHeader>
              <CardTitle level={3} className={styles.shipTitle}>
                {o.title}
                {o.badge && (
                  <Badge size="sm" tone="neutral" variant="outline">
                    {o.badge}
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>{o.description}</CardDescription>
            </CardHeader>
            <CardContent className={styles.shipCode}>
              <InstallCommand command={o.command} block />
            </CardContent>
            <CardFooter>
              <TextLink href={o.href}>{o.link}</TextLink>
            </CardFooter>
          </Card>
        ))}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */

/**
 * A real excerpt of button.meta.json — the one file the docs, the registry and agents all read. Picked fields,
 * one entry each, formatted compactly so it reads at a glance.
 */
function metaExcerpt(): string | undefined {
  const m = getMeta('button');
  if (!m) return undefined;
  const j = (v: unknown) => JSON.stringify(v);
  const key = m.accessibility.keyboard[0];
  const lines: Array<string | false | undefined> = [
    '{',
    `  "name": ${j(m.name)},`,
    `  "maturity": ${j(m.maturity)},`,
    key && '  "accessibility": {',
    key && '    "keyboard": [',
    key && `      { "keys": ${j(key.keys)}, "action": ${j(key.action)} }`,
    key && '    ]',
    key && '  },',
    '  "guidelines": {',
    m.guidelines.do[0] && `    "do": [${j(m.guidelines.do[0])}],`,
    m.guidelines.dont[0] && `    "dont": [${j(m.guidelines.dont[0])}]`,
    '  },',
    '  "tokens": [',
    `    ${m.tokens.slice(0, 2).map(j).join(', ')}`,
    '  ]',
    '}',
  ];
  return lines.filter((l): l is string => typeof l === 'string' && l.length > 0).join('\n');
}

export function AgentsSection() {
  const excerpt = metaExcerpt();
  return (
    <section className={styles.section} aria-labelledby="agents-title">
      <div className={styles.split}>
        <div className={styles.stack}>
          <SectionHeader id="agents-title" title="Built for people and agents">
            Each component is described once, in a meta.json: props, examples, keyboard behaviour, do and don’t.
            These docs are generated from it, and coding agents can read the same file. A Syntara MCP server, which
            serves components, tokens and usage rules to agents, is planned.
          </SectionHeader>
          <div className={styles.commandRow}>
            <TextLink href="/docs/mcp">About the MCP server</TextLink>
          </div>
        </div>
        {excerpt && (
          <div className={styles.excerpt}>
            <CodeBlock code={excerpt} lang="json" title="packages/react/meta/button.meta.json (excerpt)" collapseAfter={0} />
          </div>
        )}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */

export function ClosingCta() {
  return (
    <section className={styles.cta} aria-labelledby="cta-title">
      <div className={styles.ctaText}>
        <h2 id="cta-title" className={styles.ctaTitle}>
          Start with one component. Keep every brand.
        </h2>
        <p className={styles.ctaLead}>Install a button today; bring your brand colour when you’re ready.</p>
      </div>
      <div className={styles.heroActions}>
        <ButtonLink href="/docs" variant="inverse" size="lg">
          Get started
        </ButtonLink>
        <ButtonLink href="/themes" variant="outline" size="lg">
          Try your brand colour
        </ButtonLink>
        <ButtonLink href={GITHUB_URL} variant="ghost" size="lg">
          <IconBrandGithub aria-hidden />
          GitHub
        </ButtonLink>
      </div>
    </section>
  );
}

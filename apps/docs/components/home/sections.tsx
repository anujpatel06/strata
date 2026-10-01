/**
 * Homepage sections (server components). Every figure is read from the repo at build time — see home-data.ts.
 */
import { IconArrowRight, IconCheck, IconX } from '@syntara/icons';
import { IconBrandGithub } from '@tabler/icons-react';
import {
  Accordion,
  AccordionItem,
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
import { getComponentGroups, getMeta } from '@/lib/meta';
import { GITHUB_URL } from '@/lib/site';
import {
  getFuzzSummary,
  getReleaseInfo,
  getSolverQuote,
  getTenantOverviews,
  getAdrCount,
  getAlsoFacts,
  getFixPanel,
  getMcpTools,
  getPipeline,
  getPhases,
  getTokensFacts,
  type TenantOverview,
} from './home-data';
import { HeroAccent, HeroGlow } from './home-stage';
import { BrandRail } from './brand-rail';
import { ComponentFilter } from './component-filter';
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

/*
 * Heading and lead read as one paragraph: the heading sentence in full colour, the lead continuing in grey on
 * the same line. The mockup achieves that by putting the lead inside the <h2>. This does not — a heading that
 * contains a paragraph of prose is what a screen-reader user hears when they navigate by heading, and this
 * site's whole argument is that it does not make that trade. Both are `display: inline` inside a block wrapper,
 * so they flow together visually while the heading stays a heading.
 */
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
      <p className={styles.heroLead}>
        Six brand inputs become a light and dark theme that passes WCAG 2.2 AA. 53 React components, built by a
        design engineer, ready for agents.
      </p>
      <div className={styles.heroActions}>
        <ButtonLink href="/docs" variant="primary" size="lg">
          Get started
        </ButtonLink>
        <ButtonLink href="/docs/components" variant="outline" size="lg">
          Browse components
        </ButtonLink>
        {/* The mockup runs the npm line in beside the buttons rather than under them. */}
        <p className={styles.heroNote}>
          The packages are on npm.{' '}
          <TextLink href="/docs/installation">Install them, or copy a component’s source</TextLink>.
        </p>
      </div>
      {/*
        The install command used to sit here with the full "run this" treatment — bordered, monospace, a copy
        button — for a package that did not exist. The packages are real now (0.1.0), but the block is not coming
        back: the demo below is the page's argument, and the command belongs on /docs/installation, which is where
        someone installing looks. One line is enough to say it exists. No version number here either — the pill
        above now shows the published version of @syntara/react, so a second number here would just repeat it.
        The site used to show a build phase (v0.5) beside packages published at 0.1.0; there is one version
        scheme now, npm's, and the phases are called phases.
      */}
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
/** Same word, sentence-initial. "One card. Five brands." — not "five brands". */
const countWordCap = (n: number) => {
  const w = countWord(n);
  return w.charAt(0).toUpperCase() + w.slice(1);
};

export function BrandsSection() {
  const tenants = getTenantOverviews();
  return (
    <section className={styles.section} aria-labelledby="brands-title">
      <SectionHeader
        id="brands-title"
        title={
          <>
            One card. <HeroAccent className={styles.titleAccent}>{countWordCap(tenants.length)} brands.</HeroAccent>
          </>
        }
      >
        Arabic right to left, Hindi in Devanagari, a serif for insurance. Same code; only brand.json and
        content.json change.
      </SectionHeader>
      <BrandRail label="brands">
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
      </BrandRail>
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
          <SectionHeader
            id="a11y-title"
            title={
              <>
                {fuzz ? `${fuzz.checksPerTheme} checks a brand.` : 'Every pair checked.'}{' '}
                <HeroAccent className={styles.titleAccent}>Zero failures.</HeroAccent>
              </>
            }
          >
            The engine fuzzed {fuzz ? int.format(fuzz.themes) : 'a thousand'} random brands in light and dark, and
            never rounds up: 4.49:1 fails.
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
                  label="To build a theme"
                  value={`${fuzz.medianMs.toFixed(2)} ms`}
                  caption={`Median; ${fuzz.adjustments.median} adjustments per brand`}
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

/*
 * The three trust levels, worded as GOVERNANCE.md §6 and ADR-008 word them. ADR-008's status says enforcement
 * is not built, so the card says so rather than implying an agent can act.
 */
const TRUST = [
  { level: 'Ambient', may: 'Fix token drift in consumer code, where there is one safe answer', who: 'See it in the diff' },
  { level: 'Soft gate', may: 'Open pull requests for docs, meta.json and stories', who: 'Approve' },
  { level: 'Hard gate', may: 'Draft RFCs and propose new components, token-tier changes and breaking changes', who: 'Decide, review, merge' },
] as const;

export function AgentsSection() {
  const excerpt = metaExcerpt();
  const adrs = getAdrCount();
  const tools = getMcpTools();
  return (
    <section className={styles.section} aria-labelledby="agents-title">
      <SectionHeader
        id="agents-title"
        title={
          <>
            Built by a <HeroAccent className={styles.titleAccent}>person.</HeroAccent> Read by agents.
          </>
        }
      >
        Each component is described once, in a meta.json. The docs are generated from it, and coding agents
        read the same file.
      </SectionHeader>

      <div className={styles.agentGrid}>
        <article className={`${styles.agentCard} ${styles.agentCardBrand}`}>
          <h3 className={styles.agentTitle}>Described once</h3>
          {excerpt && <CodeBlock code={excerpt} lang="json" title="button.meta.json" collapseAfter={0} />}
          <p className={styles.agentNote}>
            Props, examples, keyboard behaviour, do and don’t. The docs pages and the agents read the same file.
          </p>
        </article>

        <article className={`${styles.agentCard} ${styles.agentCardAccent}`}>
          <h3 className={styles.agentTitle}>Three trust levels</h3>
          <dl className={styles.trust}>
            {TRUST.map((t) => (
              <div key={t.level} className={styles.trustRow}>
                <dt className={styles.trustLevel}>{t.level}</dt>
                <dd className={styles.trustMay}>{t.may}</dd>
              </div>
            ))}
          </dl>
          <p className={styles.agentNote}>
            What an agent may do on its own, with review, or only as a proposal. Written down in GOVERNANCE §6;
            enforcing it is not built yet.
          </p>
        </article>

        <article className={styles.agentCard}>
          <h3 className={styles.agentTitle}>An MCP server</h3>
          <ul className={styles.toolChips}>
            {tools.map((t) => (
              <li key={t}>
                <code className={styles.toolChip}>{t}</code>
              </li>
            ))}
          </ul>
          <p className={styles.agentNote}>
            {tools.length} tools serving components, tokens and usage rules to agents, alongside the drift
            auditor. Read-only: no tool writes a file.
          </p>
          <TextLink href="/docs/mcp">About the MCP server</TextLink>
        </article>
      </div>

      <p className={styles.decisions}>
        <strong>{adrs} decisions, each signed.</strong> Every record names who decided: Anuj, or Claude with
        Anuj’s acceptance. Deprecated APIs go only at 1.0, and breaking changes ship with a codemod.{' '}
        <TextLink href="/docs/governance">Read the decisions</TextLink>
      </p>
    </section>
  );
}

/* ------------------------------------------------------------------ */

export function TokensSection() {
  const f = getTokensFacts();
  const fix = getFixPanel();
  const pipeline = getPipeline();
  if (!f) return null;
  return (
    <section className={styles.section} aria-labelledby="tokens-title">
      <SectionHeader
        id="tokens-title"
        title={
          <>
            Brands are <HeroAccent className={styles.titleAccent}>data,</HeroAccent> not code.
          </>
        }
      >
        {countWordCap(f.inputCount)} inputs go in one file. The engine turns them into {f.tokenCount} tokens, and no
        component ever knows which brand it renders.
      </SectionHeader>
      <div className={styles.panelGrid}>
        <article className={styles.panel}>
          <h3 className={styles.panelTitle}>{countWordCap(f.inputCount)} inputs, one file</h3>
          <p className={styles.panelNote}>
            A tenant is this and a content.json. Adding a brand adds no component code.
          </p>
          <CodeBlock code={f.brandJson} lang="json" title={`tenants/${f.tenant.toLowerCase()}/brand.json`} collapseAfter={0} />
        </article>
        <article className={styles.panel}>
          <h3 className={styles.panelTitle}>Every fix, in a sentence</h3>
          <p className={styles.panelNote}>
            When a pair fails, the engine moves the lighter side and says why. These are its own words.
          </p>
          {fix && (
            <div className={styles.fixes}>
              <p className={styles.checksPass}>
                <IconCheck aria-hidden stroke={2} className={styles.verdictIcon} />
                {fix.checks.passed}/{fix.checks.total} live checks pass
              </p>
              {(['light', 'dark'] as const).map((scheme) =>
                fix[scheme] ? (
                  <div key={scheme} className={styles.fixCard}>
                    <span className={styles.fixScheme}>{scheme}</span>
                    <p className={styles.fixMessage}>{fix[scheme]?.message}</p>
                  </div>
                ) : null,
              )}
            </div>
          )}
        </article>
        <article className={styles.panel}>
          <h3 className={styles.panelTitle}>Values change, never names</h3>
          <p className={styles.panelNote}>
            The role is the API. A component reads the name; the brand decides the value.
          </p>
          <ol className={styles.pipeline}>
            {pipeline.map((step) => (
              <li key={step.pkg} className={styles.pipelineStep}>
                <code className={styles.pipelinePkg}>{step.pkg}</code>
                <span className={styles.pipelineNote}>{step.note}</span>
              </li>
            ))}
          </ol>
        </article>
        <article className={styles.panel}>
          <h3 className={styles.panelTitle}>Scope a theme to one screen</h3>
          <p className={styles.panelNote}>
            Tokens key off attributes, so a brand can wrap the page or a single panel inside it.
          </p>
          <CodeBlock
            code={`<ThemeScope theme="qamar" locale="ar-AE">\n  <Button>\u0645\u062a\u0627\u0628\u0639\u0629</Button>\n</ThemeScope>`}
            lang="tsx"
            title="nested scope"
            collapseAfter={0}
          />
        </article>
      </div>
      <div className={styles.commandRow}>
        <TextLink href="/docs/theming">How theming works</TextLink>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */

const MATURITY_ORDER = ['stable', 'beta', 'alpha'] as const;

export function ComponentsSection() {
  const groups = getComponentGroups();
  const also = getAlsoFacts();
  const all = groups.flatMap((g) => g.items);
  const counts = MATURITY_ORDER.map((m) => ({ maturity: m, n: all.filter((c) => c.maturity === m).length }));
  /* The badges are the point of this section, so the sentence reads them rather than restating them. */
  const badgeLine = counts
    .filter((c) => c.n > 0)
    .map((c) => `${c.n} ${c.maturity}`)
    .join(', ');
  const zero = counts.filter((c) => c.n === 0).map((c) => `0 ${c.maturity}`);

  return (
    <section className={styles.section} aria-labelledby="components-title">
      <SectionHeader
        id="components-title"
        title={
          <>
            {all.length} components on <HeroAccent className={styles.titleAccent}>React Aria.</HeroAccent>
          </>
        }
      >
        Focus, typeahead and ARIA patterns come from a library that already solved them. The badges tell the
        truth: {[badgeLine, ...zero].join(', ')}.
      </SectionHeader>
      <ComponentFilter
        items={groups.flatMap((g) => g.items.map((c) => ({ name: c.name, title: c.title, category: g.category, categoryLabel: g.label, maturity: c.maturity })))}
      />
      <p className={styles.alsoLine}>
        <strong>{also.blocks.length}</strong> blocks: {also.blocks.slice(0, -1).join(', ')} and{' '}
        {also.blocks.at(-1)} · <strong>{also.icons}</strong> icons, each with a duotone twin.
      </p>
      <div className={styles.commandRow}>
        <TextLink href="/docs/components">Browse all {all.length}</TextLink>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */

/**
 * Drafted from the repo — ADRs, GOVERNANCE.md and the measured figures — not from marketing copy. Every claim
 * here is one the rest of the site already makes and a script can reproduce.
 */
/**
 * Anuj's answers from the Home v3 mockup, with three corrected where the mockup has been overtaken:
 *   - npm: the mockup says "not yet". All eight packages are published at 0.1.0.
 *   - the MCP server: "in progress" in the mockup; it ships as @syntara/mcp, with eight tools. The mockup
 *     says seven, and so did a check here that grepped only get_/list_/find_/search_ names and missed
 *     audit_snippet. `packages/mcp/README.md` says eight; the source registers eight.
 *   - decision records: 36 in the mockup, 37 on disk (`ls docs/adr/*.md`).
 */
const faqItems = (): readonly { q: string; a: ReactNode }[] => [
  {
    q: 'Is Syntara on npm?',
    a: (
      <>
        Yes. Eight packages at 0.1.0 under the <code>@syntara</code> scope — components, tokens, theme engine,
        icons, the server-driven UI schema, the auditor, the MCP server and the codemods.{' '}
        <code>pnpm add @syntara/react @syntara/tokens</code>, or copy a component’s <code>.tsx</code> and{' '}
        <code>.module.css</code> into your project and load the token CSS once at the app root.
      </>
    ),
  },
  {
    q: 'How do I add a brand?',
    a: (
      <>
        Write two files: <code>tenants/&lt;id&gt;/brand.json</code> with the six inputs, and{' '}
        <code>tenants/&lt;id&gt;/content.json</code> with copy, language and text direction. Then run{' '}
        <code>pnpm tokens</code>. It fails the build if any pair misses AA. No component code changes.
      </>
    ),
  },
  {
    q: 'What does “accessible by construction” mean?',
    a: (
      <>
        The theme engine can’t output a theme that fails WCAG 2.2 AA. It checks 118 text, control and focus-ring
        pairs per brand in light and dark, fixes what fails, and writes a sentence for each fix. Keyboard and
        screen-reader behaviour come from React Aria.
      </>
    ),
  },
  {
    q: 'Does it handle right to left and other scripts?',
    a: (
      <>
        Yes. Components use CSS logical properties, and ThemeScope sets lang and dir from the tenant’s content.
        Qamar runs in Arabic, right to left; Haat runs in Hindi.
      </>
    ),
  },
  {
    q: 'Can I use the tokens without React?',
    a: (
      <>
        Yes. Every tenant exports as CSS variables, DTCG 2025.10 JSON and Figma variables, plus Kotlin and Swift
        sources for native. It’s plain CSS, so any stack can read it.
      </>
    ),
  },
  {
    q: 'How do AI agents use Syntara?',
    a: (
      <>
        They read the same meta.json the docs are generated from. The MCP server ships as{' '}
        <code>@syntara/mcp</code>, with eight tools, and it is read-only — no tool writes a file. ADR-008 defines
        three trust levels and GOVERNANCE §6 writes them down; enforcing them is not built yet.
      </>
    ),
  },
  {
    q: 'Who decides what goes in?',
    a: (
      <>
        One maintainer, Anuj, pairing with AI agents. There are {getAdrCount()} decision records, and each names
        who decided. Deprecated APIs are removed only at 1.0, and every breaking change ships with a codemod.
      </>
    ),
  },
];

export function FaqSection() {
  const phases = [...getPhases()].reverse();
  return (
    <section className={styles.section} aria-labelledby="faq-title">
      <div className={styles.split}>
        <div className={styles.stack}>
          <SectionHeader
            id="faq-title"
            title={
              <>
                Questions, <HeroAccent className={styles.titleAccent}>straight</HeroAccent> answers.
              </>
            }
          >
            What this is, what it is not, and where the honest edges are.
          </SectionHeader>
          {/*
            Each phase's status is read from its own badge in the changelog. An earlier version of this assumed
            that an entry meant it had shipped and rendered all five as Shipped. That was right by accident:
            the changelog badged three of them In progress at the time, and Anuj has since marked those
            shipped. The status is read either way, so the roadmap follows the changelog rather than a guess.
          */}
          <ol className={styles.roadmap}>
            {phases.map((p) => (
              <li key={p.label} className={styles.roadmapRow}>
                <span className={styles.roadmapVersion}>{p.label}</span>
                <span className={styles.roadmapTitle}>{p.title}</span>
                {p.status && (
                  <span className={styles.roadmapStatus} data-shipped={p.status === 'Shipped' ? 'true' : undefined}>
                    {p.status}
                  </span>
                )}
              </li>
            ))}
          </ol>
        </div>
        <Accordion className={styles.faq}>
          {faqItems().map((item, i) => (
            <AccordionItem
              key={item.q}
              id={`faq-${i}`}
              title={
                <>
                  <span className={styles.faqNumber}>{String(i + 1).padStart(2, '0')}</span>
                  {item.q}
                </>
              }
            >
              <p className={styles.faqAnswer}>{item.a}</p>
            </AccordionItem>
          ))}
        </Accordion>
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
          Start with one component.{' '}
          <HeroAccent className={styles.titleAccent}>Keep every brand.</HeroAccent>
        </h2>
        <p className={styles.ctaLead}>Copy a button today, and tell me when it’s wrong.</p>
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

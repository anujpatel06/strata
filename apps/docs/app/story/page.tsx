import { Badge, Card, Eyebrow } from '@syntara/react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { PageShell } from '@/components/page/page-shell';
import { readState } from '@/components/themes/state';
import { ThemesProvider } from '@/components/themes/themes-provider';
import { ThemesWorkspace } from '@/components/themes/themes-workspace';
import { getAdrSplit, getStoryFigures, getStoryTenants } from '@/lib/story';
import { getThemePresets } from '@/lib/theme-presets';
import styles from './page.module.css';

export const metadata: Metadata = {
  title: 'Story',
  description:
    'How Syntara was built: the live generator, three brands from the same code, the numbers with the command that produces each one, and the five decisions that mattered.',
};

/** BRIEF §11 §5 — tension, call, consequence. Each links to the ADR that records who decided. */
const DECISIONS = [
  {
    adr: 'ADR-006',
    href: '/docs/theming',
    tension: 'Let a brand pick its colours, or guarantee the result is legible. You cannot promise both.',
    call: 'Generate the ramps in OKLCH and run a solver that moves a role until the pair passes — then record what it moved.',
    consequence: 'A brand can hand over any hex. Nothing ships that fails, and the page shows the correction rather than hiding it.',
  },
  {
    adr: 'ADR-011',
    href: '/docs/installation',
    tension: 'Copy-in components get adopted fastest. Versioned packages are the only way to deprecate anything.',
    call: 'Built both from one source, shipped both — then withdrew the registry four weeks later and kept npm.',
    consequence: 'One install route to document and test. The reversal is in the ADR as a revision, not a rewrite.',
  },
  {
    adr: 'ADR-012',
    href: '/docs/rtl',
    tension: 'Overlays portal to the end of the document, so they leave the element whose brand and direction they belong to.',
    call: 'Every overlay copies the nearest scope’s data attributes, dir and lang as it opens; the locale drives direction, not a dir prop.',
    consequence: 'A dialog opened from an Arabic tenant is Arabic. The helper is repeated in each overlay file so a copied file still works.',
  },
  {
    adr: 'ADR-021',
    href: '/docs/governance',
    tension: 'Button’s danger was a variant, which put status in the same prop as emphasis. Fixing it breaks everyone using it.',
    call: 'Deprecate in a minor, remove at 1.0 only, ship a codemod with the RFC, and warn in development.',
    consequence: 'The governance claim has one real deprecation behind it instead of a policy document.',
  },
  {
    adr: 'ADR-019',
    href: '/docs/server-driven-ui',
    tension: 'Every design system is asked for native components. Building them badly is worse than not building them.',
    call: 'Said no. Shipped a server-driven UI schema and native token files instead, and wrote down that there are no native components.',
    consequence: 'The mobile claim is small and true. Scope held.',
  },
];

/** BRIEF §11 §6 — the rollout, quarter by quarter. */
const ROLLOUT = [
  {
    quarter: 'Q1',
    title: 'Audit, and earn the right',
    body: 'Inventory what exists across the estate and count it, not eyeball it. Pick the ten components that appear everywhere. Publish the audit before proposing anything.',
    measure: 'Baseline: components in use, duplicates per pattern, contrast failures per surface.',
  },
  {
    quarter: 'Q2',
    title: 'Foundations, with one team',
    body: 'Tokens and the theme engine, adopted by a single product team who ship with it. No library-wide rollout until one real surface runs on it.',
    measure: 'That team’s drift score, and the time it takes them to re-skin.',
  },
  {
    quarter: 'Q3',
    title: 'The top ten, and the governance that keeps them',
    body: 'Ship the ten, with RFCs, deprecations and codemods from day one. A design system without a deprecation path becomes a fork within a year.',
    measure: 'Adoption per component, and the number of overrides written against them.',
  },
  {
    quarter: 'Q4',
    title: 'Adoption as a programme, not a memo',
    body: 'Office hours, a contribution path, and a lint rule that suggests the right component rather than only naming the wrong one. Measure the system, not the designers.',
    measure: 'Drift score across the estate, and how many teams ship without asking us anything.',
  },
];

export default function Story() {
  const figures = getStoryFigures();
  const adrs = getAdrSplit();
  const tenants = getStoryTenants();
  const presets = getThemePresets();
  const initial = readState(new URLSearchParams(), presets);

  return (
    <PageShell
      eyebrow="Case study"
      title={
        <>
          One design system, <em>every brand</em>
        </>
      }
      description="How it was built, what the numbers are, and what they do not cover."
    >
      {/* 1 — Opening scene. Anuj writes this; the placeholder is deliberately loud so it cannot ship unnoticed. */}
      <section className={styles.section} aria-labelledby="scene">
        <Eyebrow lead="rule">Opening</Eyebrow>
        <h2 id="scene" className={styles.h2}>
          The Thursday problem
        </h2>
        <Card className={styles.placeholder}>
          <Badge tone="warning">Placeholder — Anuj writes this</Badge>
          <p className={styles.placeholderBody}>
            A concrete moment: a new client signs on Thursday and their branded app has to be in pilot on Monday.
            One paragraph, first person, no system vocabulary.
          </p>
        </Card>
      </section>

      {/* 2 — The generator, live. The same workspace /themes mounts, from the same preset list. */}
      <section className={styles.section} aria-labelledby="generator">
        <Eyebrow lead="rule">Try it</Eyebrow>
        <h2 id="generator" className={styles.h2}>
          Type a colour. Get a brand.
        </h2>
        <p className={styles.lede}>
          Six inputs become a light and dark theme that passes WCAG 2.2 AA. Every correction the solver made is
          listed, so you can see where your colour was and where it had to go.
        </p>
        <ThemesProvider presets={presets} initial={initial}>
          <div className={styles.generator}>
            <ThemesWorkspace />
          </div>
        </ThemesProvider>
      </section>

      {/* 3 — Three tenants side by side, from pnpm screenshots. */}
      <section className={styles.section} aria-labelledby="tenants">
        <Eyebrow lead="rule">Same code</Eyebrow>
        <h2 id="tenants" className={styles.h2}>
          Three brands, one component library
        </h2>
        <p className={styles.lede}>
          A brand has to be <strong>data, not code</strong>. Nothing below differs in code, and no component
          ever learns which brand it is rendering — there is no tenant id anywhere in{' '}
          <code>packages/react</code>.
        </p>
        <ul className={styles.tenants}>
          {tenants.map((t) => (
            <li key={t.id} className={styles.tenant}>
              {/*
               * A plain <img>, not next/image: the site is a static export (ADR-030), so the optimizer
               * endpoint /_next/image does not exist and every shot would 404 in production. width/height
               * are the Playwright viewport, so the box is reserved before the file loads.
               */}
              <img
                src={t.shot}
                alt={`${t.name}, ${t.industry}, in light mode`}
                width={1440}
                height={900}
                loading="lazy"
                decoding="async"
                className={styles.shot}
              />
              <div className={styles.tenantMeta}>
                <strong>{t.name}</strong>
                <span>{t.industry}</span>
                <span className={styles.locale}>
                  {t.locale}
                  {t.dir === 'rtl' && ' · RTL'}
                </span>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* 4 — Numbers, each with the command that produces it. */}
      <section className={styles.section} aria-labelledby="numbers">
        <Eyebrow lead="rule">Evidence</Eyebrow>
        <h2 id="numbers" className={styles.h2}>
          Numbers, and how to reproduce them
        </h2>
        <p className={styles.lede}>
          A design system that claims accessibility and cannot show it is a brochure. Each figure is read at
          build time from the file its command writes — none is typed by hand.
        </p>
        <ul className={styles.figures}>
          {figures.map((f) => (
            <li key={f.label} className={styles.figure}>
              <span className={styles.figureValue}>{f.value}</span>
              <span className={styles.figureLabel}>{f.label}</span>
              <span className={styles.figureBasis}>{f.basis}</span>
              <code className={styles.command}>{f.command}</code>
            </li>
          ))}
        </ul>
      </section>

      {/* 5 — Five decisions. */}
      <section className={styles.section} aria-labelledby="decisions">
        <Eyebrow lead="rule">Judgement</Eyebrow>
        <h2 id="decisions" className={styles.h2}>
          Five decisions that mattered
        </h2>
        {adrs && (
          <p className={styles.lede}>
            Every architectural call is an ADR, and every ADR records who made it — Anuj, the agent
            recommending and Anuj accepting, or the agent alone pending review. There are {adrs.total}, and not
            one is anonymous. {adrs.pending} are still waiting on his review, and they say so.
          </p>
        )}
        <ol className={styles.decisions}>
          {DECISIONS.map((d) => (
            <li key={d.adr} className={styles.decision}>
              <Link href={d.href} className={styles.adr}>
                {d.adr}
              </Link>
              <p className={styles.tension}>{d.tension}</p>
              <p className={styles.callLine}>
                <strong>Call.</strong> {d.call}
              </p>
              <p className={styles.consequence}>
                <strong>Consequence.</strong> {d.consequence}
              </p>
            </li>
          ))}
        </ol>
      </section>

      {/* 6 — Rollout. */}
      <section className={styles.section} aria-labelledby="rollout">
        <Eyebrow lead="rule">In practice</Eyebrow>
        <h2 id="rollout" className={styles.h2}>
          Rolling this out to 40 designers and 300 engineers
        </h2>
        <ol className={styles.rollout}>
          {ROLLOUT.map((q) => (
            <li key={q.quarter} className={styles.phase}>
              <span className={styles.quarter}>{q.quarter}</span>
              <div>
                <h3 className={styles.h3}>{q.title}</h3>
                <p>{q.body}</p>
                <p className={styles.measure}>
                  <strong>Measured by.</strong> {q.measure}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* 7 — Limits. The section that makes the rest credible. */}
      <section className={styles.section} aria-labelledby="limits">
        <Eyebrow lead="rule">Limits</Eyebrow>
        <h2 id="limits" className={styles.h2}>
          What this does not prove
        </h2>
        <ul className={styles.limits}>
          <li>
            <strong>No users.</strong> Nobody has adopted this. Every number measures the system against itself,
            not a team against a deadline.
          </li>
          <li>
            <strong>One maintainer.</strong> The governance is real and runnable, but it has never survived two
            people disagreeing about a breaking change.
          </li>
          <li>
            <strong>RTL is table stakes now.</strong> shadcn/ui calls its own RTL first-class and Untitled UI
            React ships logical properties throughout. Doing it from day one was right; it is not a difference.
          </li>
          <li>
            <strong>Tenant copy is mine, not a native speaker’s.</strong> The Hindi and Arabic are marked as
            drafts in the interface wherever they appear, and stay marked until someone fluent reads them.
          </li>
          <li>
            <strong>The agent eval is one model, one task family, 100 runs.</strong> It shows a direction, not a
            law. Its first run reported 0% against 70%, which would have been a far better headline; it was a
            fault in the harness. Both runs are in the repository and the invalid one is still there, marked. A
            number you cannot reproduce is worth less than no number.
          </li>
        </ul>
      </section>
    </PageShell>
  );
}

import type { Metadata } from 'next';
import { ButtonLink } from '@/components/page/button-link';
import { PageShell } from '@/components/page/page-shell';
import { getStoryFigures } from '@/components/story/story-data';
import styles from './page.module.css';

export const metadata: Metadata = {
  title: 'Story',
  description: 'Why Syntara exists, what was decided and by whom, and what measuring changed.',
};

export default function Story() {
  const f = getStoryFigures();
  return (
    <PageShell
      width="narrow"
      eyebrow="Story"
      title={
        <>
          What I decided, <em>and what I measured</em>
        </>
      }
      description="Syntara is a multi-brand design system built in four weeks, paired with an AI agent. This page is the part a repository can't show: which calls were mine, which were the agent's, and where measuring changed the answer."
      actions={
        <ButtonLink href="/docs/changelog" variant="outline">
          What shipped, by phase →
        </ButtonLink>
      }
    >
      <div className={styles.prose}>
        <h2>The problem</h2>
        <p>
          Most design systems serve one brand. The ones that serve several usually do it by forking: a second
          repository, a second set of components, and two definitions of a button drifting apart. I wanted to know
          whether a single component library could carry five brands — including one in Arabic, right to left, and one
          in Devanagari — without a component ever learning which brand it is rendering. This site runs on a sixth.
        </p>
        <p>
          The answer is that a brand has to be <strong>data, not code</strong>. Six inputs — a primary colour, a
          neutral, a shape, a type pair, a density, a name — go in; a light and a dark theme come out, and a solver
          moves any role that fails its contrast check until it passes. Components read semantic roles and nothing
          else. There is no tenant id anywhere in <code>packages/react</code>.
        </p>

        <h2>What the numbers are for</h2>
        <p>
          A design system that claims accessibility and cannot show it is a brochure. Every number on this site comes
          from a script, and the command is written next to it.
        </p>
        <div className={styles.figures}>
          {f.map((x) => (
            <div key={x.label} className={styles.figure}>
              <span className={styles.figureValue}>{x.value}</span>
              <span className={styles.figureLabel}>{x.label}</span>
            </div>
          ))}
        </div>
        <p>
          The contrast fuzz test generates a thousand random brands and checks every pair in both schemes. It is the
          only evidence I trust for the claim on the home page, because it is the only one that tries colours I would
          never have chosen.
        </p>

        <h2>Who decided what</h2>
        <p>
          I paired with Claude for the engineering. Every architectural decision is written down as an ADR, and every
          ADR records who made the call — <strong>me</strong>, <strong>the agent recommended and I accepted</strong>,
          or <strong>I delegated it</strong>. There are {f.find((x) => x.key === 'adrs')?.value} of them and not one
          is anonymous.
        </p>
        <p>
          The split is not clean, and that is the honest part: twenty name me as deciding or setting direction, twenty
          record a recommendation from the agent, and the overlap is where most of the work actually happened — I
          chose the direction, it proposed the implementation, I accepted or pushed back. Six I handed over outright.
          Six are still waiting on my review, and the site says so rather than pretending otherwise.
        </p>

        <h2>Where measuring changed the answer</h2>
        <p>
          I built an MCP server so coding agents could read the system's own metadata, then ran an eval to find out
          whether it helped: twenty-five prompts, a hundred runs, with and without. Fully on-system rose from 64% to
          88%. It made no difference at all to type errors.
        </p>
        <p>
          The first run of that eval said 0% against 70%, which would have been a much better headline. It was a fault
          in my harness. Both runs are in the repository, and the invalid one is still there, marked. A number I
          cannot reproduce is worth less than no number.
        </p>
        <p>
          The same habit caught smaller things. A build-id check that passed while measuring a stale build. A hero
          headline that quietly swapped in a fallback colour for 45% of inputs and never said so. Two packages about
          to ship their test suites to npm. None of those were found by reading the code.
        </p>

        <h2>What is not done</h2>
        <p>
          Nothing is published to npm yet, and the home page says so instead of showing an install command that would
          404. The docs are not deployed. Four icon drawings have never had a designer's eye on them. Hindi copy is a
          draft until a Hindi reader has read it. Those are listed here for the same reason the failed eval is: the
          gaps are the most useful thing a reviewer can see.
        </p>
      </div>
    </PageShell>
  );
}

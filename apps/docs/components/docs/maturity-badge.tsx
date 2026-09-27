import { Badge, Link, Tooltip, TooltipTrigger } from '@strata/react';
import styles from './maturity-badge.module.css';

export type Maturity = 'alpha' | 'beta' | 'stable';

const TONE = { alpha: 'warning', beta: 'info', stable: 'success' } as const;

/** Where the criteria live: the "Maturity" section of content/docs/governance.mdx. */
export const MATURITY_HREF = '/docs/governance#maturity';

/**
 * One line per level, in the same words as the governance page. The tooltip, the components index legend and the
 * criteria must agree; the criteria themselves are enforced by `pnpm check:meta`.
 */
export const MATURITY_MEANING: Record<Maturity, string> = {
  alpha: 'new; the API may change',
  beta: 'in real use; the API changes only by deprecation',
  stable: 'published; the API is frozen under semver',
};

/** The same meanings, cut to a few words for the components index legend. */
export const MATURITY_SHORT: Record<Maturity, string> = {
  alpha: 'API may change',
  beta: 'changes by deprecation',
  stable: 'frozen under semver',
};

const label = (m: Maturity) => m.charAt(0).toUpperCase() + m.slice(1);

/** The plain badge: a word with a tone. Used where it can't be focusable, e.g. inside the index cards' stretched link. */
export function MaturityBadge({ maturity, size = 'sm' }: { maturity: Maturity; size?: 'sm' | 'md' }) {
  return (
    <Badge tone={TONE[maturity] ?? 'neutral'} variant="soft" size={size}>
      {maturity}
    </Badge>
  );
}

/**
 * The badge that explains itself (component page header): a link to the criteria, with a tooltip on hover and focus.
 * The link's name is "Maturity: alpha" (the visible word stays in the name, WCAG 2.5.3); the tooltip becomes its
 * description while open. The tooltip holds no link of its own because tooltips can't be reached by keyboard.
 */
export function MaturityBadgeLink({ maturity, size = 'md' }: { maturity: Maturity; size?: 'sm' | 'md' }) {
  return (
    <TooltipTrigger delay={300}>
      <Link href={MATURITY_HREF} variant="standalone" className={styles.link}>
        <span className="visually-hidden">Maturity: </span>
        <MaturityBadge maturity={maturity} size={size} />
      </Link>
      <Tooltip placement="bottom">
        {label(maturity)}: {MATURITY_MEANING[maturity]}. See Maturity.
      </Tooltip>
    </TooltipTrigger>
  );
}

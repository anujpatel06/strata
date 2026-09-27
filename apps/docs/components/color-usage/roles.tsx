/**
 * The role guide on /docs/color: each group of roles as a live specimen (Strata components in the picked tenant)
 * over a list of its roles, with a swatch that reads the live CSS variable and the engine's hex beside it.
 */
import { IconAlertTriangle, IconCircleCheck, IconCircleX, IconInfoCircle } from '@strata/icons';
import { Badge, Button, Tag } from '@strata/react';
import { roleToCssVar, type Role } from '@strata/theme-engine';
import type { ReactNode } from 'react';
import { getColorUsageData } from './data';
import { LiveScope, RoleHex, TenantPicker } from './live';
import styles from './color-usage.module.css';

type GroupId = 'surface' | 'text' | 'action' | 'accent' | 'border' | 'focus' | 'feedback';

/** What each role is for, in one line. The feedback roles are described once per job, not per tone. */
const USE: Partial<Record<Role, string>> = {
  'surface.canvas': 'The page itself. Everything else sits on it.',
  'surface.default': 'Content areas, inputs, secondary buttons, table bodies.',
  'surface.raised': 'Cards. One step up from default; in light mode the shadow carries the step.',
  'surface.sunken': 'Inset wells: code, a summary inside a card, neutral chips.',
  'surface.selected': 'The chosen row, the current nav item, a highlighted option.',
  'surface.inverse': 'Tooltips and the one element that flips against the page. Only text.inverse sits on it.',
  'text.default': 'Body copy, headings, labels, values.',
  'text.subtle': 'Descriptions, captions, table headers, hints.',
  'text.brand': 'Links and a word of emphasis. Not for paragraphs.',
  'text.inverse': 'Text on surface.inverse, and nowhere else.',
  'text.disabled': 'Labels of disabled controls only. Not checked for contrast.',
  'action.primary.bg': 'The one main action in a view.',
  'action.primary.fg': 'The label and icon on a primary fill.',
  'action.primary.hover': 'Primary fill under the pointer.',
  'action.primary.pressed': 'Primary fill while pressed.',
  'action.primary.border': 'Edge of the primary fill where it needs one.',
  'action.secondary.bg': 'Quiet brand-tinted actions and the brand badge.',
  'action.secondary.fg': 'The label on a secondary fill.',
  'action.secondary.hover': 'Secondary fill under the pointer.',
  'action.secondary.pressed': 'Secondary fill while pressed.',
  'accent.bg': 'A solid accent fill: a highlight chip, a marker.',
  'accent.fg': 'The label on accent.bg.',
  'accent.subtle': 'A soft accent tint behind accent.text.',
  'accent.text': 'Accent-coloured text on surface.default or accent.subtle.',
  'border.subtle': 'Decorative hairlines: card edges, dividers, chart grids. No contrast needed.',
  'border.default': 'Visible edges on floating layers and secondary controls.',
  'border.strong': 'Boundaries people must see: input edges. 3:1 against canvas and default.',
  'focus.ring': 'The 2px keyboard focus outline. 3:1 against canvas, default and raised.',
};

const GROUP_ROLES = (group: GroupId, all: Role[]) => all.filter((r) => r.startsWith(`${group}.`));

function RoleRow({ role, use, children }: { role: Role; use?: string; children: ReactNode }) {
  return (
    <li className={styles.roleRow}>
      <span className={styles.chip} style={{ background: `var(${roleToCssVar(role)})` }} aria-hidden="true" />
      <span className={styles.roleName}>
        <code className={styles.code}>{role}</code>
        {children}
      </span>
      {use && <span className={styles.roleUse}>{use}</span>}
    </li>
  );
}

/* ---- Specimens: what the roles look like doing their job ---- */

function SurfaceSpecimen() {
  return (
    <div className={styles.stack}>
      <span className={styles.stackLabel}>surface.canvas</span>
      <div className={styles.stackDefault}>
        <span className={styles.stackLabel}>surface.default</span>
        <div className={styles.stackRaised}>
          <span className={styles.stackLabel}>surface.raised</span>
          <div className={styles.stackSunken}>
            <span className={styles.stackLabel}>surface.sunken</span>
          </div>
          <div className={styles.stackSelected}>
            <span className={styles.stackLabel}>surface.selected</span>
          </div>
        </div>
      </div>
      <span className={styles.stackInverse}>surface.inverse</span>
    </div>
  );
}

function TextSpecimen() {
  return (
    <div className={styles.textSpecimen}>
      <p className={styles.tDefault}>Your refund of 2,400 is on its way</p>
      <p className={styles.tSubtle}>It usually arrives in 3 to 5 working days</p>
      <p className={styles.tSubtle}>
        <span className={styles.tBrand}>Track the refund</span>
      </p>
      <div>
        {/* A real disabled control: text.disabled is only for these, and WCAG exempts them from 1.4.3. */}
        <Button variant="ghost" size="sm" isDisabled>
          Cancel refund
        </Button>
      </div>
      <span className={styles.tInverse}>text.inverse on surface.inverse</span>
    </div>
  );
}

function ActionSpecimen() {
  return (
    <div className={styles.row}>
      <Button variant="primary">Pay now</Button>
      <Button variant="secondary">Save draft</Button>
    </div>
  );
}

function AccentSpecimen() {
  return (
    <div className={styles.row}>
      <Tag tone="accent">New</Tag>
      <span className={styles.accentFill}>Featured</span>
      <span className={styles.accentText}>Recommended for you</span>
    </div>
  );
}

function BorderSpecimen() {
  return (
    <div className={styles.borders}>
      <span className={styles.bSubtle}>subtle</span>
      <span className={styles.bDefault}>default</span>
      <span className={styles.bStrong}>strong</span>
    </div>
  );
}

function FocusSpecimen() {
  return (
    <div className={styles.row}>
      <span className={styles.focusDemo}>Focused control</span>
    </div>
  );
}

const TONES = [
  { tone: 'success', word: 'Paid', icon: <IconCircleCheck /> },
  { tone: 'warning', word: 'Due soon', icon: <IconAlertTriangle /> },
  { tone: 'danger', word: 'Overdue', icon: <IconCircleX /> },
  { tone: 'info', word: 'Scheduled', icon: <IconInfoCircle /> },
] as const;

function FeedbackSpecimen() {
  return (
    <div className={styles.feedbackGrid}>
      {TONES.map((t) => (
        <div key={t.tone} className={styles.feedbackCol}>
          <Badge tone={t.tone} variant="soft" icon={t.icon}>
            {t.word}
          </Badge>
          <Badge tone={t.tone} variant="solid">
            {t.word}
          </Badge>
          <Badge tone={t.tone} variant="status">
            {t.word}
          </Badge>
        </div>
      ))}
    </div>
  );
}

const SPECIMEN: Record<GroupId, () => ReactNode> = {
  surface: SurfaceSpecimen,
  text: TextSpecimen,
  action: ActionSpecimen,
  accent: AccentSpecimen,
  border: BorderSpecimen,
  focus: FocusSpecimen,
  feedback: FeedbackSpecimen,
};

const GROUP_LABEL: Record<GroupId, string> = {
  surface: 'Surface roles',
  text: 'Text roles',
  action: 'Action roles',
  accent: 'Accent roles',
  border: 'Border roles',
  focus: 'Focus role',
  feedback: 'Feedback roles',
};

const FEEDBACK_JOBS = [
  ['bg', 'A soft tint for alerts and badges.'],
  ['fg', 'Status text: on its own bg, or on default, sunken or selected.'],
  ['border', 'The hairline edge of an alert.'],
  ['solid', 'A strong fill: solid badges, the dot of a status badge.'],
  ['onSolid', 'The label on solid.'],
] as const;

/** A group of roles: a live specimen, then each role with its swatch, hex in the picked tenant, and its job. */
export function RoleGroup({ group }: { group: GroupId }) {
  const data = getColorUsageData();
  const roles = GROUP_ROLES(group, Object.keys(data.hexes) as Role[]);
  const Specimen = SPECIMEN[group];
  return (
    <figure className={styles.group}>
      <LiveScope tenants={data.tenants} className={styles.specimen} label={`${GROUP_LABEL[group]}, live`}>
        <Specimen />
      </LiveScope>
      <LiveScope tenants={data.tenants} surface="none" direction="page" className={styles.roleScope}>
        {group === 'feedback' ? (
          <FeedbackRoles />
        ) : (
          <ul className={styles.roleList} aria-label={GROUP_LABEL[group]}>
            {roles.map((role) => (
              <RoleRow key={role} role={role} use={USE[role]}>
                <RoleHex tenants={data.tenants} hexes={data.hexes[role]} />
              </RoleRow>
            ))}
          </ul>
        )}
      </LiveScope>
    </figure>
  );
}

/** Feedback roles as a tone × job grid: the jobs are the same for every tone, so they're said once. */
function FeedbackRoles() {
  const data = getColorUsageData();
  return (
    <ul className={styles.roleList} aria-label="Feedback roles">
      <li className={styles.feedbackKey}>Swatches, left to right: success, warning, danger, info.</li>
      {FEEDBACK_JOBS.map(([job, use]) => (
        <li key={job} className={styles.feedbackRow}>
          <span className={styles.feedbackChips} aria-hidden="true">
            {TONES.map((t) => (
              <span
                key={t.tone}
                className={styles.chip}
                style={{ background: `var(${roleToCssVar(`feedback.${t.tone}.${job}` as Role)})` }}
              />
            ))}
          </span>
          <span className={styles.roleName}>
            <code className={styles.code}>{`feedback.*.${job}`}</code>
          </span>
          <span className={styles.roleUse}>{use}</span>
        </li>
      ))}
    </ul>
  );
}

/** The page's tenant picker; every picker drives every live region on the page. */
export function ColorTenantPicker() {
  return <TenantPicker tenants={getColorUsageData().tenants} />;
}

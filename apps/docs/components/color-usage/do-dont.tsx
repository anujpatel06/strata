/**
 * Do / Don't pairs on /docs/color, rendered live with Syntara components in the picked tenant.
 *
 * A "don't" that breaks contrast on purpose is drawn as an SVG picture with a text alternative (role="img"), so the
 * page itself never ships a failing text pair: it shows the mistake without making it. Every stage is `inert`,
 * because these are illustrations, not controls to tab through.
 */
import { IconCheck, IconCircleX, IconX } from '@syntara/icons';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Eyebrow,
  Link,
  TextField,
} from '@syntara/react';
import type { ReactNode } from 'react';
import { floor2, getColorUsageData } from './data';
import { LiveScope, TenantPicker } from './live';
import styles from './color-usage.module.css';

interface Pair {
  id: string;
  title: string;
  do: { specimen: ReactNode; text: ReactNode };
  dont: { specimen: ReactNode; text: ReactNode };
}

/** An SVG "photo" of a failing pair: fill and text colours are live role variables, the words are the alt text. */
function Picture({ label, bg, fg, text, gradient }: { label: string; bg: string; fg: string; text: string; gradient?: boolean }) {
  return (
    <svg className={styles.picture} viewBox="0 0 240 48" role="img" aria-label={label}>
      {gradient && (
        <defs>
          <linearGradient id="dont-gradient" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0.2" style={{ stopColor: 'var(--syntara-color-surface-default)', stopOpacity: 0 }} />
            <stop offset="1" style={{ stopColor: 'var(--syntara-color-surface-default)', stopOpacity: 0.7 }} />
          </linearGradient>
        </defs>
      )}
      <rect x="0" y="0" width="240" height="48" rx="10" style={{ fill: `var(${bg})` }} />
      {gradient && <rect x="0" y="0" width="240" height="48" rx="10" fill="url(#dont-gradient)" />}
      <text x="120" y="29" textAnchor="middle" className={styles.pictureText} style={{ fill: `var(${fg})` }}>
        {text}
      </text>
    </svg>
  );
}

const PAIRS: Pair[] = [
  {
    id: 'brand-text',
    title: 'Brand text',
    do: {
      specimen: (
        <div className={styles.well}>
          <span className={styles.wellText}>Your statement is ready</span>
          <Link href="#brand-text" variant="standalone">
            View statement
          </Link>
        </div>
      ),
      text: (
        <>
          <code>text.brand</code> on <code>surface.sunken</code>. A checked pair.
        </>
      ),
    },
    dont: {
      specimen: (
        <Picture
          label="Example of a mistake: red error text on a brand-coloured fill"
          bg="--syntara-color-action-primary-bg"
          fg="--syntara-color-feedback-danger-fg"
          text="Payment failed"
        />
      ),
      text: <DangerOnBrand />,
    },
  },
  {
    id: 'status-word',
    title: 'Status',
    do: {
      specimen: (
        <div className={styles.statusRow}>
          <span className={styles.statusName}>Invoice 1042</span>
          <Badge tone="danger" variant="soft" icon={<IconCircleX />}>
            Overdue
          </Badge>
        </div>
      ),
      text: <>An icon and a word. The colour only adds emphasis.</>,
    },
    dont: {
      specimen: (
        <div className={styles.statusRow}>
          <span className={styles.statusName}>Invoice 1042</span>
          <span className={styles.lonelyDot} aria-hidden="true" />
        </div>
      ),
      text: <>A red dot alone. People who can’t tell red from green, and screen readers, get nothing.</>,
    },
  },
  {
    id: 'one-primary',
    title: 'Primary actions',
    do: {
      specimen: (
        <div className={styles.row}>
          <Button variant="primary" size="sm">
            Pay now
          </Button>
          <Button variant="secondary" size="sm">
            Save draft
          </Button>
          <Button variant="ghost" size="sm">
            Cancel
          </Button>
        </div>
      ),
      text: <>One primary action per view. The rest step down.</>,
    },
    dont: {
      specimen: (
        <div className={styles.row}>
          <Button variant="primary" size="sm">
            Pay now
          </Button>
          <Button variant="primary" size="sm">
            Save draft
          </Button>
          <Button variant="primary" size="sm">
            Cancel
          </Button>
        </div>
      ),
      text: <>Three primaries. Nothing is the main action any more.</>,
    },
  },
  {
    id: 'flood',
    title: 'Brand on surfaces',
    do: {
      specimen: (
        <Card className={styles.miniCard}>
          <CardHeader>
            <Eyebrow lead="rule" tone="brand">
              Savings
            </Eyebrow>
            <CardTitle level={4}>Round up every payment</CardTitle>
          </CardHeader>
          <CardContent>
            <Button variant="primary" size="sm">
              Turn on
            </Button>
          </CardContent>
        </Card>
      ),
      text: <>Neutral surface, brand in two small places: the rule and the button.</>,
    },
    dont: {
      specimen: (
        <div className={styles.flood}>
          <span className={styles.floodTitle}>Round up every payment</span>
          <Button variant="primary" size="sm">
            Turn on
          </Button>
        </div>
      ),
      text: <>A brand-filled panel. The button disappears into it, and the page gets loud.</>,
    },
  },
  {
    id: 'solid-label',
    title: 'Labels on fills',
    do: {
      specimen: (
        <div className={styles.row}>
          <Button variant="primary" size="sm">
            Confirm transfer
          </Button>
          <Badge tone="success" variant="solid">
            Paid
          </Badge>
        </div>
      ),
      text: (
        <>
          A flat fill with its own label: <code>action.primary.fg</code>, <code>onSolid</code>.
        </>
      ),
    },
    dont: {
      specimen: (
        <Picture
          label="Example of a mistake: a button label over a gradient"
          bg="--syntara-color-action-primary-bg"
          fg="--syntara-color-action-primary-fg"
          text="Confirm transfer"
          gradient
        />
      ),
      text: <>A gradient or overlay behind the label. Some fills are tuned to exactly 4.5:1, so any tint can fail.</>,
    },
  },
  {
    id: 'field-edge',
    title: 'Field edges',
    do: {
      specimen: <TextField label="Email" placeholder="name@example.com" className={styles.field} />,
      text: (
        <>
          The field’s edge reaches 3:1 against the surface outside it (<code>border.strong</code>).
        </>
      ),
    },
    dont: {
      specimen: (
        <div className={styles.fakeField}>
          <span className={styles.fakeLabel}>Email</span>
          <span className={styles.fakeBox}>name@example.com</span>
        </div>
      ),
      text: (
        <>
          A <code>border.subtle</code> hairline. Pretty, but people with low vision can’t find the field.
        </>
      ),
    },
  },
  {
    id: 'chart-text',
    title: 'Chart labels',
    do: {
      specimen: (
        <ul className={styles.legendDemo}>
          <li>
            <span className={styles.seriesSwatch} data-series="1" aria-hidden="true" />
            Rent
          </li>
          <li>
            <span className={styles.seriesSwatch} data-series="2" aria-hidden="true" />
            Groceries
          </li>
        </ul>
      ),
      text: <>The swatch carries the colour; the words stay in text colours.</>,
    },
    dont: {
      specimen: (
        <Picture
          label="Example of a mistake: a chart label written in the series colour"
          bg="--syntara-color-surface-default"
          fg="--syntara-chart-2"
          text="Groceries 38%"
        />
      ),
      text: <>Text in a series colour. Series only promise 3:1, and text needs 4.5:1.</>,
    },
  },
];

function DangerOnBrand() {
  const { ratio, at } = getColorUsageData().dangerOnBrand;
  return (
    <>
      Feedback text on a brand fill. Nobody checks that pair: it drops to {floor2(ratio)}:1 in {at}.
    </>
  );
}

function Half({ verdict, specimen, children }: { verdict: 'do' | 'dont'; specimen: ReactNode; children: ReactNode }) {
  const tenants = getColorUsageData().tenants;
  return (
    <div className={styles.half} data-verdict={verdict}>
      <LiveScope tenants={tenants} className={styles.stage} surface="default">
        <div className={styles.stageInner} inert>
          {specimen}
        </div>
      </LiveScope>
      <div className={styles.verdict}>
        {verdict === 'do' ? (
          <Badge tone="success" variant="soft" icon={<IconCheck />}>
            Do
          </Badge>
        ) : (
          <Badge tone="danger" variant="soft" icon={<IconX />}>
            Don’t
          </Badge>
        )}
        <p className={styles.verdictText}>{children}</p>
      </div>
    </div>
  );
}

export function DoDont() {
  const tenants = getColorUsageData().tenants;
  return (
    <div className={styles.doDont}>
      <TenantPicker tenants={tenants} />
      {PAIRS.map((p) => (
        <section key={p.id} className={styles.pair} aria-labelledby={`dd-${p.id}`} id={p.id}>
          <h3 id={`dd-${p.id}`} className={styles.pairTitle}>
            {p.title}
          </h3>
          <div className={styles.pairGrid}>
            <Half verdict="do" specimen={p.do.specimen}>
              {p.do.text}
            </Half>
            <Half verdict="dont" specimen={p.dont.specimen}>
              {p.dont.text}
            </Half>
          </div>
        </section>
      ))}
    </div>
  );
}

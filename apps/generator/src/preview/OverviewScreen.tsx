/**
 * Overview — the reference product's first screen, rendered for any tenant.
 *
 * The component knows nothing about which tenant it is showing: every colour, size, radius, font and
 * spacing value comes from --syntara-* custom properties set by an ancestor, and every string and number
 * comes from `content`. Direction is handled by logical CSS (plus `dir` on the root), layout by container
 * queries, formatting by Intl in the tenant locale.
 */
import { useId, type JSX, type MouseEvent } from 'react';
import type { ActivityRow, FormFieldContent, StatContent, TenantContent, Tone } from './content-types';
import {
  currencySymbol,
  formatPercent,
  formatShortDate,
  formatSignedAmount,
  formatStatValue,
  languageOf,
  toPercentInt,
} from './format';
import {
  AlertGlyph,
  BellGlyph,
  ChevronDownGlyph,
  ChevronForwardGlyph,
  MoneyInGlyph,
  MoneyOutGlyph,
  SearchGlyph,
  ToneGlyph,
  TrendDownGlyph,
  TrendUpGlyph,
} from './icons';
import styles from './OverviewScreen.module.css';

type ClassValue = string | false | null | undefined;
type SectionHeading = 'h2' | 'h3';
const cx = (...classes: ClassValue[]): string => classes.filter(Boolean).join(' ');

const TONE_CLASS: Record<Tone, ClassValue> = {
  success: styles.toneSuccess,
  warning: styles.toneWarning,
  danger: styles.toneDanger,
  info: styles.toneInfo,
};

/** Preview links go nowhere; keep the page from jumping to "#". */
const stay = (event: MouseEvent<HTMLAnchorElement>): void => event.preventDefault();

/** First user-perceived character of the product name, for the logo mark. */
function monogram(name: string): string {
  return Array.from(name.trim())[0] ?? '';
}

export interface OverviewScreenProps {
  content: TenantContent;
  /**
   * Set when the screen is shown inside another page that already has its own `<main>` (e.g. the
   * Brand Generator preview). The screen's main landmark becomes a labelled region so landmarks
   * don't nest, and headings shift down one level (h1 → h2, h2 → h3) to sit under the host page's h1.
   * Default false: the screen is the page.
   */
  embedded?: boolean;
}

export function OverviewScreen({ content, embedded = false }: OverviewScreenProps): JSX.Element {
  // useId keeps ids unique when several tenants render on one page.
  const uid = useId();
  const id = (part: string): string => `${uid}-${part}`;
  const { locale, currency, overview } = content;
  const Main = embedded ? 'section' : 'main';
  const H1 = embedded ? 'h2' : 'h1';
  const H2: SectionHeading = embedded ? 'h3' : 'h2';

  return (
    <div className={styles.root} dir={content.dir} lang={languageOf(locale)}>
      <AppHeader content={content} />

      <Main className={styles.page} aria-labelledby={id('title')}>
        <div className={styles.pageHeader}>
          <div className={styles.titleBlock}>
            <H1 id={id('title')} className={styles.h1}>
              {overview.greeting}
            </H1>
            <p className={styles.subtitle}>{overview.subtitle}</p>
          </div>
          <div className={styles.pageActions}>
            <button type="button" className={cx(styles.button, styles.secondary)}>
              {overview.secondaryAction}
            </button>
            <button type="button" className={cx(styles.button, styles.primary)}>
              {overview.primaryAction}
            </button>
          </div>
        </div>

        <AlertBanner alert={overview.alert} />

        <dl className={styles.stats}>
          {overview.stats.map((stat) => (
            <StatCard key={stat.label} stat={stat} locale={locale} currency={currency} />
          ))}
        </dl>

        <div className={styles.body}>
          <ActivityCard content={content} titleId={id('activity')} heading={H2} />

          <div className={styles.side}>
            <div className={styles.card}>
              <div className={styles.cardIntro}>
                <H2 id={id('form')} className={styles.h2}>
                  {overview.form.title}
                </H2>
                <p className={styles.cardDescription}>{overview.form.description}</p>
              </div>
              <form className={styles.form} aria-labelledby={id('form')} noValidate onSubmit={(e) => e.preventDefault()}>
                {overview.form.fields.map((field) => (
                  <Field
                    key={`${field.id}:${field.value ?? ''}`}
                    field={field}
                    controlId={id(`field-${field.id}`)}
                    locale={locale}
                    currency={currency}
                  />
                ))}
                <button type="button" className={cx(styles.button, styles.primary, styles.block)}>
                  {overview.form.submit}
                </button>
              </form>
            </div>

            <ProgressCard progress={overview.progress} locale={locale} titleId={id('progress')} heading={H2} />
          </div>
        </div>
      </Main>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function AppHeader({ content }: { content: TenantContent }): JSX.Element {
  const { product, nav, user, a11y } = content;
  return (
    <header className={styles.appHeader}>
      <div className={styles.headerInner}>
        <a href="#" className={styles.brand} onClick={stay}>
          <span className={styles.logoMark} aria-hidden="true">
            {monogram(product.name)}
          </span>
          <span className={styles.productName}>{product.name}</span>
        </a>

        <nav className={styles.nav} aria-label={a11y.mainNav}>
          <ul className={styles.navList}>
            {nav.map((item, index) => (
              <li key={item}>
                <a
                  href="#"
                  className={styles.navLink}
                  aria-current={index === 0 ? 'page' : undefined}
                  onClick={stay}
                >
                  {item}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className={styles.headerEnd}>
          <button type="button" className={styles.iconButton} aria-label={a11y.search}>
            <SearchGlyph size={20} />
          </button>
          <button type="button" className={styles.iconButton} aria-label={a11y.notifications}>
            <BellGlyph size={20} />
            <span className={styles.unreadDot} aria-hidden="true" />
          </button>
          <button type="button" className={styles.avatar} aria-label={a11y.account}>
            <span aria-hidden="true">{user.initials}</span>
          </button>
        </div>
      </div>
    </header>
  );
}

function AlertBanner({ alert }: { alert: TenantContent['overview']['alert'] }): JSX.Element {
  return (
    <div className={cx(styles.alert, TONE_CLASS[alert.tone])}>
      <AlertGlyph tone={alert.tone} size={20} className={styles.alertIcon} />
      <div className={styles.alertContent}>
        <p className={styles.alertTitle}>{alert.title}</p>
        <p className={styles.alertBody}>{alert.body}</p>
      </div>
      <a href="#" className={styles.alertAction} onClick={stay}>
        {alert.action}
      </a>
    </div>
  );
}

function StatCard({ stat, locale, currency }: { stat: StatContent; locale: string; currency: string }): JSX.Element {
  const { delta, deltaLabel } = stat;
  const hasDelta = typeof delta === 'number';
  const good = hasDelta && delta !== 0 && (delta > 0) === (stat.positiveIsGood ?? true);
  const deltaClass = !hasDelta || delta === 0 ? styles.deltaNeutral : good ? styles.toneSuccess : styles.toneDanger;

  return (
    <div className={cx(styles.card, styles.statCard)}>
      <dt className={styles.statLabel}>{stat.label}</dt>
      <dd className={styles.statValue}>{formatStatValue(stat, locale, currency)}</dd>
      {(hasDelta || deltaLabel) && (
        <dd className={styles.statMeta}>
          {hasDelta && (
            <span className={cx(styles.delta, deltaClass)}>
              {delta > 0 && <TrendUpGlyph size={14} />}
              {delta < 0 && <TrendDownGlyph size={14} />}
              <span className={styles.num}>{formatPercent(delta, locale, true)}</span>
            </span>
          )}
          {deltaLabel && <span className={styles.deltaLabel}>{deltaLabel}</span>}
        </dd>
      )}
    </div>
  );
}

function ActivityCard({
  content,
  titleId,
  heading: Heading,
}: {
  content: TenantContent;
  titleId: string;
  heading: SectionHeading;
}): JSX.Element {
  const { locale, currency } = content;
  const { table, statusLabels } = content.overview;
  const { columns } = table;

  return (
    <section className={cx(styles.card, styles.activityCard)} aria-labelledby={titleId}>
      <div className={styles.cardHeader}>
        <Heading id={titleId} className={styles.h2}>
          {table.title}
        </Heading>
        <a href="#" className={styles.textLink} aria-describedby={titleId} onClick={stay}>
          {table.action}
          <ChevronForwardGlyph size={16} />
        </a>
      </div>

      <table className={styles.table}>
        <caption className={styles.visuallyHidden}>{table.title}</caption>
        <thead>
          <tr>
            <th scope="col">{columns.date}</th>
            <th scope="col">{columns.description}</th>
            <th scope="col" className={styles.colCategory}>
              {columns.category}
            </th>
            <th scope="col">{columns.status}</th>
            <th scope="col" className={styles.alignEnd}>
              {columns.amount}
            </th>
          </tr>
        </thead>
        <tbody>
          {table.rows.map((row, index) => (
            <ActivityTableRow
              key={`${row.date}-${index}`}
              row={row}
              status={statusLabels[row.status] ?? { label: row.status, tone: 'info' }}
              locale={locale}
              currency={currency}
            />
          ))}
        </tbody>
      </table>
    </section>
  );
}

function ActivityTableRow({
  row,
  status,
  locale,
  currency,
}: {
  row: ActivityRow;
  status: { label: string; tone: Tone };
  locale: string;
  currency: string;
}): JSX.Element {
  const incoming = row.amount > 0;
  return (
    <tr className={styles.row}>
      <td className={styles.cellDate}>
        <time dateTime={row.date}>{formatShortDate(row.date, locale)}</time>
      </td>
      <td className={styles.cellDesc}>
        <div className={styles.desc}>
          <span className={cx(styles.ledgerGlyph, incoming && styles.ledgerGlyphIn)}>
            {incoming ? <MoneyInGlyph size={16} /> : <MoneyOutGlyph size={16} />}
          </span>
          <span className={styles.descText}>
            <span className={styles.descTitle}>{row.title}</span>
            <span className={styles.descMeta}>
              {row.meta}
              {/* Shown only when the category column is dropped for width (see CSS). */}
              <span className={styles.metaCategory}> · {row.category}</span>
            </span>
          </span>
        </div>
      </td>
      <td className={styles.cellCategory}>{row.category}</td>
      <td className={styles.cellStatus}>
        <span className={cx(styles.badge, TONE_CLASS[status.tone])}>
          <ToneGlyph tone={status.tone} size={14} />
          {status.label}
        </span>
      </td>
      <td className={cx(styles.cellAmount, incoming && styles.amountIn)}>
        {formatSignedAmount(row.amount, locale, currency)}
      </td>
    </tr>
  );
}

function Field({
  field,
  controlId,
  locale,
  currency,
}: {
  field: FormFieldContent;
  controlId: string;
  locale: string;
  currency: string;
}): JSX.Element {
  const hintId = field.hint ? `${controlId}-hint` : undefined;
  const affixId = field.currencyAffix ? `${controlId}-affix` : undefined;
  const describedBy = [affixId, hintId].filter(Boolean).join(' ') || undefined;

  let control: JSX.Element;
  if (field.type === 'select') {
    control = (
      <div className={styles.selectWrap}>
        <select
          id={controlId}
          className={cx(styles.control, styles.select)}
          defaultValue={field.value ?? ''}
          aria-describedby={describedBy}
        >
          {field.placeholder && (
            <option value="" disabled>
              {field.placeholder}
            </option>
          )}
          {(field.options ?? []).map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <ChevronDownGlyph size={16} className={styles.selectIcon} />
      </div>
    );
  } else {
    const input = (
      <input
        id={controlId}
        type="text"
        className={field.currencyAffix ? styles.inputBare : styles.control}
        defaultValue={field.value}
        placeholder={field.placeholder}
        inputMode={field.inputMode}
        autoComplete="off"
        aria-describedby={describedBy}
      />
    );
    control = field.currencyAffix ? (
      <div className={cx(styles.control, styles.inputGroup)}>
        <span id={affixId} className={styles.affix}>
          {currencySymbol(locale, currency)}
        </span>
        {input}
      </div>
    ) : (
      input
    );
  }

  return (
    <div className={styles.field}>
      <label htmlFor={controlId} className={styles.label}>
        {field.label}
      </label>
      {control}
      {field.hint && (
        <p id={hintId} className={styles.hint}>
          {field.hint}
        </p>
      )}
    </div>
  );
}

function ProgressCard({
  progress,
  locale,
  titleId,
  heading: Heading,
}: {
  progress: TenantContent['overview']['progress'];
  locale: string;
  titleId: string;
  heading: SectionHeading;
}): JSX.Element {
  const pct = toPercentInt(progress.value);
  const labelId = `${titleId}-label`;
  return (
    <section className={cx(styles.card, styles.progressCard)} aria-labelledby={titleId}>
      <Heading id={titleId} className={styles.h2}>
        {progress.title}
      </Heading>
      <div className={styles.progressFigures}>
        <p className={styles.progressValue}>{formatPercent(pct / 100, locale)}</p>
        <p id={labelId} className={styles.progressLabel}>
          {progress.label}
        </p>
      </div>
      <div
        className={styles.track}
        role="progressbar"
        aria-labelledby={titleId}
        aria-describedby={labelId}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
      >
        <div className={styles.fill} style={{ inlineSize: `${pct}%` }} />
      </div>
      <p className={styles.progressCaption}>{progress.caption}</p>
    </section>
  );
}

'use client';

/**
 * Benefits overview — the web screen of a family health-benefits product (the KYB web prototype, rebuilt from
 * Strata components): a filter rail for members and categories, a search, the shared wallet, and every benefit as a
 * row you open for the detail. Copy, amounts and dates come from `content`, so the same code is an employer OPD
 * wallet in one brand and an insurer's everyday allowance in another.
 *
 * Rows have four looks on top of the same components (block CSS only):
 * - normal: what's been used, or "Unlimited", or a member rate;
 * - fully used (a count with nothing left): greyed, with a "Fully used" tag;
 * - locked (needs a declaration or a check first): a dashed warning border, a lock and "Locked";
 * - enrol (someone has to be opted in): a brand border, a person-plus and "Enrol to start".
 * Each state is said in words as well as colour.
 *
 * The rail is two React Aria listboxes with single selection. They filter the rows; they don't navigate.
 * From 760px of its own width the rail sits beside the list; below that it goes on top and its items wrap as chips.
 *
 * `headingLevel` (default 1) is the level of the page title (visually hidden: the product has none). Above 1 the
 * block is embedded in another page and renders no <main> landmark.
 */

import {
  Accordion,
  AccordionItem,
  Amount,
  Avatar,
  Badge,
  Button,
  Card,
  CardContent,
  Eyebrow,
  IconTile,
  Meter,
  PersonChip,
  SearchField,
  Tag,
  Tooltip,
  TooltipTrigger,
  Alert,
} from '@strata/react';
import {
  IconCalendar,
  IconCheck,
  IconEye,
  IconInfoCircle,
  IconLayoutGrid,
  IconLock,
  IconShieldCheck,
  IconUserPlus,
  IconUsers,
  type Icon as StrataIcon,
} from '@strata/icons';
import { useId, useMemo, useState, type CSSProperties, type JSX, type ReactNode } from 'react';
import { ListBox, ListBoxItem, type Key, type Selection } from 'react-aria-components';
import {
  benefitsOverviewContent,
  type BenefitsOverviewBenefit,
  type BenefitsOverviewContent,
  type BenefitsOverviewIcon,
  type BenefitsOverviewRelation,
} from './benefits-overview.content';
import {
  IconApple,
  IconBaby,
  IconCalendarEvent as IconCalendarPlus,
  IconHospital as IconClinic,
  IconShieldCheck as IconClipboardCheck,
  IconDiscount,
  IconTestTube as IconFlask,
  IconHeartPulse,
  IconMoodSmile,
  IconPill,
  IconStethoscope,
  IconBuildingStore as IconStore,
  IconVideo,
} from '@strata/icons';
import styles from './benefits-overview.module.css';

const cx = (...c: Array<string | false | null | undefined>) => c.filter(Boolean).join(' ');

type Level = 1 | 2 | 3 | 4 | 5 | 6;
const level = (n: number): Level => Math.min(6, Math.max(1, Math.round(n))) as Level;

/** Fills `{key}` placeholders. */
const fill = (text: string, values: Record<string, string | number>) =>
  text.replace(/\{(\w+)\}/g, (m, k: string) => (k in values ? String(values[k]) : m));

const ICONS: Record<BenefitsOverviewIcon, StrataIcon> = {
  all: IconLayoutGrid,
  sponsored: IconShieldCheck,
  discounted: IconDiscount,
  consult: IconStethoscope,
  clinic: IconClinic,
  lab: IconFlask,
  checkup: IconClipboardCheck,
  nutrition: IconApple,
  video: IconVideo,
  pharmacy: IconPill,
  maternity: IconBaby,
  elder: IconHeartPulse,
  vision: IconEye,
  wellness: IconMoodSmile,
  store: IconStore,
};

const RELATION_ORDER: BenefitsOverviewRelation[] = ['employee', 'spouse', 'child', 'parent'];

/** Staggered entrance for the rows (see .rise in the CSS). */
const rise = (i: number) => ({ '--_i': i }) as CSSProperties;

type RowState = 'normal' | 'spent' | 'locked' | 'enrol';
const rowState = (b: BenefitsOverviewBenefit): RowState =>
  b.state ?? (b.usage.kind === 'count' && b.usage.used >= b.usage.of ? 'spent' : 'normal');

export interface BenefitsOverviewProps {
  /** All copy. Defaults to the English sample in ./benefits-overview.content.ts. */
  content?: BenefitsOverviewContent;
  /** Level of the (visually hidden) page title, default 1. Above 1 the block renders as embedded: no <main>. */
  headingLevel?: 1 | 2 | 3 | 4;
  className?: string;
}

export function BenefitsOverview({ content: contentProp, headingLevel = 1, className }: BenefitsOverviewProps): JSX.Element {
  // A tenant can supply only some keys; anything missing falls back to the sample.
  const content: BenefitsOverviewContent = { ...benefitsOverviewContent, ...contentProp } as BenefitsOverviewContent;
  const c = content.benefitsOverview ?? benefitsOverviewContent.benefitsOverview;
  const { locale, currency } = content;
  const L = c.labels;
  const uid = useId();
  const Main = headingLevel > 1 ? 'div' : 'main';
  const H1 = `h${level(headingLevel)}` as const;
  const H2 = `h${level(headingLevel + 1)}` as const;
  const rowHeading = level(headingLevel + 2) as 2 | 3 | 4 | 5 | 6;

  const fmt = useMemo(() => {
    const money = new Intl.NumberFormat(locale, { style: 'currency', currency, maximumFractionDigits: 0 });
    const percent = new Intl.NumberFormat(locale, { style: 'percent', maximumFractionDigits: 0 });
    const number = new Intl.NumberFormat(locale);
    // Dates are ISO days; format them in UTC so the static page and the browser agree whatever the time zone.
    const date = new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
    return {
      money: (n: number) => money.format(n),
      percent: (n: number) => percent.format(n),
      number: (n: number) => number.format(n),
      date: (iso: string) => date.format(new Date(`${iso}T00:00:00Z`)),
    };
  }, [locale, currency]);

  const memberById = useMemo(() => new Map(c.members.map((m) => [m.id, m])), [c.members]);

  // The wallet's "used" is the sum of what each service has drawn from it (not typed separately).
  const walletUsed = c.benefits.reduce((sum, b) => sum + (b.usage.kind === 'amount' ? b.usage.used : 0), 0);
  const walletLeft = Math.max(0, c.walletTotal - walletUsed);

  /* ---- filters ---- */
  const ALL = 'all';
  const [member, setMember] = useState<Key>(ALL);
  const [category, setCategory] = useState<Key>(ALL);
  const [query, setQuery] = useState('');
  const [expanded, setExpanded] = useState<Set<Key>>(() => new Set(c.openBenefit ? [c.openBenefit] : []));

  const q = query.trim().toLocaleLowerCase(locale);
  const visible = c.benefits.filter(
    (b) =>
      (member === ALL || b.covered.includes(String(member))) &&
      (category === ALL || b.categories.includes(String(category))) &&
      (!q || `${b.title} ${b.description}`.toLocaleLowerCase(locale).includes(q)),
  );
  const filtered = member !== ALL || category !== ALL || q !== '';
  // The names of the rail filters that are on, for the toolbar ("Priya", "Pharmacy").
  const filterNames = [
    member !== ALL ? memberById.get(String(member))?.name : undefined,
    category !== ALL ? c.categories.find((cat) => cat.id === category)?.label : undefined,
  ].filter((n): n is string => n != null);
  const clearFilters = () => {
    setMember(ALL);
    setCategory(ALL);
    setQuery('');
  };
  const single = (set: (k: Key) => void) => (keys: Selection) => {
    if (keys !== 'all' && keys.size) set([...keys][0]!);
  };

  const membersLabelId = `${uid}-members`;
  const categoriesLabelId = `${uid}-categories`;
  const walletTitleId = `${uid}-wallet`;

  /* ---- a row's trailing value (collapsed) ---- */
  const trailing = (b: BenefitsOverviewBenefit, state: RowState): ReactNode => {
    if (state === 'locked') return <span className={cx(styles.value, styles.valueWarning)}>{L.locked}</span>;
    if (state === 'enrol')
      return (
        <span className={styles.valueStack}>
          <span className={cx(styles.value, styles.valueBrand)}>{L.enrol}</span>
          <span className={styles.valueCaption}>{L.toStart}</span>
        </span>
      );
    if (state === 'spent') return null;
    const u = b.usage;
    switch (u.kind) {
      case 'amount':
        return (
          <span className={styles.valueStack}>
            <span className={styles.value}>{fmt.money(u.used)}</span>
            <span className={styles.valueCaption}>{L.used}</span>
          </span>
        );
      case 'count':
        return (
          <span className={styles.valueStack}>
            <span className={styles.value}>{fill(L.countUsed, { used: fmt.number(u.used) })}</span>
            <span className={styles.valueCaption}>{fill(L.countOf, { total: fmt.number(u.of) })}</span>
          </span>
        );
      case 'unlimited':
        return <span className={cx(styles.value, styles.valueBrand)}>{L.unlimited}</span>;
      case 'discount':
        return (
          <span className={styles.valueStack}>
            <span className={cx(styles.value, styles.valueSuccess)}>{fill(L.discount, { percent: fmt.percent(u.percent) })}</span>
            <span className={styles.valueCaption}>{L.memberRate}</span>
          </span>
        );
    }
  };

  /* ---- the line under the title (collapsed) ---- */
  const summary = (b: BenefitsOverviewBenefit, state: RowState) => {
    if ((state === 'locked' || state === 'enrol') && b.reason) return b.reason;
    const count = fmt.number(b.covered.length);
    if (b.usage.kind === 'discount') return fill(L.discountedFor, { count });
    const parts = [fill(L.coveredFor, { count })];
    if (b.discounts?.length) parts.push(fill(L.discounted, { count: fmt.number(b.discounts.length) }));
    return parts.join(' · ');
  };

  return (
    <Main className={cx(styles.root, className)}>
      <H1 className={styles.srOnly}>{L.title}</H1>
      {/* The root is the size container; this grid is what the container queries lay out. */}
      <div className={styles.layout}>

      {/* ---------------------------------------------------------------- filter rail */}
      <div className={styles.rail}>
        <section className={styles.railGroup} aria-labelledby={membersLabelId}>
          <div className={styles.railHead}>
            <Eyebrow as="span" id={membersLabelId}>
              {L.members}
            </Eyebrow>
            <Badge size="sm" aria-hidden="true">
              {fmt.number(c.members.length)}
            </Badge>
          </div>
          <ListBox
            aria-labelledby={membersLabelId}
            layout="grid"
            selectionMode="single"
            disallowEmptySelection
            selectedKeys={[member]}
            onSelectionChange={single(setMember)}
            className={styles.railList}
          >
            <ListBoxItem id={ALL} textValue={L.everyone} className={styles.railItem}>
              <IconTile tint="solid" size="sm" className={styles.everyone}>
                <IconUsers />
              </IconTile>
              <span className={styles.railLabel}>{L.everyone}</span>
            </ListBoxItem>
            {c.members.map((m) => (
              <ListBoxItem key={m.id} id={m.id} textValue={m.name} className={styles.railItem}>
                <Avatar name={m.name} alt="" tint="auto" size="sm" className={styles.railAvatar} />
                <span className={styles.railLabel}>{m.name}</span>
              </ListBoxItem>
            ))}
          </ListBox>
        </section>

        <section className={styles.railGroup} aria-labelledby={categoriesLabelId}>
          <div className={styles.railHead}>
            <Eyebrow as="span" id={categoriesLabelId}>
              {L.categories}
            </Eyebrow>
            <Badge size="sm" aria-hidden="true">
              {fmt.number(c.categories.length)}
            </Badge>
          </div>
          <ListBox
            aria-labelledby={categoriesLabelId}
            layout="grid"
            selectionMode="single"
            disallowEmptySelection
            selectedKeys={[category]}
            onSelectionChange={single(setCategory)}
            className={styles.railList}
          >
            {c.categories.map((cat) => {
              const Icon = ICONS[cat.icon];
              return (
                <ListBoxItem key={cat.id} id={cat.id} textValue={cat.label} className={styles.railItem}>
                  {({ isSelected }) => (
                    <>
                      <IconTile tint={isSelected ? 'solid' : 'none'} size="sm" className={styles.railTile}>
                        <Icon />
                      </IconTile>
                      <span className={styles.railLabel}>{cat.label}</span>
                      <IconCheck className={styles.railCheck} aria-hidden="true" />
                    </>
                  )}
                </ListBoxItem>
              );
            })}
          </ListBox>
        </section>
      </div>

      {/* ---------------------------------------------------------------- main column */}
      <div className={styles.main}>
        {/* The toolbar: search (at a reading width, not the full column) and, at the other end, how many benefits
            are showing and which filters are on, with a way to clear them. */}
        <div className={styles.toolbar}>
          <SearchField
            aria-label={L.search.label}
            placeholder={L.search.placeholder}
            value={query}
            onChange={setQuery}
            className={styles.search}
          />
          <p className={styles.results}>
            <span className={styles.resultCount}>
              {filtered
                ? fill(L.results.filtered, { shown: fmt.number(visible.length), total: fmt.number(c.benefits.length) })
                : fill(L.results.all, { count: fmt.number(c.benefits.length) })}
            </span>
            {filterNames.map((n) => (
              <span key={n} className={styles.resultFilter}>
                {n}
              </span>
            ))}
            {filtered && (
              <Button variant="link" size="sm" onPress={clearFilters} className={styles.clear}>
                {L.empty.clear}
              </Button>
            )}
          </p>
        </div>

        <section aria-labelledby={walletTitleId} className={styles.walletSection}>
          <div className={styles.sectionHead}>
            <H2 id={walletTitleId} className={styles.sectionTitle}>
              {L.wallet.title}
            </H2>
            <p className={styles.sectionNote}>{L.wallet.note}</p>
          </div>
          <Card variant="feature">
            <CardContent className={styles.walletBody}>
              {/* Anchored: what's used (the headline) at the start, what's left at the end, one shared baseline. */}
              <div className={styles.walletFigures}>
                <p className={styles.walletUsed}>
                  <Amount value={walletUsed} currency={currency} locale={locale} size="md" />
                  <span className={styles.walletOf}>{fill(L.wallet.usedOf, { total: fmt.money(c.walletTotal) })}</span>
                </p>
                <p className={styles.walletLeft}>
                  <span className={styles.walletLeftLabel}>{L.wallet.left}</span>
                  <span className={styles.walletLeftValue}>{fmt.money(walletLeft)}</span>
                </p>
              </div>
              <Meter
                aria-label={L.wallet.meter}
                value={walletUsed}
                maxValue={c.walletTotal}
                valueLabel={`${fmt.money(walletUsed)} ${fill(L.wallet.usedOf, { total: fmt.money(c.walletTotal) })}`}
                showValue={false}
                className={styles.walletMeter}
              />
            </CardContent>
          </Card>
        </section>

        <section aria-labelledby={`${uid}-benefits`} className={styles.benefits}>
          <H2 id={`${uid}-benefits`} className={styles.srOnly}>
            {L.benefits}
          </H2>

          {/* Always in the DOM, so screen readers announce when the filters leave nothing to show. */}
          <p role="status" className={styles.srOnly}>
            {visible.length === 0 ? L.empty.title : ''}
          </p>

          {visible.length === 0 ? (
            <Card variant="ghost" className={styles.empty}>
              <CardContent variant="inset" className={styles.emptyBody}>
                <p className={styles.emptyTitle} aria-hidden="true">
                  {L.empty.title}
                </p>
                <p className={styles.emptyText}>{L.empty.body}</p>
                <Button variant="outline" size="sm" onPress={clearFilters}>
                  {L.empty.clear}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Accordion
              expandedKeys={expanded}
              onExpandedChange={(keys) => setExpanded(new Set(keys))}
              className={styles.list}
            >
              {visible.map((b, i) => {
                const state = rowState(b);
                const Icon = ICONS[b.icon];
                const covered = b.covered.map((id) => memberById.get(id)).filter((m) => m != null);
                const relations = RELATION_ORDER.filter((r) => covered.some((m) => m.relation === r));
                const discountFor = new Map((b.discounts ?? []).map((d) => [d.member, d.percent]));
                const action = b.action ?? L.use;
                return (
                  <Card key={b.id} className={styles.row} data-state={state} style={rise(i)}>
                    <AccordionItem
                      id={b.id}
                      headingLevel={rowHeading}
                      className={styles.item}
                      title={
                        <span className={styles.glance}>
                          <IconTile tint={state === 'spent' ? 'none' : b.tint} size="md" className={styles.tile}>
                            <Icon />
                          </IconTile>
                          <span className={styles.mid}>
                            <span className={styles.name}>
                              <span className={styles.nameText}>{b.title}</span>
                              {state === 'locked' && <IconLock className={styles.nameIconWarning} aria-hidden="true" />}
                              {state === 'enrol' && <IconUserPlus className={styles.nameIconBrand} aria-hidden="true" />}
                              {state === 'spent' && (
                                <Tag size="sm" variant="outline" uppercase>
                                  {L.fullyUsed}
                                </Tag>
                              )}
                            </span>
                            <span className={styles.summary}>{summary(b, state)}</span>
                            <span className={styles.description}>{b.description}</span>
                          </span>
                          <span className={styles.trailing}>{trailing(b, state)}</span>
                          {b.usage.kind === 'amount' && state === 'normal' && (
                            <span className={styles.openValue}>
                              <Eyebrow as="span" tone="brand" icon={<span className={styles.dot} />} className={styles.openEyebrow}>
                                {L.usedInService}
                              </Eyebrow>
                              <Amount value={b.usage.used} currency={currency} locale={locale} size="sm" tone="brand" />
                            </span>
                          )}
                        </span>
                      }
                    >
                      <div className={styles.body}>
                        {b.usage.kind === 'count' && (
                          <Meter
                            variant="card"
                            label={L.countMeter}
                            value={b.usage.used}
                            maxValue={b.usage.of}
                            valueLabel={fill(L.countValue, { used: fmt.number(b.usage.used), total: fmt.number(b.usage.of) })}
                            tone={state === 'spent' ? 'neutral' : 'brand'}
                          />
                        )}

                        <div className={styles.segment}>
                          <p className={styles.segmentHead}>
                            <Eyebrow as="span">{L.whoCovered}</Eyebrow>
                            <span className={styles.relations} aria-hidden="true">
                              <span className={styles.paren}>(</span>
                              {relations.map((r) => (
                                <span key={r}>{L.relations[r]}</span>
                              ))}
                              <span className={styles.paren}>)</span>
                            </span>
                            <TooltipTrigger delay={200}>
                              <Button variant="ghost" size="icon" aria-label={L.relationsInfo} className={styles.infoButton}>
                                <IconInfoCircle />
                              </Button>
                              <Tooltip>{L.relationsHelp}</Tooltip>
                            </TooltipTrigger>
                          </p>
                          <ul className={styles.people}>
                            {covered.map((m) => {
                              const off = discountFor.get(m.id);
                              return (
                                <li key={m.id} className={cx(styles.person, off != null && styles.personDiscount)}>
                                  <PersonChip name={m.name} size="sm" />
                                  {off != null && (
                                    <Tag tone="warning" size="sm">
                                      {fill(L.memberDiscount, { percent: fmt.percent(off) })}
                                    </Tag>
                                  )}
                                </li>
                              );
                            })}
                          </ul>
                        </div>

                        {b.pay && (b.pay.cashless || b.pay.reimburse || b.pay.where) && (
                          <div className={styles.segment}>
                            <Eyebrow as="p">{L.howYouPay}</Eyebrow>
                            <ul className={styles.payWays}>
                              {b.pay.cashless && (
                                <li>
                                  <Badge variant="status" tone="brand">
                                    <span className={styles.payName}>{L.cashless}:</span>
                                    <span className={styles.payBrand}>{b.pay.cashless}</span>
                                  </Badge>
                                </li>
                              )}
                              {b.pay.reimburse && (
                                <li>
                                  <Badge variant="status" tone="warning">
                                    <span className={styles.payName}>{L.reimburse}:</span>
                                    <span className={styles.payDanger}>{b.pay.reimburse}</span>
                                  </Badge>
                                </li>
                              )}
                              {b.pay.where && (
                                <li className={styles.payWhere}>
                                  <IconClinic className={styles.payWhereIcon} aria-hidden="true" />
                                  {b.pay.where}
                                </li>
                              )}
                            </ul>
                          </div>
                        )}

                        {b.note && (
                          <Alert tone={state === 'spent' ? 'info' : 'warning'} className={styles.note}>
                            {b.note}
                          </Alert>
                        )}

                        <div className={styles.foot}>
                          {b.validUntil ? (
                            <p className={styles.valid}>
                              <IconCalendar aria-hidden="true" />
                              {fill(L.validUntil, { date: fmt.date(b.validUntil) })}
                            </p>
                          ) : (
                            <span />
                          )}
                          <div className={styles.actions}>
                            <Button
                              variant="outline"
                              aria-label={fill(L.actionLabel, { action: L.details, benefit: b.title })}
                            >
                              {L.details}
                            </Button>
                            <Button variant="primary" aria-label={fill(L.actionLabel, { action, benefit: b.title })}>
                              {state === 'locked' ? (
                                <IconLock aria-hidden="true" />
                              ) : state === 'enrol' ? (
                                <IconUserPlus aria-hidden="true" />
                              ) : (
                                <IconCalendarPlus aria-hidden="true" />
                              )}
                              {action}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </AccordionItem>
                  </Card>
                );
              })}
            </Accordion>
          )}
        </section>
      </div>
      </div>
    </Main>
  );
}

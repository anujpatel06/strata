'use client';

/**
 * Portfolio — a wealth dashboard, built from Strata components only: a floating Sidebar, a greeting with search,
 * a KPI row, the portfolio value over a chosen period, allocation, monthly investing, a deposit card, recent activity
 * and the holdings table. It's designed dark-first (deep surfaces, one brand glow on the deposit card, rim-lit
 * cards) and works in light too; every text colour sits on a surface the theme engine checks it against.
 *
 * Every number is derived from `content` (see ./portfolio.content.ts): net worth is the holdings plus cash, the 7D
 * chart is summed from the same daily closes as the table, class totals are sums of their holdings. Dates are ISO
 * and formatted in UTC, so the static page and the browser agree whatever the time zone.
 *
 * Layout is container-query driven (the root is the container): sidebar beside the content from 960px of its own
 * width, and a menu button that opens the same navigation in a Sheet below that.
 *
 * `headingLevel` (default 1) is the level of the greeting. Above 1 the block is embedded in another page and
 * renders no <main> landmark.
 */

import {
  AreaChart,
  Amount,
  Avatar,
  Badge,
  BarChart,
  Button,
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  DataTable,
  DialogTrigger,
  Eyebrow,
  IconTile,
  SearchField,
  Sheet,
  Sidebar,
  SidebarFooter,
  SidebarHeader,
  SidebarItem,
  SidebarSection,
  Sparkline,
  StatTile,
  StatTileGroup,
  ToggleButton,
  ToggleButtonGroup,
  useSidebar,
  useSortedRows,
  type DataTableColumn,
  type DataTableSortDescriptor,
} from '@strata/react';
import {
  IconArrowDownLeft,
  IconArrowUpRight,
  IconArrowsExchange,
  IconBell,
  IconBuildingBank,
  IconCalendarEvent,
  IconChartLine,
  IconChartPie,
  IconCoins,
  IconCpu,
  IconFileInvoice,
  IconFlag,
  IconHome,
  IconLayoutDashboard,
  IconLeaf,
  IconMenu2,
  IconPiggyBank,
  IconPlus,
  IconSettings,
  IconSparkles,
  IconTrendingDown,
  IconTrendingUp,
  IconWallet,
  IconWorld,
  type Icon as StrataIcon,
} from '@strata/icons';
import { useId, useMemo, useState, type CSSProperties, type JSX } from 'react';
import {
  portfolioContent,
  type PortfolioActivityKind,
  type PortfolioContent,
  type PortfolioHolding,
  type PortfolioIcon,
  type PortfolioLabels,
  type PortfolioPeriod,
  type PortfolioTint,
} from './portfolio.content';
import styles from './portfolio.module.css';

const cx = (...c: Array<string | false | null | undefined>) => c.filter(Boolean).join(' ');

type Level = 1 | 2 | 3 | 4 | 5 | 6;
const level = (n: number): Level => Math.min(6, Math.max(1, Math.round(n))) as Level;

/** Fills `{key}` placeholders. */
const fill = (text: string, values: Record<string, string | number>) =>
  text.replace(/\{(\w+)\}/g, (m, k: string) => (k in values ? String(values[k]) : m));

const ICONS: Record<PortfolioIcon, StrataIcon> = {
  world: IconWorld,
  cpu: IconCpu,
  leaf: IconLeaf,
  bank: IconBuildingBank,
  coins: IconCoins,
  chart: IconChartLine,
  wallet: IconWallet,
  home: IconHome,
};

/** Which way the money moved, the tile and its icon. Direction is also in the sign of the amount. */
const KIND: Record<PortfolioActivityKind, { icon: StrataIcon; tint: PortfolioTint; sign: 1 | -1 }> = {
  buy: { icon: IconPlus, tint: 'brand', sign: -1 },
  sell: { icon: IconArrowsExchange, tint: 'info', sign: 1 },
  dividend: { icon: IconCoins, tint: 'accent', sign: 1 },
  deposit: { icon: IconArrowDownLeft, tint: 'success', sign: 1 },
  withdrawal: { icon: IconArrowUpRight, tint: 'warning', sign: -1 },
};

const PERIODS: PortfolioPeriod[] = ['24h', '7d', '1m', '1y'];

/** Staggered entrance (see .rise in the CSS). */
const rise = (i: number) => ({ '--_i': i }) as CSSProperties;

const sum = (values: number[]) => values.reduce((a, b) => a + b, 0);
const change = (from: number, to: number) => (from === 0 ? 0 : to / from - 1);

interface HoldingRow extends PortfolioHolding {
  price: number;
  value: number;
  change: number;
  share: number;
}

export interface PortfolioProps {
  /** All copy and data. Defaults to the sample in ./portfolio.content.ts. */
  content?: PortfolioContent;
  /** Level of the greeting, default 1. Above 1 the block renders as embedded: no <main>. */
  headingLevel?: 1 | 2 | 3 | 4;
  className?: string;
}

export function Portfolio({ content: contentProp, headingLevel = 1, className }: PortfolioProps): JSX.Element {
  // A tenant can supply only some keys; anything missing falls back to the sample.
  const content: PortfolioContent = { ...portfolioContent, ...contentProp } as PortfolioContent;
  const p = content.portfolio ?? portfolioContent.portfolio;
  const product = content.product ?? portfolioContent.product!;
  const user = content.user ?? portfolioContent.user!;
  const { locale, currency } = content;
  const L = p.labels;
  const uid = useId();
  const Main = headingLevel > 1 ? 'div' : 'main';
  const H1 = `h${level(headingLevel)}` as const;
  const cardLevel = level(headingLevel + 1);

  const fmt = useMemo(() => {
    const moneyFmt = new Intl.NumberFormat(locale, { style: 'currency', currency, maximumFractionDigits: 0 });
    const signedFmt = new Intl.NumberFormat(locale, { style: 'currency', currency, maximumFractionDigits: 0, signDisplay: 'exceptZero' });
    const priceFmt = new Intl.NumberFormat(locale, { style: 'currency', currency, minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const pctFmt = new Intl.NumberFormat(locale, { style: 'percent', maximumFractionDigits: 1, signDisplay: 'exceptZero' });
    const shareFmt = new Intl.NumberFormat(locale, { style: 'percent', maximumFractionDigits: 1 });
    const unitsFmt = new Intl.NumberFormat(locale, { maximumFractionDigits: 2 });
    const utc = (o: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat(locale, { ...o, timeZone: 'UTC' });
    const time = utc({ hour: 'numeric', minute: '2-digit' });
    const day = utc({ weekday: 'short', day: 'numeric' });
    const date = utc({ day: 'numeric', month: 'short' });
    const dayMonth = utc({ day: 'numeric', month: 'long' });
    const month = utc({ month: 'short', year: '2-digit' });
    const monthName = utc({ month: 'long' });
    const monthShort = utc({ month: 'short' });
    const stamp = utc({ day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });
    /** Intl uses a hyphen-minus; set a true minus (U+2212), like Amount and StatTile. */
    const minus = (text: string) => text.replace('-', '\u2212');
    return {
      money: (n: number) => minus(moneyFmt.format(n)),
      signed: (n: number) => minus(signedFmt.format(n)),
      price: (n: number) => priceFmt.format(n),
      pct: (n: number) => minus(pctFmt.format(n)),
      share: (n: number) => shareFmt.format(n),
      units: (n: number) => unitsFmt.format(n),
      time: (d: Date) => time.format(d),
      day: (d: Date) => day.format(d),
      date: (d: Date) => date.format(d),
      dayMonth: (d: Date) => dayMonth.format(d),
      month: (d: Date) => month.format(d),
      monthName: (d: Date) => monthName.format(d),
      monthShort: (d: Date) => monthShort.format(d),
      stamp: (iso: string) => stamp.format(new Date(iso)),
    };
  }, [locale, currency]);

  /* ---- derived numbers ---- */
  const derived = useMemo(() => {
    const priced = p.holdings.map((h) => {
      const price = h.prices[h.prices.length - 1] ?? 0;
      return { ...h, price, value: h.units * price, change: change(h.prices[0] ?? price, price) };
    });
    const invested = sum(priced.map((h) => h.value));
    const netWorth = invested + p.cash;
    const holdings: HoldingRow[] = priced.map((h) => ({ ...h, share: netWorth ? h.value / netWorth : 0 }));
    const cost = sum(p.holdings.map((h) => h.units * h.cost));
    const days = Math.max(0, ...p.holdings.map((h) => h.prices.length));
    // Daily totals from the holdings' closes plus cash: the 7D chart and the table share one source.
    const daily = Array.from({ length: days }, (_, i) => sum(p.holdings.map((h) => h.units * (h.prices[i] ?? 0))) + p.cash);
    const classes = p.classes.map((c) => {
      const members = p.holdings.filter((h) => h.class === c.id);
      const trend =
        c.id === 'cash' && !members.length
          ? Array.from({ length: days }, () => p.cash)
          : Array.from({ length: days }, (_, i) => sum(members.map((h) => h.units * (h.prices[i] ?? 0))));
      const value = trend[trend.length - 1] ?? 0;
      return { ...c, value, trend, share: netWorth ? value / netWorth : 0, change: change(trend[0] ?? value, value) };
    });
    return { holdings, invested, netWorth, cost, daily, classes };
  }, [p]);

  const now = new Date(p.asOf);
  const back = (ms: number) => new Date(now.getTime() - ms);
  const HOUR = 3_600_000;
  const DAY = 24 * HOUR;

  const series = useMemo(() => {
    const scale = (shape: number[]) => shape.map((f) => f * derived.netWorth);
    const build = (values: number[], label: (i: number, n: number) => string) =>
      values.map((value, i) => ({ x: label(i, values.length), value }));
    const monthsBack = (k: number) => {
      const d = new Date(now);
      d.setUTCDate(1);
      d.setUTCMonth(d.getUTCMonth() - k);
      return d;
    };
    return {
      '24h': build(scale(p.history['24h']), (i, n) => fmt.time(back((n - 1 - i) * 2 * HOUR))),
      '7d': build(derived.daily, (i, n) => fmt.day(back((n - 1 - i) * DAY))),
      '1m': build(scale(p.history['1m']), (i, n) => fmt.date(back((n - 1 - i) * DAY))),
      '1y': build(scale(p.history['1y']), (i, n) => fmt.month(monthsBack(n - 1 - i))),
    } satisfies Record<PortfolioPeriod, { x: string; value: number }[]>;
  }, [derived, p, fmt]);

  const [period, setPeriod] = useState<PortfolioPeriod>('1y');
  const points = series[period];
  const first = points[0]?.value ?? 0;
  const last = points[points.length - 1]?.value ?? 0;
  const periodChange = change(first, last);
  const lo = Math.min(...points.map((d) => d.value));
  const hi = Math.max(...points.map((d) => d.value));
  // A value chart, not a magnitude comparison: fit the range to the data with air below, so a 0.6% day still has a shape.
  const yDomain: [number, number] = [lo - (hi - lo) * 0.6, hi + (hi - lo) * 0.12];

  const monthChange = change(series['1m'][0]?.value ?? 0, derived.netWorth);
  const dayFirst = series['24h'][0]?.value ?? derived.netWorth;
  const gain = derived.invested - derived.cost;
  const contributions = p.contributions;
  const lastContribution = contributions[contributions.length - 1];
  const prevContribution = contributions[contributions.length - 2];
  const monthOf = (ym: string) => new Date(`${ym}-01T00:00:00Z`);
  const nextRun = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
  const bars = contributions.map((c) => ({ month: fmt.monthShort(monthOf(c.month)), amount: c.amount }));

  /* ---- search: filters the holdings and the activity ---- */
  const [query, setQuery] = useState('');
  const q = query.trim().toLocaleLowerCase(locale);
  const match = (...text: string[]) => !q || text.join(' ').toLocaleLowerCase(locale).includes(q);

  const [sort, setSort] = useState<DataTableSortDescriptor>({ column: 'value', direction: 'descending' });
  const sorted = useSortedRows(
    derived.holdings.filter((h) => match(h.name, h.ticker)),
    sort,
    { value: (r: HoldingRow) => r.value, change: (r: HoldingRow) => r.change, price: (r: HoldingRow) => r.price },
  );
  const activity = p.activity.filter((a) => match(a.title, L.activity.kinds[a.kind]));

  const ids = {
    chart: `${uid}-chart`,
    allocation: `${uid}-allocation`,
    contributions: `${uid}-contributions`,
    promo: `${uid}-promo`,
    activity: `${uid}-activity`,
    holdings: `${uid}-holdings`,
  };

  const deltaTone = (n: number) => (n > 0 ? 'success' : n < 0 ? 'danger' : 'neutral');
  const DeltaIcon = ({ n }: { n: number }) => (n >= 0 ? <IconTrendingUp /> : <IconTrendingDown />);

  const columns: DataTableColumn<HoldingRow>[] = [
    {
      id: 'asset',
      header: L.holdings.asset,
      isRowHeader: true,
      minWidth: 220,
      cell: (r) => {
        const Icon = ICONS[r.icon];
        return (
          <span className={styles.assetCell}>
            <IconTile tint={r.tint} size="sm">
              <Icon />
            </IconTile>
            <span className={styles.assetText}>
              <span className={styles.assetName}>{r.name}</span>
              <span className={styles.ticker}>{r.ticker}</span>
            </span>
          </span>
        );
      },
    },
    { id: 'price', header: L.holdings.price, align: 'end', allowsSorting: true, cell: (r) => fmt.price(r.price) },
    {
      id: 'change',
      header: L.holdings.change,
      align: 'end',
      allowsSorting: true,
      cell: (r) => (
        <Badge size="sm" tone={deltaTone(r.change)} icon={<DeltaIcon n={r.change} />} className={styles.chip}>
          {fmt.pct(r.change)}
        </Badge>
      ),
    },
    {
      id: 'trend',
      header: L.holdings.trend,
      minWidth: 120,
      cell: (r) => (
        <Sparkline
          data={r.prices}
          tone={r.change >= 0 ? 'success' : 'danger'}
          className={styles.tableSpark}
          aria-label={fill(L.holdings.trendLabel, { name: r.name, change: fmt.pct(r.change) })}
        />
      ),
    },
    {
      id: 'holding',
      header: L.holdings.holding,
      align: 'end',
      cell: (r) => fill(L.holdings.units, { units: fmt.units(r.units) }),
    },
    { id: 'value', header: L.holdings.value, align: 'end', allowsSorting: true, cell: (r) => <span className={styles.strong}>{fmt.money(r.value)}</span> },
    { id: 'share', header: L.holdings.allocation, align: 'end', cell: (r) => fmt.share(r.share) },
  ];

  const nav = (withHeader: boolean) => (
    <>
      {withHeader && (
        <SidebarHeader
          logo={
            <IconTile tint="solid" size="sm">
              <IconSparkles />
            </IconTile>
          }
          title={product.name}
          subtitle={L.subtitle}
        />
      )}
      <SidebarSection title={L.nav.overview}>
        <SidebarItem href="#dashboard" icon={<IconLayoutDashboard />} isCurrent>
          {L.nav.dashboard}
        </SidebarItem>
        <SidebarItem href="#holdings" icon={<IconChartPie />} count={p.holdings.length}>
          {L.nav.holdings}
        </SidebarItem>
        <SidebarItem href="#markets" icon={<IconChartLine />} badge={L.nav.marketsBadge}>
          {L.nav.markets}
        </SidebarItem>
      </SidebarSection>
      <SidebarSection title={L.nav.money}>
        <SidebarItem href="#transfers" icon={<IconArrowsExchange />}>
          {L.nav.transfers}
        </SidebarItem>
        <SidebarItem href="#statements" icon={<IconFileInvoice />} count={2}>
          {L.nav.statements}
        </SidebarItem>
        <SidebarItem href="#goals" icon={<IconFlag />}>
          {L.nav.goals}
        </SidebarItem>
      </SidebarSection>
      <SidebarSection title={L.nav.account}>
        <SidebarItem href="#alerts" icon={<IconBell />} count={3}>
          {L.nav.alerts}
        </SidebarItem>
        <SidebarItem href="#settings" icon={<IconSettings />}>
          {L.nav.settings}
        </SidebarItem>
      </SidebarSection>
      {withHeader && (
        <SidebarFooter>
          <Account name={user.name} caption={L.nav.personal} />
        </SidebarFooter>
      )}
    </>
  );

  return (
    <Main className={cx(styles.root, className)}>
      <div className={styles.shell}>
        <Sidebar aria-label={L.nav.label} variant="floating" className={styles.sidebar}>
          {nav(true)}
        </Sidebar>

        <div className={styles.page}>
          {/* ------------------------------------------------------------ header */}
          <header className={styles.header}>
            <div className={styles.titleRow}>
              <DialogTrigger>
                <Button variant="outline" size="icon" aria-label={L.nav.open} className={styles.menuButton}>
                  <IconMenu2 aria-hidden="true" />
                </Button>
                <Sheet side="start" title={product.name}>
                  <Sidebar aria-label={L.nav.label} className={styles.sheetNav}>
                    {nav(false)}
                  </Sidebar>
                </Sheet>
              </DialogTrigger>
              <div className={styles.greeting}>
                <H1 className={styles.title}>{fill(L.greeting, { name: user.name.split(' ')[0] ?? user.name })}</H1>
                <p className={styles.intro}>
                  {fill(L.intro, { change: fmt.signed(derived.netWorth - (series['1m'][0]?.value ?? derived.netWorth)) })}
                </p>
              </div>
            </div>
            <div className={styles.tools}>
              <SearchField
                aria-label={L.search.label}
                placeholder={L.search.placeholder}
                value={query}
                onChange={setQuery}
                className={styles.search}
              />
              <Button variant="outline" size="icon" aria-label={L.notifications} className={styles.bell}>
                <IconBell aria-hidden="true" />
              </Button>
            </div>
          </header>

          {/* ------------------------------------------------------------ KPIs */}
          <StatTileGroup className={cx(styles.kpis, styles.rise)} style={rise(0)}>
            <StatTile
              label={L.kpi.netWorth}
              value={fmt.money(derived.netWorth)}
              delta={monthChange}
              deltaLabel={L.kpi.netWorthDelta}
              icon={<IconWallet />}
              sparkline={series['1m'].map((d) => d.value)}
              className={styles.kpi}
            />
            <StatTile
              label={L.kpi.today}
              value={fmt.signed(derived.netWorth - dayFirst)}
              delta={change(dayFirst, derived.netWorth)}
              deltaLabel={L.kpi.todayDelta}
              icon={<IconChartLine />}
              sparkline={series['24h'].map((d) => d.value)}
              className={styles.kpi}
            />
            <StatTile
              label={L.kpi.returns}
              value={fmt.signed(gain)}
              delta={change(derived.cost, derived.invested)}
              deltaLabel={L.kpi.returnsDelta}
              icon={<IconTrendingUp />}
              sparkline={series['1y'].map((d) => d.value)}
              className={styles.kpi}
            />
            <StatTile
              label={L.kpi.invested}
              value={fmt.money(lastContribution?.amount ?? 0)}
              delta={lastContribution && prevContribution ? change(prevContribution.amount, lastContribution.amount) : undefined}
              deltaLabel={prevContribution ? fill(L.kpi.investedDelta, { month: fmt.monthName(monthOf(prevContribution.month)) }) : undefined}
              icon={<IconPiggyBank />}
              sparkline={contributions.map((c) => c.amount)}
              className={styles.kpi}
            />
          </StatTileGroup>

          <div className={styles.grid}>
            {/* ---------------------------------------------------------- hero chart */}
            <Card rim className={cx(styles.hero, styles.rise)} style={rise(1)}>
              <CardHeader className={styles.heroHead}>
                <div className={styles.heroFigure}>
                  <CardTitle level={cardLevel} id={ids.chart} className={styles.eyebrowTitle}>
                    {L.chart.title}
                  </CardTitle>
                  <Amount value={Math.round(derived.netWorth)} currency={currency} locale={locale} size="lg" className={styles.heroAmount} />
                  <p className={styles.heroDelta}>
                    <Badge tone={deltaTone(periodChange)} icon={<DeltaIcon n={periodChange} />} className={styles.chip}>
                      {fmt.pct(periodChange)}
                    </Badge>
                    <span className={styles.heroDeltaText}>
                      <span className={styles.strong}>{fmt.signed(last - first)}</span> {L.chart.versus[period]}
                    </span>
                  </p>
                </div>
                <CardAction className={styles.heroAction}>
                  <ToggleButtonGroup
                    aria-label={L.chart.period}
                    size="sm"
                    selectionMode="single"
                    disallowEmptySelection
                    selectedKeys={[period]}
                    onSelectionChange={(keys) => {
                      const next = [...keys][0];
                      if (next) setPeriod(next as PortfolioPeriod);
                    }}
                  >
                    {PERIODS.map((id) => (
                      <ToggleButton key={id} id={id}>
                        {L.chart.periods[id]}
                      </ToggleButton>
                    ))}
                  </ToggleButtonGroup>
                </CardAction>
              </CardHeader>
              <CardContent className={styles.heroChart}>
                <AreaChart
                  key={period}
                  aria-labelledby={ids.chart}
                  data={points}
                  x="x"
                  xLabel={L.chart.x[period]}
                  series={[{ key: 'value', label: L.chart.series }]}
                  format={{ value: { style: 'currency', currency, maximumFractionDigits: 0 } }}
                  yDomain={yDomain}
                  height={264}
                  showYAxis={false}
                  showGrid={false}
                  className={styles.areaChart}
                />
              </CardContent>
            </Card>

            {/* ---------------------------------------------------------- promo */}
            <Card variant="feature" stars className={cx(styles.promo, styles.rise)} style={rise(2)} aria-labelledby={ids.promo} role="region">
              <CardHeader>
                <div className={styles.promoTop}>
                  <IconTile tint="solid" size="md">
                    <IconSparkles />
                  </IconTile>
                  <Eyebrow as="span">{L.promo.eyebrow}</Eyebrow>
                </div>
                <CardTitle level={cardLevel} id={ids.promo} className={styles.promoTitle}>
                  {L.promo.title}
                </CardTitle>
                <CardDescription className={styles.promoBody}>{L.promo.body}</CardDescription>
              </CardHeader>
              <CardContent className={styles.promoCash}>
                <span className={styles.label}>{L.promo.cash}</span>
                <Amount value={Math.round(p.cash)} currency={currency} locale={locale} size="md" />
                {lastContribution && (
                  // The next auto-invest: the first of next month, the same amount as this month's.
                  <p className={styles.nextRun}>
                    <IconCalendarEvent aria-hidden="true" className={styles.nextIcon} />
                    <span className={styles.nextText}>
                      <span className={styles.label}>{L.promo.next}</span>
                      <span className={styles.strong}>
                        {fmt.money(lastContribution.amount)} · <time dateTime={nextRun.toISOString().slice(0, 10)}>{fmt.dayMonth(nextRun)}</time>
                      </span>
                    </span>
                  </p>
                )}
              </CardContent>
              <CardFooter className={styles.promoActions}>
                <Button size="lg" className={styles.promoButton}>
                  <IconArrowDownLeft aria-hidden="true" />
                  {L.promo.deposit}
                </Button>
                <Button size="lg" variant="secondary" className={styles.promoButton}>
                  <IconArrowUpRight aria-hidden="true" />
                  {L.promo.withdraw}
                </Button>
              </CardFooter>
            </Card>

            {/* ---------------------------------------------------------- allocation */}
            <Card rim className={cx(styles.allocation, styles.rise)} style={rise(3)}>
              <CardHeader>
                <CardTitle level={cardLevel} id={ids.allocation}>
                  {L.allocation.title}
                </CardTitle>
                <CardAction>
                  <span className={styles.total}>{fmt.money(derived.netWorth)}</span>
                </CardAction>
              </CardHeader>
              <CardContent className={styles.allocationBody}>
                {/* Decorative: the list below says every share in words. */}
                <div className={styles.stack} aria-hidden="true">
                  {derived.classes.map((c, i) => (
                    <span key={c.id} className={styles.segment} style={{ flexGrow: c.share, '--_c': `var(--strata-chart-${i + 1})` } as CSSProperties} />
                  ))}
                </div>
                <ul className={styles.list} aria-labelledby={ids.allocation}>
                  {derived.classes.map((c, i) => {
                    const Icon = ICONS[c.icon];
                    return (
                      <li key={c.id} className={styles.assetRow}>
                        <IconTile tint={c.tint} size="md">
                          <Icon />
                        </IconTile>
                        <span className={styles.assetText}>
                          <span className={styles.assetName}>
                            <span className={styles.swatch} style={{ '--_c': `var(--strata-chart-${i + 1})` } as CSSProperties} aria-hidden="true" />
                            {c.label}
                          </span>
                          <span className={styles.meta}>{fill(L.allocation.share, { percent: fmt.share(c.share) })}</span>
                        </span>
                        <Sparkline data={c.trend} series={(i + 1) as 1 | 2 | 3 | 4} className={styles.rowSpark} />
                        <span className={styles.rowValue}>
                          <span className={styles.strong}>{fmt.money(c.value)}</span>
                          <span className={cx(styles.meta, styles.signed)}>{fmt.pct(c.change)}</span>
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </CardContent>
            </Card>

            {/* ---------------------------------------------------------- contributions */}
            <Card rim className={cx(styles.contributions, styles.rise)} style={rise(4)}>
              <CardHeader>
                <CardTitle level={cardLevel} id={ids.contributions}>
                  {L.contributions.title}
                </CardTitle>
                {lastContribution && (
                  <CardDescription>
                    {fill(L.contributions.caption, { month: fmt.monthName(monthOf(lastContribution.month)) })}{' '}
                    <span className={styles.strong}>{fmt.money(lastContribution.amount)}</span>
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <BarChart
                  aria-labelledby={ids.contributions}
                  data={bars}
                  x="month"
                  xLabel={L.contributions.x}
                  series={[{ key: 'amount', label: L.contributions.series }]}
                  format={{ value: { style: 'currency', currency, maximumFractionDigits: 0 } }}
                  height={216}
                />
              </CardContent>
            </Card>

            {/* ---------------------------------------------------------- activity */}
            <Card rim className={cx(styles.activity, styles.rise)} style={rise(5)}>
              <CardHeader>
                <CardTitle level={cardLevel} id={ids.activity}>
                  {L.activity.title}
                </CardTitle>
                <CardAction>
                  <Button variant="ghost" size="sm">
                    {L.activity.viewAll}
                  </Button>
                </CardAction>
              </CardHeader>
              {/* On the inset (surface.sunken): feedback.success.fg is contrast-checked there, not on the raised card. */}
              <CardContent variant="inset">
                <ul className={cx(styles.list, styles.activityList)} aria-labelledby={ids.activity}>
                  {activity.map((a) => {
                    const k = KIND[a.kind];
                    const Icon = k.icon;
                    return (
                      <li key={a.id} className={styles.activityRow}>
                        <IconTile tint={k.tint} size="sm">
                          <Icon />
                        </IconTile>
                        <span className={styles.assetText}>
                          <span className={styles.assetName}>{a.title}</span>
                          <span className={styles.meta}>
                            {L.activity.kinds[a.kind]} · <time dateTime={a.at} className={styles.nowrap}>{fmt.stamp(a.at)}</time>
                          </span>
                        </span>
                        <span className={cx(styles.strong, styles.signed, k.sign > 0 && styles.inflow)}>{fmt.signed(a.amount * k.sign)}</span>
                      </li>
                    );
                  })}
                </ul>
              </CardContent>
            </Card>

            {/* ---------------------------------------------------------- holdings */}
            <Card rim className={cx(styles.holdings, styles.rise)} style={rise(6)}>
              <CardHeader>
                <CardTitle level={cardLevel} id={ids.holdings}>
                  {L.holdings.title}
                </CardTitle>
                <CardAction>
                  <Badge size="sm">{fmt.units(sorted.length)}</Badge>
                </CardAction>
              </CardHeader>
              <CardContent variant="inset">
                <DataTable
                  aria-labelledby={ids.holdings}
                  columns={columns}
                  rows={sorted}
                  getRowId={(r) => r.id}
                  sortDescriptor={sort}
                  onSortChange={setSort}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Main>
  );
}

/** The signed-in person, in the sidebar footer. Collapsed, only the avatar shows and carries the name. */
function Account({ name, caption }: { name: string; caption: string }): JSX.Element {
  const { collapsed } = useSidebar();
  return (
    <div className={styles.account}>
      <Avatar name={name} size="md" alt={collapsed ? name : ''} />
      {!collapsed && (
        <span className={styles.assetText}>
          <span className={styles.assetName}>{name}</span>
          <span className={styles.meta}>{caption}</span>
        </span>
      )}
    </div>
  );
}

export type { PortfolioLabels };

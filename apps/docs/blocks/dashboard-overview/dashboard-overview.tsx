'use client';

/**
 * Dashboard overview — an account home: app header (navigation, ⌘K command menu, notifications, account menu),
 * a page header, an alert, KPI tiles, recent activity and two side cards.
 *
 * Every string and number comes from `content` (see ./dashboard-overview.content.ts); every colour, size and
 * space from --strata-* tokens. Layout follows the block's own width (container queries), so it works in a
 * narrow preview as well as a full page. Wrap it in a <ThemeScope> (theme, scheme, locale) as you would a page.
 *
 * Headings and landmarks: `headingLevel` (default 1) is the level of the page title; sections use the next
 * level. At 1 the block is the page: it renders <main>, and its <header> is the banner. Above 1 it is embedded
 * in someone else's page (a docs preview, a style guide): no <main>, no global ⌘K shortcut, and the navigation's
 * label names the product so it doesn't duplicate the host page's landmarks.
 */

import {
  Alert,
  Avatar,
  Badge,
  Button,
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  CommandDialog,
  CommandItem,
  CommandSection,
  DataTable,
  Kbd,
  KbdGroup,
  Link,
  Menu,
  MenuItem,
  MenuSection,
  MenuSeparator,
  MenuTrigger,
  ProgressBar,
  Select,
  SelectItem,
  StatTile,
  StatTileGroup,
  TextField,
  ToastRegion,
  toast,
  useCommandShortcut,
  type DataTableColumn,
} from '@strata/react';
import {
  IconArrowDownLeft,
  IconArrowUpRight,
  IconBell,
  IconChevronRight,
  IconFileText,
  IconHelpCircle,
  IconLayoutDashboard,
  IconLogout,
  IconSearch,
  IconSettings,
  IconSparkles,
  IconUser,
} from '@tabler/icons-react';
import {
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type HTMLAttributes,
  type JSX,
  type MouseEvent,
  type RefObject,
} from 'react';
import {
  dashboardOverviewContent,
  type DashboardActivityRow,
  type DashboardFormField,
  type DashboardOverviewContent,
  type DashboardStat,
} from './dashboard-overview.content';
import styles from './dashboard-overview.module.css';

const cx = (...c: Array<string | false | null | undefined>) => c.filter(Boolean).join(' ');

type Level = 1 | 2 | 3 | 4 | 5 | 6;
const level = (n: number): Level => Math.min(6, Math.max(1, Math.round(n))) as Level;

function Heading({ level: l, ...rest }: { level: Level } & HTMLAttributes<HTMLHeadingElement>): JSX.Element {
  const Tag = `h${l}` as const;
  return <Tag {...rest} />;
}

/** Demo links point at "#": keep them from navigating (or scrolling a host page to the top). */
const stay = (e: MouseEvent<Element>) => e.preventDefault();

/** Below this width (px) the activity table folds date and category into the description column. */
const COMPACT_TABLE_BELOW = 560;

function useWidthBelow(ref: RefObject<HTMLElement | null>, width: number): boolean {
  const [below, setBelow] = useState(false);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(([entry]) => {
      if (entry) setBelow(entry.contentRect.width < width);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [ref, width]);
  return below;
}

/* ------------------------------------------------------------------ *
 * Formatting — Intl in the content locale, never by hand
 * ------------------------------------------------------------------ */

const MINUS = '−'; // U+2212: reads as a number sign, same bidi class as "-".

function useFormat(locale: string, currency: string) {
  return useMemo(() => {
    const whole = new Intl.NumberFormat(locale, { style: 'currency', currency, minimumFractionDigits: 0, maximumFractionDigits: 0 });
    const exact = new Intl.NumberFormat(locale, { style: 'currency', currency });
    const signed = new Intl.NumberFormat(locale, { style: 'currency', currency, signDisplay: 'exceptZero' });
    const number = new Intl.NumberFormat(locale, { maximumFractionDigits: 2 });
    const percent = new Intl.NumberFormat(locale, { style: 'percent', maximumFractionDigits: 1 });
    const day = new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short', timeZone: 'UTC' });
    const relative = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
    const withMinus = (nf: Intl.NumberFormat, v: number) =>
      nf
        .formatToParts(v)
        .map((p) => (p.type === 'minusSign' ? p.value.replace('-', MINUS) : p.value))
        .join('');
    const symbol = exact.formatToParts(0).find((p) => p.type === 'currency')?.value ?? currency;
    return {
      symbol,
      stat: (s: DashboardStat) =>
        s.format === 'currency'
          ? withMinus(Number.isInteger(s.value) ? whole : exact, s.value)
          : s.format === 'percent'
            ? percent.format(s.value)
            : withMinus(number, s.value),
      amount: (v: number) => withMinus(signed, v),
      date: (iso: string) => {
        const d = new Date(`${iso}T00:00:00Z`);
        return Number.isNaN(d.getTime()) ? iso : day.format(d);
      },
      ago: (value: number, unit: Intl.RelativeTimeFormatUnit) => relative.format(-value, unit),
    };
  }, [locale, currency]);
}

/* ------------------------------------------------------------------ *
 * Block
 * ------------------------------------------------------------------ */

export interface DashboardOverviewProps {
  /** All copy and data. Defaults to the English sample in ./dashboard-overview.content.ts. */
  content?: DashboardOverviewContent;
  /** Level of the page title (default 1). Above 1 the block renders as embedded: no <main>, sections one level down. */
  headingLevel?: 1 | 2 | 3 | 4;
  className?: string;
}

export function DashboardOverview({
  content = dashboardOverviewContent,
  headingLevel = 1,
  className,
}: DashboardOverviewProps): JSX.Element {
  const uid = useId();
  const embedded = headingLevel > 1;
  const titleLevel = level(headingLevel);
  const sectionLevel = level(headingLevel + 1);
  const { overview, dashboard } = content;
  const fmt = useFormat(content.locale, content.currency);
  const [commandOpen, setCommandOpen] = useState(false);
  // A page-wide ⌘K only makes sense when the block is the page.
  useCommandShortcut(() => setCommandOpen(true), { isDisabled: embedded });

  const Main = embedded ? 'div' : 'main';
  const sparkline = dashboard.sparkline;

  return (
    <div className={cx(styles.root, className)}>
      <AppHeader content={content} embedded={embedded} onSearch={() => setCommandOpen(true)} fmt={fmt} />

      <Main className={styles.main} aria-labelledby={embedded ? undefined : `${uid}-title`}>
        <div className={styles.page}>
          <div className={styles.pageHeader}>
            <div className={styles.titleBlock}>
              <Heading level={titleLevel} id={`${uid}-title`} className={styles.title}>
                {overview.greeting}
              </Heading>
              <p className={styles.subtitle}>{overview.subtitle}</p>
            </div>
            <div className={styles.pageActions}>
              <Button variant="outline">{overview.secondaryAction}</Button>
              <Button variant="primary">{overview.primaryAction}</Button>
            </div>
          </div>

          <Alert
            tone={overview.alert.tone}
            title={overview.alert.title}
            action={
              <Button variant="outline" size="sm">
                {overview.alert.action}
              </Button>
            }
          >
            {overview.alert.body}
          </Alert>

          <StatTileGroup className={styles.stats}>
            {overview.stats.map((stat, i) => (
              <StatTile
                key={stat.label}
                label={stat.label}
                value={fmt.stat(stat)}
                delta={stat.delta}
                deltaLabel={stat.deltaLabel}
                positiveIsGood={stat.positiveIsGood ?? true}
                sparkline={sparkline && sparkline.stat === i ? sparkline.values : undefined}
              />
            ))}
          </StatTileGroup>

          <div className={styles.grid}>
            <ActivityCard content={content} headingLevel={sectionLevel} fmt={fmt} />
            <div className={styles.side}>
              <QuickActionCard content={content} headingLevel={sectionLevel} symbol={fmt.symbol} />
              <Card>
                <CardHeader>
                  <CardTitle level={sectionLevel}>{overview.progress.title}</CardTitle>
                  <CardDescription>{overview.progress.caption}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ProgressBar label={overview.progress.label} value={toPercent(overview.progress.value)} showValue />
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </Main>

      <CommandMenu content={content} isOpen={commandOpen} onOpenChange={setCommandOpen} fmt={fmt} />
      <ToastRegion />
    </div>
  );
}

/** 0.62 → 62; values above 1 are already percentages. */
function toPercent(value: number): number {
  const pct = value > 1 ? value : value * 100;
  return Math.min(100, Math.max(0, pct));
}

type Formatters = ReturnType<typeof useFormat>;

/* ------------------------------------------------------------------ *
 * App header
 * ------------------------------------------------------------------ */

function AppHeader({
  content,
  embedded,
  onSearch,
  fmt,
}: {
  content: DashboardOverviewContent;
  embedded: boolean;
  onSearch: () => void;
  fmt: Formatters;
}): JSX.Element {
  const { product, nav, user, a11y, dashboard } = content;
  const { notifications, account } = dashboard;
  const monogram = Array.from(product.name.trim())[0] ?? '';
  return (
    <header className={styles.appBar}>
      <div className={styles.appBarInner}>
        <Link href="#" onClick={stay} className={styles.brand} variant="standalone">
          <span className={styles.logoMark} aria-hidden="true">
            {monogram}
          </span>
          <span className={styles.productName}>{product.name}</span>
        </Link>

        <nav className={styles.nav} aria-label={embedded ? `${a11y.mainNav} (${product.name})` : a11y.mainNav}>
          <ul className={styles.navList}>
            {nav.map((item, i) => (
              <li key={item}>
                <Link
                  href="#"
                  onClick={stay}
                  variant="standalone"
                  className={styles.navLink}
                  aria-current={i === 0 ? 'page' : undefined}
                >
                  {item}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className={styles.appBarEnd}>
          <Button variant="outline" className={styles.search} onPress={onSearch}>
            <IconSearch aria-hidden />
            <span className={styles.searchLabel}>{a11y.search}</span>
            {!embedded && (
              <KbdGroup className={styles.searchKbd} aria-hidden="true">
                <Kbd>⌘</Kbd>
                <Kbd>K</Kbd>
              </KbdGroup>
            )}
          </Button>

          <MenuTrigger>
            <Button variant="ghost" size="icon" aria-label={a11y.notifications} className={styles.iconButton}>
              <IconBell aria-hidden />
              {notifications.items.length > 0 && <span className={styles.unreadDot} aria-hidden="true" />}
            </Button>
            <Menu placement="bottom end" className={styles.notificationMenu}>
              <MenuSection title={notifications.title}>
                {notifications.items.map((n) => (
                  <MenuItem
                    key={n.id}
                    id={n.id}
                    textValue={n.title}
                    description={`${n.description} · ${fmt.ago(n.ago.value, n.ago.unit)}`}
                  >
                    {n.title}
                  </MenuItem>
                ))}
              </MenuSection>
              <MenuSeparator />
              <MenuItem id="mark-all-read">{notifications.markAllRead}</MenuItem>
            </Menu>
          </MenuTrigger>

          <MenuTrigger>
            <Button variant="ghost" size="icon" aria-label={a11y.account} className={styles.avatarButton}>
              <Avatar name={user.name} alt="" size="sm">
                {user.initials}
              </Avatar>
            </Button>
            <Menu placement="bottom end">
              <MenuSection title={user.name}>
                <MenuItem id="profile" icon={<IconUser />}>
                  {account.profile}
                </MenuItem>
                <MenuItem id="settings" icon={<IconSettings />}>
                  {account.settings}
                </MenuItem>
                <MenuItem id="help" icon={<IconHelpCircle />}>
                  {account.help}
                </MenuItem>
              </MenuSection>
              <MenuSeparator />
              <MenuItem id="sign-out" icon={<IconLogout className={styles.directional} />}>
                {account.signOut}
              </MenuItem>
            </Menu>
          </MenuTrigger>
        </div>
      </div>
    </header>
  );
}

/* ------------------------------------------------------------------ *
 * Command menu
 * ------------------------------------------------------------------ */

function CommandMenu({
  content,
  isOpen,
  onOpenChange,
  fmt,
}: {
  content: DashboardOverviewContent;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  fmt: Formatters;
}): JSX.Element {
  const { nav, overview, dashboard, a11y } = content;
  const { command } = dashboard;
  return (
    <CommandDialog
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      aria-label={a11y.search}
      placeholder={command.placeholder}
      renderEmptyState={(query) => <p className={styles.commandEmpty}>{command.empty.replace('{query}', query)}</p>}
      footer={
        <div className={styles.commandFooter}>
          <span className={styles.commandHint}>
            <Kbd>↑</Kbd>
            <Kbd>↓</Kbd>
            {command.hints.navigate}
          </span>
          <span className={styles.commandHint}>
            <Kbd>↵</Kbd>
            {command.hints.select}
          </span>
          <span className={styles.commandHint}>
            <Kbd>esc</Kbd>
            {command.hints.close}
          </span>
        </div>
      }
    >
      <CommandSection title={command.pages}>
        {nav.map((item) => (
          <CommandItem key={item} id={`page-${item}`} icon={<IconLayoutDashboard />}>
            {item}
          </CommandItem>
        ))}
      </CommandSection>
      <CommandSection title={command.actions}>
        {[overview.primaryAction, overview.secondaryAction, overview.form.title].map((action) => (
          <CommandItem key={action} id={`action-${action}`} icon={<IconSparkles />}>
            {action}
          </CommandItem>
        ))}
      </CommandSection>
      <CommandSection title={command.recent}>
        {overview.table.rows.map((row, i) => (
          <CommandItem
            key={`${row.date}-${i}`}
            id={`recent-${i}`}
            icon={<IconFileText />}
            textValue={`${row.title} ${row.meta} ${row.category}`}
            description={row.meta}
            meta={<span className={styles.num}>{fmt.amount(row.amount)}</span>}
          >
            {row.title}
          </CommandItem>
        ))}
      </CommandSection>
    </CommandDialog>
  );
}

/* ------------------------------------------------------------------ *
 * Recent activity
 * ------------------------------------------------------------------ */

function ActivityCard({
  content,
  headingLevel,
  fmt,
}: {
  content: DashboardOverviewContent;
  headingLevel: Level;
  fmt: Formatters;
}): JSX.Element {
  const uid = useId();
  const ref = useRef<HTMLDivElement>(null);
  const compact = useWidthBelow(ref, COMPACT_TABLE_BELOW);
  const { table, statusLabels } = content.overview;
  const { columns: labels } = table;

  const columns = useMemo<DataTableColumn<DashboardActivityRow & { key: string }>[]>(() => {
    const status = (row: DashboardActivityRow) => {
      const s = statusLabels[row.status] ?? { label: row.status, tone: 'neutral' as const };
      return (
        <Badge tone={s.tone} size={compact ? 'sm' : 'md'}>
          {s.label}
        </Badge>
      );
    };
    const amount = (row: DashboardActivityRow) => (
      <span className={cx(styles.amount, row.amount > 0 && styles.amountIn)}>{fmt.amount(row.amount)}</span>
    );
    const description = (row: DashboardActivityRow) => (
      <span className={styles.desc}>
        {!compact && (
          <span className={cx(styles.ledger, row.amount > 0 && styles.ledgerIn)} aria-hidden="true">
            {row.amount > 0 ? <IconArrowDownLeft className={styles.directional} /> : <IconArrowUpRight className={styles.directional} />}
          </span>
        )}
        <span className={styles.descText}>
          <span className={styles.descTitle}>{row.title}</span>
          <span className={styles.descMeta}>{compact ? `${fmt.date(row.date)} · ${row.meta}` : row.meta}</span>
        </span>
      </span>
    );
    if (compact) {
      return [
        { id: 'description', header: labels.description, isRowHeader: true, cell: description },
        {
          id: 'amount',
          header: labels.amount,
          align: 'end',
          cell: (row) => (
            <span className={styles.amountStack}>
              {amount(row)}
              {status(row)}
            </span>
          ),
        },
      ];
    }
    return [
      { id: 'date', header: labels.date, cell: (row) => <time dateTime={row.date}>{fmt.date(row.date)}</time> },
      { id: 'description', header: labels.description, isRowHeader: true, cell: description },
      { id: 'category', header: labels.category, cell: (row) => row.category },
      { id: 'status', header: labels.status, cell: status },
      { id: 'amount', header: labels.amount, align: 'end', cell: amount },
    ];
  }, [compact, fmt, labels, statusLabels]);

  const rows = useMemo(() => table.rows.map((row, i) => ({ ...row, key: `${row.date}-${i}` })), [table.rows]);

  return (
    <Card className={styles.activity} ref={ref}>
      <CardHeader>
        <CardTitle level={headingLevel} id={`${uid}-activity`}>
          {table.title}
        </CardTitle>
        <CardAction>
          <Link href="#" onClick={stay} variant="standalone" className={styles.viewAll}>
            {table.action}
            <IconChevronRight aria-hidden className={styles.directional} />
          </Link>
        </CardAction>
      </CardHeader>
      <DataTable
        aria-labelledby={`${uid}-activity`}
        columns={columns}
        rows={rows}
        getRowId={(row) => row.key}
        stickyHeader={false}
        className={styles.table}
      />
    </Card>
  );
}

/* ------------------------------------------------------------------ *
 * Quick action form
 * ------------------------------------------------------------------ */

function QuickActionCard({
  content,
  headingLevel,
  symbol,
}: {
  content: DashboardOverviewContent;
  headingLevel: Level;
  symbol: string;
}): JSX.Element {
  const uid = useId();
  const { form } = content.overview;
  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    toast({ ...content.dashboard.formSubmitted, tone: 'success' });
  };
  return (
    <Card>
      <CardHeader>
        <CardTitle level={headingLevel} id={`${uid}-title`}>
          {form.title}
        </CardTitle>
        <CardDescription>{form.description}</CardDescription>
      </CardHeader>
      <form aria-labelledby={`${uid}-title`} onSubmit={onSubmit} className={styles.form}>
        <CardContent className={styles.formFields}>
          {form.fields.map((field) => (
            <FormField key={field.id} field={field} symbol={symbol} />
          ))}
        </CardContent>
        <CardFooter>
          <Button type="submit" className={styles.block}>
            {form.submit}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}

function FormField({ field, symbol }: { field: DashboardFormField; symbol: string }): JSX.Element {
  if (field.type === 'select') {
    return (
      <Select
        label={field.label}
        placeholder={field.placeholder}
        description={field.hint}
        defaultSelectedKey={field.value}
        name={field.id}
      >
        {(field.options ?? []).map((option) => (
          <SelectItem key={option} id={option}>
            {option}
          </SelectItem>
        ))}
      </Select>
    );
  }
  return (
    <TextField
      label={field.label}
      name={field.id}
      description={field.hint}
      placeholder={field.placeholder}
      defaultValue={field.value}
      inputMode={field.inputMode}
      autoComplete="off"
      prefix={field.currencyAffix ? symbol : undefined}
    />
  );
}

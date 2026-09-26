'use client';

/**
 * Settings — tabs for profile, notifications, security and billing, with a danger zone. Built only from Strata
 * components; every string, number and date comes from `content`, every visual value from --strata-* tokens.
 *
 * `headingLevel` (default 1) is the level of the page title; cards use the next level and groups inside cards
 * the one after. Above 1 the block is embedded in another page and renders no <main> landmark.
 */

import {
  AlertDialog,
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
  DataTable,
  DialogTrigger,
  FileUpload,
  Menu,
  MenuItem,
  MenuTrigger,
  Select,
  SelectItem,
  Separator,
  Switch,
  Tab,
  TabList,
  TabPanel,
  Tabs,
  TextField,
  ToastRegion,
  ToggleButton,
  ToggleButtonGroup,
  toast,
  type DataTableColumn,
} from '@strata/react';
import {
  IconCheck,
  IconCreditCard,
  IconDeviceDesktop,
  IconDeviceMobile,
  IconDeviceTablet,
  IconDots,
  IconLayoutList,
  IconLayoutRows,
  IconMoon,
  IconSun,
} from '@tabler/icons-react';
import {
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type HTMLAttributes,
  type JSX,
  type RefObject,
} from 'react';
import { settingsContent, type SettingsContent, type SettingsSession } from './settings.content';
import styles from './settings.module.css';

const cx = (...c: Array<string | false | null | undefined>) => c.filter(Boolean).join(' ');

type Level = 1 | 2 | 3 | 4 | 5 | 6;
const level = (n: number): Level => Math.min(6, Math.max(1, Math.round(n))) as Level;

function Heading({ level: l, ...rest }: { level: Level } & HTMLAttributes<HTMLHeadingElement>): JSX.Element {
  const Tag = `h${l}` as const;
  return <Tag {...rest} />;
}

/** Below this width (px) the sessions table folds location and time under the device name. */
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

const DEVICE_ICON = { desktop: IconDeviceDesktop, mobile: IconDeviceMobile, tablet: IconDeviceTablet };

export interface SettingsProps {
  /** All copy and data. Defaults to the English sample in ./settings.content.ts. */
  content?: SettingsContent;
  /** Level of the page title (default 1). Above 1 the block renders as embedded: no <main>, headings one level down. */
  headingLevel?: 1 | 2 | 3 | 4;
  className?: string;
}

export function Settings({ content = settingsContent, headingLevel = 1, className }: SettingsProps): JSX.Element {
  const uid = useId();
  const s = content.settings;
  const embedded = headingLevel > 1;
  const Main = embedded ? 'div' : 'main';
  const cardLevel = level(headingLevel + 1);
  const groupLevel = level(headingLevel + 2);

  const saved = (e?: FormEvent<HTMLFormElement>) => {
    e?.preventDefault();
    toast({ title: s.saved, tone: 'success' });
  };

  return (
    <div className={cx(styles.root, className)}>
      <Main className={styles.page} aria-labelledby={embedded ? undefined : `${uid}-title`}>
        <div className={styles.header}>
          <Heading level={level(headingLevel)} id={`${uid}-title`} className={styles.title}>
            {s.title}
          </Heading>
          <p className={styles.description}>{s.description}</p>
        </div>

        <Tabs className={styles.tabs}>
          <TabList aria-label={s.tabsLabel} className={styles.tabList}>
            <Tab id="profile">{s.tabs.profile}</Tab>
            <Tab id="notifications">{s.tabs.notifications}</Tab>
            <Tab id="security">{s.tabs.security}</Tab>
            <Tab id="billing">{s.tabs.billing}</Tab>
          </TabList>

          <TabPanel id="profile" className={styles.panel}>
            <ProfileCard content={content} level={cardLevel} onSave={saved} />
            <DisplayCard content={content} level={cardLevel} />
            <DangerCard content={content} level={cardLevel} />
          </TabPanel>

          <TabPanel id="notifications" className={styles.panel}>
            <NotificationsCard content={content} level={cardLevel} groupLevel={groupLevel} onSave={saved} />
          </TabPanel>

          <TabPanel id="security" className={styles.panel}>
            <SecurityCard content={content} level={cardLevel} />
            <SessionsCard content={content} level={cardLevel} />
          </TabPanel>

          <TabPanel id="billing" className={styles.panel}>
            <BillingCards content={content} level={cardLevel} />
          </TabPanel>
        </Tabs>
      </Main>
      <ToastRegion />
    </div>
  );
}

interface CardProps {
  content: SettingsContent;
  level: Level;
}

/* ------------------------------------------------------------------ *
 * Profile
 * ------------------------------------------------------------------ */

function ProfileCard({ content, level: l, onSave }: CardProps & { onSave: (e: FormEvent<HTMLFormElement>) => void }): JSX.Element {
  const uid = useId();
  const p = content.settings.profile;
  const [photo, setPhoto] = useState<string | undefined>();

  // Object URLs hold the file in memory until revoked.
  useEffect(() => () => (photo ? URL.revokeObjectURL(photo) : undefined), [photo]);

  return (
    <Card>
      <form onSubmit={onSave} aria-labelledby={`${uid}-title`} className={styles.form}>
        <CardHeader divider>
          <CardTitle level={l} id={`${uid}-title`}>
            {p.title}
          </CardTitle>
          <CardDescription>{p.description}</CardDescription>
        </CardHeader>
        <CardContent className={styles.stack}>
          <div className={styles.photoRow}>
            <Avatar name={content.user.name} src={photo} alt="" size="lg" className={styles.photo}>
              {content.user.initials}
            </Avatar>
            <FileUpload
              label={p.photo.label}
              dropLabel={p.photo.dropLabel}
              browseLabel={p.photo.browseLabel}
              hint={p.photo.hint}
              acceptedFileTypes={['image/png', 'image/jpeg']}
              maxSize={5 * 1024 * 1024}
              onChange={(files) => setPhoto(files[0] ? URL.createObjectURL(files[0]) : undefined)}
              className={styles.upload}
            />
          </div>
          <div className={styles.fieldGrid}>
            <TextField label={p.name.label} description={p.name.description} defaultValue={p.name.value} autoComplete="name" name="name" />
            <TextField
              label={p.email.label}
              description={p.email.description}
              defaultValue={p.email.value}
              type="email"
              autoComplete="email"
              name="email"
              className={styles.ltrValue}
            />
            <TextField
              label={p.phone.label}
              description={p.phone.description}
              defaultValue={p.phone.value}
              type="tel"
              autoComplete="tel"
              name="phone"
              className={styles.ltrValue}
            />
            <Select label={p.language.label} defaultSelectedKey={p.language.value} name="language">
              {p.language.options.map((o) => (
                <SelectItem key={o.id} id={o.id}>
                  {o.label}
                </SelectItem>
              ))}
            </Select>
            <Select label={p.region.label} defaultSelectedKey={p.region.value} name="timeZone">
              {p.region.options.map((o) => (
                <SelectItem key={o.id} id={o.id}>
                  {o.label}
                </SelectItem>
              ))}
            </Select>
          </div>
        </CardContent>
        <CardFooter divider className={styles.footerEnd}>
          <Button type="submit">{content.settings.save}</Button>
        </CardFooter>
      </form>
    </Card>
  );
}

function DisplayCard({ content, level: l }: CardProps): JSX.Element {
  const uid = useId();
  const d = content.settings.display;
  return (
    <Card>
      <CardHeader>
        <CardTitle level={l}>{d.title}</CardTitle>
        <CardDescription>{d.description}</CardDescription>
      </CardHeader>
      <CardContent className={styles.choices}>
        <div className={styles.choice}>
          <span id={`${uid}-theme`} className={styles.choiceLabel}>
            {d.theme.label}
          </span>
          <ToggleButtonGroup aria-labelledby={`${uid}-theme`} defaultSelectedKeys={['system']} disallowEmptySelection className={styles.toggles}>
            <ToggleButton id="system">
              <IconDeviceDesktop aria-hidden />
              {d.theme.options.system}
            </ToggleButton>
            <ToggleButton id="light">
              <IconSun aria-hidden />
              {d.theme.options.light}
            </ToggleButton>
            <ToggleButton id="dark">
              <IconMoon aria-hidden />
              {d.theme.options.dark}
            </ToggleButton>
          </ToggleButtonGroup>
        </div>
        <div className={styles.choice}>
          <span id={`${uid}-density`} className={styles.choiceLabel}>
            {d.density.label}
          </span>
          <ToggleButtonGroup aria-labelledby={`${uid}-density`} defaultSelectedKeys={['comfortable']} disallowEmptySelection className={styles.toggles}>
            <ToggleButton id="comfortable">
              <IconLayoutRows aria-hidden />
              {d.density.options.comfortable}
            </ToggleButton>
            <ToggleButton id="compact">
              <IconLayoutList aria-hidden />
              {d.density.options.compact}
            </ToggleButton>
          </ToggleButtonGroup>
        </div>
      </CardContent>
    </Card>
  );
}

function DangerCard({ content, level: l }: CardProps): JSX.Element {
  const d = content.settings.danger;
  return (
    <Card variant="outline" className={styles.danger}>
      <CardHeader className={styles.dangerHeader}>
        <CardTitle level={l}>{d.title}</CardTitle>
        <CardDescription>{d.description}</CardDescription>
        <CardAction className={styles.dangerAction}>
          <DialogTrigger>
            <Button variant="danger">{d.action}</Button>
            <AlertDialog
              tone="danger"
              title={d.dialog.title}
              actionLabel={d.dialog.action}
              cancelLabel={d.dialog.cancel}
              onAction={() => {
                toast({ title: d.done, tone: 'neutral' });
              }}
            >
              {d.dialog.body}
            </AlertDialog>
          </DialogTrigger>
        </CardAction>
      </CardHeader>
    </Card>
  );
}

/* ------------------------------------------------------------------ *
 * Notifications
 * ------------------------------------------------------------------ */

function NotificationsCard({
  content,
  level: l,
  groupLevel,
  onSave,
}: CardProps & { groupLevel: Level; onSave: (e: FormEvent<HTMLFormElement>) => void }): JSX.Element {
  const uid = useId();
  const n = content.settings.notifications;
  return (
    <Card>
      <form onSubmit={onSave} aria-labelledby={`${uid}-title`} className={styles.form}>
        <CardHeader divider>
          <CardTitle level={l} id={`${uid}-title`}>
            {n.title}
          </CardTitle>
          <CardDescription>{n.description}</CardDescription>
        </CardHeader>
        <CardContent className={styles.groups}>
          {n.groups.map((group, i) => (
            <section key={group.title} className={styles.group} aria-labelledby={`${uid}-g${i}`}>
              <Heading level={groupLevel} id={`${uid}-g${i}`} className={styles.groupTitle}>
                {group.title}
              </Heading>
              <div className={styles.switches}>
                {group.items.map((item) => (
                  <Switch
                    key={item.id}
                    name={item.id}
                    defaultSelected={item.on}
                    isDisabled={item.locked}
                    description={item.description}
                    className={styles.switch}
                  >
                    {item.label}
                  </Switch>
                ))}
              </div>
            </section>
          ))}
          <Separator />
          <div className={styles.choice}>
            <span id={`${uid}-channels`} className={styles.choiceLabel}>
              {n.channels.label}
            </span>
            <ToggleButtonGroup
              aria-labelledby={`${uid}-channels`}
              selectionMode="multiple"
              defaultSelectedKeys={n.channels.selected}
              className={styles.toggles}
            >
              {n.channels.options.map((o) => (
                <ToggleButton key={o.id} id={o.id}>
                  {o.label}
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
          </div>
        </CardContent>
        <CardFooter divider className={styles.footerEnd}>
          <Button type="submit">{content.settings.save}</Button>
        </CardFooter>
      </form>
    </Card>
  );
}

/* ------------------------------------------------------------------ *
 * Security
 * ------------------------------------------------------------------ */

function SecurityCard({ content, level: l }: CardProps): JSX.Element {
  const sec = content.settings.security;
  return (
    <Card>
      <CardHeader divider>
        <CardTitle level={l}>{sec.title}</CardTitle>
        <CardDescription>{sec.description}</CardDescription>
      </CardHeader>
      <CardContent className={styles.rows}>
        <Switch defaultSelected={sec.twoFactor.on} description={sec.twoFactor.description} className={styles.switch}>
          {sec.twoFactor.label}
        </Switch>
        <Separator />
        <div className={styles.row}>
          <div className={styles.rowText}>
            <p className={styles.rowLabel}>{sec.password.label}</p>
            <p className={styles.rowDescription}>{sec.password.description}</p>
          </div>
          <Button variant="outline">{sec.password.action}</Button>
        </div>
      </CardContent>
    </Card>
  );
}

function SessionsCard({ content, level: l }: CardProps): JSX.Element {
  const uid = useId();
  const ref = useRef<HTMLDivElement>(null);
  const compact = useWidthBelow(ref, COMPACT_TABLE_BELOW);
  const t = content.settings.security.sessions;
  const [rows, setRows] = useState(t.rows);
  const when = useMemo(
    () =>
      new Intl.DateTimeFormat(content.locale, {
        dateStyle: 'medium',
        timeStyle: 'short',
        timeZone: content.settings.profile.region.value,
      }),
    [content.locale, content.settings.profile.region.value],
  );
  const columns = useMemo<DataTableColumn<SettingsSession>[]>(() => {
    const lastActive = (row: SettingsSession) => when.format(new Date(row.lastActive));
    const device: DataTableColumn<SettingsSession> = {
      id: 'device',
      header: t.columns.device,
      isRowHeader: true,
      cell: (row) => {
        const Icon = DEVICE_ICON[row.kind];
        return (
          <span className={styles.device}>
            <span className={styles.deviceIcon} aria-hidden="true">
              <Icon />
            </span>
            <span className={styles.deviceText}>
              <span className={styles.deviceName}>
                {row.device}
                {row.current && (
                  <Badge tone="success" size="sm" dot>
                    {t.current}
                  </Badge>
                )}
              </span>
              {compact && (
                <span className={styles.deviceMeta}>
                  {row.location} · {lastActive(row)}
                </span>
              )}
            </span>
          </span>
        );
      },
    };
    const actions: DataTableColumn<SettingsSession> = {
      id: 'actions',
      header: <span className={styles.srOnly}>{t.columns.actions}</span>,
      textValue: t.columns.actions,
      align: 'end',
      cell: (row) => (
        <MenuTrigger>
          <Button variant="ghost" size="icon" aria-label={t.actionsLabel.replace('{device}', row.device)}>
            <IconDots aria-hidden />
          </Button>
          <Menu
            placement="bottom end"
            disabledKeys={row.current ? ['sign-out'] : []}
            onAction={() => {
              setRows((all) => all.filter((r) => r.id !== row.id));
              toast({ title: t.signedOut.replace('{device}', row.device), tone: 'success' });
            }}
          >
            <MenuItem id="sign-out" tone="danger">
              {t.signOut}
            </MenuItem>
          </Menu>
        </MenuTrigger>
      ),
    };
    if (compact) return [device, actions];
    return [
      device,
      { id: 'location', header: t.columns.location, cell: (row) => row.location },
      { id: 'lastActive', header: t.columns.lastActive, cell: (row) => <time dateTime={row.lastActive}>{lastActive(row)}</time> },
      actions,
    ];
  }, [compact, t, when]);

  return (
    <Card className={styles.tableCard} ref={ref}>
      <CardHeader>
        <CardTitle level={l} id={`${uid}-title`}>
          {t.title}
        </CardTitle>
        <CardDescription>{t.description}</CardDescription>
      </CardHeader>
      <DataTable
        aria-labelledby={`${uid}-title`}
        columns={columns}
        rows={rows}
        getRowId={(row) => row.id}
        stickyHeader={false}
        className={styles.table}
      />
    </Card>
  );
}

/* ------------------------------------------------------------------ *
 * Billing
 * ------------------------------------------------------------------ */

function BillingCards({ content, level: l }: CardProps): JSX.Element {
  const b = content.settings.billing;
  const price = useMemo(() => {
    const whole = Number.isInteger(b.plan.price);
    return new Intl.NumberFormat(content.locale, {
      style: 'currency',
      currency: content.currency,
      ...(whole ? { minimumFractionDigits: 0, maximumFractionDigits: 0 } : {}),
    }).format(b.plan.price);
  }, [b.plan.price, content.currency, content.locale]);

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle level={l}>{b.plan.name}</CardTitle>
          <CardDescription>{b.description}</CardDescription>
          <CardAction>
            <Badge tone="brand">{b.plan.badge}</Badge>
          </CardAction>
        </CardHeader>
        <CardContent className={styles.plan}>
          <p className={styles.price}>
            <span className={styles.priceValue}>{price}</span> <span className={styles.pricePeriod}>{b.plan.period}</span>
          </p>
          <ul className={styles.features}>
            {b.plan.features.map((f) => (
              <li key={f}>
                <IconCheck aria-hidden className={styles.featureIcon} />
                {f}
              </li>
            ))}
          </ul>
        </CardContent>
        <CardFooter divider className={styles.footerEnd}>
          <Button variant="outline">{b.plan.change}</Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle level={l}>{b.method.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className={styles.row}>
            <div className={styles.method}>
              <span className={styles.methodIcon} aria-hidden="true">
                <IconCreditCard />
              </span>
              <div className={styles.rowText}>
                <p className={styles.rowLabel}>{b.method.label}</p>
                <p className={styles.rowDescription}>{b.method.detail}</p>
              </div>
            </div>
            <Button variant="outline">{b.method.update}</Button>
          </div>
        </CardContent>
      </Card>
    </>
  );
}

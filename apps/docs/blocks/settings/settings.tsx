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
  Amount,
  Avatar,
  Badge,
  Button,
  Card,
  CardContent,
  CardFooter,
  DataTable,
  DialogTrigger,
  Eyebrow,
  Menu,
  MenuItem,
  MenuTrigger,
  Select,
  SelectItem,
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
  IconUpload,
} from '@strata/icons';
import { DropZone, FileTrigger, type FileDropItem } from 'react-aria-components';
import {
  Fragment,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type HTMLAttributes,
  type JSX,
  type ReactNode,
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
  const sectionLevel = level(headingLevel + 1);
  const groupLevel = level(headingLevel + 2);
  // The photo lives here so the identity in the page header changes with the upload, not just the form.
  const [photo, setPhoto] = useState<string | undefined>();
  // Object URLs hold the file in memory until revoked.
  useEffect(() => () => (photo ? URL.revokeObjectURL(photo) : undefined), [photo]);

  const saved = (e?: FormEvent<HTMLFormElement>) => {
    e?.preventDefault();
    toast({ title: s.saved, tone: 'success' });
  };

  const props = { content, level: sectionLevel };

  return (
    <div className={cx(styles.root, className)}>
      <Main className={styles.page} aria-labelledby={embedded ? undefined : `${uid}-title`}>
        <div className={styles.header}>
          <div className={styles.titleBlock}>
            <Heading level={level(headingLevel)} id={`${uid}-title`} className={styles.title}>
              {emphasis(s.title)}
            </Heading>
            <p className={styles.description}>{s.description}</p>
          </div>
          {/* Whose settings these are: the person (tinted from their name, same as everywhere else) and their plan. */}
          <div className={styles.identity}>
            <Avatar name={content.user.name} src={photo} alt="" tint="auto" size="lg" className={styles.identityFace}>
              {content.user.initials}
            </Avatar>
            <span className={styles.identityText}>
              <span className={styles.identityName}>{content.user.name}</span>
              <Eyebrow as="span" tone="brand" lead="rule">
                {s.billing.plan.name}
              </Eyebrow>
            </span>
          </div>
        </div>

        <Tabs className={styles.tabs}>
          <TabList aria-label={s.tabsLabel} className={styles.tabList}>
            <Tab id="profile">{s.tabs.profile}</Tab>
            <Tab id="notifications">{s.tabs.notifications}</Tab>
            <Tab id="security">{s.tabs.security}</Tab>
            <Tab id="billing">{s.tabs.billing}</Tab>
          </TabList>

          <TabPanel id="profile" className={styles.panel}>
            <ProfileSection {...props} photo={photo} onPhoto={setPhoto} onSave={saved} />
            <DisplaySection {...props} />
            <DangerSection {...props} />
          </TabPanel>

          <TabPanel id="notifications" className={styles.panel}>
            <NotificationsSection {...props} groupLevel={groupLevel} onSave={saved} />
          </TabPanel>

          <TabPanel id="security" className={styles.panel}>
            <SecuritySection {...props} />
            <SessionsSection {...props} />
          </TabPanel>

          <TabPanel id="billing" className={styles.panel}>
            <BillingSections {...props} />
          </TabPanel>
        </Tabs>
      </Main>
      <ToastRegion />
    </div>
  );
}

/** `*word*` → <em>word</em>: editorial emphasis written in the copy (the heading face's italic), not in the component. */
function emphasis(text: string): ReactNode {
  const parts = text.split('*');
  if (parts.length < 3) return text;
  return parts.map((part, i) => (i % 2 === 1 ? <em key={i}>{part}</em> : <Fragment key={i}>{part}</Fragment>));
}

interface SectionProps {
  content: SettingsContent;
  level: Level;
}

/**
 * One settings section: its name and purpose in a quiet column at the start, the controls in a card beside it.
 * The heading labels the section (and the form inside it), so the card itself carries no second title.
 */
function Section({
  title,
  description,
  level: l,
  headingId,
  children,
  className,
}: {
  title: ReactNode;
  description?: ReactNode;
  level: Level;
  headingId: string;
  children: ReactNode;
  className?: string;
}): JSX.Element {
  return (
    <section className={cx(styles.section, className)} aria-labelledby={headingId}>
      <div className={styles.aside}>
        <Heading level={l} id={headingId} className={styles.sectionTitle}>
          {title}
        </Heading>
        {description && <p className={styles.sectionDescription}>{description}</p>}
      </div>
      <div className={styles.sectionBody}>{children}</div>
    </section>
  );
}

/* ------------------------------------------------------------------ *
 * Profile
 * ------------------------------------------------------------------ */

const PHOTO_TYPES = ['image/png', 'image/jpeg'];
const PHOTO_MAX = 5 * 1024 * 1024;

/** "upload one" → "Upload one" as a button label; scripts without case are unchanged. */
const sentence = (text: string, locale: string) => text.charAt(0).toLocaleUpperCase(locale) + text.slice(1);

function ProfileSection({
  content,
  level: l,
  photo,
  onPhoto,
  onSave,
}: SectionProps & {
  photo: string | undefined;
  onPhoto: (url: string | undefined) => void;
  onSave: (e: FormEvent<HTMLFormElement>) => void;
}): JSX.Element {
  const uid = useId();
  const p = content.settings.profile;
  const accept = (file: File | undefined) => {
    if (!file || !PHOTO_TYPES.includes(file.type) || file.size > PHOTO_MAX) return;
    onPhoto(URL.createObjectURL(file));
  };

  return (
    <Section title={p.title} description={p.description} level={l} headingId={`${uid}-title`}>
      <Card>
        <form onSubmit={onSave} aria-labelledby={`${uid}-title`} className={styles.form}>
          <CardContent className={styles.stack}>
            {/* The photo row is also a drop target; the button is the keyboard and pointer path. */}
            <DropZone
              aria-label={p.photo.label}
              getDropOperation={(types) => (PHOTO_TYPES.some((t) => types.has(t)) ? 'copy' : 'cancel')}
              onDrop={async (e) => {
                const item = e.items.find((i): i is FileDropItem => i.kind === 'file');
                accept(item ? await item.getFile() : undefined);
              }}
              className={styles.photoRow}
            >
              <Avatar name={content.user.name} src={photo} alt="" tint="auto" size="lg" className={styles.photo}>
                {content.user.initials}
              </Avatar>
              <div className={styles.photoText}>
                <p className={styles.rowLabel} id={`${uid}-photo`}>
                  {p.photo.label}
                </p>
                <p className={styles.rowDescription} id={`${uid}-photo-hint`}>
                  {p.photo.hint}
                </p>
              </div>
              <FileTrigger acceptedFileTypes={PHOTO_TYPES} onSelect={(files) => accept(files?.[0])}>
                <Button variant="outline" size="sm" aria-describedby={`${uid}-photo ${uid}-photo-hint`} className={styles.photoButton}>
                  <IconUpload aria-hidden />
                  {sentence(p.photo.browseLabel, content.locale)}
                </Button>
              </FileTrigger>
            </DropZone>
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
            {/* The tab's one hero action. */}
            <Button type="submit">{content.settings.save}</Button>
          </CardFooter>
        </form>
      </Card>
    </Section>
  );
}

function DisplaySection({ content, level: l }: SectionProps): JSX.Element {
  const uid = useId();
  const d = content.settings.display;
  return (
    <Section title={d.title} description={d.description} level={l} headingId={`${uid}-title`}>
      <Card>
        <CardContent className={styles.lines}>
          <div className={styles.line}>
            <span id={`${uid}-theme`} className={styles.rowLabel}>
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
          <div className={styles.line}>
            <span id={`${uid}-density`} className={styles.rowLabel}>
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
    </Section>
  );
}

/**
 * Closing the account is calm until it's chosen: a plain row and an outline button with tone="danger".
 * The alert dialog that follows is where the red fill belongs.
 */
function DangerSection({ content, level: l }: SectionProps): JSX.Element {
  const uid = useId();
  const d = content.settings.danger;
  return (
    <Section title={d.title} level={l} headingId={`${uid}-title`}>
      <Card>
        <CardContent>
          <div className={styles.row}>
            <p className={cx(styles.rowDescription, styles.dangerText)}>{d.description}</p>
            <DialogTrigger>
              <Button variant="outline" tone="danger">
                {d.action}
              </Button>
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
          </div>
        </CardContent>
      </Card>
    </Section>
  );
}

/* ------------------------------------------------------------------ *
 * Notifications
 * ------------------------------------------------------------------ */

function NotificationsSection({
  content,
  level: l,
  groupLevel,
  onSave,
}: SectionProps & { groupLevel: Level; onSave: (e: FormEvent<HTMLFormElement>) => void }): JSX.Element {
  const uid = useId();
  const n = content.settings.notifications;
  return (
    <Section title={n.title} description={n.description} level={l} headingId={`${uid}-title`}>
      <Card>
        <form onSubmit={onSave} aria-labelledby={`${uid}-title`} className={styles.form}>
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
            <div className={cx(styles.line, styles.channels)}>
              <span id={`${uid}-channels`} className={styles.rowLabel}>
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
    </Section>
  );
}

/* ------------------------------------------------------------------ *
 * Security
 * ------------------------------------------------------------------ */

function SecuritySection({ content, level: l }: SectionProps): JSX.Element {
  const uid = useId();
  const sec = content.settings.security;
  return (
    <Section title={sec.title} description={sec.description} level={l} headingId={`${uid}-title`}>
      <Card>
        <CardContent className={styles.lines}>
          <Switch defaultSelected={sec.twoFactor.on} description={sec.twoFactor.description} className={styles.switch}>
            {sec.twoFactor.label}
          </Switch>
          <div className={styles.row}>
            <div className={styles.rowText}>
              <p className={styles.rowLabel}>{sec.password.label}</p>
              <p className={styles.rowDescription}>{sec.password.description}</p>
            </div>
            <Button variant="outline">{sec.password.action}</Button>
          </div>
        </CardContent>
      </Card>
    </Section>
  );
}

function SessionsSection({ content, level: l }: SectionProps): JSX.Element {
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
            <span className={cx(styles.deviceIcon, row.current && styles.deviceIconCurrent)} aria-hidden="true">
              <Icon />
            </span>
            <span className={styles.deviceText}>
              <span className={styles.deviceName}>{row.device}</span>
              {compact ? (
                <span className={styles.deviceMeta}>
                  {row.location} · {lastActive(row)}
                </span>
              ) : null}
              {row.current && (
                <Badge tone="success" variant="status" size="sm" className={styles.current}>
                  {t.current}
                </Badge>
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
      { id: 'location', header: t.columns.location, cell: (row) => <span className={styles.quiet}>{row.location}</span> },
      {
        id: 'lastActive',
        header: t.columns.lastActive,
        cell: (row) => (
          <time dateTime={row.lastActive} className={cx(styles.quiet, styles.num)}>
            {lastActive(row)}
          </time>
        ),
      },
      actions,
    ];
  }, [compact, t, when]);

  return (
    <Section title={t.title} description={t.description} level={l} headingId={`${uid}-title`}>
      <Card ref={ref}>
        <CardContent variant="inset">
          <DataTable
            aria-labelledby={`${uid}-title`}
            columns={columns}
            rows={rows}
            getRowId={(row) => row.id}
            stickyHeader={false}
          />
        </CardContent>
      </Card>
    </Section>
  );
}

/* ------------------------------------------------------------------ *
 * Billing
 * ------------------------------------------------------------------ */

function BillingSections({ content, level: l }: SectionProps): JSX.Element {
  const uid = useId();
  const b = content.settings.billing;
  return (
    <Section title={b.title} description={b.description} level={l} headingId={`${uid}-title`}>
      <Card>
        <CardContent className={styles.plan}>
          <div className={styles.planHead}>
            <Eyebrow tone="brand" lead="rule">
              {b.plan.badge}
            </Eyebrow>
            <Heading level={level(l + 1)} className={styles.planName}>
              {emphasis(b.plan.name)}
            </Heading>
            <p className={styles.price}>
              <Amount value={b.plan.price} currency={content.currency} locale={content.locale} size="md" />
              <span className={styles.pricePeriod}>{b.plan.period}</span>
            </p>
          </div>
          <Button variant="outline" className={styles.planAction}>
            {b.plan.change}
          </Button>
        </CardContent>
        {/* What the plan includes sits in the card's inset panel: a list to read, not more card chrome. */}
        <CardContent variant="inset">
          <ul className={styles.features}>
            {b.plan.features.map((f) => (
              <li key={f}>
                <IconCheck aria-hidden className={styles.featureIcon} />
                {f}
              </li>
            ))}
          </ul>
        </CardContent>
        <CardFooter className={styles.method}>
          <span className={styles.methodIcon} aria-hidden="true">
            <IconCreditCard />
          </span>
          <div className={styles.rowText}>
            <Eyebrow as="span">{b.method.title}</Eyebrow>
            <p className={styles.rowLabel}>{b.method.label}</p>
            <p className={styles.rowDescription}>{b.method.detail}</p>
          </div>
          <Button variant="ghost" className={styles.methodAction}>
            {b.method.update}
          </Button>
        </CardFooter>
      </Card>
    </Section>
  );
}

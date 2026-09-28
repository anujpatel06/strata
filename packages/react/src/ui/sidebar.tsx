'use client';

import {
  Children,
  Fragment,
  createContext,
  isValidElement,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
  type HTMLAttributes,
  type JSX,
  type ReactElement,
  type ReactNode,
  type Ref,
} from 'react';
import {
  Button as RACButton,
  Dialog as RACDialog,
  DialogTrigger,
  Disclosure,
  DisclosurePanel,
  Link as RACLink,
  MenuTrigger,
  composeRenderProps,
  useLocale,
  type ButtonProps as RACButtonProps,
  type LinkProps as RACLinkProps,
  type PressEvent,
} from 'react-aria-components';
import { IconChevronDown, IconDotsVertical, IconLayoutSidebar, IconSearch, IconSquareSmall } from '@syntara/icons';
import { Avatar } from './avatar';
import { Badge } from './badge';
import { Kbd } from './kbd';
import { Popover } from './popover';
import { SearchField, type SearchFieldProps } from './search-field';
import { Tooltip, TooltipTrigger } from './tooltip';
import styles from './sidebar.module.css';

const cx = (...c: Array<string | false | null | undefined>) => c.filter(Boolean).join(' ');

// The collapse toggle's glyph and the nested-item bullet live in @syntara/icons with every other icon.
const IconSidebarPanel = IconLayoutSidebar;
const IconBullet = IconSquareSmall;

interface SidebarContextValue {
  /** Icon-only mode. */
  collapsed: boolean;
  /** Changes the mode (and reports it through onCollapsedChange). */
  setCollapsed: (next: boolean) => void;
  /** The collapse toggle, rendered by SidebarUser (or by Sidebar at the bottom when there is no SidebarUser). */
  toggle: ReactNode;
  /** Nested inside a group (expanded) or a collapsed group's flyout: items render the bullet and the guide marker. */
  nested: 'panel' | 'flyout' | null;
  /** Closes the collapsed group's flyout when an item in it is pressed. */
  closeFlyout?: () => void;
}

const SidebarContext = createContext<SidebarContextValue>({
  collapsed: false,
  setCollapsed: () => {},
  toggle: null,
  nested: null,
});

/** Reads the nearest Sidebar's state, e.g. to render a smaller footer when it's collapsed. */
export function useSidebar(): { collapsed: boolean; setCollapsed: (collapsed: boolean) => void } {
  const { collapsed, setCollapsed } = useContext(SidebarContext);
  return { collapsed, setCollapsed };
}

export interface SidebarProps extends Omit<HTMLAttributes<HTMLDivElement>, 'aria-label'> {
  /** Names the navigation landmark, e.g. "Main". Required: a page can have several navs. */
  'aria-label': string;
  /**
   * `flush` = full-height app chrome with a hairline at the inline end. `floating` = an inset panel: a recessed
   * canvas-toned face, container radius, hairline edge and generous padding (the dashboard look).
   */
  variant?: 'flush' | 'floating';
  /** Icon-only mode (controlled). Labels move into tooltips; accessible names stay. */
  collapsed?: boolean;
  /** Initial icon-only mode (uncontrolled). */
  defaultCollapsed?: boolean;
  /** Called by the collapse toggle. Passing it (or `defaultCollapsed`) shows the toggle. */
  onCollapsedChange?: (collapsed: boolean) => void;
  /** Shows the collapse toggle. Defaults to true when `onCollapsedChange` or `defaultCollapsed` is set. */
  collapsible?: boolean;
  /** Toggle label while expanded. */
  collapseLabel?: string;
  /** Toggle label while collapsed. */
  expandLabel?: string;
  ref?: Ref<HTMLDivElement>;
}

/** Children with Fragments opened up, so `<>{header}{sections}</>` partitions like direct children. */
function flatten(children: ReactNode): ReactNode[] {
  return Children.toArray(children).flatMap((child) =>
    isValidElement<{ children?: ReactNode }>(child) && child.type === Fragment ? flatten(child.props.children) : [child],
  );
}

const isType = (node: ReactNode, type: unknown): node is ReactElement<Record<string, unknown>> =>
  isValidElement(node) && node.type === type;

/**
 * App navigation: a brand block, an optional search, labelled sections of links (with nested groups), and a footer
 * with secondary links and the signed-in user. The sections sit in a `<nav>` landmark named by `aria-label`; the
 * header, search and footer sit outside it. Collapses to an icon rail.
 * Keyboard: Tab / Shift+Tab move through the items like any list of links (no roving focus; see the meta notes).
 */
export function Sidebar({
  variant = 'flush',
  collapsed: collapsedProp,
  defaultCollapsed,
  onCollapsedChange,
  collapsible,
  collapseLabel = 'Collapse sidebar',
  expandLabel = 'Expand sidebar',
  className,
  children,
  'aria-label': ariaLabel,
  ...rest
}: SidebarProps): JSX.Element {
  const [uncontrolled, setUncontrolled] = useState(defaultCollapsed ?? false);
  const collapsed = collapsedProp ?? uncontrolled;
  const navId = useId();
  const showToggle = collapsible ?? (onCollapsedChange !== undefined || defaultCollapsed !== undefined);

  const setCollapsed = (next: boolean) => {
    if (collapsedProp === undefined) setUncontrolled(next);
    onCollapsedChange?.(next);
  };

  const label = collapsed ? expandLabel : collapseLabel;
  const toggle = showToggle ? (
    <TooltipTrigger delay={300}>
      <RACButton
        aria-label={label}
        aria-controls={navId}
        className={cx(styles.iconButton, styles.toggle)}
        onPress={() => setCollapsed(!collapsed)}
      >
        <IconSidebarPanel aria-hidden="true" />
      </RACButton>
      <Tooltip placement="end">{label}</Tooltip>
    </TooltipTrigger>
  ) : null;

  // Header, search and footer go outside the nav landmark; everything else (the sections) goes inside it.
  let header: ReactNode = null;
  let search: ReactNode = null;
  let footer: ReactElement<Record<string, unknown>> | null = null;
  const sections: ReactNode[] = [];
  flatten(children).forEach((child) => {
    if (isType(child, SidebarHeader)) header = child;
    else if (isType(child, SidebarSearch)) search = child;
    else if (isType(child, SidebarFooter)) footer = child;
    else sections.push(child);
  });
  // The toggle lives next to the user card. Without one, it gets its own row at the bottom.
  const footerChildren = footer ? flatten((footer as ReactElement<{ children?: ReactNode }>).props.children) : [];
  const userHoldsToggle = footerChildren.some((c) => isType(c, SidebarUser));

  return (
    <SidebarContext.Provider value={{ collapsed, setCollapsed, toggle: userHoldsToggle ? toggle : null, nested: null }}>
      <div
        {...rest}
        data-variant={variant}
        data-collapsed={collapsed || undefined}
        className={cx(styles.sidebar, className)}
      >
        {header}
        {search}
        <nav id={navId} aria-label={ariaLabel} className={styles.nav}>
          {sections}
        </nav>
        {footer}
        {toggle && !userHoldsToggle && <div className={styles.toggleRow}>{toggle}</div>}
      </div>
    </SidebarContext.Provider>
  );
}

export interface SidebarHeaderProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  /** A logo or brand mark, e.g. an IconTile. Stays visible when collapsed. */
  logo?: ReactNode;
  /** Product name. */
  title?: ReactNode;
  /** A small line under the title, e.g. the workspace or plan. */
  subtitle?: ReactNode;
  ref?: Ref<HTMLDivElement>;
}

/** The brand block at the top, with a hairline under it. Extra `children` go under the brand row. */
export function SidebarHeader({ logo, title, subtitle, className, children, ...rest }: SidebarHeaderProps): JSX.Element {
  return (
    <div {...rest} className={cx(styles.header, className)}>
      <div className={styles.brand}>
        {logo != null && <span className={styles.logo}>{logo}</span>}
        {(title != null || subtitle != null) && (
          <span className={styles.brandText}>
            {title != null && <span className={styles.title}>{title}</span>}
            {subtitle != null && <span className={styles.subtitle}>{subtitle}</span>}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}

export interface SidebarSearchProps
  extends Omit<SearchFieldProps, 'label' | 'aria-label' | 'aria-labelledby' | 'size' | 'className'> {
  /** Accessible name of the field (and of the icon button when collapsed). */
  'aria-label'?: string;
  /** Placeholder text. */
  placeholder?: string;
  /** A shortcut hint at the end of the field, e.g. "⌘K". Display only: bind the keys yourself. */
  shortcut?: string;
  /**
   * Launcher mode: the field becomes a button that calls this, e.g. to open a CommandDialog. Without it the field is a
   * real search input, and the collapsed icon button expands the sidebar and focuses it.
   */
  onPress?: (e: PressEvent) => void;
  className?: string;
}

/**
 * A search slot under the header: a filled search field with an optional shortcut hint. Collapsed, it's a square icon
 * button. Pass `onPress` to make it a launcher for a command palette instead of a text input.
 */
export function SidebarSearch({
  'aria-label': ariaLabel = 'Search',
  placeholder = 'Search…',
  shortcut,
  onPress,
  className,
  ...fieldProps
}: SidebarSearchProps): JSX.Element {
  const { collapsed, setCollapsed } = useContext(SidebarContext);
  const inputRef = useRef<HTMLInputElement>(null);
  const [focusOnExpand, setFocusOnExpand] = useState(false);

  // The collapsed button expands the panel first; focus the field once it's back in the DOM.
  useEffect(() => {
    if (!collapsed && focusOnExpand) {
      inputRef.current?.focus();
      setFocusOnExpand(false);
    }
  }, [collapsed, focusOnExpand]);

  const hint = shortcut ? (
    <Kbd aria-hidden="true" dir="ltr" className={styles.searchKbd}>
      {shortcut}
    </Kbd>
  ) : null;

  let body: ReactNode;
  if (collapsed) {
    body = (
      <TooltipTrigger delay={0} closeDelay={0}>
        <RACButton
          aria-label={ariaLabel}
          className={styles.searchTile}
          onPress={(e) => {
            if (onPress) return onPress(e);
            setFocusOnExpand(true);
            setCollapsed(false);
          }}
        >
          <IconSearch aria-hidden="true" />
        </RACButton>
        <Tooltip placement="end">
          {ariaLabel}
          {shortcut && <span className={styles.tooltipCount}>{shortcut}</span>}
        </Tooltip>
      </TooltipTrigger>
    );
  } else if (onPress) {
    body = (
      <RACButton aria-label={ariaLabel} className={styles.searchLauncher} onPress={onPress}>
        <IconSearch aria-hidden="true" className={styles.searchIcon} />
        <span className={styles.searchPlaceholder}>{placeholder}</span>
        {hint}
      </RACButton>
    );
  } else {
    body = (
      <>
        <SearchField {...fieldProps} aria-label={ariaLabel} placeholder={placeholder} inputRef={inputRef} />
        {hint}
      </>
    );
  }

  return <div className={cx(styles.search, className)}>{body}</div>;
}

export interface SidebarSectionProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  /** Quiet label above the items, e.g. "General". Names the list for screen readers. Hidden when collapsed. */
  title?: ReactNode;
  ref?: Ref<HTMLDivElement>;
}

/** A labelled group of SidebarItems, rendered as a list. */
export function SidebarSection({ title, className, children, ...rest }: SidebarSectionProps): JSX.Element {
  const titleId = useId();
  return (
    <div {...rest} className={cx(styles.section, className)}>
      {title != null && (
        <div id={titleId} className={styles.sectionTitle}>
          {title}
        </div>
      )}
      {/* role="list" restores list semantics that Safari drops for list-style: none. */}
      <ul role="list" aria-labelledby={title != null ? titleId : undefined} className={styles.list}>
        {children}
      </ul>
    </div>
  );
}

interface SidebarItemOwnProps {
  /**
   * Label. Also the tooltip and accessible name when collapsed. Nested `SidebarItem` children turn the item into an
   * expandable group; the rest of the children (or `label`) is the group's label.
   */
  children: ReactNode;
  /** The group's label when the children are nested items. Optional: plain children before the items work too. */
  label?: ReactNode;
  /** Leading icon from @syntara/icons. Needed for the collapsed mode. Nested items default to a small square bullet. */
  icon?: ReactNode;
  /** Marks the current page: `aria-current="page"` and the raised pill (plus the brand marker when nested). */
  isCurrent?: boolean;
  /** A trailing count, e.g. 3 unread. Formatted for the locale; part of the accessible name. A dot when collapsed. */
  count?: number;
  /** A trailing badge, e.g. "New" or "Beta". A string becomes a soft neutral Badge; pass a Badge for anything else. */
  badge?: ReactNode;
  /** Group only: expanded (controlled). */
  isExpanded?: boolean;
  /** Group only: initially expanded. Defaults to true when a nested item is current. */
  defaultExpanded?: boolean;
  /** Group only: called when the group opens or closes. */
  onExpandedChange?: (isExpanded: boolean) => void;
  className?: string;
}

export type SidebarItemProps = SidebarItemOwnProps &
  (
    | ({ href: string } & Omit<RACLinkProps, 'children' | 'className' | 'style' | 'href'>)
    | ({ href?: undefined } & Omit<RACButtonProps, 'children' | 'className' | 'style'>)
  );

/**
 * One destination. With `href` it's a link (React Aria Link, so client routers work through RouterProvider); without,
 * it's a button (`onPress`), e.g. "Invite people". With nested SidebarItem children it's an expandable group: a
 * disclosure (React Aria Disclosure) when expanded, and a button that opens the children in a popover when collapsed.
 */
export function SidebarItem(props: SidebarItemProps): JSX.Element {
  const {
    children,
    label,
    icon,
    isCurrent,
    count,
    badge,
    isExpanded: isExpandedProp,
    defaultExpanded,
    onExpandedChange,
    className,
    ...rest
  } = props;
  const ctx = useContext(SidebarContext);
  const { collapsed, nested, closeFlyout } = ctx;
  const { locale } = useLocale();
  const countText = count !== undefined ? new Intl.NumberFormat(locale).format(count) : undefined;
  const hasMarker = countText !== undefined || (badge != null && badge !== false);

  // Split nested items (a group) from the label.
  const items: ReactElement<SidebarItemProps>[] = [];
  const labelParts: ReactNode[] = [];
  flatten(children).forEach((child) => {
    if (isType(child, SidebarItem)) items.push(child as unknown as ReactElement<SidebarItemProps>);
    else labelParts.push(child);
  });
  const isGroup = items.length > 0;
  const text = label ?? (isGroup ? labelParts : children);
  const containsCurrent = items.some((c) => c.props.isCurrent);

  const [expandedState, setExpandedState] = useState(defaultExpanded ?? containsCurrent);
  const expanded = isExpandedProp ?? expandedState;
  const setExpanded = (next: boolean) => {
    if (isExpandedProp === undefined) setExpandedState(next);
    onExpandedChange?.(next);
  };
  const [flyoutOpen, setFlyoutOpen] = useState(false);
  const flyoutTitleId = useId();

  // Nested items get the square bullet when they have no icon of their own.
  const leading = icon ?? (nested ? <IconBullet /> : null);
  const content = (
    <>
      {leading != null && (
        <span className={styles.icon} aria-hidden="true">
          {leading}
          {hasMarker && <span className={styles.marker} />}
        </span>
      )}
      <span className={styles.label}>{text}</span>
      {countText !== undefined && (
        <Badge size="sm" tone="neutral" className={styles.count}>
          {countText}
        </Badge>
      )}
      {badge != null &&
        badge !== false &&
        (typeof badge === 'string' || typeof badge === 'number' ? (
          <Badge size="sm" tone="neutral" className={styles.badge}>
            {badge}
          </Badge>
        ) : (
          <span className={styles.badge}>{badge}</span>
        ))}
      {isGroup && !collapsed && <IconChevronDown aria-hidden="true" className={styles.chevron} />}
    </>
  );

  const itemClass = composeRenderProps(className, (c) => cx(styles.item, c));
  const showTooltip = collapsed && !nested;
  const tooltip = (
    <Tooltip placement="end" className={styles.tooltip}>
      {text}
      {countText !== undefined && <span className={styles.tooltipCount}>{countText}</span>}
    </Tooltip>
  );

  if (isGroup) {
    const nestedItems = (where: 'panel' | 'flyout') => (
      <SidebarContext.Provider
        value={{ ...ctx, collapsed: false, nested: where, closeFlyout: where === 'flyout' ? () => setFlyoutOpen(false) : undefined }}
      >
        <ul role="list" className={styles.subList}>
          {items}
        </ul>
      </SidebarContext.Provider>
    );

    // A group's parent is always a button: drop a stray href.
    const { href: _href, ...buttonProps } = rest as RACButtonProps & { href?: string };
    if (collapsed && !nested) {
      // Icon rail: the parent icon opens the children in a popover dialog (links stay links; Escape closes and focus
      // returns here). The tile shows the raised pill when the current page is inside.
      return (
        <li className={styles.listItem}>
          <TooltipTrigger delay={0} closeDelay={0} isDisabled={flyoutOpen}>
            <DialogTrigger isOpen={flyoutOpen} onOpenChange={setFlyoutOpen}>
              <RACButton
                {...buttonProps}
                data-current-ancestor={containsCurrent || undefined}
                className={itemClass}
              >
                {content}
              </RACButton>
              <Popover placement="end top" className={styles.flyout}>
                <RACDialog aria-labelledby={flyoutTitleId} className={styles.flyoutDialog}>
                  <div id={flyoutTitleId} className={styles.flyoutTitle}>
                    {text}
                  </div>
                  {nestedItems('flyout')}
                </RACDialog>
              </Popover>
            </DialogTrigger>
            {tooltip}
          </TooltipTrigger>
        </li>
      );
    }

    return (
      <li className={styles.listItem}>
        <Disclosure isExpanded={expanded} onExpandedChange={setExpanded} className={styles.group}>
          <RACButton
            {...buttonProps}
            slot="trigger"
            data-current-ancestor={containsCurrent || undefined}
            className={itemClass}
          >
            {content}
          </RACButton>
          {/* One-row grid: 0fr → 1fr animates the height; the clip lets the row shrink to 0. */}
          <DisclosurePanel className={styles.panel}>
            <div className={styles.clip}>{nestedItems('panel')}</div>
          </DisclosurePanel>
        </Disclosure>
      </li>
    );
  }

  const current = isCurrent ? ('page' as const) : undefined;
  const onPress = (e: PressEvent) => {
    (rest as { onPress?: (e: PressEvent) => void }).onPress?.(e);
    closeFlyout?.();
  };

  return (
    <li className={styles.listItem} data-current={isCurrent || undefined}>
      <TooltipTrigger isDisabled={!showTooltip} delay={0} closeDelay={0}>
        {rest.href !== undefined ? (
          <RACLink {...(rest as RACLinkProps)} onPress={onPress} aria-current={current} className={itemClass}>
            {content}
          </RACLink>
        ) : (
          <RACButton
            {...(rest as RACButtonProps)}
            onPress={onPress}
            aria-current={current}
            data-current={isCurrent || undefined}
            className={itemClass}
          >
            {content}
          </RACButton>
        )}
        {tooltip}
      </TooltipTrigger>
    </li>
  );
}

export interface SidebarFooterProps extends HTMLAttributes<HTMLDivElement> {
  ref?: Ref<HTMLDivElement>;
}

/**
 * Pinned to the bottom behind a hairline: secondary items (SidebarItem children are gathered into a list), then a
 * SidebarUser, which also holds the collapse toggle. Outside the nav landmark. `useSidebar()` tells custom content
 * whether the sidebar is collapsed.
 */
export function SidebarFooter({ className, children, ...rest }: SidebarFooterProps): JSX.Element {
  const out: ReactNode[] = [];
  let run: ReactNode[] = [];
  const flush = () => {
    if (run.length === 0) return;
    out.push(
      <ul role="list" key={`list-${out.length}`} className={styles.list}>
        {run}
      </ul>,
    );
    run = [];
  };
  for (const child of flatten(children)) {
    if (isType(child, SidebarItem)) run.push(child);
    else {
      flush();
      out.push(child);
    }
  }
  flush();
  return (
    <div {...rest} className={cx(styles.footer, className)}>
      {out}
    </div>
  );
}

export interface SidebarUserProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  /** The person's name. Shown in medium weight; the avatar's initials and tooltip come from it. */
  name: string;
  /** A second line in text.subtle, e.g. the email address or the plan. */
  description?: ReactNode;
  /** Avatar photo. Without it the Avatar shows initials. */
  src?: string;
  /** A `<Menu>` of account actions, opened from the ⋯ button (or from the avatar when collapsed). */
  menu?: ReactElement;
  /** Same as `menu`, for those who prefer children. */
  children?: ReactElement;
  /** Accessible name of the ⋯ button. */
  menuLabel?: string;
  ref?: Ref<HTMLDivElement>;
}

/**
 * The signed-in person, in SidebarFooter: avatar, name, a description (email), an optional account menu, and the
 * sidebar's collapse toggle beside the card. Collapsed, only the avatar shows (it opens the menu) and the toggle.
 */
export function SidebarUser({
  name,
  description,
  src,
  menu,
  children,
  menuLabel = 'Account options',
  className,
  ...rest
}: SidebarUserProps): JSX.Element {
  const { collapsed, toggle } = useContext(SidebarContext);
  const accountMenu = menu ?? children;

  if (collapsed) {
    return (
      <div {...rest} className={cx(styles.user, className)}>
        {accountMenu ? (
          <MenuTrigger>
            <TooltipTrigger delay={0} closeDelay={0}>
              <RACButton className={styles.avatarButton}>
                {/* The avatar's name is the button's name; aria-haspopup says it opens a menu. */}
                <Avatar name={name} src={src} shape="square" size="md" />
              </RACButton>
              <Tooltip placement="end">{name}</Tooltip>
            </TooltipTrigger>
            {accountMenu}
          </MenuTrigger>
        ) : (
          <Avatar name={name} src={src} shape="square" size="md" />
        )}
        {toggle}
      </div>
    );
  }

  return (
    <div {...rest} className={cx(styles.user, className)}>
      <div className={styles.userCard}>
        <Avatar name={name} src={src} shape="square" size="md" alt="" />
        <span className={styles.userText}>
          <span className={styles.userName}>{name}</span>
          {description != null && <span className={styles.userDescription}>{description}</span>}
        </span>
        {accountMenu && (
          <MenuTrigger>
            <RACButton aria-label={menuLabel} className={cx(styles.iconButton, styles.userMenu)}>
              <IconDotsVertical aria-hidden="true" />
            </RACButton>
            {accountMenu}
          </MenuTrigger>
        )}
      </div>
      {toggle}
    </div>
  );
}

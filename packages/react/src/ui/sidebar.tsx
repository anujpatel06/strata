'use client';

import {
  Children,
  createContext,
  isValidElement,
  useContext,
  useId,
  useState,
  type HTMLAttributes,
  type JSX,
  type ReactNode,
  type Ref,
} from 'react';
import {
  Button as RACButton,
  Link as RACLink,
  composeRenderProps,
  useLocale,
  type ButtonProps as RACButtonProps,
  type LinkProps as RACLinkProps,
} from 'react-aria-components';
import { IconChevronLeft } from '@strata/icons';
import { Badge } from './badge';
import { Button } from './button';
import { Tooltip, TooltipTrigger } from './tooltip';
import styles from './sidebar.module.css';

const cx = (...c: Array<string | false | null | undefined>) => c.filter(Boolean).join(' ');

interface SidebarContextValue {
  /** Icon-only mode. */
  collapsed: boolean;
  /** The collapse toggle, rendered by SidebarHeader (or by Sidebar when there is no header). */
  toggle: ReactNode;
}

const SidebarContext = createContext<SidebarContextValue>({ collapsed: false, toggle: null });

/** Reads the nearest Sidebar's state, e.g. to render a smaller footer when it's collapsed. */
export function useSidebar(): { collapsed: boolean } {
  return { collapsed: useContext(SidebarContext).collapsed };
}

export interface SidebarProps extends Omit<HTMLAttributes<HTMLDivElement>, 'aria-label'> {
  /** Names the navigation landmark, e.g. "Main". Required: a page can have several navs. */
  'aria-label': string;
  /**
   * `flush` = full-height app chrome with a hairline at the inline end. `floating` = an inset panel: container radius,
   * raised surface, rim light and shadow (the dashboard look).
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

/**
 * App navigation: a brand block, labelled sections of links, and a footer (a user or upgrade card). The sections sit
 * in a `<nav>` landmark named by `aria-label`; SidebarHeader and SidebarFooter sit outside it. Collapses to icons.
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
      <Button
        variant="ghost"
        size="icon"
        aria-label={label}
        aria-controls={navId}
        className={styles.toggle}
        onPress={() => setCollapsed(!collapsed)}
      >
        <IconChevronLeft data-directional aria-hidden="true" />
      </Button>
      <Tooltip placement="end">{label}</Tooltip>
    </TooltipTrigger>
  ) : null;

  // Header and footer go outside the nav landmark; everything else (the sections) goes inside it.
  let header: ReactNode = null;
  let footer: ReactNode = null;
  const sections: ReactNode[] = [];
  Children.forEach(children, (child) => {
    if (isValidElement(child) && child.type === SidebarHeader) header = child;
    else if (isValidElement(child) && child.type === SidebarFooter) footer = child;
    else sections.push(child);
  });

  return (
    <SidebarContext.Provider value={{ collapsed, toggle }}>
      <div
        {...rest}
        data-variant={variant}
        data-collapsed={collapsed || undefined}
        className={cx(styles.sidebar, className)}
      >
        {header ?? (toggle && <div className={styles.toggleRow}>{toggle}</div>)}
        <nav id={navId} aria-label={ariaLabel} className={styles.nav}>
          {sections}
        </nav>
        {footer}
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

/** The brand block at the top. Holds the collapse toggle when the sidebar has one. Extra `children` go under it. */
export function SidebarHeader({ logo, title, subtitle, className, children, ...rest }: SidebarHeaderProps): JSX.Element {
  const { toggle } = useContext(SidebarContext);
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
        {toggle}
      </div>
      {children}
    </div>
  );
}

export interface SidebarSectionProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  /** Quiet label above the items, e.g. "Overview". Names the list for screen readers. Hidden when collapsed. */
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
  /** Label. Also the tooltip and accessible name when collapsed. */
  children: ReactNode;
  /** Leading icon from @strata/icons. Needed for the collapsed mode. */
  icon?: ReactNode;
  /** Marks the current page: `aria-current="page"`, the selected pill and the brand indicator bar. */
  isCurrent?: boolean;
  /** A trailing count, e.g. 3 unread. Formatted for the locale; part of the accessible name. A dot when collapsed. */
  count?: number;
  /** A trailing badge, e.g. "New" or "Beta". A string becomes a soft brand Badge; pass a Badge for anything else. */
  badge?: ReactNode;
  className?: string;
}

export type SidebarItemProps = SidebarItemOwnProps &
  (
    | ({ href: string } & Omit<RACLinkProps, 'children' | 'className' | 'style' | 'href'>)
    | ({ href?: undefined } & Omit<RACButtonProps, 'children' | 'className' | 'style'>)
  );

/**
 * One destination. With `href` it's a link (React Aria Link, so client routers work through RouterProvider); without,
 * it's a button (`onPress`), e.g. "Invite people".
 */
export function SidebarItem({ children, icon, isCurrent, count, badge, className, ...rest }: SidebarItemProps): JSX.Element {
  const { collapsed } = useContext(SidebarContext);
  const { locale } = useLocale();
  const countText = count !== undefined ? new Intl.NumberFormat(locale).format(count) : undefined;
  const hasMarker = countText !== undefined || (badge != null && badge !== false);

  const content = (
    <>
      {icon != null && (
        <span className={styles.icon} aria-hidden="true">
          {icon}
          {hasMarker && <span className={styles.marker} />}
        </span>
      )}
      <span className={styles.label}>{children}</span>
      {countText !== undefined && (
        <Badge size="sm" tone={isCurrent ? 'brand' : 'neutral'} className={styles.count}>
          {countText}
        </Badge>
      )}
      {badge != null &&
        badge !== false &&
        (typeof badge === 'string' || typeof badge === 'number' ? (
          <Badge size="sm" tone="brand" className={styles.badge}>
            {badge}
          </Badge>
        ) : (
          <span className={styles.badge}>{badge}</span>
        ))}
    </>
  );

  const itemClass = composeRenderProps(className, (c) => cx(styles.item, c));
  const current = isCurrent ? ('page' as const) : undefined;

  return (
    <li className={styles.listItem}>
      <TooltipTrigger isDisabled={!collapsed} delay={0} closeDelay={0}>
        {rest.href !== undefined ? (
          <RACLink {...(rest as RACLinkProps)} aria-current={current} className={itemClass}>
            {content}
          </RACLink>
        ) : (
          <RACButton
            {...(rest as RACButtonProps)}
            aria-current={current}
            data-current={isCurrent || undefined}
            className={itemClass}
          >
            {content}
          </RACButton>
        )}
        <Tooltip placement="end" className={styles.tooltip}>
          {children}
          {countText !== undefined && <span className={styles.tooltipCount}>{countText}</span>}
        </Tooltip>
      </TooltipTrigger>
    </li>
  );
}

export interface SidebarFooterProps extends HTMLAttributes<HTMLDivElement> {
  ref?: Ref<HTMLDivElement>;
}

/**
 * Pinned to the bottom: a user row, an upgrade card, settings. Outside the nav landmark. Use `useSidebar()` to render
 * a compact version when collapsed.
 */
export function SidebarFooter({ className, ...rest }: SidebarFooterProps): JSX.Element {
  return <div {...rest} className={cx(styles.footer, className)} />;
}

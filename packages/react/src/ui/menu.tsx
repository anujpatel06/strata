'use client';

import type { JSX, ReactNode } from 'react';
import {
  Collection,
  Header,
  Keyboard,
  Menu as RACMenu,
  MenuItem as RACMenuItem,
  MenuSection as RACMenuSection,
  PopoverContext,
  Separator,
  Text,
  composeRenderProps,
  useSlottedContext,
  type MenuItemProps as RACMenuItemProps,
  type MenuProps as RACMenuProps,
  type MenuSectionProps as RACMenuSectionProps,
  type SeparatorProps,
} from 'react-aria-components';
import { IconCheck, IconChevronRight } from '@syntara/icons';
import { Popover, type PopoverProps } from './popover';
import styles from './menu.module.css';

export {
  MenuTrigger,
  SubmenuTrigger,
  type MenuTriggerProps,
  type SubmenuTriggerProps,
} from 'react-aria-components';

const cx = (...c: Array<string | false | null | undefined>) => c.filter(Boolean).join(' ');

export interface MenuProps<T> extends RACMenuProps<T> {
  /** Where the menu opens relative to its trigger. Defaults to below, aligned to the start edge; submenus open at the end edge. */
  placement?: PopoverProps['placement'];
}

/**
 * A list of actions or options. Inside a MenuTrigger (or as the second child of a SubmenuTrigger) it renders in a
 * popover anchored to the trigger; anywhere else it renders inline.
 */
export function Menu<T extends object>({ className, placement, ...props }: MenuProps<T>): JSX.Element {
  const trigger = useSlottedContext(PopoverContext)?.trigger;
  const menu = <RACMenu<T> {...props} className={composeRenderProps(className, (c) => cx(styles.menu, c))} />;
  if (trigger === 'MenuTrigger') {
    return (
      <Popover className={styles.popover} {...(placement && { placement })}>
        {menu}
      </Popover>
    );
  }
  if (trigger === 'SubmenuTrigger') {
    // Line the submenu's first item up with the item that opened it, a few px clear of the parent menu.
    return (
      <Popover className={styles.popover} offset={8} crossOffset={-5} {...(placement && { placement })}>
        {menu}
      </Popover>
    );
  }
  return menu;
}

export interface MenuItemProps<T = object> extends Omit<RACMenuItemProps<T>, 'children'> {
  /** The item's label. */
  children: ReactNode;
  /** Leading icon, e.g. `<IconPencil />`. Decorative — the label names the item. */
  icon?: ReactNode;
  /** Secondary line under the label. */
  description?: ReactNode;
  /** Keyboard shortcut hint shown at the inline end, e.g. "⌘E". Display only — bind the keys yourself. */
  shortcut?: string;
  /** `danger` marks destructive actions. */
  tone?: 'neutral' | 'danger';
}

/** One action or option in a Menu. */
export function MenuItem<T extends object>({
  children,
  icon,
  description,
  shortcut,
  tone = 'neutral',
  textValue,
  className,
  ...props
}: MenuItemProps<T>): JSX.Element {
  return (
    <RACMenuItem<T>
      {...props}
      textValue={textValue ?? (typeof children === 'string' ? children : undefined)}
      data-tone={tone === 'danger' ? tone : undefined}
      className={composeRenderProps(className, (c) => cx(styles.item, c))}
    >
      {({ hasSubmenu, isSelected, selectionMode }) => (
        <>
          {selectionMode !== 'none' && (
            <span className={styles.check} aria-hidden>
              {isSelected && <IconCheck size="1em" stroke={2} />}
            </span>
          )}
          {icon != null && (
            <span className={styles.icon} aria-hidden>
              {icon}
            </span>
          )}
          <span className={styles.text}>
            <Text slot="label" className={styles.label}>
              {children}
            </Text>
            {description != null && (
              <Text slot="description" className={styles.description}>
                {description}
              </Text>
            )}
          </span>
          {shortcut && <Keyboard className={styles.shortcut}>{shortcut}</Keyboard>}
          {hasSubmenu && <IconChevronRight className={styles.chevron} aria-hidden size="1em" />}
        </>
      )}
    </RACMenuItem>
  );
}

export interface MenuSectionProps<T> extends RACMenuSectionProps<T> {
  /** Visible heading for the group; also its accessible name. */
  title?: ReactNode;
}

/** Groups related items under an optional heading. */
export function MenuSection<T extends object>({
  title,
  items,
  children,
  className,
  ...props
}: MenuSectionProps<T>): JSX.Element {
  return (
    <RACMenuSection<T> {...props} className={cx(styles.section, className)}>
      {title != null && <Header className={styles.sectionTitle}>{title}</Header>}
      {typeof children === 'function' ? <Collection items={items}>{children}</Collection> : children}
    </RACMenuSection>
  );
}

export type MenuSeparatorProps = SeparatorProps;

/** A hairline between groups of items. */
export function MenuSeparator({ className, ...props }: MenuSeparatorProps): JSX.Element {
  return <Separator {...props} className={cx(styles.separator, className)} />;
}

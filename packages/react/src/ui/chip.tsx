'use client';

import { createContext, useContext, useMemo, type JSX, type ReactNode, type Ref } from 'react';
import {
  Button as AriaButton,
  Label as AriaLabel,
  Tag as AriaTag,
  TagGroup as AriaTagGroup,
  TagList as AriaTagList,
  composeRenderProps,
  useLocale,
  type Key,
  type TagGroupProps as AriaTagGroupProps,
  type TagListProps as AriaTagListProps,
  type TagProps as AriaTagProps,
} from 'react-aria-components';
import { IconX } from '@strata/icons';
import styles from './chip.module.css';

const cx = (...c: Array<string | false | null | undefined>) => c.filter(Boolean).join(' ');

/** Re-exported so selection handlers don't need a second import from react-aria-components. */
export type { Selection } from 'react-aria-components';

export type ChipGroupMode = 'filter' | 'choice' | 'input';
export type ChipSize = 'sm' | 'md';

const GroupContext = createContext<{ mode: ChipGroupMode; size: ChipSize }>({ mode: 'filter', size: 'md' });

export interface ChipGroupProps<T extends object>
  extends Omit<
    AriaTagGroupProps,
    'children' | 'selectionMode' | 'disallowEmptySelection' | 'selectionBehavior' | 'onRemove' | 'className'
  > {
  /**
   * What the chips do:
   * - `filter`: turn any number on or off (multiple selection); a check draws in on the selected ones.
   * - `choice`: pick exactly one (single selection, can't be emptied), like a segmented control that wraps.
   * - `input`: things the user entered, each with a remove button (pass `onRemove`). Not selectable.
   */
  mode?: ChipGroupMode;
  /** Visible label above the chips. Without it, pass `aria-label` or `aria-labelledby`. */
  label?: ReactNode;
  /** `md` is the control height (a Button or TextField's height); `sm` is one 8px step smaller. */
  size?: ChipSize;
  /** Wrap onto more lines (default), or keep one line that scrolls sideways (`false`), e.g. a filter row on a phone. */
  wrap?: boolean;
  /** `input` mode: called with the keys of the chips to remove (remove button, Delete or Backspace). */
  onRemove?: (keys: Set<Key>) => void;
  /** Items for a dynamic collection; `children` is then a function that renders one Chip. */
  items?: Iterable<T>;
  children: ReactNode | ((item: T) => ReactNode);
  /** Shown in the list when there are no chips (e.g. every input chip was removed). */
  renderEmptyState?: AriaTagListProps<T>['renderEmptyState'];
  className?: string;
  ref?: Ref<HTMLDivElement>;
}

/**
 * A set of chips the user picks from or removes: filters ("Sponsored", "Discounted"), a single choice ("This month"),
 * or entered values ("Delhi ×"). Built on React Aria's TagGroup: one tab stop, arrow keys between chips, Space
 * toggles, Delete/Backspace removes.
 */
export function ChipGroup<T extends object>({
  mode = 'filter',
  label,
  size = 'md',
  wrap = true,
  onRemove,
  items,
  children,
  renderEmptyState,
  className,
  ...rest
}: ChipGroupProps<T>): JSX.Element {
  const selection =
    mode === 'filter'
      ? ({ selectionMode: 'multiple' } as const)
      : mode === 'choice'
        ? ({ selectionMode: 'single', disallowEmptySelection: true } as const)
        : ({ selectionMode: 'none' } as const);
  const context = useMemo(() => ({ mode, size }), [mode, size]);
  return (
    <GroupContext.Provider value={context}>
      <AriaTagGroup
        {...rest}
        {...selection}
        onRemove={mode === 'input' ? onRemove : undefined}
        data-mode={mode}
        className={cx(styles.root, className)}
      >
        {label != null && label !== false && <AriaLabel className={styles.label}>{label}</AriaLabel>}
        <AriaTagList
          items={items}
          renderEmptyState={renderEmptyState}
          data-size={size}
          data-wrap={wrap ? undefined : 'false'}
          className={styles.list}
        >
          {children}
        </AriaTagList>
      </AriaTagGroup>
    </GroupContext.Provider>
  );
}

export interface ChipProps extends Omit<AriaTagProps, 'children' | 'textValue'> {
  /** The label. Keep it to one to three words. */
  children: ReactNode;
  /** Leading icon from @strata/icons. Decorative: the label carries the meaning. In filter mode the check takes its place when selected. */
  icon?: ReactNode;
  /** A leading Avatar (e.g. filtering by person). Pass `alt=""` so the name isn't read twice. */
  avatar?: ReactNode;
  /** A quiet trailing number ("Sponsored 3"), formatted for the locale and read as part of the chip's name. */
  count?: number;
  /** Plain-text name when `children` isn't a string. The count is appended to it. */
  textValue?: string;
  ref?: Ref<HTMLDivElement>;
}

/** One chip in a ChipGroup. Give it an `id`; that's the key in selection and onRemove. */
export function Chip({ children, icon, avatar, count, textValue, className, ...rest }: ChipProps): JSX.Element {
  const { mode, size } = useContext(GroupContext);
  const { locale } = useLocale();
  const text = textValue ?? (typeof children === 'string' || typeof children === 'number' ? String(children) : undefined);
  const formatted = count != null ? new Intl.NumberFormat(locale).format(count) : undefined;
  const name = text != null && formatted != null ? `${text} ${formatted}` : text;
  const hasIcon = icon != null && icon !== false;
  const hasAvatar = avatar != null && avatar !== false;
  const check = (
    <svg
      className={styles.check}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      focusable="false"
    >
      <path d="M5 12.5l4.5 4.5l9.5 -10" pathLength="1" />
    </svg>
  );

  return (
    <AriaTag
      {...rest}
      textValue={name}
      data-size={size}
      data-mode={mode}
      data-icon={hasIcon || undefined}
      data-avatar={hasAvatar || undefined}
      className={composeRenderProps(className, (c) => cx(styles.chip, c))}
    >
      {({ allowsRemoving }) => (
        <>
          {/*
           * Filter mode: a check that draws in when the chip turns on. Without an icon or avatar it sits in a slot that
           * opens from zero width (the chip grows to make room); with an icon it takes the icon's place.
           */}
          {mode === 'filter' && !hasIcon && !hasAvatar && (
            <span className={styles.checkSlot} aria-hidden="true">
              <span className={styles.checkInner}>{check}</span>
            </span>
          )}
          {hasIcon && (
            <span className={styles.icon} aria-hidden="true">
              {icon}
              {mode === 'filter' && check}
            </span>
          )}
          {/* With an avatar the check covers the face on a brand disc when selected, so the chip doesn't grow. */}
          {hasAvatar && (
            <span className={styles.avatar}>
              {avatar}
              {mode === 'filter' && (
                <span className={styles.checkDisc} aria-hidden="true">
                  {check}
                </span>
              )}
            </span>
          )}
          {/* Selected chips turn medium weight. A string label reserves that width (data-label) so nothing shifts. */}
          <span className={styles.text} data-label={typeof children === 'string' ? children : undefined}>
            {children}
          </span>
          {formatted != null && <span className={styles.count}>{formatted}</span>}
          {allowsRemoving && (
            // React Aria names it "Remove <label>" in the user's language. Delete/Backspace also remove.
            <AriaButton slot="remove" className={styles.remove}>
              <IconX aria-hidden="true" />
            </AriaButton>
          )}
        </>
      )}
    </AriaTag>
  );
}

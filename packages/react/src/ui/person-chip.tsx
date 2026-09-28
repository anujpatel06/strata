'use client';

import { createContext, useContext, type HTMLAttributes, type JSX, type Ref } from 'react';
import {
  Button as AriaButton,
  Tag as AriaTag,
  TagGroup as AriaTagGroup,
  TagList as AriaTagList,
  type Key,
  type TagGroupProps as AriaTagGroupProps,
} from 'react-aria-components';
import { IconX } from '@syntara/icons';
import { Avatar, type AvatarTint } from './avatar';
import styles from './person-chip.module.css';

const cx = (...c: Array<string | false | null | undefined>) => c.filter(Boolean).join(' ');

export type PersonChipSize = 'sm' | 'md';

/**
 * How chips render depends on the group:
 * - no group → a plain inline element (static text);
 * - PersonChipGroup → a list item in a list (static, not focusable);
 * - PersonChipGroup with onRemove → a React Aria Tag in a TagGroup (one tab stop, arrow keys, Delete/Backspace).
 */
const GroupContext = createContext<{ size: PersonChipSize; removable: boolean } | null>(null);

export interface PersonChipProps extends Omit<HTMLAttributes<HTMLElement>, 'id' | 'children'> {
  /** The person's name, shown in the chip. Also drives the avatar's initials and tint. */
  name: string;
  /** Photo URL for the avatar. Initials show while it loads and if it fails. */
  src?: string;
  /** Avatar tint. `auto` hashes the name, so a person is the same colour here and in any Avatar. */
  tint?: AvatarTint;
  /** `md` is 32px tall, `sm` is 24px. Inherits from PersonChipGroup. */
  size?: PersonChipSize;
  /**
   * Someone who isn't added yet ("? Father"): a dashed chip, a "?" avatar and the name in italic text.subtle.
   * The chip looks optional but says nothing on its own; put the reason in text nearby ("Not added yet").
   */
  placeholder?: boolean;
  /** Key passed to PersonChipGroup's onRemove. Defaults to `name`. */
  id?: Key;
  ref?: Ref<HTMLElement>;
}

/** A person as a small avatar and their name, in a pill. Static; inside a removable PersonChipGroup it can be removed. */
export function PersonChip({
  name,
  src,
  tint = 'auto',
  size,
  placeholder = false,
  id,
  className,
  ref,
  ...rest
}: PersonChipProps): JSX.Element {
  const group = useContext(GroupContext);
  const resolvedSize = size ?? group?.size ?? 'md';
  const face = (
    <Avatar
      name={name}
      src={placeholder ? undefined : src}
      alt=""
      size="sm"
      tint={tint}
      placeholder={placeholder ? 'unknown' : undefined}
      className={styles.face}
    />
  );
  const label = <span className={styles.name}>{name}</span>;
  const dataProps = {
    'data-size': resolvedSize,
    'data-placeholder': placeholder || undefined,
  };

  if (group?.removable) {
    return (
      <AriaTag
        {...(rest as object)}
        {...dataProps}
        ref={ref as Ref<HTMLDivElement>}
        id={id ?? name}
        textValue={name}
        className={cx(styles.chip, className)}
      >
        {({ allowsRemoving }) => (
          <>
            {face}
            {label}
            {allowsRemoving && (
              // React Aria names this "Remove <name>" in the user's language and keeps it out of the tab order
              // (Delete/Backspace remove the focused chip); it's for pointer users.
              <AriaButton slot="remove" className={styles.remove}>
                <IconX aria-hidden="true" />
              </AriaButton>
            )}
          </>
        )}
      </AriaTag>
    );
  }

  return (
    <span
      role={group ? 'listitem' : undefined}
      {...rest}
      {...dataProps}
      ref={ref as Ref<HTMLSpanElement>}
      className={cx(styles.chip, className)}
    >
      {face}
      {label}
    </span>
  );
}

export interface PersonChipGroupProps
  extends Omit<HTMLAttributes<HTMLDivElement>, 'onChange'>,
    Pick<AriaTagGroupProps, 'disabledKeys'> {
  /** Size of every chip in the group. */
  size?: PersonChipSize;
  /**
   * Makes the chips removable. Called with the removed chips' keys (their `id`, or `name`). The group becomes a
   * React Aria TagGroup: one tab stop, arrow keys between chips, Delete or Backspace removes, and each chip gets a
   * remove button. Needs an accessible name (`aria-label` or `aria-labelledby`).
   */
  onRemove?: (keys: Set<Key>) => void;
  ref?: Ref<HTMLDivElement>;
}

/** A wrapping row of PersonChips with the right gap ("Arjun · Priya · Aarav"). A list, or a TagGroup when removable. */
export function PersonChipGroup({
  size = 'md',
  onRemove,
  disabledKeys,
  className,
  children,
  ref,
  ...rest
}: PersonChipGroupProps): JSX.Element {
  if (onRemove) {
    const { style, id, ...aria } = rest;
    return (
      <GroupContext.Provider value={{ size, removable: true }}>
        <AriaTagGroup
          {...(aria as object)}
          id={id}
          style={style}
          onRemove={onRemove}
          disabledKeys={disabledKeys}
          ref={ref}
          className={cx(styles.root, className)}
        >
          <AriaTagList data-size={size} className={styles.group}>
            {children}
          </AriaTagList>
        </AriaTagGroup>
      </GroupContext.Provider>
    );
  }
  return (
    <GroupContext.Provider value={{ size, removable: false }}>
      <div role="list" {...rest} ref={ref} data-size={size} className={cx(styles.group, className)}>
        {children}
      </div>
    </GroupContext.Provider>
  );
}

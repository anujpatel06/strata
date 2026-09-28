'use client';

import { useRef, type JSX, type ReactElement, type ReactNode } from 'react';
import {
  Button as RACButton,
  ComboBox as RACComboBox,
  Collection,
  Header,
  ListBox,
  ListBoxItem,
  ListBoxSection,
  Popover,
  Text,
  composeRenderProps,
  type ComboBoxProps as RACComboBoxProps,
  type ListBoxItemProps,
  type ListBoxSectionProps,
  type ValidationResult,
} from 'react-aria-components';
import { IconCheck, IconChevronDown } from '@syntara/icons';
import { Description, FieldError, FieldGroup, Input, Label, type FieldSize } from './text-field';
import styles from './combobox.module.css';

const cx = (...c: Array<string | false | null | undefined>) => c.filter(Boolean).join(' ');

/**
 * Overlays portal to <body>, outside any ThemeScope. When the popover mounts, copy the trigger's scope
 * attributes (theme, scheme, density — and dir/lang if React Aria hasn't set them) onto it, so the popover
 * is a scope of its own and renders with the same tokens. Same approach as dialog.tsx.
 */
const SCOPE_ATTRS = ['data-syntara-theme', 'data-syntara-scheme', 'data-syntara-density'] as const;
function mirrorScope(overlay: HTMLElement | null, source: Element | null): void {
  if (!overlay || !source || overlay.contains(source)) return;
  for (const name of SCOPE_ATTRS) {
    // Look each attribute up on its own: a single-tenant app themes :root and scopes only the scheme.
    const value = source.closest(`[${name}]`)?.getAttribute(name);
    if (value) overlay.setAttribute(name, value);
  }
  for (const name of ['dir', 'lang']) {
    const value = source.closest(`[${name}]`)?.getAttribute(name);
    if (value && !overlay.hasAttribute(name)) overlay.setAttribute(name, value);
  }
}

export interface ComboboxProps<T extends object> extends Omit<RACComboBoxProps<T>, 'children'> {
  /** Visible label. Pass `aria-label` instead only when a visible label is truly impossible. */
  label?: ReactNode;
  /** Help text under the input. */
  description?: ReactNode;
  /** Shown when the field is invalid. A string, or a function of RAC's validation result. */
  errorMessage?: string | ((validation: ValidationResult) => string);
  /** Placeholder text in the input, e.g. "Search countries…". */
  placeholder?: string;
  /** Row shown when nothing matches the typed text. */
  emptyState?: ReactNode;
  /** Height of the input: `md` is the control height. Matches `Button` and `TextField` of the same size. */
  size?: FieldSize;
  /** `ComboboxItem` / `ComboboxSection` elements, or a function that renders one per item. */
  children: ReactNode | ((item: T) => ReactElement);
}

/**
 * A text input that filters a list of options as you type. Keyboard: ↓/↑ open and move, Enter selects,
 * Escape closes and restores the selected text. Use `allowsCustomValue` to accept free text.
 */
export function Combobox<T extends object>({
  label,
  description,
  errorMessage,
  placeholder,
  emptyState = 'No results',
  items,
  children,
  className,
  allowsEmptyCollection = true,
  size = 'md',
  ...props
}: ComboboxProps<T>): JSX.Element {
  const groupRef = useRef<HTMLDivElement>(null);
  return (
    <RACComboBox<T>
      {...props}
      items={items}
      allowsEmptyCollection={allowsEmptyCollection}
      data-field-size={size}
      className={composeRenderProps(className, (c) => cx(styles.field, c))}
    >
      {label != null && <Label isRequired={props.isRequired}>{label}</Label>}
      <FieldGroup ref={groupRef} className={styles.control}>
        <Input placeholder={placeholder} />
        <RACButton className={styles.button}>
          <IconChevronDown aria-hidden className={styles.chevron} />
        </RACButton>
      </FieldGroup>
      {description != null && <Description>{description}</Description>}
      <FieldError>{errorMessage}</FieldError>
      <Popover offset={4} ref={(node) => mirrorScope(node, groupRef.current)} className={styles.popover}>
        <ListBox<T> className={styles.listbox} renderEmptyState={() => <div className={styles.empty}>{emptyState}</div>}>
          {children}
        </ListBox>
      </Popover>
    </RACComboBox>
  );
}

export interface ComboboxItemProps<T extends object = object> extends Omit<ListBoxItemProps<T>, 'children'> {
  /** The option's label. A plain string also becomes its `textValue`, which fills the input when chosen. */
  children: ReactNode;
  /** A second, quieter line under the label. */
  description?: ReactNode;
  /** Leading icon (decorative). */
  icon?: ReactNode;
}

/** One option in a Combobox. Give it an `id`; that is the key `selectedKey`/`onSelectionChange` use. */
export function ComboboxItem<T extends object = object>({
  children,
  description,
  icon,
  textValue,
  className,
  ...props
}: ComboboxItemProps<T>): JSX.Element {
  return (
    <ListBoxItem<T>
      {...props}
      textValue={textValue ?? (typeof children === 'string' ? children : undefined)}
      className={composeRenderProps(className, (c) => cx(styles.item, c))}
    >
      {({ isSelected }) => (
        <>
          {icon != null && (
            <span aria-hidden className={styles.icon}>
              {icon}
            </span>
          )}
          <span className={styles.itemText}>
            <Text slot="label" className={styles.itemLabel}>
              {children}
            </Text>
            {description != null && (
              <Text slot="description" className={styles.itemDescription}>
                {description}
              </Text>
            )}
          </span>
          <IconCheck aria-hidden className={styles.check} data-visible={isSelected || undefined} />
        </>
      )}
    </ListBoxItem>
  );
}

export interface ComboboxSectionProps<T extends object = object> extends Omit<ListBoxSectionProps<T>, 'children'> {
  /** Section heading, e.g. "Recent". */
  title?: ReactNode;
  /** Items for a dynamic section; pair with a render function as `children`. */
  items?: Iterable<T>;
  children: ReactNode | ((item: T) => ReactElement);
}

/** Groups related options under a heading. Sections with no matches hide while filtering. */
export function ComboboxSection<T extends object = object>({
  title,
  items,
  children,
  className,
  ...props
}: ComboboxSectionProps<T>): JSX.Element {
  return (
    <ListBoxSection<T> {...props} className={cx(styles.section, className)}>
      {title != null && <Header className={styles.sectionHeader}>{title}</Header>}
      {items ? <Collection items={items}>{children}</Collection> : (children as ReactNode)}
    </ListBoxSection>
  );
}

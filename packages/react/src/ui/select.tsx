'use client';

import { createContext, useContext, useRef, type JSX, type ReactElement, type ReactNode } from 'react';
import {
  Button as RACButton,
  Collection,
  Header,
  ListBox,
  ListBoxItem,
  ListBoxSection,
  Popover,
  Select as RACSelect,
  SelectValue,
  Text,
  composeRenderProps,
  type ListBoxItemProps,
  type ListBoxSectionProps,
  type SelectProps as RACSelectProps,
  type ValidationResult,
} from 'react-aria-components';
import { IconCheck, IconChevronDown } from '@syntara/icons';
import { Description, FieldError, Label, type FieldSize } from './text-field';
import styles from './select.module.css';

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

/** True while an item's content is being rendered inside the trigger (SelectValue), not the list. */
const InTriggerContext = createContext(false);

export interface SelectProps<T extends object> extends Omit<RACSelectProps<T>, 'children'> {
  /** Visible label. Pass `aria-label` instead only when a visible label is truly impossible. */
  label?: ReactNode;
  /** Help text under the trigger. */
  description?: ReactNode;
  /** Shown when the field is invalid. A string, or a function of RAC's validation result. */
  errorMessage?: string | ((validation: ValidationResult) => string);
  /** Items for dynamic collections; pair with a render function as `children`. */
  items?: Iterable<T>;
  /** Height of the trigger: `md` is the control height. Matches `Button` and `TextField` of the same size. */
  size?: FieldSize;
  /** `SelectItem` / `SelectSection` elements, or a function that renders one per item. */
  children: ReactNode | ((item: T) => ReactElement);
}

/**
 * A button that opens a list of options and shows the chosen one. Keyboard: Enter, Space or ↓ opens,
 * arrows move, typing jumps to a match, Enter selects, Escape closes.
 */
export function Select<T extends object>({
  label,
  description,
  errorMessage,
  items,
  children,
  size = 'md',
  className,
  ...props
}: SelectProps<T>): JSX.Element {
  const triggerRef = useRef<HTMLButtonElement>(null);
  return (
    <RACSelect<T> {...props} data-field-size={size} className={composeRenderProps(className, (c) => cx(styles.field, c))}>
      {label != null && <Label isRequired={props.isRequired}>{label}</Label>}
      <RACButton ref={triggerRef} className={styles.trigger}>
        <InTriggerContext.Provider value>
          <SelectValue className={styles.value} />
        </InTriggerContext.Provider>
        <span aria-hidden className={styles.chevronBox}>
          <IconChevronDown className={styles.chevron} />
        </span>
      </RACButton>
      {description != null && <Description>{description}</Description>}
      <FieldError>{errorMessage}</FieldError>
      <Popover offset={4} ref={(node) => mirrorScope(node, triggerRef.current)} className={styles.popover}>
        <ListBox<T> items={items} className={styles.listbox}>
          {children}
        </ListBox>
      </Popover>
    </RACSelect>
  );
}

export interface SelectItemProps<T extends object = object> extends Omit<ListBoxItemProps<T>, 'children'> {
  /** The option's label. A plain string also becomes its `textValue` for type-ahead. */
  children: ReactNode;
  /** A second, quieter line under the label. Not shown in the trigger. */
  description?: ReactNode;
  /** Leading icon (decorative). Shown in the list and in the trigger. */
  icon?: ReactNode;
}

function ItemContent({
  icon,
  description,
  isSelected,
  children,
}: {
  icon?: ReactNode;
  description?: ReactNode;
  isSelected: boolean;
  children: ReactNode;
}): JSX.Element {
  const inTrigger = useContext(InTriggerContext);
  if (inTrigger) {
    return (
      <>
        {icon != null && (
          <span aria-hidden className={styles.icon}>
            {icon}
          </span>
        )}
        <span className={styles.valueText}>{children}</span>
      </>
    );
  }
  return (
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
  );
}

/** One option in a Select. Give it an `id`; that is the key `selectedKey`/`onSelectionChange` use. */
export function SelectItem<T extends object = object>({
  children,
  description,
  icon,
  textValue,
  className,
  ...props
}: SelectItemProps<T>): JSX.Element {
  return (
    <ListBoxItem<T>
      {...props}
      textValue={textValue ?? (typeof children === 'string' ? children : undefined)}
      className={composeRenderProps(className, (c) => cx(styles.item, c))}
    >
      {({ isSelected }) => (
        <ItemContent icon={icon} description={description} isSelected={isSelected}>
          {children}
        </ItemContent>
      )}
    </ListBoxItem>
  );
}

export interface SelectSectionProps<T extends object = object> extends Omit<ListBoxSectionProps<T>, 'children'> {
  /** Section heading, e.g. "Europe". */
  title?: ReactNode;
  /** Items for a dynamic section; pair with a render function as `children`. */
  items?: Iterable<T>;
  children: ReactNode | ((item: T) => ReactElement);
}

/** Groups related options under a heading. */
export function SelectSection<T extends object = object>({
  title,
  items,
  children,
  className,
  ...props
}: SelectSectionProps<T>): JSX.Element {
  return (
    <ListBoxSection<T> {...props} className={cx(styles.section, className)}>
      {title != null && <Header className={styles.sectionHeader}>{title}</Header>}
      {items ? <Collection items={items}>{children}</Collection> : (children as ReactNode)}
    </ListBoxSection>
  );
}

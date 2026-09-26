'use client';

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type JSX,
  type ReactElement,
  type ReactNode,
} from 'react';
import {
  Autocomplete,
  Collection,
  Dialog as RACDialog,
  Header,
  Input,
  ListBox,
  ListBoxItem,
  ListBoxSection,
  Modal,
  ModalOverlay,
  PopoverContext,
  SearchField,
  Text,
  composeRenderProps,
  useFilter,
  useSlottedContext,
  type Key,
  type ListBoxItemProps,
  type ListBoxSectionProps,
} from 'react-aria-components';
import { IconSearch } from '@tabler/icons-react';
import styles from './command.module.css';

const cx = (...c: Array<string | false | null | undefined>) => c.filter(Boolean).join(' ');

/**
 * Overlays portal to <body>, outside any ThemeScope. At open time copy the scope attributes
 * (data-strata-theme/scheme/density) and dir/lang of the element the palette belongs to onto the overlay root.
 */
const SCOPE_ATTRS = ['data-strata-theme', 'data-strata-scheme', 'data-strata-density'] as const;
function mirrorScope(overlay: HTMLElement, source: Element | null | undefined): void {
  if (!source || overlay.contains(source)) return;
  for (const name of SCOPE_ATTRS) {
    // Look each attribute up on its own: a single-tenant app themes :root and scopes only the scheme.
    const value = source.closest(`[${name}]`)?.getAttribute(name);
    if (value) overlay.setAttribute(name, value);
  }
  for (const name of ['dir', 'lang']) {
    const value = source.closest(`[${name}]`)?.getAttribute(name);
    if (value) overlay.setAttribute(name, value);
  }
}

export interface CommandDialogProps<T> {
  /** Controlled open state. Omit inside a DialogTrigger. */
  isOpen?: boolean;
  /** Initial open state when uncontrolled. */
  defaultOpen?: boolean;
  /** Called when the palette opens or closes (Escape, backdrop click, or after an item's action). */
  onOpenChange?: (isOpen: boolean) => void;
  /** Placeholder of the search input. */
  placeholder?: string;
  /** Accessible name of the palette and its input. */
  'aria-label'?: string;
  /** Called with the chosen item's `id` (Enter or click). The palette closes afterwards. */
  onAction?: (key: Key) => void;
  /** CommandSection / CommandItem elements, or a function rendering one per entry of `items`. */
  children: ReactNode | ((item: T) => ReactElement);
  /** Entries for a dynamic collection. */
  items?: Iterable<T>;
  /** Decides whether an item matches the query. Defaults to a case- and accent-insensitive "contains". */
  filter?: (textValue: string, inputValue: string) => boolean;
  /** Content when nothing matches. Receives the current query. */
  renderEmptyState?: (inputValue: string) => ReactNode;
  /** Replaces the keyboard hint row; pass `null` to hide it. */
  footer?: ReactNode;
  /** Class for the palette panel. */
  className?: string;
  /** Style for the palette panel. */
  style?: CSSProperties;
}

/**
 * A ⌘K command palette: a modal search field that filters a list of commands or destinations as you type. Arrow
 * keys move through results, Enter runs the highlighted one, Escape clears the query and then closes.
 */
export function CommandDialog<T extends object>({
  isOpen,
  defaultOpen,
  onOpenChange,
  placeholder = 'Type a command or search…',
  'aria-label': ariaLabel = 'Command menu',
  onAction,
  children,
  items,
  filter,
  renderEmptyState,
  footer,
  className,
  style,
}: CommandDialogProps<T>): JSX.Element {
  const triggerRef = useSlottedContext(PopoverContext)?.triggerRef;
  const anchorRef = useRef<HTMLSpanElement>(null);
  const overlayRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (node) mirrorScope(node, triggerRef?.current ?? anchorRef.current ?? document.activeElement);
    },
    [triggerRef],
  );

  return (
    <>
      {!triggerRef && <span ref={anchorRef} hidden />}
      <ModalOverlay
        ref={overlayRef}
        className={styles.overlay}
        isDismissable
        isOpen={isOpen}
        defaultOpen={defaultOpen}
        onOpenChange={onOpenChange}
      >
        <Modal className={cx(styles.panel, className)} style={style}>
          <RACDialog aria-label={ariaLabel} className={styles.dialog}>
            {({ close }) => (
              <CommandPalette<T>
                aria-label={ariaLabel}
                placeholder={placeholder}
                items={items}
                filter={filter}
                renderEmptyState={renderEmptyState}
                footer={footer}
                onAction={(key) => {
                  onAction?.(key);
                  close();
                }}
              >
                {children}
              </CommandPalette>
            )}
          </RACDialog>
        </Modal>
      </ModalOverlay>
    </>
  );
}

interface CommandPaletteProps<T>
  extends Pick<CommandDialogProps<T>, 'placeholder' | 'children' | 'items' | 'filter' | 'renderEmptyState' | 'footer'> {
  'aria-label': string;
  onAction: (key: Key) => void;
}

/** Lives inside the modal so the query resets every time the palette opens. */
function CommandPalette<T extends object>({
  'aria-label': ariaLabel,
  placeholder,
  children,
  items,
  filter,
  renderEmptyState,
  footer,
  onAction,
}: CommandPaletteProps<T>): JSX.Element {
  const [query, setQuery] = useState('');
  const { contains } = useFilter({ sensitivity: 'base' });

  return (
    <>
      <Autocomplete inputValue={query} onInputChange={setQuery} filter={filter ?? contains}>
        <SearchField aria-label={ariaLabel} autoFocus className={styles.search}>
          <IconSearch aria-hidden className={styles.searchIcon} size="1.125em" stroke={1.75} />
          {/* The combobox pattern (APG): focus stays here and aria-activedescendant points at the active option. It
              also tells assistive tech — and axe — that the scrolling results list is operated from this input. */}
          <Input placeholder={placeholder} role="combobox" aria-expanded className={styles.input} />
        </SearchField>
        <ListBox<T>
          aria-label={ariaLabel}
          items={items}
          onAction={onAction}
          className={styles.list}
          renderEmptyState={() =>
            renderEmptyState ? (
              renderEmptyState(query)
            ) : (
              <p className={styles.empty}>
                {query ? (
                  <>
                    No results for <span className={styles.query}>“{query}”</span>
                  </>
                ) : (
                  'No results'
                )}
              </p>
            )
          }
        >
          {children}
        </ListBox>
      </Autocomplete>
      {footer === undefined ? (
        <div className={styles.footer}>
          <span className={styles.hint}>
            <kbd className={styles.kbd}>↑</kbd>
            <kbd className={styles.kbd}>↓</kbd>
            to navigate
          </span>
          <span className={styles.hint}>
            <kbd className={styles.kbd}>↵</kbd>
            to select
          </span>
          <span className={styles.hint}>
            <kbd className={styles.kbd}>esc</kbd>
            to close
          </span>
        </div>
      ) : (
        footer
      )}
    </>
  );
}

export interface CommandSectionProps<T> extends ListBoxSectionProps<T> {
  /** Visible heading for the group, e.g. "Components". */
  title?: ReactNode;
}

/** A titled group of results. Hidden automatically when none of its items match. */
export function CommandSection<T extends object>({
  title,
  items,
  children,
  className,
  ...props
}: CommandSectionProps<T>): JSX.Element {
  return (
    <ListBoxSection<T> {...props} className={cx(styles.section, className)}>
      {title != null && <Header className={styles.sectionTitle}>{title}</Header>}
      {typeof children === 'function' ? <Collection items={items}>{children}</Collection> : children}
    </ListBoxSection>
  );
}

export interface CommandItemProps<T = object> extends Omit<ListBoxItemProps<T>, 'children'> {
  /** The result's label. */
  children: ReactNode;
  /** Text matched against the query. Required when `children` isn't a plain string; add keywords here too. */
  textValue?: string;
  /** Leading icon. Decorative. */
  icon?: ReactNode;
  /** Secondary line under the label. */
  description?: ReactNode;
  /** Short trailing text at the inline end, e.g. a category or shortcut. */
  meta?: ReactNode;
}

/** One result in a CommandDialog. */
export function CommandItem<T extends object>({
  children,
  textValue,
  icon,
  description,
  meta,
  className,
  ...props
}: CommandItemProps<T>): JSX.Element {
  return (
    <ListBoxItem<T>
      {...props}
      textValue={textValue ?? (typeof children === 'string' ? children : undefined)}
      className={composeRenderProps(className, (c) => cx(styles.item, c))}
    >
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
      {meta != null && <span className={styles.meta}>{meta}</span>}
    </ListBoxItem>
  );
}

/**
 * Calls `onOpen` when the user presses ⌘K (macOS) or Ctrl+K (elsewhere), anywhere on the page. Pass a different
 * `key` to bind another letter, or `isDisabled` to unbind. Skips key presses an earlier listener already handled
 * (`preventDefault()`), so two palettes on one page don't both open.
 */
export function useCommandShortcut(
  onOpen: () => void,
  { key = 'k', isDisabled = false }: { key?: string; isDisabled?: boolean } = {},
): void {
  const handler = useRef(onOpen);
  useEffect(() => {
    handler.current = onOpen;
  });
  useEffect(() => {
    if (isDisabled) return;
    const onKeyDown = (e: KeyboardEvent) => {
      // A handler that ran earlier (e.g. the app's own search) already claimed the shortcut.
      if (e.defaultPrevented) return;
      if (e.key?.toLowerCase() === key.toLowerCase() && (e.metaKey || e.ctrlKey) && !e.altKey && !e.shiftKey) {
        e.preventDefault();
        handler.current();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [key, isDisabled]);
}

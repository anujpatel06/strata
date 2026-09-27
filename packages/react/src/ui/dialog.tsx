'use client';

import { useCallback, useId, useRef, type CSSProperties, type JSX, type ReactNode } from 'react';
import {
  Dialog as RACDialog,
  Heading,
  Modal,
  ModalOverlay,
  PopoverContext,
  useSlottedContext,
  type DialogProps as RACDialogProps,
} from 'react-aria-components';
import { IconX } from '@strata/icons';
import { Button } from './button';
import styles from './dialog.module.css';

export { DialogTrigger, type DialogTriggerProps } from 'react-aria-components';

const cx = (...c: Array<string | false | null | undefined>) => c.filter(Boolean).join(' ');

/**
 * Overlays portal to <body>, outside any ThemeScope, so scoped tokens would not reach them. At open time we
 * copy the scope's data-strata-* attributes (and dir/lang) from the element the overlay belongs to onto the
 * overlay root, which makes the root a scope of its own. Nested overlays find the attributes on their parent.
 */
const SCOPE_ATTRS = ['data-strata-theme', 'data-strata-scheme', 'data-strata-density'] as const;
function mirrorScope(overlay: HTMLElement, source: Element | null | undefined): void {
  if (!source || overlay.contains(source)) return;
  for (const name of SCOPE_ATTRS) {
    // Look each attribute up on its own: a single-tenant app themes :root and scopes only the scheme.
    const value = source.closest(`[${name}]`)?.getAttribute(name);
    if (value && overlay.getAttribute(name) !== value) overlay.setAttribute(name, value);
  }
  for (const name of ['dir', 'lang']) {
    const value = source.closest(`[${name}]`)?.getAttribute(name);
    if (value && overlay.getAttribute(name) !== value) overlay.setAttribute(name, value);
  }
}

/**
 * The same lookup as mirrorScope, returned as props so the overlay root is *created* inside its scope. React Aria
 * decides whether an overlay has an entry animation in a layout effect that runs before the ref callback that calls
 * mirrorScope; until the scope attributes land, the motion tokens are undefined, the `animation` declaration is
 * invalid, and React Aria concludes there's nothing to animate. mirrorScope stays as the fallback for an overlay
 * that mounts already open (its trigger or anchor isn't in the DOM yet during that first render).
 */
function scopeProps(source: Element | null | undefined): Record<string, string> {
  const props: Record<string, string> = {};
  if (!source) return props;
  for (const name of [...SCOPE_ATTRS, 'dir', 'lang']) {
    const value = source.closest(`[${name}]`)?.getAttribute(name);
    if (value) props[name] = value;
  }
  return props;
}

export interface DialogRenderProps {
  /** Closes the dialog. */
  close: () => void;
}

export interface DialogProps extends Omit<RACDialogProps, 'children' | 'className' | 'style'> {
  /** Heading at the top of the dialog; also its accessible name. */
  title: ReactNode;
  /** Supporting text under the title, announced with it. */
  description?: ReactNode;
  /** Body content, or a function that receives `{ close }`. Scrolls when taller than the viewport allows. */
  children?: ReactNode | ((opts: DialogRenderProps) => ReactNode);
  /** Actions pinned to the bottom, usually Buttons. Also accepts a function that receives `{ close }`. */
  footer?: ReactNode | ((opts: DialogRenderProps) => ReactNode);
  /** Maximum width. */
  size?: 'sm' | 'md' | 'lg';
  /** Whether clicking the backdrop closes the dialog. Escape always closes unless `isKeyboardDismissDisabled`. */
  isDismissable?: boolean;
  /** Whether Escape is ignored. */
  isKeyboardDismissDisabled?: boolean;
  /** Controlled open state — only when the dialog is not inside a DialogTrigger. */
  isOpen?: boolean;
  /** Initial open state — only when the dialog is not inside a DialogTrigger. */
  defaultOpen?: boolean;
  /** Called when the open state changes — only when the dialog is not inside a DialogTrigger. */
  onOpenChange?: (isOpen: boolean) => void;
  /** Class for the dialog panel. */
  className?: string;
  /** Style for the dialog panel. */
  style?: CSSProperties;
}

/**
 * A modal window with a title, optional description, scrollable body and footer actions. Use inside a
 * DialogTrigger, or control it with `isOpen`/`onOpenChange`. Alert dialogs (`role="alertdialog"`) never show
 * the close button — the user must choose an action.
 */
export function Dialog({
  title,
  description,
  children,
  footer,
  size = 'md',
  isDismissable = true,
  isKeyboardDismissDisabled,
  isOpen,
  defaultOpen,
  onOpenChange,
  className,
  style,
  role,
  ...props
}: DialogProps): JSX.Element {
  const descriptionId = useId();
  const triggerRef = useSlottedContext(PopoverContext)?.triggerRef;
  const anchorRef = useRef<HTMLSpanElement>(null);
  const overlayRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (node) mirrorScope(node, triggerRef?.current ?? anchorRef.current ?? document.activeElement);
    },
    [triggerRef],
  );
  const isAlert = role === 'alertdialog';

  return (
    <>
      {/* Controlled dialogs have no trigger to read the ThemeScope from, so leave an invisible marker. */}
      {!triggerRef && <span ref={anchorRef} hidden />}
      <ModalOverlay
        // Scope attributes at creation, so entry animations resolve their tokens (see scopeProps).
        {...scopeProps(triggerRef?.current ?? anchorRef.current)}
        ref={overlayRef}
        className={styles.overlay}
        isDismissable={isDismissable && !isAlert}
        isKeyboardDismissDisabled={isKeyboardDismissDisabled}
        isOpen={isOpen}
        defaultOpen={defaultOpen}
        onOpenChange={onOpenChange}
      >
        <Modal className={cx(styles.panel, className)} style={style} data-size={size}>
          <RACDialog
            {...props}
            role={role}
            aria-describedby={cx(description != null && descriptionId, props['aria-describedby']) || undefined}
            className={styles.dialog}
          >
            {({ close }) => (
              <>
                <header className={styles.header}>
                  <Heading slot="title" level={2} className={styles.title}>
                    {title}
                  </Heading>
                  {description != null && (
                    <p id={descriptionId} className={styles.description}>
                      {description}
                    </p>
                  )}
                </header>
                {children != null && (
                  <div className={styles.body}>{typeof children === 'function' ? children({ close }) : children}</div>
                )}
                {footer != null && (
                  <footer className={styles.footer}>{typeof footer === 'function' ? footer({ close }) : footer}</footer>
                )}
                {!isAlert && (
                  <Button variant="ghost" size="icon" aria-label="Close" onPress={close} className={styles.close}>
                    <IconX aria-hidden />
                  </Button>
                )}
              </>
            )}
          </RACDialog>
        </Modal>
      </ModalOverlay>
    </>
  );
}

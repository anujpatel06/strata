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
import { IconX } from '@tabler/icons-react';
import { Button } from './button';
import styles from './sheet.module.css';

const cx = (...c: Array<string | false | null | undefined>) => c.filter(Boolean).join(' ');

/** Overlays portal to <body>: copy the trigger's ThemeScope attributes (and dir/lang) onto the overlay root. */
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

export interface SheetRenderProps {
  /** Closes the sheet. */
  close: () => void;
}

export interface SheetProps extends Omit<RACDialogProps, 'children' | 'className' | 'style'> {
  /** Edge the panel slides in from. Logical: `end` is the right edge in LTR and the left edge in RTL. */
  side?: 'start' | 'end' | 'top' | 'bottom';
  /** Heading at the top of the panel; also its accessible name. */
  title: ReactNode;
  /** Supporting text under the title. */
  description?: ReactNode;
  /** Panel content, or a function that receives `{ close }`. Scrolls independently of header and footer. */
  children?: ReactNode | ((opts: SheetRenderProps) => ReactNode);
  /** Actions pinned to the bottom of the panel. Also accepts a function that receives `{ close }`. */
  footer?: ReactNode | ((opts: SheetRenderProps) => ReactNode);
  /** Whether clicking the backdrop closes the sheet. */
  isDismissable?: boolean;
  /** Whether Escape is ignored. */
  isKeyboardDismissDisabled?: boolean;
  /** Controlled open state — only when the sheet is not inside a DialogTrigger. */
  isOpen?: boolean;
  /** Initial open state — only when the sheet is not inside a DialogTrigger. */
  defaultOpen?: boolean;
  /** Called when the open state changes — only when the sheet is not inside a DialogTrigger. */
  onOpenChange?: (isOpen: boolean) => void;
  /** Class for the panel. */
  className?: string;
  /** Style for the panel. */
  style?: CSSProperties;
}

/**
 * A modal panel attached to an edge of the viewport — for filters, details and secondary tasks that keep the page
 * in context. Use inside a DialogTrigger, or control it with `isOpen`/`onOpenChange`.
 */
export function Sheet({
  side = 'end',
  title,
  description,
  children,
  footer,
  isDismissable = true,
  isKeyboardDismissDisabled,
  isOpen,
  defaultOpen,
  onOpenChange,
  className,
  style,
  ...props
}: SheetProps): JSX.Element {
  const descriptionId = useId();
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
        isDismissable={isDismissable}
        isKeyboardDismissDisabled={isKeyboardDismissDisabled}
        isOpen={isOpen}
        defaultOpen={defaultOpen}
        onOpenChange={onOpenChange}
      >
        <Modal className={cx(styles.panel, className)} style={style} data-side={side}>
          <RACDialog
            {...props}
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
                <div className={styles.body}>{typeof children === 'function' ? children({ close }) : children}</div>
                {footer != null && (
                  <footer className={styles.footer}>{typeof footer === 'function' ? footer({ close }) : footer}</footer>
                )}
                <Button variant="ghost" size="icon" aria-label="Close" onPress={close} className={styles.close}>
                  <IconX aria-hidden stroke={1.75} />
                </Button>
              </>
            )}
          </RACDialog>
        </Modal>
      </ModalOverlay>
    </>
  );
}

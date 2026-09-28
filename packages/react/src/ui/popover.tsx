'use client';

import { useCallback, type JSX, type Ref } from 'react';
import {
  OverlayArrow,
  Popover as RACPopover,
  PopoverContext,
  composeRenderProps,
  useSlottedContext,
  type PopoverProps as RACPopoverProps,
} from 'react-aria-components';
import styles from './popover.module.css';

const cx = (...c: Array<string | false | null | undefined>) => c.filter(Boolean).join(' ');

/**
 * Overlays portal to <body>, outside any ThemeScope. At open time copy the trigger's scope attributes
 * (data-syntara-theme/scheme/density) and dir/lang onto the overlay root so it resolves the same tokens.
 */
const SCOPE_ATTRS = ['data-syntara-theme', 'data-syntara-scheme', 'data-syntara-density'] as const;
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

export interface PopoverProps extends RACPopoverProps {
  /** Draws a small arrow pointing at the trigger. */
  showArrow?: boolean;
  ref?: Ref<HTMLElement>;
}

/**
 * A floating panel anchored to a trigger — for rich, interactive content (filters, details, small forms). Put it
 * inside a DialogTrigger next to its trigger button; it gets `role="dialog"`, traps focus and closes on Escape
 * or outside click. For short, non-interactive hints use a Tooltip.
 */
export function Popover({ showArrow, children, className, offset, ref, ...props }: PopoverProps): JSX.Element {
  const context = useSlottedContext(PopoverContext);
  const source = props.triggerRef ?? context?.triggerRef;
  const setRef = useCallback(
    (node: HTMLElement | null) => {
      if (node) mirrorScope(node, source?.current);
      if (typeof ref === 'function') return ref(node);
      if (ref) ref.current = node;
    },
    [source, ref],
  );

  return (
    <RACPopover
      {...props}
      ref={setRef}
      offset={offset ?? context?.offset ?? (showArrow ? 10 : 6)}
      className={composeRenderProps(className, (c) => cx(styles.popover, c))}
    >
      {composeRenderProps(children, (content) => (
        <>
          {showArrow && (
            <OverlayArrow className={styles.arrow}>
              <svg viewBox="0 0 12 12" aria-hidden>
                <path d="M0 0 L6 6 L12 0" />
              </svg>
            </OverlayArrow>
          )}
          {content}
        </>
      ))}
    </RACPopover>
  );
}

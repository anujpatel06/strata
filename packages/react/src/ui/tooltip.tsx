'use client';

import { useCallback, type JSX, type Ref } from 'react';
import {
  OverlayArrow,
  Tooltip as RACTooltip,
  TooltipContext,
  TooltipTrigger as RACTooltipTrigger,
  composeRenderProps,
  useSlottedContext,
  type TooltipProps as RACTooltipProps,
  type TooltipTriggerComponentProps,
} from 'react-aria-components';
import styles from './tooltip.module.css';

const cx = (...c: Array<string | false | null | undefined>) => c.filter(Boolean).join(' ');

/**
 * Overlays portal to <body>, outside any ThemeScope. At open time copy the trigger's scope attributes
 * (data-strata-theme/scheme/density) and dir/lang onto the overlay root so it resolves the same tokens.
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

export interface TooltipProps extends RACTooltipProps {
  /** Draws a small arrow pointing at the trigger. */
  showArrow?: boolean;
  ref?: Ref<HTMLDivElement>;
}

/**
 * A short text label shown on hover or keyboard focus of its trigger. Never put interactive content or essential
 * information in a tooltip — it is unreachable on touch devices.
 */
export function Tooltip({ showArrow = true, children, className, offset, ref, ...props }: TooltipProps): JSX.Element {
  const contextTriggerRef = useSlottedContext(TooltipContext)?.triggerRef;
  const source = props.triggerRef ?? contextTriggerRef;
  const setRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (node) mirrorScope(node, source?.current);
      if (typeof ref === 'function') return ref(node);
      if (ref) ref.current = node;
    },
    [source, ref],
  );

  return (
    <RACTooltip
      {...props}
      ref={setRef}
      offset={offset ?? (showArrow ? 8 : 6)}
      className={composeRenderProps(className, (c) => cx(styles.tooltip, c))}
    >
      {composeRenderProps(children, (content) => (
        <>
          {showArrow && (
            <OverlayArrow className={styles.arrow}>
              <svg viewBox="0 0 8 8" aria-hidden>
                <path d="M0 0 L4 4 L8 0" />
              </svg>
            </OverlayArrow>
          )}
          {content}
        </>
      ))}
    </RACTooltip>
  );
}

export type TooltipTriggerProps = TooltipTriggerComponentProps;

/**
 * Wraps a focusable trigger (usually a Button) and its Tooltip. Opens after `delay` ms of hover, immediately on
 * keyboard focus, and closes on blur, pointer leave or Escape.
 */
export function TooltipTrigger({ delay = 600, closeDelay = 0, ...props }: TooltipTriggerProps): JSX.Element {
  return <RACTooltipTrigger {...props} delay={delay} closeDelay={closeDelay} />;
}
